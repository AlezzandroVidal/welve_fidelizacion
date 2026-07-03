from datetime import datetime
from typing import Any, Dict

from pydantic import BaseModel

from app.models.enums import TipoNotificacion


class NotificacionResponse(BaseModel):
    id: str
    clienteId: str
    empresaId: str
    tipo: TipoNotificacion
    titulo: str
    mensaje: str
    datos: Dict[str, Any] = {}
    leida: bool
    createdAt: datetime
