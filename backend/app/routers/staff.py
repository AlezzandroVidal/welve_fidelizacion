from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_empresa_admin
from app.models.empresa import Empresa
from app.schemas.canje import CanjeResponse
from app.schemas.qr import ResultadoVisitaResponse
from app.schemas.staff import (
    CanjePorCodigoRequest,
    CanjePorQRRequest,
    CanjeStaffResponse,
    ClienteInfoStaff,
    ClienteStaffResponse,
    RelacionInfoStaff,
    VisitaPorCodigoRequest,
    VisitaPorQRRequest,
    VisitaStaffResponse,
)
from app.services import cupon_service, staff_service

router = APIRouter(prefix="/staff", tags=["staff"])


def _parse_id(value: str, campo: str = "id") -> PydanticObjectId:
    try:
        return PydanticObjectId(value)
    except Exception:
        raise HTTPException(status_code=422, detail=f"{campo} inválido")


def _canje_to_response(c) -> CanjeResponse:
    return CanjeResponse(
        id=str(c.id), empresaId=str(c.empresa_id), clienteId=str(c.cliente_id),
        cuponId=str(c.cupon_id), fecha=c.fecha, canal=c.canal, staffRef=c.staff_ref,
    )


def _resultado_to_response(r: dict) -> ResultadoVisitaResponse:
    return ResultadoVisitaResponse(
        visitasTotales=r["visitas_totales"],
        rachaActual=r["racha_actual"],
        recompensasDesbloqueadas=[
            {"cuponId": x["cupon_id"], "nombre": x["nombre"], "tipo": x["tipo"]}
            for x in r["recompensas_desbloqueadas"]
        ],
        retosCompletados=[
            {"retoId": x["reto_id"], "nombre": x["nombre"], "recompensa": x["recompensa"]}
            for x in r["retos_completados"]
        ],
        subioAExclusivo=r["subio_a_exclusivo"],
        mensaje=r["mensaje"],
        yaRegistradoHoy=r["ya_registrado_hoy"],
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/cliente/{codigo_cliente}", response_model=ClienteStaffResponse)
async def cliente_por_codigo(codigo_cliente: str, empresa: Empresa = Depends(get_current_empresa_admin)):
    data = await staff_service.info_cliente(empresa.id, codigo_cliente)
    if not data:
        raise HTTPException(status_code=404, detail="Código no válido para esta empresa")
    return ClienteStaffResponse(
        cliente=ClienteInfoStaff(
            id=str(data["cliente"].id),
            nombre=data["cliente"].nombre, email=data["cliente"].email, whatsapp=data["cliente"].whatsapp,
            codigoCliente=data["cliente"].codigo_cliente,
        ),
        relacion=RelacionInfoStaff(
            visitasTotales=data["relacion"].visitas_totales,
            rachaActual=data["relacion"].racha_actual,
            puntos=data["relacion"].puntos,
            segmento=data["relacion"].segmento.value,
        ),
        cuponesDisponibles=[cupon_service.cupon_to_response(c) for c in data["cupones"]],
        canjesRecientes=[_canje_to_response(c) for c in data["canjes"]],
    )


@router.post("/visita/por-codigo", response_model=VisitaStaffResponse)
async def visita_por_codigo(data: VisitaPorCodigoRequest, empresa: Empresa = Depends(get_current_empresa_admin)):
    resultado, error = await staff_service.registrar_visita_por_codigo(empresa.id, data.codigo_cliente, data.monto)
    if error:
        raise HTTPException(status_code=404, detail=error)
    return VisitaStaffResponse(
        clienteNombre=resultado["cliente_nombre"], resultado=_resultado_to_response(resultado["resultado"]),
    )


@router.post("/visita/por-qr", response_model=VisitaStaffResponse)
async def visita_por_qr(data: VisitaPorQRRequest, empresa: Empresa = Depends(get_current_empresa_admin)):
    cliente_id = _parse_id(data.cliente_id, "cliente_id")
    resultado, error = await staff_service.registrar_visita_por_cliente_id(empresa.id, cliente_id, data.monto)
    if error:
        raise HTTPException(status_code=404, detail=error)
    return VisitaStaffResponse(
        clienteNombre=resultado["cliente_nombre"], resultado=_resultado_to_response(resultado["resultado"]),
    )


@router.post("/canje/por-codigo", response_model=CanjeStaffResponse)
async def canje_por_codigo(data: CanjePorCodigoRequest, empresa: Empresa = Depends(get_current_empresa_admin)):
    cupon_id = _parse_id(data.cupon_id, "cupon_id")
    # staff_ref=None: el canal (staff_manual/qr) ya identifica que lo registró
    # el staff — no exponemos el email de login de la empresa en el historial.
    resultado, error = await staff_service.canjear_por_codigo(
        empresa.id, data.codigo_cliente, cupon_id, None, data.monto,
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    return CanjeStaffResponse(
        clienteNombre=resultado["cliente_nombre"],
        canje=_canje_to_response(resultado["canje"]),
        resultado=_resultado_to_response(resultado["resultado"]),
    )


@router.post("/canje/por-qr", response_model=CanjeStaffResponse)
async def canje_por_qr(data: CanjePorQRRequest, empresa: Empresa = Depends(get_current_empresa_admin)):
    cliente_id = _parse_id(data.cliente_id, "cliente_id")
    cupon_id = _parse_id(data.cupon_id, "cupon_id")
    resultado, error = await staff_service.canjear_por_cliente_id(
        empresa.id, cliente_id, cupon_id, None, data.monto,
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    return CanjeStaffResponse(
        clienteNombre=resultado["cliente_nombre"],
        canje=_canje_to_response(resultado["canje"]),
        resultado=_resultado_to_response(resultado["resultado"]),
    )
