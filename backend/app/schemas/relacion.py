from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enums import SegmentoCliente


class RelacionResponse(BaseModel):
    id: str
    empresaId: str
    clienteId: str
    visitasTotales: int
    montoAcumulado: float
    rachaActual: int
    rachaMaxima: int
    ultimaVisita: Optional[datetime] = None
    segmento: SegmentoCliente
    puntos: int
