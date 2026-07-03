from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class HistorialVisita(Document):
    """Log de cada visita/venta con fecha y monto — RelacionClienteEmpresa solo
    guarda totales acumulados, no permite responder "¿cuántas visitas tuvo en
    los últimos 30 días?". Escrito exclusivamente por
    visita_service.registrar_visita(), en el mismo punto donde se actualizan
    esos totales para que nunca queden desincronizados. Sin endpoints CRUD
    propios: solo lo leen los helpers de progreso por período (ver
    cupon_acceso_service / recompensas_engine)."""

    empresa_id: Indexed(PydanticObjectId)
    cliente_id: Indexed(PydanticObjectId)
    fecha: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    monto: Optional[float] = None

    class Settings:
        name = "historial_visitas"
        indexes = [
            IndexModel([("empresa_id", ASCENDING), ("cliente_id", ASCENDING), ("fecha", ASCENDING)]),
        ]
