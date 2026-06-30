from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import ASCENDING, IndexModel

from app.models.enums import EstadoCupon, TipoCupon


class Cupon(Document):
    empresa_id: Indexed(PydanticObjectId)
    nombre: str
    tipo: TipoCupon
    valor: Optional[float] = None          # None válido solo para producto_gratis/dos_por_uno
    monto_minimo: Optional[float] = None
    fecha_inicio: datetime
    fecha_expiracion: datetime
    estado: EstadoCupon = EstadoCupon.activo
    limite_usos_total: Optional[int] = None  # None = ilimitado
    limite_usos_por_cliente: Optional[int] = 1
    usos_actuales: int = 0
    exclusivo: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "cupones"
        indexes = [
            IndexModel([("empresa_id", ASCENDING), ("estado", ASCENDING)]),
        ]
