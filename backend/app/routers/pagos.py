import asyncio

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.core.deps import get_current_empresa_admin
from app.models.empresa import Empresa
from app.models.pago import Pago
from app.schemas.pago import IniciarPagoRequest, PagoResponse
from app.services import pago_service

router = APIRouter(prefix="/pagos", tags=["pagos"])


def _to_response(pago: Pago) -> PagoResponse:
    return PagoResponse(
        id=str(pago.id),
        empresaId=str(pago.empresa_id),
        monto=pago.monto,
        moneda=pago.moneda,
        plan=pago.plan,
        concepto=pago.concepto,
        estado=pago.estado,
        metodoPago=pago.metodo_pago,
        ultimos4=pago.ultimos_4,
        marcaTarjeta=pago.marca_tarjeta,
        nombreTitular=pago.nombre_titular,
        referencia=pago.referencia,
        fechaPago=pago.fecha_pago,
        fechaVencimientoPlan=pago.fecha_vencimiento_plan,
        motivoRechazo=pago.motivo_rechazo,
        createdAt=pago.created_at,
    )


@router.get("/historial", response_model=list[PagoResponse])
async def historial(empresa: Empresa = Depends(get_current_empresa_admin)):
    pagos = await pago_service.historial_pagos(empresa.id)
    return [_to_response(p) for p in pagos]


@router.get("/{pago_id}", response_model=PagoResponse)
async def obtener(pago_id: str, empresa: Empresa = Depends(get_current_empresa_admin)):
    try:
        pid = PydanticObjectId(pago_id)
    except Exception:
        raise HTTPException(status_code=422, detail="ID inválido")

    pago = await pago_service.obtener_pago(pid, empresa.id)
    if not pago:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    return _to_response(pago)


@router.post("/iniciar", response_model=PagoResponse, status_code=status.HTTP_201_CREATED)
async def iniciar(
    data: IniciarPagoRequest,
    request: Request,
    empresa: Empresa = Depends(get_current_empresa_admin),
):
    pago = await pago_service.iniciar_pago(
        empresa_id=empresa.id,
        plan=data.plan,
        metodo_pago=data.metodo_pago,
        tarjeta=data.tarjeta,
        ip_origen=request.client.host if request.client else None,
    )
    return _to_response(pago)


@router.post("/{pago_id}/confirmar", response_model=PagoResponse)
async def confirmar(pago_id: str, empresa: Empresa = Depends(get_current_empresa_admin)):
    try:
        pid = PydanticObjectId(pago_id)
    except Exception:
        raise HTTPException(status_code=422, detail="ID inválido")

    await asyncio.sleep(1.5)  # simula el tiempo de procesamiento — no hay llamada externa

    pago, error = await pago_service.procesar_pago(pid, empresa.id)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return _to_response(pago)
