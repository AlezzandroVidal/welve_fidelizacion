# Welve — Plataforma SaaS de Fidelización

> Proyecto integrador académico (Modalidad A) · Stack: FastAPI · React · MongoDB · Redis · Docker · Codespaces

Welve es una plataforma B2B que permite a negocios físicos (restaurantes, cafeterías, salones de belleza, retail) configurar y gestionar programas de fidelización para sus clientes. Los clientes finales acceden **sin necesidad de app ni registro**, a través de un QR o magic link.

---

## Arquitectura

```mermaid
graph TD
    subgraph Cliente Final
        QR[QR / Magic Link]
    end

    subgraph Frontend
        FE[React 18 + Vite\nnginx :80]
    end

    subgraph Backend
        API[FastAPI :8000]
        WRK[Celery Worker]
    end

    subgraph Datos
        MDB[(MongoDB :27017)]
        RDS[(Redis :6379)]
    end

    subgraph Notificaciones
        WA[WhatsApp Cloud API]
        SG[SendGrid / Resend]
    end

    QR --> FE
    FE -->|HTTP / REST| API
    API --> MDB
    API -->|Encola tarea| RDS
    WRK -->|Consume| RDS
    WRK --> WA
    WRK --> SG
```

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Python 3.11, FastAPI 0.115, Uvicorn |
| ODM / DB Driver | Beanie 1.27 + Motor 3.6 (async) |
| Base de datos | MongoDB 7.0 |
| Cola de tareas | Celery 5.4 + Redis 7.4 |
| Frontend | React 18, Vite 6, TailwindCSS 3, React Query 5 |
| Contenedores | Docker + Docker Compose |
| Cloud Dev | GitHub Codespaces |
| Testing | Pytest (backend), Vitest (frontend) |

---

## Estructura de carpetas

```
welve_fidelizacion/
├── .devcontainer/        # GitHub Codespaces config
├── .github/              # PR template
├── backend/
│   ├── Dockerfile        # Multi-stage build
│   ├── requirements.txt
│   └── app/
│       ├── main.py       # FastAPI app + lifespan
│       ├── core/         # Config, seguridad (JWT)
│       ├── db/           # Init Motor + Beanie
│       ├── models/       # Documentos Beanie (colecciones Mongo)
│       ├── schemas/      # Pydantic request/response
│       ├── routers/      # Endpoints por dominio
│       ├── services/     # Lógica de negocio
│       └── worker/       # Celery app + tasks
├── frontend/
│   ├── Dockerfile        # Vite build → nginx
│   ├── nginx.conf
│   └── src/
│       ├── api/          # Axios client base
│       └── components/   # Componentes React
├── infra/
│   └── mongo-init/       # Script de inicialización de Mongo
├── docker-compose.yml
├── .env.example
├── .gitignore
└── CONTRIBUTING.md
```

---

## Modelo de datos en MongoDB

Welve usa una **base de datos compartida con aislamiento por `empresa_id`** (multi-tenancy por campo). Cada documento que pertenece a un tenant lleva `empresa_id` indexado.

| Colección | Propósito |
|---|---|
| `empresas` | Tenants / clientes de Welve. Cada empresa tiene su `slug`, plan y configuración. |
| `clientes` | Usuarios finales de cada empresa. Sin contraseña; identificados por teléfono o email. Campo `empresa_id` obligatorio. |
| `cupones` | Beneficios configurados por la empresa (descuentos, productos gratis). Con validez, tope de usos y puntos requeridos. |
| `canjes` | Registro inmutable de cada canje de cupón por un cliente. |
| `retos` | Desafíos de visitas/puntos que la empresa define para premiar la recurrencia. |
| `membresias` | Relación cliente↔empresa: puntos acumulados, nivel, racha actual, retos completados. |

### Versionado de esquemas en MongoDB

A diferencia de bases de datos relacionales, MongoDB no tiene migraciones DDL. En Welve usamos la siguiente estrategia:

1. **Validación a nivel de documento con Beanie/Pydantic**: todos los campos tienen tipos estrictos y valores por defecto. Si un campo nuevo es opcional, los documentos viejos son compatibles automáticamente.
2. **Campo `schema_version` (a agregar si crece la complejidad)**: permite identificar la versión de esquema de cada documento y correr scripts de migración solo sobre los documentos desactualizados.
3. **Scripts de migración en `/infra/migrations/`**: scripts Python con Motor que actualizan documentos en batch cuando un cambio de esquema es incompatible hacia atrás. Se corren manualmente (o con Celery) antes del deploy.

---

## Correr localmente con Docker

### Prerrequisitos
- Docker Desktop (o Docker Engine + Compose plugin)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/<usuario>/welve_fidelizacion.git
cd welve_fidelizacion

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores si es necesario

# 3. Levantar el stack completo
docker compose up --build

# La primera vez tarda más porque descarga imágenes y construye las capas.
# Servicios disponibles:
#   Frontend:  http://localhost:80
#   API:       http://localhost:8000
#   Docs API:  http://localhost:8000/docs
#   MongoDB:   localhost:27017
#   Redis:     localhost:6379
```

### Comandos útiles

```bash
# Solo los servicios de datos (útil para desarrollo local sin Docker del backend)
docker compose up mongo redis -d

# Ver logs de un servicio
docker compose logs -f backend

# Acceder a Mongo con mongosh
docker compose exec mongo mongosh -u root -p changeme_root

# Detener y eliminar volúmenes (reset completo)
docker compose down -v
```

---

## Correr en GitHub Codespaces

### Abrir con un clic

1. En GitHub, haz clic en **Code → Codespaces → New codespace**.
2. El Codespace se configura automáticamente via `.devcontainer/devcontainer.json`.
3. Al terminar el setup, se ejecuta `docker compose up -d` automáticamente.
4. Los puertos 8000 (API), 80 (frontend) y 27017 (Mongo) quedan expuestos.

### Conectarse a MongoDB desde el Codespace

**Con mongosh en la terminal:**
```bash
docker compose exec mongo mongosh \
  -u welve_app -p changeme_app \
  --authenticationDatabase welve \
  welve
```

**Con la extensión MongoDB for VS Code:**
1. Abrir la extensión (ícono de hoja en la barra lateral).
2. Agregar conexión: `mongodb://welve_app:changeme_app@localhost:27017/welve?authSource=welve`
3. Explorar colecciones visualmente desde el panel.

---

## Correr los tests

### Backend (Pytest)

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

### Frontend (Vitest)

```bash
cd frontend
npm install
npm test
```

---

## Branching Strategy

Usamos **GitHub Flow**. Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para la guía completa de:
- Convención de nombres de ramas (`feature/`, `fix/`, `docs/`, `chore/`)
- Convención de commits (Conventional Commits)
- Flujo de Pull Request
- Reglas de protección de `main`

---

## Equipo

Proyecto académico desarrollado en GitHub Codespaces.
