# Base de datos iPaletitas (PostgreSQL)

Esquema alineado con el panel actual: cuentas, sucursales, usuarios, productos, existencias, entradas, caducados/pérdidas, ventas, cobros y bitácora admin.

## Qué incluye

| Archivo | Contenido |
|---------|-----------|
| `001_schema.sql` | Extensiones, tipos, tablas, índices y vista `v_stock_sucursal` |
| `002_seed.sql` | Planes, cupones y staff `admin@ipaletitas.com` |
| `003_auth_pagos.sql` | Tokens de contraseña + columnas Stripe en `cuentas` (migración) |
| `crear.ps1` | Script Windows: crea la base y aplica los SQL |
| `.env.example` | Plantilla de conexión para la API (punto 2) |

Si la base ya existía, ejecuta también `003_auth_pagos.sql` en el Query Tool / `psql`.

**No se guarda** el número completo de tarjeta ni el CVV; solo marca, últimos 4, vencimiento y titular (o correo de billetera).

## Crear la base (local) — Punto 1

**Desde CMD (ventana negra):**

```bat
cd C:\Users\Cristian\OneDrive\Documents\GitHub\iPaletitas\database
crear.bat
```

**Desde PowerShell:**

```powershell
cd C:\Users\Cristian\OneDrive\Documents\GitHub\iPaletitas\database
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\crear.ps1
```

Te pide la contraseña de `postgres`, crea la base `ipaletitas` y aplica el esquema + semilla.

**Alternativa (pgAdmin):** crea la base `ipaletitas` → Query Tool → ejecuta primero `001_schema.sql`, luego `002_seed.sql`.

## Staff de desarrollo

- Correo: `admin@ipaletitas.com`
- Contraseña: `ipaletitas-dev`

Cámbiala antes de cualquier entorno real.

## Tablas principales

```
planes
cuentas ──┬─ medios_pago
          ├─ sucursales
          ├─ usuarios
          ├─ productos ── existencias (por sucursal)
          ├─ entradas
          ├─ perdidas
          ├─ ventas ── venta_partidas
          │         └─ anticipo_pagos
          └─ cobros
staff
bitacora
cupones
```

Vista: `v_stock_sucursal` (estado de stock y caducidad listos para el panel).

## Conexión (punto 2 — API)

Copia `.env.example` a `.env.local` y pon tu contraseña:

```
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@127.0.0.1:5432/ipaletitas
```

Nunca uses variables `VITE_` para esto.

## Orden del proyecto

1. **Esta base** (punto 1)
2. API + login
3. Conectar el panel
4. Publicar HTTPS / PWA
5. Planes honestos, pagos, recuperar contraseña, POS tablet…
