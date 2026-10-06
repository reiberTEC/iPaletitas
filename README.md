# iPaletitas

Sistema de gestión inteligente para micro y pequeños negocios.

## Estructura

```
iPaletitas/
├── frontend/   Aplicación web (Vue 3 + Vite + TypeScript)
└── backend/    API (Django)
```

## Frontend

```sh
cd frontend
npm install
npm run dev
```

Más detalles en [`frontend/README.md`](frontend/README.md).

## Backend

```sh
cd backend
python -m venv .venv
source .venv/bin/activate        # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Los pasos para crear y levantar el proyecto Django están en [`backend/README.md`](backend/README.md).
