-- iPaletitas · esquema PostgreSQL
-- Corresponde al modelo actual del panel (stores/negocio.ts, admin.ts, catalogo.ts).
-- Nunca guardar número completo de tarjeta ni CVV.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Tipos ----------

CREATE TYPE plan_id AS ENUM (
  'basica',
  'doble',
  'doble-especial',
  'especial-super'
);

CREATE TYPE ciclo_pago AS ENUM ('mensual', 'anual');

CREATE TYPE rol_usuario AS ENUM (
  'Administrador',
  'Gerente',
  'Cajero',
  'Almacén'
);

CREATE TYPE metodo_pago_venta AS ENUM ('Efectivo', 'Tarjeta', 'Transferencia');

CREATE TYPE motivo_perdida AS ENUM ('Caducidad', 'Daño', 'Merma', 'Otro');

CREATE TYPE estado_cobro AS ENUM ('Pagado', 'Pendiente', 'Vencido', 'Reembolsado');

CREATE TYPE metodo_cobro AS ENUM (
  'Transferencia',
  'Tarjeta',
  'PayPal',
  'Mercado Pago',
  'Google Pay'
);

-- ---------- Catálogo de planes (iPaletitas) ----------

CREATE TABLE planes (
  id                plan_id PRIMARY KEY,
  nombre            text NOT NULL,
  lema              text NOT NULL DEFAULT '',
  precio_mensual    numeric(12, 2) NOT NULL CHECK (precio_mensual >= 0),
  acento            text NOT NULL DEFAULT '#295bdc',
  acento_oscuro     text,
  incluye_de        plan_id REFERENCES planes (id),
  destacado         boolean NOT NULL DEFAULT false,
  limite_sucursales integer,          -- NULL = ilimitado
  limite_usuarios   integer,
  limite_productos  integer,
  historial_meses   integer,
  incluye           text[] NOT NULL DEFAULT '{}'
);

-- ---------- Cuentas (cada negocio contratante) ----------

CREATE TABLE cuentas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio             text NOT NULL,
  giro                text NOT NULL DEFAULT '',
  telefono            text NOT NULL DEFAULT '',
  titular_correo      text NOT NULL,
  plan_id             plan_id NOT NULL REFERENCES planes (id),
  ciclo               ciclo_pago NOT NULL DEFAULT 'mensual',
  clave_licencia      text NOT NULL UNIQUE,
  inicio              timestamptz NOT NULL DEFAULT now(),
  vence               timestamptz NOT NULL,
  en_prueba           boolean NOT NULL DEFAULT false,
  suspendida          boolean NOT NULL DEFAULT false,
  cancelada           boolean NOT NULL DEFAULT false,
  prueba_usada        boolean NOT NULL DEFAULT false,
  tutorial_pendiente  boolean NOT NULL DEFAULT true,
  garantia_hasta      timestamptz,
  logo_url            text,
  color_marca         text,
  -- Facturación
  fact_pais           text NOT NULL DEFAULT 'México',
  fact_estado         text NOT NULL DEFAULT '',
  fact_direccion      text NOT NULL DEFAULT '',
  fact_codigo_postal  text NOT NULL DEFAULT '',
  -- Folios por cuenta
  folio_venta         integer NOT NULL DEFAULT 1001,
  folio_entrada       integer NOT NULL DEFAULT 1,
  folio_perdida       integer NOT NULL DEFAULT 1,
  creado_en           timestamptz NOT NULL DEFAULT now(),
  actualizado_en      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX cuentas_titular_correo_idx ON cuentas (lower(titular_correo));

-- Medio de pago tokenizado: solo marca, últimos 4, vencimiento y titular/correo de billetera.
CREATE TABLE medios_pago (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id       uuid NOT NULL UNIQUE REFERENCES cuentas (id) ON DELETE CASCADE,
  marca           text NOT NULL,
  ultimos4        text NOT NULL DEFAULT '',
  vence           text NOT NULL DEFAULT '',   -- MM/AA; vacío en billeteras
  titular         text NOT NULL DEFAULT '',
  creado_en       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sucursales (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id   uuid NOT NULL REFERENCES cuentas (id) ON DELETE CASCADE,
  nombre      text NOT NULL,
  direccion   text NOT NULL DEFAULT '',
  activa      boolean NOT NULL DEFAULT true,
  creado_en   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sucursales_cuenta_idx ON sucursales (cuenta_id);

CREATE TABLE usuarios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id       uuid NOT NULL REFERENCES cuentas (id) ON DELETE CASCADE,
  sucursal_id     uuid REFERENCES sucursales (id) ON DELETE SET NULL,
  nombre          text NOT NULL,
  correo          text NOT NULL,
  telefono        text NOT NULL DEFAULT '',
  puesto          text NOT NULL DEFAULT '',
  fecha_ingreso   date NOT NULL DEFAULT CURRENT_DATE,
  rol             rol_usuario NOT NULL DEFAULT 'Cajero',
  activo          boolean NOT NULL DEFAULT true,
  -- Hash de contraseña (bcrypt/argon2). Nunca guardar en claro.
  password_hash   text NOT NULL,
  permisos        text[] NOT NULL DEFAULT '{}',
  creado_en       timestamptz NOT NULL DEFAULT now(),
  actualizado_en  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cuenta_id, correo)
);

CREATE UNIQUE INDEX usuarios_correo_global_idx ON usuarios (lower(correo));
CREATE INDEX usuarios_cuenta_idx ON usuarios (cuenta_id);

CREATE TABLE productos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id       uuid NOT NULL REFERENCES cuentas (id) ON DELETE CASCADE,
  sku             text NOT NULL,
  nombre          text NOT NULL,
  categoria       text NOT NULL DEFAULT '',
  precio          numeric(12, 2) NOT NULL CHECK (precio >= 0),
  costo           numeric(12, 2) NOT NULL CHECK (costo >= 0),
  stock_minimo    integer NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  caducidad       date,
  activo          boolean NOT NULL DEFAULT true,
  creado_en       timestamptz NOT NULL DEFAULT now(),
  actualizado_en  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cuenta_id, sku)
);

CREATE INDEX productos_cuenta_idx ON productos (cuenta_id);
CREATE INDEX productos_caducidad_idx ON productos (cuenta_id, caducidad)
  WHERE caducidad IS NOT NULL AND activo;

-- Existencias por sucursal (reemplaza el mapa existencias{} del frontend)
CREATE TABLE existencias (
  producto_id   uuid NOT NULL REFERENCES productos (id) ON DELETE CASCADE,
  sucursal_id   uuid NOT NULL REFERENCES sucursales (id) ON DELETE CASCADE,
  cantidad      integer NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  PRIMARY KEY (producto_id, sucursal_id)
);

CREATE TABLE entradas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id         uuid NOT NULL REFERENCES cuentas (id) ON DELETE CASCADE,
  sucursal_id       uuid NOT NULL REFERENCES sucursales (id),
  producto_id       uuid NOT NULL REFERENCES productos (id),
  folio             integer NOT NULL,
  fecha             timestamptz NOT NULL DEFAULT now(),
  cantidad          integer NOT NULL CHECK (cantidad > 0),
  costo_unitario    numeric(12, 2) NOT NULL CHECK (costo_unitario >= 0),
  proveedor         text NOT NULL DEFAULT '',
  nota              text NOT NULL DEFAULT '',
  registrado_por    uuid REFERENCES usuarios (id) ON DELETE SET NULL,
  UNIQUE (cuenta_id, folio)
);

CREATE INDEX entradas_sucursal_idx ON entradas (sucursal_id, fecha DESC);

CREATE TABLE perdidas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id         uuid NOT NULL REFERENCES cuentas (id) ON DELETE CASCADE,
  sucursal_id       uuid NOT NULL REFERENCES sucursales (id),
  producto_id       uuid NOT NULL REFERENCES productos (id),
  folio             integer NOT NULL,
  fecha             timestamptz NOT NULL DEFAULT now(),
  cantidad          integer NOT NULL CHECK (cantidad > 0),
  costo_unitario    numeric(12, 2) NOT NULL CHECK (costo_unitario >= 0),
  motivo            motivo_perdida NOT NULL DEFAULT 'Caducidad',
  nota              text NOT NULL DEFAULT '',
  registrado_por    uuid REFERENCES usuarios (id) ON DELETE SET NULL,
  UNIQUE (cuenta_id, folio)
);

CREATE INDEX perdidas_sucursal_idx ON perdidas (sucursal_id, fecha DESC);

CREATE TABLE ventas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id         uuid NOT NULL REFERENCES cuentas (id) ON DELETE CASCADE,
  sucursal_id       uuid NOT NULL REFERENCES sucursales (id),
  folio             integer NOT NULL,
  fecha             timestamptz NOT NULL DEFAULT now(),
  cajero_id         uuid REFERENCES usuarios (id) ON DELETE SET NULL,
  cajero_nombre     text NOT NULL DEFAULT '',
  metodo_pago       metodo_pago_venta NOT NULL,
  total             numeric(12, 2) NOT NULL CHECK (total >= 0),
  recibido          numeric(12, 2) NOT NULL DEFAULT 0 CHECK (recibido >= 0),
  -- Anticipo opcional
  es_anticipo       boolean NOT NULL DEFAULT false,
  anticipo_cliente  text,
  anticipo_telefono text,
  anticipo_entrega  date,
  UNIQUE (cuenta_id, folio)
);

CREATE INDEX ventas_sucursal_fecha_idx ON ventas (sucursal_id, fecha DESC);

CREATE TABLE venta_partidas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id      uuid NOT NULL REFERENCES ventas (id) ON DELETE CASCADE,
  producto_id   uuid REFERENCES productos (id) ON DELETE SET NULL,
  nombre        text NOT NULL,
  cantidad      integer NOT NULL CHECK (cantidad > 0),
  precio        numeric(12, 2) NOT NULL CHECK (precio >= 0)
);

CREATE INDEX venta_partidas_venta_idx ON venta_partidas (venta_id);

-- Abonos de un anticipo (la primera cuota y las siguientes)
CREATE TABLE anticipo_pagos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id    uuid NOT NULL REFERENCES ventas (id) ON DELETE CASCADE,
  fecha       timestamptz NOT NULL DEFAULT now(),
  monto       numeric(12, 2) NOT NULL CHECK (monto > 0),
  metodo      metodo_pago_venta NOT NULL,
  recibido    numeric(12, 2) NOT NULL DEFAULT 0 CHECK (recibido >= 0)
);

CREATE INDEX anticipo_pagos_venta_idx ON anticipo_pagos (venta_id);

-- ---------- Plataforma iPaletitas (consola admin) ----------

CREATE TABLE staff (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correo          text NOT NULL,
  nombre          text NOT NULL,
  password_hash   text NOT NULL,
  activo          boolean NOT NULL DEFAULT true,
  creado_en       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_correo_ipaletitas CHECK (lower(correo) LIKE '%@ipaletitas.com')
);

CREATE UNIQUE INDEX staff_correo_idx ON staff (lower(correo));

CREATE TABLE cobros (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id     uuid NOT NULL REFERENCES cuentas (id) ON DELETE CASCADE,
  folio         integer NOT NULL,
  concepto      text NOT NULL,
  monto         numeric(12, 2) NOT NULL CHECK (monto >= 0),
  emitido       timestamptz NOT NULL DEFAULT now(),
  limite        timestamptz NOT NULL,
  estado        estado_cobro NOT NULL DEFAULT 'Pendiente',
  periodo       timestamptz,
  metodo        metodo_cobro,
  referencia    text,
  pagado_el     timestamptz,
  UNIQUE (folio)
);

CREATE INDEX cobros_cuenta_idx ON cobros (cuenta_id, emitido DESC);
CREATE INDEX cobros_estado_idx ON cobros (estado) WHERE estado IN ('Pendiente', 'Vencido');

CREATE TABLE bitacora (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha       timestamptz NOT NULL DEFAULT now(),
  autor       text NOT NULL DEFAULT 'Sistema',
  accion      text NOT NULL,
  detalle     text NOT NULL DEFAULT '',
  cuenta_id   uuid REFERENCES cuentas (id) ON DELETE SET NULL,
  staff_id    uuid REFERENCES staff (id) ON DELETE SET NULL
);

CREATE INDEX bitacora_fecha_idx ON bitacora (fecha DESC);

-- Cupones de primer pago (catálogo actual)
CREATE TABLE cupones (
  codigo        text PRIMARY KEY,
  porcentaje    numeric(5, 2) NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
  descripcion   text NOT NULL DEFAULT '',
  activo        boolean NOT NULL DEFAULT true
);

-- ---------- Vistas útiles ----------

CREATE VIEW v_stock_sucursal AS
SELECT
  p.cuenta_id,
  e.sucursal_id,
  p.id AS producto_id,
  p.sku,
  p.nombre,
  p.categoria,
  p.precio,
  p.costo,
  p.stock_minimo,
  p.caducidad,
  e.cantidad,
  CASE
    WHEN e.cantidad <= 0 THEN 'agotado'
    WHEN e.cantidad <= p.stock_minimo THEN 'bajo'
    ELSE 'ok'
  END AS estado_stock,
  CASE
    WHEN p.caducidad IS NULL THEN 'sinFecha'
    WHEN p.caducidad < CURRENT_DATE THEN 'caducado'
    WHEN p.caducidad <= CURRENT_DATE + 7 THEN 'porCaducar'
    ELSE 'ok'
  END AS estado_caducidad
FROM productos p
JOIN existencias e ON e.producto_id = p.id
WHERE p.activo;

COMMENT ON TABLE cuentas IS 'Negocio contratante (tenant). Un titular, un plan, una licencia.';
COMMENT ON TABLE medios_pago IS 'Solo marca, últimos 4, vencimiento y titular. Sin PAN ni CVV.';
COMMENT ON TABLE perdidas IS 'Bajas de inventario por caducidad, daño, merma u otro.';
COMMENT ON TABLE existencias IS 'Cantidad por producto y sucursal.';
