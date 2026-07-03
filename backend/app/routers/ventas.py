from datetime import datetime
from typing import Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import get_current_empresa_admin
from app.models.cliente import Cliente
from app.models.empresa import Empresa
from app.models.enums import MetodoPagoVenta
from app.models.venta import Venta
from app.schemas.qr import RecompensaDesbloqueada, ResultadoVisitaResponse, RetoCompletadoQR
from app.schemas.venta import (
    CalcularCarritoRequest,
    CarritoCalculado,
    ItemCarritoCalculado,
    ItemVentaResponse,
    ProcesarVentaRequest,
    ResumenVentasResponse,
    VentaResponse,
)
from app.services import cupon_service, producto_service, venta_service

router = APIRouter(prefix="/ventas", tags=["ventas"])


def _parse_id(value: str, campo: str = "id") -> PydanticObjectId:
    try:
        return PydanticObjectId(value)
    except Exception:
        raise HTTPException(status_code=422, detail=f"{campo} inválido")


def _resultado_to_response(r: dict) -> ResultadoVisitaResponse:
    return ResultadoVisitaResponse(
        visitasTotales=r["visitas_totales"],
        rachaActual=r["racha_actual"],
        recompensasDesbloqueadas=[
            RecompensaDesbloqueada(cuponId=x["cupon_id"], nombre=x["nombre"], tipo=x.get("tipo"))
            for x in r["recompensas_desbloqueadas"]
        ],
        retosCompletados=[
            RetoCompletadoQR(retoId=x["reto_id"], nombre=x["nombre"], recompensa=x.get("recompensa"))
            for x in r["retos_completados"]
        ],
        subioAExclusivo=r["subio_a_exclusivo"],
        mensaje=r["mensaje"],
        yaRegistradoHoy=r["ya_registrado_hoy"],
    )


def _carrito_to_response(carrito: dict) -> CarritoCalculado:
    return CarritoCalculado(
        items=[
            ItemCarritoCalculado(
                producto=producto_service.producto_to_response(item["producto_obj"]),
                cantidad=item["cantidad"],
                precioUnitario=item["precio_unitario"],
                subtotal=item["subtotal"],
            )
            for item in carrito["items"]
        ],
        subtotal=carrito["subtotal"],
        cuponAplicado=cupon_service.cupon_to_response(carrito["cupon_aplicado"]) if carrito["cupon_aplicado"] else None,
        descuentoMonto=carrito["descuento_monto"],
        descuentoPorcentaje=carrito["descuento_porcentaje"],
        igv=carrito["igv"],
        total=carrito["total"],
        erroresCupon=carrito["errores_cupon"],
        esValido=carrito["es_valido"],
    )


async def _venta_to_response(venta: Venta, resultado_visita: Optional[dict] = None) -> VentaResponse:
    cliente_nombre = None
    if venta.cliente_id:
        cliente = await Cliente.get(venta.cliente_id)
        cliente_nombre = cliente.nombre if cliente else None

    return VentaResponse(
        id=str(venta.id),
        empresaId=str(venta.empresa_id),
        clienteId=str(venta.cliente_id) if venta.cliente_id else None,
        codigoCliente=venta.codigo_cliente,
        clienteNombre=cliente_nombre,
        items=[
            ItemVentaResponse(
                productoId=str(i.producto_id), nombreProducto=i.nombre_producto, sku=i.sku,
                cantidad=i.cantidad, precioUnitario=i.precio_unitario, subtotal=i.subtotal,
                descuentoItem=i.descuento_item,
            )
            for i in venta.items
        ],
        subtotal=venta.subtotal,
        descuentoMonto=venta.descuento_monto,
        descuentoPorcentaje=venta.descuento_porcentaje,
        igv=venta.igv,
        total=venta.total,
        cuponId=str(venta.cupon_id) if venta.cupon_id else None,
        cuponCodigo=venta.cupon_codigo,
        canjeId=str(venta.canje_id) if venta.canje_id else None,
        metodoPago=venta.metodo_pago,
        montoEfectivo=venta.monto_efectivo,
        montoTarjeta=venta.monto_tarjeta,
        montoYape=venta.monto_yape,
        vuelto=venta.vuelto,
        estado=venta.estado,
        notas=venta.notas,
        createdAt=venta.created_at,
        createdBy=venta.created_by,
        resultadoVisita=_resultado_to_response(resultado_visita) if resultado_visita else None,
    )


@router.post("/calcular", response_model=CarritoCalculado)
async def calcular_carrito(data: CalcularCarritoRequest, empresa: Empresa = Depends(get_current_empresa_admin)):
    carrito = await venta_service.calcular_carrito(
        empresa.id,
        data.items,
        _parse_id(data.cupon_id, "cupon_id") if data.cupon_id else None,
        _parse_id(data.cliente_id, "cliente_id") if data.cliente_id else None,
    )
    return _carrito_to_response(carrito)


@router.post("", response_model=VentaResponse, status_code=status.HTTP_201_CREATED)
async def procesar_venta(data: ProcesarVentaRequest, empresa: Empresa = Depends(get_current_empresa_admin)):
    venta, resultado_visita, error = await venta_service.procesar_venta(
        empresa_id=empresa.id,
        items=data.items,
        cliente_id=_parse_id(data.cliente_id, "cliente_id") if data.cliente_id else None,
        cupon_id=_parse_id(data.cupon_id, "cupon_id") if data.cupon_id else None,
        metodo_pago=data.metodo_pago,
        monto_efectivo=data.monto_efectivo,
        monto_tarjeta=data.monto_tarjeta,
        monto_yape=data.monto_yape,
        notas=data.notas,
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    return await _venta_to_response(venta, resultado_visita)


@router.get("/resumen", response_model=ResumenVentasResponse)
async def resumen_ventas(empresa: Empresa = Depends(get_current_empresa_admin)):
    r = await venta_service.resumen_ventas(empresa.id)
    return ResumenVentasResponse(
        ventasHoy=r["ventas_hoy"], montoHoy=r["monto_hoy"],
        ventasSemana=r["ventas_semana"], montoSemana=r["monto_semana"],
        ventasMes=r["ventas_mes"], montoMes=r["monto_mes"],
        ticketPromedioHoy=r["ticket_promedio_hoy"],
        metodoMasUsadoHoy=r["metodo_mas_usado_hoy"],
        porcentajeConCuponHoy=r["porcentaje_con_cupon_hoy"],
        productoMasVendidoHoy=r["producto_mas_vendido_hoy"],
    )


@router.get("", response_model=list[VentaResponse])
async def historial_ventas(
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    cliente_id: Optional[str] = None,
    con_cupon: Optional[bool] = None,
    metodo_pago: Optional[MetodoPagoVenta] = None,
    empresa: Empresa = Depends(get_current_empresa_admin),
):
    ventas = await venta_service.historial_ventas(
        empresa.id,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        cliente_id=_parse_id(cliente_id, "cliente_id") if cliente_id else None,
        con_cupon=con_cupon,
        metodo_pago=metodo_pago,
    )
    return [await _venta_to_response(v) for v in ventas]


@router.get("/{venta_id}", response_model=VentaResponse)
async def obtener_venta(venta_id: str, empresa: Empresa = Depends(get_current_empresa_admin)):
    venta = await venta_service.obtener_venta(empresa.id, _parse_id(venta_id, "venta_id"))
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return await _venta_to_response(venta)
