# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Welve: SaaS B2B multi-tenant de fidelización de clientes para negocios físicos
(restaurantes, cafeterías, salones de belleza, retail) en Perú.
Las empresas pagan suscripción mensual y configuran cupones, retos, rachas de visita
y recompensas por historial. Los clientes finales acceden sin registro vía QR o magic link.

Antes de implementar cualquier feature de dominio, lee `PRODUCT.MD` (reglas de
negocio) y `DATABASE.MD` (schema completo de colecciones, tipos y enums).

Antes de tocar UI, lee `DESIGN.md` (paleta, tipografía, layout de tarjetas/sidebar, íconos):
es la fuente de verdad de tokens visuales — no inventar valores nuevos por componente.

## Stack

- **Backend**: Python 3.11, FastAPI 0.115, Motor 3.6 + Beanie 1.27 (MongoDB), Celery 5.4, Redis 7.4
- **Frontend**: React 18, Vite 6, TailwindCSS 3, React Query 5, TypeScript
- **DB**: MongoDB Atlas (cluster en la nube, `MONGO_URI` con `mongodb+srv://`) — **no** hay contenedor
  Mongo local; `docker-compose.yml` no define un servicio `mongo`.
- **Testing**: Pytest (backend), Vitest (frontend)
- **Infra**: Docker Compose (`name: welve`), GitHub Codespaces

## Flujo de desarrollo por defecto (Codespaces)

El devcontainer (`.devcontainer/devcontainer.json`) **no** levanta el stack completo con Docker.
Al crear el Codespace:
- `postCreateCommand` copia `.env.example` → `.env`, instala `backend/requirements.txt` y `frontend` (`npm install`).
- `postStartCommand` solo corre `docker compose up redis -d`.

El día a día es: Redis en Docker + backend con `uvicorn`/`fastapi dev` nativo + frontend con `npm run dev`
nativo. `docker compose up --build` (stack completo, backend/frontend/celery-worker dockerizados) es para
probar el build tipo producción, no el loop de desarrollo habitual.

## Comandos clave

```bash
# Solo Redis (flujo por defecto en Codespaces — ver arriba)
docker compose up redis -d

# Stack completo dockerizado (backend + celery-worker + frontend + redis),
# para probar el build tipo producción — Mongo sigue siendo Atlas, no local
docker compose up --build
docker compose up -d      # en background, sin rebuild

# Logs de un servicio
docker compose logs -f backend        # o: frontend | celery-worker | redis

# Bajar el stack (no hay volúmenes locales que borrar: Mongo es Atlas,
# Redis no tiene volumen definido en docker-compose.yml)
docker compose down

# Conectarse a Mongo Atlas con mongosh (usa el MONGO_URI de .env)
mongosh "$MONGO_URI"

# Tests backend (pytest + pytest-asyncio ya están en requirements.txt,
# pero no existe todavía backend/tests/ — crearla al agregar el primer test)
cd backend && pytest -v

# Tests frontend (vitest ya está configurado en package.json,
# pero no existe todavía ningún *.test.ts(x) — crearlo al agregar el primer test)
cd frontend && npm test

# Dev server frontend (sin Docker, apunta a API en :8000)
cd frontend && npm run dev

# Linter frontend
cd frontend && npm run lint

# Celery worker (desarrollo local sin Docker)
cd backend && celery -A app.worker.celery_app worker --loglevel=info

# Seed de datos de ejemplo (idempotente — no duplica si ya existen)
cd backend && python scripts/seed.py
```

Los índices de Beanie/MongoDB se crean automáticamente en el startup de FastAPI
(`lifespan` en `app/main.py` → `init_db()` → `init_beanie()`). No hay comando de migración separado.

**API docs interactiva** (cuando el backend corre): `http://localhost:8000/docs`

## Desarrollo local sin Docker (backend)

`MONGO_URI` apunta siempre al mismo cluster de Atlas (no cambia entre Docker y local). Lo único que
cambia es `REDIS_URL`/`CELERY_*`: si Redis corre vía `docker compose up redis -d` y el backend se corre
nativo con `uvicorn`, usar `localhost` en vez del nombre de servicio Docker:

```
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

Dentro de `docker-compose.yml` (backend/celery-worker dockerizados), estas variables usan `redis` como host.

## Reglas que NUNCA debo romper

1. **Multi-tenancy**: todo documento Beanie que pertenezca a una empresa DEBE tener
   el campo `empresa_id: Indexed(PydanticObjectId)`. Es la única barrera de aislamiento entre tenants.
2. **`.env` nunca se commitea**. Solo `.env.example`. Verificar con `git status` antes de cualquier commit.
3. **No push directo a `main`**. Siempre rama + PR. Ver `CONTRIBUTING.md`.
4. **Conventional Commits**: `feat(scope):`, `fix(scope):`, `docs:`, `chore:`, `refactor:`, `test:`.
5. **No agregar dependencias** (`pip install` / `npm install <pkg>`) sin confirmar con el usuario primero.
6. **No modificar campos de identidad/aislamiento** (`empresa_id`, `cliente_id` en colecciones de relación) desde un endpoint sin validar contra el JWT/sesión — nunca confiar en un `empresa_id` que venga del body del request.

## Modelo de datos (MongoDB) — resumen

Schema completo, tipos de campo, índices y enums en `DATABASE.MD`. Resumen de colecciones:

| Colección | Tenant-scoped | Propósito |
|---|---|---|
| `empresas` | — (raíz) | el tenant; login admin, plan de suscripción a Welve |
| `clientes` | No (global) | identidad del cliente B2C, sin historial por empresa |
| `relaciones_cliente_empresa` | Sí | historial, racha, puntos, segmento por (cliente, empresa) |
| `cupones` | Sí | descuentos configurados por la empresa |
| `retos` | Sí | metas con recompensa, opcionalmente de tiempo límite |
| `membresias` | Sí | definición del club mensual que ofrece la empresa |
| `membresias_clientes` | Sí | estado de suscripción de un cliente a una membresía |
| `canjes` | Sí | registro inmutable de cada redención |
| `welve_admins` | No (global) | staff interno de Welve (superadmin / soporte) |

Todos los enums de dominio están centralizados en `app/models/enums.py`
(`TipoCupon`, `EstadoCupon`, `SegmentoCliente`, `CanalCanje`, `WelveAdminRol`, etc.).

## Módulos del backend (mapeo 1:1 con colecciones de dominio)

Cada módulo de dominio sigue el patrón `router → service → model` y vive en:

- `models/<dominio>.py` — documento(s) Beanie
- `schemas/<dominio>.py` — Pydantic de entrada/salida
- `services/<dominio>_service.py` — lógica de negocio, único lugar que toca Beanie
- `routers/<dominio>.py` — endpoints HTTP, expuestos en `/api/v1/<dominio>`

Módulos: `empresas` (incluye auth admin), `admin_auth` (login WelveAdmin, prefijo interno `/admin/auth`),
`clientes`, `relaciones` (historial/racha/segmento), `cupones`, `retos`, `membresias`, `canjes`,
`auth_cliente` (magic link/QR), `metricas` (dashboard, solo lectura),
`wallet` (vista del cliente final sobre todas sus empresas — el único router sin prefijo propio;
recibe `/api/v1/wallet` al registrarse en `main.py`).

**Al agregar un nuevo módulo**, registrar el modelo Beanie en **dos lugares**:
1. `app/db/mongodb.py` → lista `document_models` del `init_beanie()`
2. `app/main.py` → `app.include_router(..., prefix="/api/v1")`

## Autenticación — tres roles separados

Los tres tipos de token JWT nunca deben mezclarse entre sí:

| Rol | Cómo accede | Dependencia FastAPI | Prefijo de ruta |
|---|---|---|---|
| `empresa` | email/password | `get_current_empresa_admin` | `/api/v1/empresas/...` |
| `cliente` | magic link / QR | `get_current_cliente` → `(Cliente, RelacionClienteEmpresa)`, scoped a una empresa | `/api/v1/auth/cliente/...` |
| `cliente` (multi-empresa) | mismo token, sin depender de `empresa_id` | `get_global_cliente` → `Cliente` solo, sin relación | `/api/v1/wallet/...` |
| `superadmin` / `soporte` | email/password (WelveAdmin) | `get_current_super_admin` | `/api/v1/admin/auth/...` |

`get_current_cliente` valida que exista una `RelacionClienteEmpresa` para el `empresa_id` del token
(endpoints de una empresa específica); `get_global_cliente` solo valida al cliente y se usa en `wallet`,
donde el cliente ve el agregado de todas sus empresas.

La fuente de verdad de las dependencias está en `app/core/dependencies.py`.
`app/core/deps.py` es un shim de compatibilidad que re-exporta todo desde allí — no editarlo directamente.

**Magic link en desarrollo**: cuando `ENVIRONMENT=development`, el endpoint
`POST /api/v1/auth/cliente/magic-link` devuelve `devToken` y `verifyUrl` directamente
en la respuesta (sin enviar email ni WhatsApp). Usar esto para testing manual.

**JWT payload del cliente** incluye `sub` (cliente_id) + `empresa_id` + `rol: "cliente"`.
El frontend almacena el token en `localStorage["welve_token"]`.

## Convenciones de código

- **Routers**: prefijo `/api/v1/<recurso>`, registrados en `main.py`. Un archivo por dominio.
- **Servicios**: funciones `async` puras en `services/<dominio>_service.py`; los routers no tocan Beanie directamente.
- **Errores HTTP**: `raise HTTPException(status_code=..., detail="...")` en el router, nunca en el servicio.
- **Excepción**: `canje_service.crear_canje()` retorna `(canje, error_msg)` — si `error_msg is not None`, el router debe lanzar el HTTPException. Este patrón de tupla se usa cuando el servicio necesita comunicar fallas de negocio sin excepciones.
- **IDs**: los modelos Beanie exponen `id` como `PydanticObjectId`; en schemas de respuesta se serializa como `str(obj.id)`.
- **Nombres**: snake_case en Python y en campos de Mongo; camelCase en TypeScript/React.

## Estructura del proyecto

- `/backend/app/` — FastAPI: `core/` (config, JWT, dependencias de auth), `db/` (init Beanie con reintentos),
  `models/` (documentos Mongo + `enums.py`), `schemas/` (Pydantic I/O), `routers/`, `services/`, `worker/` (Celery)
- `/frontend/src/` — React: `api/` (cliente Axios + funciones por dominio), `context/AuthContext.tsx` (JWT decode + roles),
  `hooks/` (React Query hooks por dominio), `pages/` (`auth/`, `admin/`, `wallet/`), `layouts/`, `components/`
- `/mongo-init/` — Script JS para crear el usuario `welve_app` al primer arranque de un Mongo local.
  **Actualmente huérfano**: `docker-compose.yml` no tiene un servicio `mongo` que lo ejecute (la DB es
  Atlas). No editar asumiendo que corre; si se necesita, es contexto para un futuro Mongo local.

### Frontend: flujo de datos

`hooks/use<Dominio>.ts` → `api/<dominio>.ts` → `api/client.ts` (Axios con interceptor de JWT).
Las páginas consumen hooks, nunca llaman a `api/` directamente.
`ProtectedRoute` valida el `rol` del JWT antes de renderizar; `AuthContext` decodifica el token del localStorage.

## Worker Celery

Archivo: `backend/app/worker/tasks.py`. Estado actual: stubs de notificación
(`enviar_whatsapp`, `enviar_email`) sin integración real — pendientes de conectar
con WhatsApp Cloud API y SendGrid/Resend respectivamente.
