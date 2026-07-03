from datetime import datetime
from typing import Optional

from pydantic import BaseModel, model_validator

from app.models.enums import TipoReto

_TIPOS_CON_PERIODO = {TipoReto.visitas_en_periodo, TipoReto.monto_en_periodo}


class RetoCreate(BaseModel):
    nombre: str
    condicion_tipo: TipoReto
    condicion_valor: float
    periodo_dias: Optional[int] = None
    producto_objetivo_id: Optional[str] = None
    categoria_objetivo: Optional[str] = None
    fecha_inicio: datetime
    fecha_fin: datetime
    recompensa_cupon_id: Optional[str] = None
    descripcion_recompensa: Optional[str] = None
    mostrar_progreso_publico: bool = True
    notificar_al_completar: bool = True
    mensaje_completado: Optional[str] = None

    @model_validator(mode="after")
    def validar_campos(self) -> "RetoCreate":
        if self.condicion_tipo in _TIPOS_CON_PERIODO and not self.periodo_dias:
            raise ValueError(f"periodo_dias es requerido para condicion_tipo={self.condicion_tipo.value}")
        if self.condicion_tipo == TipoReto.productos_comprados and not (
            self.producto_objetivo_id or self.categoria_objetivo
        ):
            raise ValueError("producto_objetivo_id o categoria_objetivo es requerido para productos_comprados")
        if self.fecha_fin <= self.fecha_inicio:
            raise ValueError("fecha_fin debe ser posterior a fecha_inicio")
        return self


class RetoUpdate(BaseModel):
    nombre: Optional[str] = None
    condicion_valor: Optional[float] = None
    periodo_dias: Optional[int] = None
    producto_objetivo_id: Optional[str] = None
    categoria_objetivo: Optional[str] = None
    fecha_fin: Optional[datetime] = None
    recompensa_cupon_id: Optional[str] = None
    descripcion_recompensa: Optional[str] = None
    mostrar_progreso_publico: Optional[bool] = None
    notificar_al_completar: Optional[bool] = None
    mensaje_completado: Optional[str] = None


class RetoResponse(BaseModel):
    id: str
    empresaId: str
    nombre: str
    condicionTipo: TipoReto
    condicionValor: float
    periodoDias: Optional[int] = None
    productoObjetivoId: Optional[str] = None
    categoriaObjetivo: Optional[str] = None
    fechaInicio: datetime
    fechaFin: datetime
    recompensaCuponId: Optional[str] = None
    recompensaCuponNombre: Optional[str] = None
    descripcionRecompensa: Optional[str] = None
    mostrarProgresoPublico: bool
    notificarAlCompletar: bool
    mensajeCompletado: Optional[str] = None
    notificado: bool
    cancelado: bool
