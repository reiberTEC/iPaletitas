# iPaletitas

Aplicación Vue con API Node.js y base de datos PostgreSQL.

## Levantar el servicio local

Necesitas Docker Engine con Compose v2 o Docker Desktop en ejecución. Desde la raíz del proyecto:

```sh
docker compose up --build -d --wait
```

Abre **http://localhost:8788**. El comando construye la aplicación, inicia PostgreSQL y espera a que ambos servicios estén listos. No necesitas instalar Node.js ni PostgreSQL ni crear archivos `.env`.

