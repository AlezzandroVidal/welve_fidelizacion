from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enums import TipoCondicionReto


class RetoCreate(BaseModel):
    nombre: str
    condicion_tipo: TipoCondicionReto
    condicion_valor: float
    fecha_inicio: datetime
    fecha_fin: datetime
    recompensa_cupon_id: Optional[str] = None


class RetoResponse(BaseModel):
    id: str
    empresaId: str
    nombre: str
    condicionTipo: TipoCondicionReto
    condicionValor: float
    fechaInicio: datetime
    fechaFin: datetime
    recompensaCuponId: Optional[str] = None
    recompensaCuponNombre: Optional[str] = None
    notificado: bool
