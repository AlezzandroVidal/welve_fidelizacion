from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import ASCENDING, IndexModel

from app.models.enums import TipoCondicionReto


class Reto(Document):
    empresa_id: Indexed(PydanticObjectId)
    nombre: str
    condicion_tipo: TipoCondicionReto
    condicion_valor: float
    fecha_inicio: datetime
    fecha_fin: datetime
    recompensa_cupon_id: Optional[PydanticObjectId] = None
    notificado: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "retos"
        indexes = [
            IndexModel([("empresa_id", ASCENDING), ("fecha_fin", ASCENDING)]),
        ]
