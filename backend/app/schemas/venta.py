from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator

from app.models.enums import EstadoVenta, MetodoPagoVenta
from app.schemas.cupon import CuponResponse
from app.schemas.producto import ProductoResponse
from app.schemas.qr import ResultadoVisitaResponse


class ItemCarritoInput(BaseModel):
    producto_id: str
    cantidad: int

    @field_validator("cantidad")
    @classmethod
    def cantidad_positiva(cls, v: int) -> int:
        if v < 1:
            raise ValueError("cantidad debe ser al menos 1")
        return v


class CalcularCarritoRequest(BaseModel):
    items: list[ItemCarritoInput]
    cupon_id: Optional[str] = None
    cliente_id: Optional[str] = None


class ProcesarVentaRequest(BaseModel):
    items: list[ItemCarritoInput]
    cliente_id: Optional[str] = None
    cupon_id: Optional[str] = None
    metodo_pago: MetodoPagoVenta
    monto_efectivo: Optional[float] = None
    monto_tarjeta: Optional[float] = None
    monto_yape: Optional[float] = None
    notas: Optional[str] = None


class ItemCarritoCalculado(BaseModel):
    producto: ProductoResponse
    cantidad: int
    precioUnitario: float
    subtotal: float


class CarritoCalculado(BaseModel):
    items: list[ItemCarritoCalculado]
    subtotal: float
    cuponAplicado: Optional[CuponResponse] = None
    descuentoMonto: float
    descuentoPorcentaje: float
    igv: float
    total: float
    erroresCupon: Optional[str] = None
    esValido: bool


class ItemVentaResponse(BaseModel):
    productoId: str
    nombreProducto: str
    sku: str
    cantidad: int
    precioUnitario: float
    subtotal: float
    descuentoItem: float


class VentaResponse(BaseModel):
    id: str
    empresaId: str
    clienteId: Optional[str] = None
    codigoCliente: Optional[str] = None
    clienteNombre: Optional[str] = None
    items: list[ItemVentaResponse]
    subtotal: float
    descuentoMonto: float
    descuentoPorcentaje: float
    igv: float
    total: float
    cuponId: Optional[str] = None
    cuponCodigo: Optional[str] = None
    canjeId: Optional[str] = None
    metodoPago: MetodoPagoVenta
    montoEfectivo: Optional[float] = None
    montoTarjeta: Optional[float] = None
    montoYape: Optional[float] = None
    vuelto: Optional[float] = None
    estado: EstadoVenta
    notas: Optional[str] = None
    createdAt: datetime
    createdBy: str
    resultadoVisita: Optional[ResultadoVisitaResponse] = None


class ResumenVentasResponse(BaseModel):
    ventasHoy: int
    montoHoy: float
    ventasSemana: int
    montoSemana: float
    ventasMes: int
    montoMes: float
    ticketPromedioHoy: float
    metodoMasUsadoHoy: Optional[str] = None
    porcentajeConCuponHoy: float
    productoMasVendidoHoy: Optional[str] = None
