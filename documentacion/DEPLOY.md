# Deploy en Railway

## Imágenes Docker Hub

- Backend: `alezzzzandrov/welve-backend:latest`
- Frontend: `alezzzzandrov/welve-frontend:latest`

Ambas ya están construidas y subidas. Para reconstruir y volver a subir después
de un cambio de código:

```bash
docker build -t alezzzzandrov/welve-backend:latest ./backend
docker push alezzzzandrov/welve-backend:latest

# El frontend SIEMPRE necesita el build-arg — Vite incrusta VITE_API_URL en
# el bundle estático en build time, no se puede cambiar después en runtime.
# Si el dominio real del backend en Railway termina siendo distinto al de
# abajo, hay que reconstruir el frontend con el dominio correcto y volver a
# subirlo (cambiar la variable de entorno en Railway NO alcanza).
docker build \
  --build-arg VITE_API_URL=https://welve-backend.up.railway.app \
  -t alezzzzandrov/welve-frontend:latest \
  ./frontend
docker push alezzzzandrov/welve-frontend:latest
```

## Pasos en Railway

### 1. Crear servicio Backend

- New Project → Deploy Docker Image
- Image: `alezzzzandrov/welve-backend:latest`
- Variables de entorno a configurar (Settings → Variables):
  ```
  MONGO_URI=mongodb+srv://...
  MONGO_DB=welve
  SECRET_KEY=<genera con: python3 -c "import secrets; print(secrets.token_hex(32))">
  ALGORITHM=HS256
  ACCESS_TOKEN_EXPIRE_MINUTES=60
  REDIS_URL=<URL de Redis, ver paso 3>
  CELERY_BROKER_URL=<misma URL de Redis>
  CELERY_RESULT_BACKEND=<misma URL de Redis, sufijo /1 si el proveedor lo soporta>
  CORS_ORIGINS=https://<tu-frontend>.up.railway.app
  ENVIRONMENT=production
  ```
- **Importante — al desplegar por imagen (no por repo conectado), Railway NO
  lee `railway.json`.** Esos archivos (`railway.json`, `backend/railway.json`,
  `frontend/railway.json`) solo aplican si más adelante conectás el repo de
  GitHub directamente en vez de usar la imagen de Docker Hub. Mientras se use
  "Deploy Docker Image", hay que configurar esto a mano en el dashboard:
  - Settings → Deploy → Healthcheck Path: `/health`
  - Settings → Deploy → Restart Policy: On Failure

### 2. Crear servicio Frontend

- Add Service → Deploy Docker Image
- Image: `alezzzzandrov/welve-frontend:latest`
- No necesita variables de entorno en runtime — `VITE_API_URL` ya quedó
  incrustada en el HTML/JS estático al momento del build (ver arriba).
- Settings → Deploy → Healthcheck Path: `/health`

### 3. Crear Redis

- Add Service → Database → Redis (o usar Upstash si preferís algo fuera de
  Railway)
- Copiar la URL generada (`REDIS_URL`) al servicio Backend. Si el proveedor
  da una URL con TLS, va con `rediss://` (doble s) en vez de `redis://`.

### 4. Verificar dominios

- Backend: Settings → Networking → Generate Domain
- Frontend: Settings → Networking → Generate Domain
- Actualizar `CORS_ORIGINS` en el backend con el dominio real del frontend
  (aunque el regex `https://.*\.up\.railway\.app` en `app/main.py` ya cubre
  cualquier subdominio de Railway automáticamente — `CORS_ORIGINS` es el
  respaldo explícito, útil si más adelante se usa un dominio propio)
- Si el dominio del backend terminó siendo distinto al usado en el build del
  frontend (`welve-backend.up.railway.app`), **reconstruir y resubir la
  imagen del frontend** con el `VITE_API_URL` correcto (ver arriba) — no
  alcanza con cambiar una variable de entorno en Railway.

### 5. Correr seed en producción (una sola vez, opcional)

En Railway → Backend service → Settings → Deploy → Run Command puntual:

```
python scripts/seed.py
```

Es idempotente — no duplica datos si ya corrió antes.

## URLs finales esperadas

- Frontend: `https://welve-frontend.up.railway.app`
- Backend API: `https://welve-backend.up.railway.app`
- Docs: `https://welve-backend.up.railway.app/docs`
- Health: `https://welve-backend.up.railway.app/health` y
  `https://welve-frontend.up.railway.app/health`

## Notas de arquitectura del deploy

- **Frontend y backend son servicios separados con dominios distintos** (no
  comparten red como en `docker-compose.yml` local). El frontend le pega
  directo al backend vía la URL incrustada en build time — no hay proxy
  intermedio en producción.
- `frontend/nginx.conf` sigue teniendo un `location /api/` que reenvía a un
  host `backend:8000` — eso solo resuelve dentro de la red de
  `docker-compose` (uso local para probar el build de producción, ver
  CLAUDE.md). Está armado con un `resolver` + variable a propósito: si ese
  host no existe (como en Railway), nginx igual arranca bien y esa ruta
  puntual devuelve 502 en vez de tumbar el contenedor entero.
- El worker de Celery (`celery-worker` en `docker-compose.yml`, jobs
  periódicos de romper rachas/expirar cupones/etc.) **no tiene un servicio
  Railway separado en esta guía** — si se necesita en producción, hay que
  crear un tercer servicio Railway con la misma imagen de backend pero
  `startCommand: celery -A app.worker.celery_app worker -B --loglevel=info`.
