# iPaletitas · Backend

API del sistema iPaletitas, hecha con [Django](https://www.djangoproject.com/).

Requiere Python 3.12 o superior.

## Crear el proyecto Django (solo la primera vez)

Desde esta carpeta (`backend/`):

```sh
python -m venv .venv
source .venv/bin/activate        # En Windows: .venv\Scripts\activate
pip install -r requirements.txt
django-admin startproject config .
```

El punto final de `startproject` hace que `manage.py` quede directamente en `backend/` y la configuración en `backend/config/`.

## Levantar el servidor

```sh
source .venv/bin/activate
python manage.py migrate
python manage.py runserver
```

El servidor queda en <http://127.0.0.1:8000/>. El frontend de Vite corre en <http://localhost:5173/>, así que cuando el frontend empiece a consumir la API habrá que habilitar CORS (por ejemplo con `django-cors-headers`) o configurar un proxy en `frontend/vite.config.ts`.

## Agregar dependencias

Después de instalar un paquete nuevo con `pip install`, agrégalo a `requirements.txt` para que el resto del equipo lo tenga.
