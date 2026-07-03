from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field
from pymongo import ASCENDING, IndexModel

from app.models.enums import TipoReto


class Reto(Document):
    empresa_id: Indexed(PydanticObjectId)
    nombre: str
    condicion_tipo: TipoReto
    condicion_valor: float
    periodo_dias: Optional[int] = None          # solo aplica a las variantes *_en_periodo de TipoReto
    producto_objetivo_id: Optional[PydanticObjectId] = None  # solo para condicion_tipo=productos_comprados
    categoria_objetivo: Optional[str] = None          # alternativa a producto_objetivo_id, por categoría
    fecha_inicio: datetime
    fecha_fin: datetime
    recompensa_cupon_id: Optional[PydanticObjectId] = None
    descripcion_recompensa: Optional[str] = None          # texto corto para mostrar al cliente, ej. "Café gratis"
    mostrar_progreso_publico: bool = True          # si True, el cliente ve su progreso aunque el cupón sea privado
    notificar_al_completar: bool = True
    mensaje_completado: Optional[str] = None
    notificado: bool = False
    cancelado: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "retos"
        indexes = [
            IndexModel([("empresa_id", ASCENDING), ("fecha_fin", ASCENDING)]),
        ]
