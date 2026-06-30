from pydantic import BaseModel

from app.models.enums import TipoCupon


class ResumenResponse(BaseModel):
    total_clientes: int
    canjes_hoy: int
    canjes_semana: int
    canjes_mes: int
    cupones_activos: int
    tasa_redencion: float        # (canjes_mes / total_clientes) * 100
    clientes_recurrentes: int    # visitas_totales > 1
    racha_promedio: float


class PuntoTiempo(BaseModel):
    fecha: str    # YYYY-MM-DD
    cantidad: int


class TopCupon(BaseModel):
    cupon_id: str
    nombre: str
    tipo: TipoCupon
    usos_actuales: int


# Alias de compatibilidad con el endpoint /dashboard anterior
class DashboardResponse(BaseModel):
    totalClientes: int
    totalCanjes: int
    cuponesActivos: int
    tasaRedencion: float
    clientesRecurrentes: int
    clientesExclusivos: int
