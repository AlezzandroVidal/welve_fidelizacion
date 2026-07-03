from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import init_db
from app.routers import health
from app.routers import (
    admin_auth,
    auth_cliente,
    empresas,
    clientes,
    cupones,
    canjes,
    relaciones,
    retos,
    membresias,
    metricas,
    wallet,
    qr,
    staff,
    resenas,
    pagos,
    productos,
    ventas,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Welve API",
    description="Plataforma SaaS B2B de fidelización para negocios físicos",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(admin_auth.router, prefix="/api/v1")
app.include_router(auth_cliente.router, prefix="/api/v1")
app.include_router(empresas.router, prefix="/api/v1")
app.include_router(clientes.router, prefix="/api/v1")
app.include_router(cupones.router, prefix="/api/v1")
app.include_router(canjes.router, prefix="/api/v1")
app.include_router(relaciones.router, prefix="/api/v1")
app.include_router(retos.router, prefix="/api/v1")
app.include_router(membresias.router, prefix="/api/v1")
app.include_router(metricas.router, prefix="/api/v1")
app.include_router(wallet.router, prefix="/api/v1/wallet")
app.include_router(qr.router, prefix="/api/v1")
app.include_router(staff.router, prefix="/api/v1")
app.include_router(resenas.router, prefix="/api/v1")
app.include_router(pagos.router, prefix="/api/v1")
app.include_router(productos.router, prefix="/api/v1")
app.include_router(ventas.router, prefix="/api/v1")
