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
    EmpresaInfoResponse,
    RegistroQRRequest,
    RegistroQRResponse,
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


@router.post("/empresa/{empresa_id}/registro", response_model=RegistroQRResponse)
async def registro_qr(empresa_id: str, data: RegistroQRRequest):
    """Público — primer contacto de un cliente nuevo (o sin sesión) al escanear el QR de empresa."""
    eid = _parse_id(empresa_id, "empresa_id")
    await _requerir_empresa_activa(eid)

    resultado = await visita_service.registrar_visita_con_registro(
        nombre=data.nombre, email=data.email, whatsapp=data.whatsapp, empresa_id=eid,
    )
    return RegistroQRResponse(
        accessToken=resultado["jwt"],
        clienteId=resultado["cliente"]["id"],
        resultado=_resultado_to_response(resultado["resultado_visita"]),
    )


@router.post("/visita/{empresa_id}", response_model=ResultadoVisitaResponse)
async def registrar_visita(empresa_id: str, cliente: Cliente = Depends(get_global_cliente)):
    """Cliente ya logueado (en cualquier empresa) registra una visita adicional vía QR."""
    eid = _parse_id(empresa_id, "empresa_id")
    await _requerir_empresa_activa(eid)

    relacion = await cliente_service.obtener_o_crear_relacion(eid, cliente.id)
    if visita_service.ya_visito_hoy(relacion):
        return _resultado_to_response({
            "visitas_totales": relacion.visitas_totales,
            "racha_actual": relacion.racha_actual,
            "recompensas_desbloqueadas": [],
            "retos_completados": [],
            "subio_a_exclusivo": False,
            "mensaje": "Ya registraste tu visita hoy. ¡Vuelve mañana!",
            "ya_registrado_hoy": True,
        })

    resultado = await visita_service.registrar_visita(cliente.id, eid, canal="qr")
    return _resultado_to_response(resultado)


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
        staff_ref=empresa.admin_email,
        registrar_visita=False,
    )
    if error:
        raise HTTPException(status_code=400, detail=error)

    resultado_visita = await visita_service.registrar_visita(cliente_id, empresa.id, canal="qr")

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
