# iPaletitas

Cómo probar el proyecto en local (rama `frontend`).

## Requisitos

- Node.js
- PostgreSQL (local) o una base Neon
- Acceso al repo como colaborador

## 1. Clonar y cambiar de rama

```bash
git clone https://github.com/reiberTEC/iPaletitas.git
cd iPaletitas
git checkout frontend
git pull
```

## 2. Base de datos

Crear la base `ipaletitas` y aplicar, en este orden:

1. `database/001_schema.sql`
2. `database/002_seed.sql`
3. `database/003_auth_pagos.sql`

(En Windows también puedes usar `database/crear.bat` y luego ejecutar el `003`.)

## 3. Backend (API)

```bash
cd backend
copy .env.example .env.local
npm install
npm run dev
```

Edita `backend/.env.local`:

```env
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@127.0.0.1:5432/ipaletitas
JWT_SECRET=ipaletitas-dev-cambia-esto
API_PUERTO=8788
API_ORIGENES=http://localhost:5173,http://127.0.0.1:5173
```

La API queda en `http://127.0.0.1:8788`.

> Sin `STRIPE_SECRET_KEY` los pagos van en **modo demo** (no cobran de verdad).

## 4. Frontend

Otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre: [http://localhost:5173](http://localhost:5173)

## 5. Qué probar

| Flujo | Cómo |
|--------|------|
| Negocio | Registro → plan → activar licencia (demo) → panel |
| Mostrador | Productos, punto de venta, entradas, caducados |
| Equipo | Usuarios → agregar → enlace para definir contraseña |
| Recuperar clave | Login → “¿Olvidaste tu contraseña?” → el enlace sale en la **consola del backend** |
| Admin | Login con “Entrar como administrador” |

**Staff de prueba**

- Correo: `admin@ipaletitas.com`
- Contraseña: `ipaletitas-dev`

## Notas

- No subas ni compartas `.env.local` en el repo.
- Cada quien usa su propia `DATABASE_URL` (o una Neon compartida por canal privado).
- Más detalle: `README.md`, `PAGOS.md`, `DEPLOY.md`, `database/README.md`.
