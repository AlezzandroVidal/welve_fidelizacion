from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import ASCENDING, IndexModel

from app.models.enums import SegmentoCliente


class RelacionClienteEmpresa(Document):
    """Historial, racha, puntos y segmento de un cliente en una empresa concreta."""

    empresa_id: Indexed(PydanticObjectId)
    cliente_id: Indexed(PydanticObjectId)
    visitas_totales: int = 0
    monto_acumulado: float = 0.0
    racha_actual: int = 0
    racha_maxima: int = 0
    ultima_visita: Optional[datetime] = None
    segmento: SegmentoCliente = SegmentoCliente.regular
    fecha_entrada_segmento: Optional[datetime] = None
    puntos: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "relaciones_cliente_empresa"
        indexes = [
            IndexModel(
                [("empresa_id", ASCENDING), ("cliente_id", ASCENDING)],
                unique=True,
                name="empresa_cliente_unique",
            ),
            IndexModel(
                [("empresa_id", ASCENDING), ("segmento", ASCENDING)],
                name="empresa_segmento",
            ),
        ]
