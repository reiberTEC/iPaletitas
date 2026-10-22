# API iPaletitas

Auth real contra PostgreSQL (punto 2). El panel todavía guarda el día a día en el navegador; el punto 3 lo conecta a esta API.

## Arranque (haz esto una vez)

1. Copia la plantilla:

```bat
cd C:\Users\Cristian\OneDrive\Documents\GitHub\iPaletitas\backend
copy .env.example .env.local
notepad .env.local
```

2. En `DATABASE_URL`, cambia `TU_CONTRASEÑA` por la misma contraseña de `postgres` que usaste en `crear.bat`.

3. Instala (solo la primera vez) y levanta:

```bat
npm install
npm run dev
```

Debe decir: `API iPaletitas en http://127.0.0.1:8788`

4. En otra terminal, el frontend:

```bat
cd C:\Users\Cristian\OneDrive\Documents\GitHub\iPaletitas\frontend
npm run dev
```

## Probar

- Crear cuenta nueva en la app → queda en Postgres.
- Login con esa cuenta y su contraseña.
- Staff: `admin@ipaletitas.com` / `ipaletitas-dev` + casilla **Entrar como administrador**.

```bat
curl http://127.0.0.1:8788/api/salud
```

## Rutas

| Método | Ruta | Qué hace |
|--------|------|----------|
| GET | `/api/salud` | API + Postgres OK |
| POST | `/api/auth/registro` | `{ correo, password }` |
| POST | `/api/auth/login` | `{ correo, password, comoAdmin? }` |
| GET | `/api/auth/yo` | Header `Authorization: Bearer …` |
| GET | `/api/negocio` | Snapshot del panel (licencia, catálogo, ventas…) |
| POST | `/api/negocio/activar` | Activa licencia + datos de ejemplo |
| POST/PUT/DELETE | `/api/negocio/…` | Productos, entradas, pérdidas, ventas, usuarios, sucursales, marca |

Usuarios nuevos del equipo (sin contraseña en el formulario) arrancan con `ipaletitas-dev` hasta el punto 7 (recuperar / definir contraseña).
