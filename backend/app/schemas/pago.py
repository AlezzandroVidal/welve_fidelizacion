from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator, model_validator

from app.models.enums import EstadoPago, MetodoPago, PlanSuscripcion


class TarjetaInput(BaseModel):
    """El número completo de la tarjeta nunca llega al backend — el frontend
    solo envía los últimos 4 dígitos y la marca detectada localmente. El CVV
    jamás se transmite ni se guarda."""

    ultimos_4: str
    marca_tarjeta: str
    nombre_titular: str
    mes_expiracion: str
    anio_expiracion: str

    @field_validator("ultimos_4")
    @classmethod
    def _validar_ultimos_4(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 4:
            raise ValueError("ultimos_4 debe ser exactamente 4 dígitos")
        return v


class IniciarPagoRequest(BaseModel):
    plan: PlanSuscripcion
    metodo_pago: MetodoPago
    tarjeta: Optional[TarjetaInput] = None
    numero_telefono: Optional[str] = None  # Yape / Plin
    numero_operacion: Optional[str] = None  # Yape / Plin — confirmación

    @model_validator(mode="after")
    def _validar_datos_por_metodo(self):
        if self.metodo_pago == MetodoPago.tarjeta and not self.tarjeta:
            raise ValueError("Se requieren datos de tarjeta para este método de pago")
        if self.metodo_pago in (MetodoPago.yape, MetodoPago.plin) and not self.numero_telefono:
            raise ValueError("Se requiere el número de teléfono para Yape/Plin")
        return self


class PagoResponse(BaseModel):
    id: str
    empresaId: str
    monto: float
    moneda: str
    plan: PlanSuscripcion
    concepto: str
    estado: EstadoPago
    metodoPago: MetodoPago
    ultimos4: Optional[str] = None
    marcaTarjeta: Optional[str] = None
    nombreTitular: Optional[str] = None
    referencia: str
    fechaPago: Optional[datetime] = None
    fechaVencimientoPlan: Optional[datetime] = None
    motivoRechazo: Optional[str] = None
    createdAt: datetime
