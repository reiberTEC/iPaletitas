# Punto 4 — Publicar en HTTPS (PWA instalable)

Con HTTPS, Chrome/Edge/Android permiten **Instalar aplicación**. En local solo funciona en `localhost`.

## Qué despliegas

Un solo servicio Docker:

- Panel Vue (PWA) en `/`
- API en `/api/...`
- Postgres en la nube (Neon, Supabase o el Postgres de Render)

## 1. Base de datos en la nube

1. Crea un proyecto en [Neon](https://neon.tech) o [Supabase](https://supabase.com) (Postgres gratis).
2. Copia la cadena `DATABASE_URL` (con SSL si te la dan).
3. En esa base ejecuta, en orden:
   - `database/001_schema.sql`
   - `database/002_seed.sql`  
   (SQL Editor del proveedor, o `psql "$DATABASE_URL" -f ...`).

## 2. Publicar la app (Render)

1. Entra a [Render](https://render.com) → **New** → **Blueprint**.
2. Conecta el repo `iPaletitas` (rama `frontend` o `main`).
3. Usa el `render.yaml` del repo.
4. Variables de entorno:
   - `DATABASE_URL` = la de Neon/Supabase
   - `JWT_SECRET` = (Render puede generarla)
   - `API_ORIGENES` = `https://TU-SERVICIO.onrender.com` (la URL que te asigne Render)
5. Deploy. Cuando termine, abre la URL HTTPS.

Comprueba:

```text
https://TU-SERVICIO.onrender.com/api/salud
```

Debe responder `{"ok":true,...,"frontend":true}`.

## 3. Instalar la PWA

1. Abre la URL en **Chrome** o **Edge** (escritorio o Android).
2. En la portada, sección **Descargar** → **Instalar aplicación**, o el ícono ⊕ de la barra.
3. En iPhone: Safari → Compartir → **Añadir a pantalla de inicio**.

## Probar en local como en producción

```bat
cd frontend
npm run build
cd ..\backend
set NODE_ENV=production
npm run start
```

Abre `http://127.0.0.1:8788` (panel + API juntos). En local la instalación PWA también funciona.

## Alternativas

| Plataforma | Notas |
|------------|--------|
| **Railway** | New Project → Deploy from Dockerfile; misma `DATABASE_URL` / `JWT_SECRET`. |
| **Fly.io** | `fly launch` con el Dockerfile. |
| **VPS** | Nginx + HTTPS (Let’s Encrypt) delante de `npm run start`. |

## Después de publicar

- Cambia la contraseña del staff `admin@ipaletitas.com` (semilla de desarrollo).
- No subas `.env.local` al repo.
- Pagos: pon `STRIPE_SECRET_KEY` (test o live) y `FRONTEND_URL` con la URL HTTPS pública. Guía en `PAGOS.md`.
- Cuando el backend tenga URL pública, en Stripe → Developers → Webhooks crea un endpoint hacia tu API y guarda `STRIPE_WEBHOOK_SECRET` (el handler de eventos queda para un siguiente paso; hoy la confirmación es al volver de Checkout).
