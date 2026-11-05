-- Semilla: planes, cupones y un usuario staff de desarrollo.
-- Contraseña local del staff: ipaletitas-dev  (cámbiala en producción)
-- Textos alineados con frontend/src/stores/catalogo.ts (punto 5: planes honestos).

INSERT INTO planes (
  id, nombre, lema, precio_mensual, acento, acento_oscuro, incluye_de, destacado,
  limite_sucursales, limite_usuarios, limite_productos, historial_meses, incluye
) VALUES
  (
    'basica',
    'Básica',
    'Para el mostrador que va empezando.',
    199,
    '#10b981',
    NULL,
    NULL,
    false,
    1, 2, 50, 3,
    ARRAY[
      '1 sucursal',
      'Hasta 2 usuarios',
      'Punto de venta (efectivo, tarjeta y transferencia)',
      'Catálogo de hasta 50 productos',
      'Inventario, entradas y caducados a pérdida',
      'Historial de ventas de los últimos 3 meses',
      'Soporte por correo'
    ]
  ),
  (
    'doble',
    'Doble',
    'Para negocios con más movimiento.',
    399,
    '#3b82f6',
    NULL,
    'basica',
    false,
    2, 5, NULL, 12,
    ARRAY[
      'Hasta 2 sucursales',
      'Hasta 5 usuarios',
      'Productos ilimitados',
      'Anticipos en el punto de venta',
      'Alertas de stock bajo y por caducar',
      'Historial de ventas de 12 meses',
      'Soporte por correo'
    ]
  ),
  (
    'doble-especial',
    'Doble Especial',
    'Para varias sucursales y un equipo con roles.',
    699,
    '#7c3aed',
    NULL,
    'doble',
    true,
    5, 15, NULL, 24,
    ARRAY[
      'Hasta 5 sucursales',
      'Hasta 15 usuarios',
      'Roles y permisos por empleado',
      'Marca blanca: logo y colores de tu negocio',
      'Gráficas de ventas en el panel',
      'Historial de ventas de 24 meses',
      'Soporte prioritario por correo'
    ]
  ),
  (
    'especial-super',
    'Especial Super',
    'Sin techos de sucursales, usuarios ni historial.',
    1199,
    '#f59e0b',
    '#93c5fd',
    'doble-especial',
    false,
    NULL, NULL, NULL, NULL,
    ARRAY[
      'Sucursales, usuarios y productos ilimitados',
      'Historial de ventas sin límite de meses',
      'Todo lo de Doble Especial, sin cupos',
      'Misma app de mostrador: POS, inventario y caducados',
      'Soporte prioritario por correo'
    ]
  )
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  lema = EXCLUDED.lema,
  precio_mensual = EXCLUDED.precio_mensual,
  acento = EXCLUDED.acento,
  acento_oscuro = EXCLUDED.acento_oscuro,
  incluye_de = EXCLUDED.incluye_de,
  destacado = EXCLUDED.destacado,
  limite_sucursales = EXCLUDED.limite_sucursales,
  limite_usuarios = EXCLUDED.limite_usuarios,
  limite_productos = EXCLUDED.limite_productos,
  historial_meses = EXCLUDED.historial_meses,
  incluye = EXCLUDED.incluye;

INSERT INTO cupones (codigo, porcentaje, descripcion, activo) VALUES
  ('PALETA10', 10, '10% en tu primer pago', true),
  ('BIENVENIDA15', 15, '15% de bienvenida en tu primer pago', true)
ON CONFLICT (codigo) DO UPDATE SET
  porcentaje = EXCLUDED.porcentaje,
  descripcion = EXCLUDED.descripcion,
  activo = EXCLUDED.activo;

-- Hash con pgcrypto (bcrypt). Contraseña: ipaletitas-dev
INSERT INTO staff (correo, nombre, password_hash, activo)
SELECT
  'admin@ipaletitas.com',
  'Admin iPaletitas',
  crypt('ipaletitas-dev', gen_salt('bf')),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM staff WHERE lower(correo) = 'admin@ipaletitas.com'
);
