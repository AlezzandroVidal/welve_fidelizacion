from datetime import datetime, timezone

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import ASCENDING, IndexModel

from app.models.enums import TipoNotificacion


class Notificacion(Document):
    """Notificación en-app persistida para el wallet del cliente — distinta de
    los recordatorios WhatsApp/email de reto_service.notificar_retos_pendientes,
    que son efímeros (se construyen y se descartan, nunca se guardan)."""

    cliente_id: Indexed(PydanticObjectId)
    empresa_id: PydanticObjectId
    tipo: TipoNotificacion
    titulo: str
    mensaje: str
    datos: dict = Field(default_factory=dict)  # ej. {"cupon_id": "...", "reto_id": "..."}
    leida: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "notificaciones"
        indexes = [
            IndexModel([("cliente_id", ASCENDING), ("leida", ASCENDING)]),
        ]
