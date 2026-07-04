# Welve — Plataforma SaaS B2B de Fidelización
## Créditos

| | |
|---|---|
| 👨‍💻 **Desarrollador** | Marco Alessandro Vidal Chumacero |
| 👩‍💻 **Desarrolladora** | Angelica Arias Alvarez |
| 🛠️ **Asistencia IA** | Claude Code (Anthropic) |
| 🏫 **Modalidad** | Proyecto Integrador Académico — Modalidad A |
| ☁️ **Entorno** | GitHub Codespaces |


![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![React](https://img.shields.io/badge/React-18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Railway](https://img.shields.io/badge/Deploy-Railway-purple)
![Docker](https://img.shields.io/badge/Docker-Hub-blue)


## Descripción

Welve es una plataforma SaaS B2B que digitaliza los programas de fidelización
de negocios físicos — restaurantes, cafeterías, salones de belleza, tiendas
de retail — reemplazando las tarjetas perforadas y stickers de papel por un
sistema configurable de cupones, retos, rachas de visita y recompensas por
historial de compra.

El modelo de negocio es una suscripción mensual B2B: la empresa paga por usar
la plataforma (planes Starter/Growth/Pro), no una comisión por cada canje o
venta. El costo de los descuentos que la empresa ofrece a sus clientes es
100% suyo — Welve solo cobra la suscripción.

Los clientes finales acceden **sin instalar nada ni crear una cuenta con
contraseña obligatoria**: escanean un QR en el local o reciben un magic link,
y desde ahí ven su wallet de cupones, su progreso en retos activos y su
historial, todo por navegador. El módulo de Caja/POS integrado permite que el
mismo negocio registre sus ventas, descuente stock de inventario y aplique
los cupones automáticamente en el mismo flujo de cobro.

## URLs de producción

| Servicio | URL |
|---|---|
| Frontend | https://welve-frontend-production.up.railway.app |
| Backend API | https://welve-backend-production.up.railway.app |
| Docs (Swagger) | https://welve-backend-production.up.railway.app/docs |
| Health check | https://welve-backend-production.up.railway.app/health |

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Backend | Python + FastAPI | 3.11 / 0.115 |
| ODM / driver Mongo | Beanie + Motor (async) | 1.27 / 3.6 |
| Base de datos | MongoDB Atlas (cloud, no local) | — |
| Cola de tareas | Celery + Redis | 5.4 / 7.4 |
| Frontend | React + Vite + TypeScript | 18 / 6 |
| Estilos | TailwindCSS | 3 |
| Estado de servidor | React Query (TanStack) | 5 |
| Formularios | React Hook Form + Zod | — |
| Gráficos | Recharts | — |
| Íconos | lucide-react | — |
| Contenedores | Docker (multi-stage) | — |
| Deploy | Railway (imágenes desde Docker Hub) | — |
| Servidor estático frontend | Nginx | 1.27-alpine |

## Cómo correr en desarrollo

El flujo por defecto en GitHub Codespaces (o local) **no** usa Docker para
todo — solo Redis corre en contenedor, el resto es nativo:

```bash
# 1. Clonar y configurar variables de entorno
git clone https://github.com/AlezzandroVidal/welve_fidelizacion.git
cd welve_fidelizacion
cp .env.example .env   # completar MONGO_URI real (Atlas) y SECRET_KEY

# 2. Levantar Redis (único servicio en Docker durante desarrollo)
docker compose up redis -d

# 3. Backend nativo
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# API: http://localhost:8000 · Docs: http://localhost:8000/docs

# 4. Frontend nativo (otra terminal)
cd frontend
npm install
npm run dev
# App: http://localhost:5173 (proxy a la API vía vite.config.ts)

# 5. (Opcional) Poblar datos de ejemplo — idempotente, no duplica
cd backend && python scripts/seed.py

# 6. (Opcional) Worker de Celery — jobs periódicos (romper rachas, expirar
# cupones, evaluar clientes VIP, notificar retos activos)
cd backend && celery -A app.worker.celery_app worker -B --loglevel=info
```

> MongoDB **no corre en contenedor** — el `MONGO_URI` siempre apunta a un
> cluster de Atlas, tanto en desarrollo como en producción. Ver `CLAUDE.md`
> para el detalle completo de convenciones del proyecto.

Para probar el build de producción completo (backend + frontend + worker
dockerizados, aunque Mongo sigue siendo Atlas):

```bash
docker compose up --build
```

## Cómo hacer deploy

El deploy a producción es a **Railway**, usando imágenes Docker ya construidas
y publicadas en Docker Hub (`alezzzzandrov/welve-backend`,
`alezzzzandrov/welve-frontend`) — no builds desde el repo conectado. La guía
completa, paso a paso, con las variables de entorno exactas y las salvedades
de Railway al desplegar por imagen en vez de por repo, está en
**[DEPLOY.md](./DEPLOY.md)**.

## Estructura del proyecto

```
welve_fidelizacion/
├── backend/
│   ├── Dockerfile             # multi-stage: builder (deps) + production
│   ├── requirements.txt
│   ├── scripts/
│   │   ├── seed.py            # datos de ejemplo, idempotente
│   │   └── migrate_*.py       # migraciones one-off de índices/schema
│   └── app/
│       ├── main.py            # FastAPI app, lifespan, CORS, routers
│       ├── core/               # config, JWT/seguridad, dependencias de auth
│       ├── db/                 # init de Motor + Beanie
│       ├── models/             # documentos Beanie (colecciones Mongo) + enums.py
│       ├── schemas/            # Pydantic de entrada/salida por dominio
│       ├── routers/            # endpoints HTTP, un archivo por dominio
│       ├── services/           # lógica de negocio (único lugar que toca Beanie)
│       └── worker/             # Celery app + tasks + jobs periódicos
├── frontend/
│   ├── Dockerfile              # multi-stage: build (Vite) + nginx
│   ├── nginx.conf
│   └── src/
│       ├── api/                 # cliente Axios + funciones por dominio
│       ├── hooks/                # hooks de React Query por dominio
│       ├── context/              # AuthContext (decodifica JWT, roles)
│       ├── layouts/              # AdminLayout, WalletLayout
│       ├── pages/                 # auth/, admin/, wallet/, qr/, LandingPage
│       └── components/            # componentes por dominio + ui/ genéricos
├── docs/
│   ├── REGLAS_NEGOCIO.md
│   ├── ARQUITECTURA.md
│   ├── DATABASE.MD                # schema completo de Mongo, campo por campo
│   ├── PRODUCT.MD                 # reglas de negocio detalladas por módulo
│   ├── DESIGN.md                  # tokens visuales (paleta, tipografía, layout)
│   └── CONTRIBUTING.md            # GitHub Flow, commits, PRs, historial real de ramas
├── docker-compose.yml            # stack completo (prueba local de prod)
├── DEPLOY.md                     # guía de deploy en Railway
└── .env.example
```

`CLAUDE.md` y `AGENTS.md` (instrucciones para agentes de IA) existen en el
repo pero **no están versionados** — viven en `.gitignore`, cada quien los
mantiene localmente.

## Documentación adicional

| Documento | Contenido |
|---|---|
| [DEPLOY.md](./DEPLOY.md) | Guía paso a paso de deploy en Railway |
| [docs/REGLAS_NEGOCIO.md](./docs/REGLAS_NEGOCIO.md) | Actores, módulos, flujos y reglas de negocio |
| [docs/ARQUITECTURA.md](./docs/ARQUITECTURA.md) | Diagramas de arquitectura, capas y schema de datos |
| [docs/DATABASE.MD](./docs/DATABASE.MD) | Schema completo de MongoDB, colección por colección |
| [docs/PRODUCT.MD](./docs/PRODUCT.MD) | Visión de producto y reglas de negocio funcionales |
| [docs/DESIGN.md](./docs/DESIGN.md) | Sistema de diseño: paleta, tipografía, componentes |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Branching (GitHub Flow), commits, PRs, cómo se ha trabajado en la práctica |

## Créditos

Proyecto integrador académico (Modalidad A), desarrollado por
**Marco Alessandro Vidal Chumacero y Angelica Arias Alvarez** en GitHub Codespaces, 
con asistencia deClaude Code para partes de implementación y automatizacion de despliegue.
