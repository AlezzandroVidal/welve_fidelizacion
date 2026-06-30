from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import get_current_empresa
from app.models.empresa import Empresa
from app.models.enums import EstadoCupon
from app.schemas.canje import CanjeResponse
from app.schemas.cupon import CuponCreate, CuponResponse, CuponUpdate
from app.services import cupon_service

router = APIRouter(prefix="/cupones", tags=["cupones"])


def _parse_id(cupon_id: str) -> PydanticObjectId:
    try:
        return PydanticObjectId(cupon_id)
    except Exception:
        raise HTTPException(status_code=422, detail="cupon_id inválido")


def _to_response(c) -> CuponResponse:
    now = datetime.now(timezone.utc)
    fecha_exp = c.fecha_expiracion
    if fecha_exp.tzinfo is None:
        fecha_exp = fecha_exp.replace(tzinfo=timezone.utc)
    return CuponResponse(
        id=str(c.id),
        empresaId=str(c.empresa_id),
        nombre=c.nombre,
        tipo=c.tipo,
        valor=c.valor,
        montoMinimo=c.monto_minimo,
        fechaInicio=c.fecha_inicio,
        fechaExpiracion=c.fecha_expiracion,
        estado=c.estado,
        limiteUsosTotal=c.limite_usos_total,
        limiteUsosPorCliente=c.limite_usos_por_cliente,
        usosActuales=c.usos_actuales,
        exclusivo=c.exclusivo,
        estaVigente=c.estado == EstadoCupon.activo and fecha_exp >= now,
        createdAt=c.created_at,
        updatedAt=c.updated_at,
    )


def _canje_to_response(c) -> CanjeResponse:
    return CanjeResponse(
        id=str(c.id),
        empresaId=str(c.empresa_id),
        clienteId=str(c.cliente_id),
        cuponId=str(c.cupon_id),
        fecha=c.fecha,
        canal=c.canal,
        staffRef=c.staff_ref,
    )


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[CuponResponse])
async def listar_cupones(
    estado: Optional[EstadoCupon] = Query(None, description="Filtrar por estado"),
    empresa: Empresa = Depends(get_current_empresa),
):
    cupones = await cupon_service.listar_cupones(empresa.id, filtro_estado=estado)
    return [_to_response(c) for c in cupones]


@router.post("", response_model=CuponResponse, status_code=status.HTTP_201_CREATED)
async def crear_cupon(data: CuponCreate, empresa: Empresa = Depends(get_current_empresa)):
    cupon = await cupon_service.crear_cupon(empresa.id, data)
    return _to_response(cupon)


@router.get("/{cupon_id}", response_model=CuponResponse)
async def obtener_cupon(cupon_id: str, empresa: Empresa = Depends(get_current_empresa)):
    cupon = await cupon_service.obtener_cupon(empresa.id, _parse_id(cupon_id))
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    return _to_response(cupon)


@router.patch("/{cupon_id}", response_model=CuponResponse)
async def actualizar_cupon(
    cupon_id: str, data: CuponUpdate, empresa: Empresa = Depends(get_current_empresa),
):
    cupon = await cupon_service.actualizar_cupon(empresa.id, _parse_id(cupon_id), data)
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    return _to_response(cupon)


@router.patch("/{cupon_id}/pausar", response_model=CuponResponse)
async def pausar_cupon(cupon_id: str, empresa: Empresa = Depends(get_current_empresa)):
    cupon = await cupon_service.pausar_cupon(empresa.id, _parse_id(cupon_id))
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    return _to_response(cupon)


@router.patch("/{cupon_id}/activar", response_model=CuponResponse)
async def activar_cupon(cupon_id: str, empresa: Empresa = Depends(get_current_empresa)):
    cupon = await cupon_service.activar_cupon(empresa.id, _parse_id(cupon_id))
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado o ya expirado")
    return _to_response(cupon)


@router.delete("/{cupon_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_cupon(cupon_id: str, empresa: Empresa = Depends(get_current_empresa)):
    try:
        deleted = await cupon_service.eliminar_cupon(empresa.id, _parse_id(cupon_id))
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    if not deleted:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")


@router.get("/{cupon_id}/canjes", response_model=list[CanjeResponse])
async def listar_canjes_cupon(
    cupon_id: str,
    limit: int = Query(5, ge=1, le=50),
    empresa: Empresa = Depends(get_current_empresa),
):
    cid = _parse_id(cupon_id)
    cupon = await cupon_service.obtener_cupon(empresa.id, cid)
    if not cupon:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    canjes = await cupon_service.listar_canjes_cupon(empresa.id, cid, limit)
    return [_canje_to_response(c) for c in canjes]
