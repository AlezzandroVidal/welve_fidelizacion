# Cuentas y Accesos — Welve (PRIVADO — NO SUBIR A GIT)

> Este archivo está en `.gitignore` (`docs/CUENTAS_Y_ACCESOS.md`). Verificar
> con `git check-ignore docs/CUENTAS_Y_ACCESOS.md` antes de cualquier commit
> masivo (`git add .`) — si el comando no devuelve nada, NO commitear.

## URLs del sistema

| Ambiente | Frontend | Backend | Docs |
|---|---|---|---|
| Producción | https://welve-frontend-production.up.railway.app | https://welve-backend-production.up.railway.app | /docs |
| Desarrollo | http://localhost:5173 | http://localhost:8000 | /docs |

## Cuentas de prueba (seed — `backend/scripts/seed.py`, idempotente)

| Rol | Email | Password | Acceso |
|---|---|---|---|
| Super Admin | admin@welve.pe | WelveAdmin2024! | `/api/v1/admin/auth/login` → panel superadmin |
| Admin Café Ritual | admin@caferitual.pe | Ritual2024! | `/login` → Empresa |
| Admin Salón Lumina | admin@salonlumina.pe | Lumina2024! | `/login` → Empresa |
| Admin Tienda Maki | admin@tiendamaki.pe | Maki2024! | `/login` → Empresa |
| Admin Pizzería Bella Napoli | admin@bellanapoli.pe | Napoli2024! | `/login` → Empresa |
| Admin Librería Página 1 | admin@pagina1.pe | Pagina2024! | `/login` → Empresa |

Los clientes de prueba (6 en el seed) no tienen password fijo — se acceden
por magic link. En `ENVIRONMENT=development`,
`POST /api/v1/auth/cliente/magic-link` devuelve el link directo en la
respuesta (sin enviar email real).

## Servicios externos

| Servicio | URL | Usuario | Notas |
|---|---|---|---|
| MongoDB Atlas | https://cloud.mongodb.com | [COMPLETAR] | Cluster: `welve.yaus4t3.mongodb.net`, DB `welve` |
| Docker Hub | https://hub.docker.com | alezzzzandrov | Imágenes: `welve-backend`, `welve-frontend` |
| Railway | https://railway.app | [COMPLETAR] | Proyecto: welve |
| GitHub | https://github.com/AlezzandroVidal/welve_fidelizacion | AlezzandroVidal | Rama principal: `main`, repo público |

## Variables de entorno de producción

Ver `.env.production` (local, gitignored, no vive en el repo) para los
valores reales completos. Referencia rápida de dónde se configura cada una:

| Variable | Dónde se configura | Notas |
|---|---|---|
| `MONGO_URI` | Railway → Backend → Variables | Ver `.env.production` para el valor real |
| `MONGO_DB` | Railway → Backend → Variables | `welve` |
| `SECRET_KEY` | Railway → Backend → Variables | Generado con `secrets.token_hex(32)`, ver `.env.production` |
| `REDIS_URL` / `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND` | Railway → Backend → Variables | Pendiente: crear servicio Redis en Railway (ver `DEPLOY.md`) |
| `CORS_ORIGINS` | Railway → Backend → Variables | Respaldo explícito — el regex `*.up.railway.app` en `main.py` ya cubre Railway automáticamente |
| `VITE_API_URL` | Build-arg de Docker, NO variable de runtime | Incrustada en el bundle al construir la imagen del frontend |

**No copiar la URI real de Mongo ni el `SECRET_KEY` a ningún otro archivo que
sí se commitee** (ver el fix aplicado en `chore/deploy-railway-dockerhub`:
antes estaban expuestos en `.env.example` y como default en `config.py`, en
un repo público).

## Comandos útiles

```bash
# Reconstruir y subir frontend (si cambia VITE_API_URL o el código)
docker build --build-arg VITE_API_URL=https://welve-backend-production.up.railway.app \
  -t alezzzzandrov/welve-frontend:latest ./frontend
docker push alezzzzandrov/welve-frontend:latest

# Reconstruir y subir backend
docker build -t alezzzzandrov/welve-backend:latest ./backend
docker push alezzzzandrov/welve-backend:latest

# Correr seed en local (idempotente)
cd backend && python scripts/seed.py

# Ver logs en Railway
# Railway Dashboard → servicio → Deploy Logs

# Probar una imagen standalone antes de subirla (health check + logs)
docker run -d --name test -p 8001:8001 -e PORT=8001 \
  -e MONGO_URI="..." -e SECRET_KEY=test alezzzzandrov/welve-backend:latest
curl http://localhost:8001/health
docker logs test
docker rm -f test
```
