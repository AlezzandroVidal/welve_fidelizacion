from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enums import EstadoAcceso


class AccesoCupon(BaseModel):
    """Resultado de cupon_acceso_service.evaluar_acceso_cupon — determina si
    un cliente puede ver/canjear un cupón, y su progreso si aplica."""

    puede_ver: bool
    puede_canjear: bool
    estado: EstadoAcceso
    progreso_actual: float
    progreso_meta: float
    progreso_porcentaje: float
    mensaje: str
    desbloqueado_en: Optional[datetime] = None
