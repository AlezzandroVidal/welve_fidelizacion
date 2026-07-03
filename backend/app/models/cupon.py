from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field
from pymongo import ASCENDING, IndexModel

from app.models.enums import AccesoVisibilidad, AplicaCupon, EstadoCupon, TipoCupon, TipoRequisito


class RequisitoAcceso(BaseModel):
    """Condición de desbloqueo para un Cupon con visibilidad=por_requisito —
    ver cupon_acceso_service.evaluar_acceso_cupon para la evaluación."""
    tipo: TipoRequisito
    valor: float
    periodo_dias: Optional[int] = None  # solo aplica a las variantes *_en_periodo de TipoRequisito
    # Solo para tipo=gasto_en_productos — mismo criterio que
    # Reto.producto_objetivo_id/categoria_objetivo: uno de los dos, no ambos.
    producto_objetivo_id: Optional[PydanticObjectId] = None
    categoria_objetivo: Optional[str] = None


class Cupon(Document):
    empresa_id: Indexed(PydanticObjectId)
    nombre: str
    # Código corto escaneable/tipeable (ej. "CUP-4F2A") — para identificar el
    # cupón en la Caja sin tener que buscarlo por nombre. Único globalmente
    # (mismo criterio que Cliente.codigo_cliente): un índice sparse compuesto
    # con empresa_id no seria realmente sparse en Mongo (solo se salta el
    # documento si TODOS los campos del índice faltan), así que se indexa solo
    # por codigo. Puede ser None en cupones creados antes de este campo.
    codigo: Optional[Indexed(str, unique=True, sparse=True)] = None
    tipo: TipoCupon
    valor: Optional[float] = None          # None válido solo para producto_gratis/dos_por_uno/envio_gratis/personalizado
    # Solo para tipo=n_por_m: cuántos paga el cliente vs. cuántos se lleva (ej. 3x2 -> paga=2, lleva=3)
    cantidad_paga: Optional[int] = None
    cantidad_lleva: Optional[int] = None
    # El producto que se da gratis (producto_gratis) o el que entra en la promo (dos_por_uno/n_por_m
    # cuando aplican a un producto específico en vez de "cualquiera" — ver aplica_a más abajo)
    producto_gratis_id: Optional[PydanticObjectId] = None
    monto_minimo: Optional[float] = None
    fecha_inicio: datetime
    fecha_expiracion: datetime
    estado: EstadoCupon = EstadoCupon.activo
    limite_usos_total: Optional[int] = None  # None = ilimitado
    limite_usos_por_cliente: Optional[int] = 1
    usos_actuales: int = 0
    # Restricciones de productos para el módulo de Caja/POS (si aplica_a=todo,
    # productos_validos/categorias_validas se ignoran — no hay restricción).
    aplica_a: AplicaCupon = AplicaCupon.todo
    productos_validos: list[PydanticObjectId] = Field(default_factory=list)
    categorias_validas: list[str] = Field(default_factory=list)
    monto_minimo_carrito: Optional[float] = None  # distinto de monto_minimo: es sobre el total del carrito, no por compra individual
    # Quién puede ver/canjear este cupón — reemplaza al viejo campo exclusivo:bool.
    # vip conserva exactamente la semántica de exclusivo=True (gate por segmento).
    visibilidad: AccesoVisibilidad = AccesoVisibilidad.publico
    reto_id: Optional[PydanticObjectId] = None          # si visibilidad=por_reto: qué reto lo desbloquea
    requisito: Optional[RequisitoAcceso] = None          # si visibilidad=por_requisito
    notificar_al_desbloquear: bool = True
    mensaje_notificacion: Optional[str] = None          # None -> mensaje default en cupon_acceso_service
    destacado: bool = False       # la empresa lo elige a mano para promocionarlo en el inicio del cliente
    imagen_url: Optional[str] = None          # data URI base64, mismo criterio que Empresa.logo_url
    terminos_condiciones: Optional[str] = None
    descripcion_larga: Optional[str] = None
    instrucciones_canje: Optional[str] = None          # ej. "Menciona 'WELVE' al pedir"
    tags: list[str] = Field(default_factory=list)
    color_tema: Optional[str] = None          # hex "#RRGGBB" para personalizar la card
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "cupones"
        indexes = [
            IndexModel([("empresa_id", ASCENDING), ("estado", ASCENDING)]),
        ]
