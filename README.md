# iPaletitas

## Estructura

```
iPaletitas/
├── database/   PostgreSQL (esquema + semilla)
├── backend/    API (auth; más adelante el panel)
└── frontend/   App Vue (PWA)
```

## Arranque en desarrollo

Necesitas **dos** terminales (Postgres ya creado en el punto 1).

**1. API**

```bat
cd backend
copy .env.example .env.local
REM Edita .env.local: pon tu contraseña en DATABASE_URL
npm install
npm run dev
```

**2. Frontend**

```bat
cd frontend
npm install
npm run dev
```

Más detalles: [`backend/README.md`](backend/README.md), [`frontend/README.md`](frontend/README.md), [`database/README.md`](database/README.md).
