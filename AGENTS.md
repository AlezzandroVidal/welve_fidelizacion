# Welve AI Agent Instructions

## Purpose
This repository is a full-stack B2B loyalty SaaS app.
Use `AGENTS.md` to understand the architecture, conventions, and core workflows before making changes.

## Key technologies
- Backend: Python 3.11, FastAPI 0.115, Uvicorn
- ODM / DB driver: Beanie 1.27 + Motor 3.6
- Database: MongoDB 7.0
- Queue: Celery 5.4 + Redis 7.4
- Frontend: React 18, Vite 6, TailwindCSS 3, React Query 5
- Testing: Pytest (backend), Vitest (frontend)

## Project structure
- `backend/`: FastAPI app, business services, models, routers, Celery worker
- `frontend/`: React UI, Vite app, page/components structure
- `infra/mongo-init/`: MongoDB init script
- `docker-compose.yml`: local multi-container dev stack

## Important repo conventions
- Prefer `AGENTS.md` over copying long docs. Link to existing docs where possible.
- This repo is multi-tenant: every tenant-scoped Mongo document must include `empresa_id`.
- Backend pattern:
  - `app/routers/*` define HTTP endpoints
  - `app/services/*` contain business logic and database access
  - routers should not access Beanie/Mongo directly except in trivial cases
- If adding a new backend domain model:
  - add the Beanie document under `backend/app/models`
  - register it in `backend/app/db/mongodb.py`
  - expose it via a router in `backend/app/main.py`
- Do not trust `empresa_id` values from request body without validation against JWT/session.
- Admin and client auth are separate flows:
  - `/api/v1/admin/auth` for admin login
  - `/api/v1/auth/cliente` for magic-link client access

## Backend environment and local setup
- Backend loads config from `backend/.env.example` and `backend/app/core/config.py`
- Key env settings:
  - `MONGO_URI`
  - `MONGO_DB`
  - `REDIS_URL`
  - `CELERY_BROKER_URL`
  - `CELERY_RESULT_BACKEND`
  - `SECRET_KEY`
  - `CORS_ORIGINS`
- Database init includes retries in `backend/app/db/mongodb.py`

## Testing and development commands
- Full stack: `docker compose up --build`
- Backend tests: `cd backend && pytest -v`
- Frontend tests: `cd frontend && npm test`
- Frontend dev: `cd frontend && npm run dev`
- Frontend lint: `cd frontend && npm run lint`

## Documentation sources
- [`README.md`](./README.md) — project overview and Docker/dev instructions
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — branch/commit/PR rules
- [`DATABASE.MD`](./DATABASE.MD) — data model and schema conventions
- [`PRODUCT.MD`](./PRODUCT.MD) — product/business rules
- [`CLAUDE.md`](./CLAUDE.md) — platform architecture and environment notes

## Commit and branch conventions
- Use Conventional Commits: `feat(...)`, `fix(...)`, `docs`, `refactor`, `test`, `chore`
- Branches should be short-lived and named like `feature/...`, `fix/...`, `docs/...`, `chore/...`
- Do not commit directly to `main`

## When to ask for clarification
- If a backend change touches tenant isolation or `empresa_id` handling
- If adding or modifying database models / indexes
- If introducing a new dependency
- If the change affects auth flows or token scopes

## Suggested future customizations
- Add a backend-specific skill for `empresa_id` / multi-tenant safety checks
- Add a frontend-specific skill for React/Vite form, API, and routing patterns
