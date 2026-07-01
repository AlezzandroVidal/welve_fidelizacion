from datetime import datetime, timezone

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_empresa, get_global_cliente
from app.models.cliente import Cliente
from app.models.cupon import Cupon
from app.models.empresa import Empresa
from app.models.enums import CanalCanje, EstadoCupon, EstadoEmpresa
from app.schemas.canje import CanjeResponse
from app.schemas.qr import (
    AfiliarResponse,
    EmpresaInfoResponse,
    RegistroQRRequest,
    ResultadoVisitaResponse,
    ValidarCuponRequest,
    ValidarCuponResponse,
)
from app.services import canje_service, cliente_service, cupon_service, empresa_service, visita_service

router = APIRouter(prefix="/qr", tags=["qr"])


def _parse_id(value: str, campo: str = "id") -> PydanticObjectId:
    try:
        return PydanticObjectId(value)
    except Exception:
        raise HTTPException(status_code=422, detail=f"{campo} inválido")


def _cupon_vigente(cupon: Cupon, now: datetime) -> bool:
    fecha_exp = cupon.fecha_expiracion
    if fecha_exp.tzinfo is None:
        fecha_exp = fecha_exp.replace(tzinfo=timezone.utc)
    return fecha_exp >= now


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


async def _requerir_empresa_activa(empresa_id: PydanticObjectId) -> Empresa:
    empresa = await empresa_service.obtener_empresa(empresa_id)
    if not empresa or empresa.estado != EstadoEmpresa.activo:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return empresa


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/empresa/{empresa_id}/info", response_model=EmpresaInfoResponse)
async def info_empresa(empresa_id: str):
    """Público — info básica para la pantalla de escaneo, antes de que el cliente se registre."""
    empresa = await _requerir_empresa_activa(_parse_id(empresa_id, "empresa_id"))

    now = datetime.now(timezone.utc)
    cupones = await cupon_service.listar_cupones(empresa.id, filtro_estado=EstadoCupon.activo)
    total_vigentes = sum(1 for c in cupones if _cupon_vigente(c, now))

    return EmpresaInfoResponse(
        id=str(empresa.id),
        nombre=empresa.nombre,
        rubro=empresa.rubro,
        logoUrl=empresa.logo_url,
        descripcion=getattr(empresa, "descripcion", None),
        totalCuponesActivos=total_vigentes,
    )


@router.post("/empresa/{empresa_id}/afiliar", response_model=AfiliarResponse)
async def afiliar(empresa_id: str, data: RegistroQRRequest):
    """Público — la ÚNICA acción que el cliente puede hacer por sí mismo: la
    primera visita (afiliación). Todo lo que pasa después lo registra el staff
    (ver routers/staff.py). 409 si este cliente ya está afiliado a la empresa."""
    eid = _parse_id(empresa_id, "empresa_id")
    await _requerir_empresa_activa(eid)

    resultado = await visita_service.afiliar_cliente(
        nombre=data.nombre, email=data.email, whatsapp=data.whatsapp, empresa_id=eid,
    )
    if resultado is None:
        raise HTTPException(status_code=409, detail="Ya estás afiliado a esta empresa")

    return AfiliarResponse(
        accessToken=resultado["jwt"],
        clienteId=resultado["cliente"]["id"],
        codigoCliente=resultado["codigo_cliente"],
        resultado=_resultado_to_response(resultado["resultado_visita"]),
    )


@router.post("/visita/{empresa_id}", response_model=ResultadoVisitaResponse)
async def registrar_visita(empresa_id: str, cliente: Cliente = Depends(get_global_cliente)):
    """Deshabilitado — regla de anti-fraude: el cliente no puede auto-registrar
    visitas después de afiliarse. Las visitas las registra el staff desde
    /api/v1/staff/visita/* (por código o escaneando el QR del cliente)."""
    raise HTTPException(
        status_code=403,
        detail="Las visitas las registra el staff del local, no el cliente. "
               "Muéstrale tu código o tu QR personal (/wallet/mi-qr).",
    )


@router.post("/cupon/{cupon_id}/validar", response_model=ValidarCuponResponse)
async def validar_cupon(
    cupon_id: str, data: ValidarCuponRequest, empresa: Empresa = Depends(get_current_empresa),
):
    """Staff (JWT de empresa) escanea el QR que el cliente muestra en pantalla y valida el canje.

    Orden importa: primero se intenta el canje (sin tocar la relación); solo si
    el canje tuvo éxito se registra la visita completa (racha/segmento/retos/
    recompensas). Así un cupón no canjeable no deja un estado a medias.
    """
    cid = _parse_id(cupon_id, "cupon_id")
    cliente_id = _parse_id(data.cliente_id, "cliente_id")

    par = await cliente_service.obtener_cliente_empresa(empresa.id, cliente_id)
    if par is None:
        raise HTTPException(status_code=404, detail="Cliente no tiene relación con esta empresa")

    canje, error = await canje_service.crear_canje(
        empresa_id=empresa.id,
        cliente_id=cliente_id,
        cupon_id=cid,
        canal=CanalCanje.qr,
        staff_ref=None,  # el canal=qr ya identifica que lo validó el staff
        registrar_visita=False,
        monto=data.monto,
    )
    if error:
        raise HTTPException(status_code=400, detail=error)

    resultado_visita = await visita_service.registrar_visita(cliente_id, empresa.id, canal="qr", monto=data.monto)

    return ValidarCuponResponse(
        canje=CanjeResponse(
            id=str(canje.id),
            empresaId=str(canje.empresa_id),
            clienteId=str(canje.cliente_id),
            cuponId=str(canje.cupon_id),
            fecha=canje.fecha,
            canal=canje.canal,
            staffRef=canje.staff_ref,
        ),
        resultadoVisita=_resultado_to_response(resultado_visita),
    )
