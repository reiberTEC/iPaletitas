# iPaletitas

Aplicación Vue con API Node.js y base de datos PostgreSQL.

## Levantar el servicio local

Necesitas Docker Engine con Compose v2 o Docker Desktop en ejecución. Desde la raíz del proyecto:

```sh
docker compose up --build -d --wait
```

Abre **http://localhost:8788**. El comando construye la aplicación, inicia PostgreSQL y espera a que ambos servicios estén listos. No necesitas instalar Node.js ni PostgreSQL ni crear archivos `.env`.

La primera vez se inicializa la base con los scripts de `database/`. Acceso de staff: **admin@ipaletitas.com** / **ipaletitas-dev**.

## Comandos útiles

```bat
cd backend
copy .env.example .env.local
REM Edita .env.local: pon tu contraseña en DATABASE_URL
Cómo probar el proyecto en local (rama `frontend`).

## Requisitos

- Node.js
- PostgreSQL (local) o una base Neon

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

Los datos se conservan en un volumen de Docker al detener el servicio. **`docker compose down -v` elimina la base y sus datos**. Los scripts SQL solo se ejecutan automáticamente con el volumen vacío; para actualizar una base existente, aplica las migraciones pendientes explícitamente.

```bat
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

En ese caso, abre **http://localhost:8790**.

Guía paso a paso: [`DEPLOY.md`](DEPLOY.md).

```bat
npm run build --prefix frontend
npm run start --prefix backend
```

Más detalles: [`backend/README.md`](backend/README.md), [`frontend/README.md`](frontend/README.md), [`database/README.md`](database/README.md), [`APP.md`](APP.md).
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
