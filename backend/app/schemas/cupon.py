import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator, model_validator

from app.models.cupon import RequisitoAcceso
from app.models.enums import AccesoVisibilidad, AplicaCupon, EstadoAcceso, EstadoCupon, RubroEmpresa, TipoCupon

_HEX_COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")


def _validar_imagen_url(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    v = v.strip()
    if not v:
        return None
    if not v.startswith("data:image/"):
        raise ValueError("imagen_url debe ser un data URI de imagen")
    # ~2 MB en bytes → ~2.73 MB en base64 → ~2 800 000 chars (mismo límite que Empresa.logo_url)
    if len(v) > 2_800_000:
        raise ValueError("La imagen supera el límite de 2 MB")
    return v


def _validar_descripcion_larga(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    v = v.strip()
    if not v:
        return None
    if len(v) > 500:
        raise ValueError("descripcion_larga no puede superar 500 caracteres")
    return v


def _validar_color_tema(v: Optional[str]) -> Optional[str]:
    if v is None:
        return v
    v = v.strip()
    if not v:
        return None
    if not _HEX_COLOR_RE.match(v):
        raise ValueError("color_tema debe ser un hex #RRGGBB")
    return v


class CuponCreate(BaseModel):
    nombre: str
    codigo: Optional[str] = None  # se autogenera si no se provee
    tipo: TipoCupon
    valor: Optional[float] = None
    cantidad_paga: Optional[int] = None
    cantidad_lleva: Optional[int] = None
    producto_gratis_id: Optional[str] = None
    monto_minimo: Optional[float] = None
    fecha_inicio: datetime
    fecha_expiracion: datetime
    limite_usos_total: Optional[int] = None
    limite_usos_por_cliente: Optional[int] = 1
    visibilidad: AccesoVisibilidad = AccesoVisibilidad.publico
    reto_id: Optional[str] = None
    requisito: Optional[RequisitoAcceso] = None
    notificar_al_desbloquear: bool = True
    mensaje_notificacion: Optional[str] = None
    destacado: bool = False
    imagen_url: Optional[str] = None
    terminos_condiciones: Optional[str] = None
    descripcion_larga: Optional[str] = None
    instrucciones_canje: Optional[str] = None
    tags: list[str] = []
    color_tema: Optional[str] = None
    aplica_a: AplicaCupon = AplicaCupon.todo
    productos_validos: list[str] = []
    categorias_validas: list[str] = []
    monto_minimo_carrito: Optional[float] = None

    @field_validator("nombre")
    @classmethod
    def nombre_min_length(cls, v: str) -> str:
        if len(v.strip()) < 3:
            raise ValueError("El nombre debe tener al menos 3 caracteres")
        return v.strip()

    @field_validator("imagen_url")
    @classmethod
    def imagen_url_valida(cls, v: Optional[str]) -> Optional[str]:
        return _validar_imagen_url(v)

    @field_validator("descripcion_larga")
    @classmethod
    def descripcion_larga_valida(cls, v: Optional[str]) -> Optional[str]:
        return _validar_descripcion_larga(v)

    @field_validator("color_tema")
    @classmethod
    def color_tema_valido(cls, v: Optional[str]) -> Optional[str]:
        return _validar_color_tema(v)

    @model_validator(mode="after")
    def validar_campos(self) -> "CuponCreate":
        if self.tipo in (TipoCupon.porcentual, TipoCupon.monto_fijo):
            if self.valor is None:
                raise ValueError(f"valor es requerido para tipo {self.tipo.value}")
        if self.tipo == TipoCupon.porcentual and self.valor is not None:
            if not (1 <= self.valor <= 100):
                raise ValueError("El porcentaje debe estar entre 1 y 100")
        if self.tipo == TipoCupon.n_por_m:
            if not self.cantidad_paga or not self.cantidad_lleva:
                raise ValueError("cantidad_paga y cantidad_lleva son requeridos para tipo n_por_m")
            if self.cantidad_paga >= self.cantidad_lleva:
                raise ValueError("cantidad_paga debe ser menor que cantidad_lleva")
        if self.fecha_expiracion <= self.fecha_inicio:
            raise ValueError("fecha_expiracion debe ser posterior a fecha_inicio")
        if self.visibilidad == AccesoVisibilidad.por_reto and not self.reto_id:
            raise ValueError("reto_id es requerido para visibilidad=por_reto")
        if self.visibilidad == AccesoVisibilidad.por_requisito and not self.requisito:
            raise ValueError("requisito es requerido para visibilidad=por_requisito")
        return self


class CuponUpdate(BaseModel):
    nombre: Optional[str] = None
    codigo: Optional[str] = None
    monto_minimo: Optional[float] = None
    fecha_expiracion: Optional[datetime] = None
    limite_usos_total: Optional[int] = None
    limite_usos_por_cliente: Optional[int] = None
    estado: Optional[EstadoCupon] = None
    visibilidad: Optional[AccesoVisibilidad] = None
    reto_id: Optional[str] = None
    requisito: Optional[RequisitoAcceso] = None
    notificar_al_desbloquear: Optional[bool] = None
    mensaje_notificacion: Optional[str] = None
    producto_gratis_id: Optional[str] = None
    destacado: Optional[bool] = None
    imagen_url: Optional[str] = None
    terminos_condiciones: Optional[str] = None
    descripcion_larga: Optional[str] = None
    instrucciones_canje: Optional[str] = None
    tags: Optional[list[str]] = None
    color_tema: Optional[str] = None
    aplica_a: Optional[AplicaCupon] = None
    productos_validos: Optional[list[str]] = None
    categorias_validas: Optional[list[str]] = None
    monto_minimo_carrito: Optional[float] = None

    @field_validator("imagen_url")
    @classmethod
    def imagen_url_valida(cls, v: Optional[str]) -> Optional[str]:
        return _validar_imagen_url(v)

    @field_validator("descripcion_larga")
    @classmethod
    def descripcion_larga_valida(cls, v: Optional[str]) -> Optional[str]:
        return _validar_descripcion_larga(v)

    @field_validator("color_tema")
    @classmethod
    def color_tema_valido(cls, v: Optional[str]) -> Optional[str]:
        return _validar_color_tema(v)


class CuponResponse(BaseModel):
    id: str
    empresaId: str
    nombre: str
    codigo: Optional[str] = None
    tipo: TipoCupon
    valor: Optional[float] = None
    cantidadPaga: Optional[int] = None
    cantidadLleva: Optional[int] = None
    productoGratisId: Optional[str] = None
    montoMinimo: Optional[float] = None
    fechaInicio: datetime
    fechaExpiracion: datetime
    estado: EstadoCupon
    limiteUsosTotal: Optional[int] = None
    limiteUsosPorCliente: Optional[int] = None
    usosActuales: int
    visibilidad: AccesoVisibilidad
    retoId: Optional[str] = None
    requisito: Optional[RequisitoAcceso] = None
    notificarAlDesbloquear: bool
    mensajeNotificacion: Optional[str] = None
    destacado: bool
    imagenUrl: Optional[str] = None
    terminosCondiciones: Optional[str] = None
    descripcionLarga: Optional[str] = None
    instruccionesCanje: Optional[str] = None
    tags: list[str] = []
    colorTema: Optional[str] = None
    aplicaA: AplicaCupon
    productosValidos: list[str] = []
    categoriasValidas: list[str] = []
    montoMinimoCarrito: Optional[float] = None
    estaVigente: bool
    createdAt: datetime
    updatedAt: datetime


class EmpresaResumenCupon(BaseModel):
    """Info de empresa embebida en la respuesta pública de detalle de cupón."""

    id: str
    nombre: str
    rubro: RubroEmpresa
    logoUrl: Optional[str] = None
    descripcion: Optional[str] = None
    direccion: Optional[str] = None
    horario: Optional[str] = None
    telefonoContacto: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    tiktok: Optional[str] = None
    sitioWeb: Optional[str] = None


class CuponDetalleResponse(CuponResponse):
    """Respuesta del endpoint público GET /wallet/cupones/{id}/detalle."""

    empresa: EmpresaResumenCupon
    cuponesRelacionados: list[CuponResponse] = []
    # estaDisponibleParaMi = acceso.puede_canjear — se mantiene por compatibilidad
    # con CanjeCTA.tsx. La afiliación (RelacionClienteEmpresa) YA NO es un
    # prerequisito para esto: cupon_acceso_service.evaluar_acceso_cupon calcula
    # puede_canjear correctamente incluso sin relación previa (ver Parte 1).
    estaDisponibleParaMi: bool
    estaAfiliado: bool
    # Estado/progreso completo (AccesoCupon) — permite a la UI mostrar "te
    # faltan X visitas" en vez de solo disponible/no-disponible.
    accesoEstado: EstadoAcceso
    progresoActual: float
    progresoMeta: float
    progresoPorcentaje: float
    accesoMensaje: str
    desbloqueadoEn: Optional[datetime] = None
