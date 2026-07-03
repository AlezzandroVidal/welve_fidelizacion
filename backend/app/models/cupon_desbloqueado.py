from datetime import datetime, timezone

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import ASCENDING, IndexModel


class CuponDesbloqueado(Document):
    """Un cupón visibilidad=por_reto/por_requisito que un cliente desbloqueó
    pero puede no haber canjeado todavía — separa "desbloqueo" de "canje",
    a diferencia de las recompensas automáticas (canal=automatico en Canje),
    que otorgan y canjean en el mismo paso. Creado por
    cupon_acceso_service.desbloquear_cupon()."""

    cliente_id: Indexed(PydanticObjectId)
    cupon_id: Indexed(PydanticObjectId)
    empresa_id: Indexed(PydanticObjectId)
    desbloqueado_en: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    notificado: bool = False
    canjeado: bool = False

    class Settings:
        name = "cupones_desbloqueados"
        indexes = [
            IndexModel([("cliente_id", ASCENDING), ("cupon_id", ASCENDING)], unique=True),
        ]
