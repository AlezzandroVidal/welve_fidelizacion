# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Welve: SaaS B2B multi-tenant de fidelización de clientes para negocios físicos
(restaurantes, cafeterías, salones de belleza, retail) en Perú.
Las empresas pagan suscripción mensual y configuran cupones, retos, rachas de visita
y recompensas por historial. Los clientes finales acceden sin registro vía QR o magic link.

Antes de implementar cualquier feature de dominio, lee `PRODUCT.MD` (reglas de
negocio) y `DATABASE.MD` (schema completo de colecciones, tipos y enums).

## Stack

- **Backend**: Python 3.11, FastAPI 0.115, Motor 3.6 + Beanie 1.27 (MongoDB), Celery 5.4, Redis 7.4
- **Frontend**: React 18, Vite 6, TailwindCSS 3, React Query 5, TypeScript
- **DB**: MongoDB 7.0
- **Testing**: Pytest (backend), Vitest (frontend)
- **Infra**: Docker Compose (`name: welve`), GitHub Codespaces

## Comandos clave

```bash
# Stack completo (primera vez o tras cambios en Dockerfile)
docker compose up --build

# Stack en background (día a día)
docker compose up -d

# Solo servicios de datos (desarrollo local sin Docker del backend)
docker compose up mongo redis -d

# Logs de un servicio
docker compose logs -f backend        # o: frontend | celery-worker | mongo | redis

# Reset completo (borra volúmenes de Mongo)
docker compose down -v

# Shell de Mongo (usuario de aplicación)
docker compose exec mongo mongosh -u welve_app -p changeme_app --authenticationDatabase welve welve

# Tests backend — todos
cd backend && pytest -v

# Tests backend — un archivo o test específico
cd backend && pytest tests/test_cupones.py -v
cd backend && pytest tests/test_cupones.py::test_crear_cupon -v

# Tests frontend
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

Cuando se corre `docker compose up mongo redis -d` y el backend directamente con `uvicorn`, el `.env` debe usar `localhost` en lugar de los nombres de servicio Docker:

```
MONGO_URI=mongodb://welve_app:changeme_app@localhost:27017/welve?authSource=welve
REDIS_URL=redis://localhost:6379/0
```

En Docker Compose, `MONGO_URI` usa `mongo` como host (nombre del servicio).

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

Módulos: `empresas` (incluye auth admin), `clientes`, `relaciones` (historial/racha/segmento),
`cupones`, `retos`, `membresias`, `canjes`, `auth_cliente` (magic link/QR), `metricas` (dashboard, solo lectura).

**Al agregar un nuevo módulo**, registrar el modelo Beanie en **dos lugares**:
1. `app/db/mongodb.py` → lista `document_models` del `init_beanie()`
2. `app/main.py` → `app.include_router(..., prefix="/api/v1")`

## Autenticación — tres roles separados

Los tres tipos de token JWT nunca deben mezclarse entre sí:

| Rol | Cómo accede | Dependencia FastAPI | Prefijo de ruta |
|---|---|---|---|
| `empresa` | email/password | `get_current_empresa_admin` | `/api/v1/empresas/...` |
| `cliente` | magic link / QR | `get_current_cliente` → `(Cliente, RelacionClienteEmpresa)` | `/api/v1/auth/cliente/...` |
| `superadmin` / `soporte` | email/password (WelveAdmin) | `get_current_super_admin` | `/api/v1/admin/auth/...` |

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
- `/mongo-init/` — Script JS que crea el usuario `welve_app` al primer arranque de Mongo

### Frontend: flujo de datos

`hooks/use<Dominio>.ts` → `api/<dominio>.ts` → `api/client.ts` (Axios con interceptor de JWT).
Las páginas consumen hooks, nunca llaman a `api/` directamente.
`ProtectedRoute` valida el `rol` del JWT antes de renderizar; `AuthContext` decodifica el token del localStorage.

## Worker Celery

Archivo: `backend/app/worker/tasks.py`. Estado actual: stubs de notificación
(`enviar_whatsapp`, `enviar_email`) sin integración real — pendientes de conectar
con WhatsApp Cloud API y SendGrid/Resend respectivamente.
