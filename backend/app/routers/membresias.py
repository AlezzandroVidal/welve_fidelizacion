from fastapi import APIRouter, Depends, HTTPException, status

from beanie import PydanticObjectId

from app.core.deps import get_current_empresa
from app.models.empresa import Empresa
from app.models.cliente import Cliente
from beanie.operators import In
from app.schemas.membresia import (
    MembresiaClienteCreate,
    MembresiaClienteResponse,
    MembresiaClienteUpdate,
    MembresiaCreate,
    MembresiaResponse,
)
from app.services import membresia_service

router = APIRouter(prefix="/membresias", tags=["membresias"])


def _mem_response(m) -> MembresiaResponse:
    return MembresiaResponse(
        id=str(m.id),
        empresaId=str(m.empresa_id),
        nombre=m.nombre,
        precio=m.precio,
        beneficioDescripcion=m.beneficio_descripcion,
        frecuencia=m.frecuencia,
        estado=m.estado,
    )


def _mc_response(mc, c_nombre: str = None) -> MembresiaClienteResponse:
    return MembresiaClienteResponse(
        id=str(mc.id),
        empresaId=str(mc.empresa_id),
        clienteId=str(mc.cliente_id),
        membresiaId=str(mc.membresia_id),
        estado=mc.estado,
        fechaInicio=mc.fecha_inicio,
        fechaProximoCobro=mc.fecha_proximo_cobro,
        clienteNombre=c_nombre,
    )

async def _hydrate_suscripciones(mcs):
    if not mcs: return []
    c_ids = [m.cliente_id for m in mcs]
    clientes = await Cliente.find(In(Cliente.id, c_ids)).to_list()
    c_map = {c.id: c.nombre for c in clientes}
    return [_mc_response(m, c_map.get(m.cliente_id)) for m in mcs]

@router.post("", response_model=MembresiaResponse, status_code=status.HTTP_201_CREATED)
async def crear_membresia(data: MembresiaCreate, empresa: Empresa = Depends(get_current_empresa)):
    membresia = await membresia_service.crear_membresia(empresa.id, data)
    return _mem_response(membresia)


@router.get("", response_model=list[MembresiaResponse])
async def listar_membresias(empresa: Empresa = Depends(get_current_empresa)):
    membresias = await membresia_service.listar_membresias(empresa.id)
    return [_mem_response(m) for m in membresias]


@router.post("/suscripciones", response_model=MembresiaClienteResponse, status_code=status.HTTP_201_CREATED)
async def suscribir_cliente(
    data: MembresiaClienteCreate, empresa: Empresa = Depends(get_current_empresa)
):
    mc, error = await membresia_service.suscribir_cliente(empresa.id, data)
    if error:
        raise HTTPException(status_code=400, detail=error)
    res = await _hydrate_suscripciones([mc])
    return res[0]

@router.get("/suscripciones", response_model=list[MembresiaClienteResponse])
async def listar_suscripciones(
    membresia_id: str | None = None, empresa: Empresa = Depends(get_current_empresa)
):
    mid = PydanticObjectId(membresia_id) if membresia_id else None
    mcs = await membresia_service.listar_suscripciones(empresa.id, mid)
    return await _hydrate_suscripciones(mcs)

@router.patch("/suscripciones/{mc_id}", response_model=MembresiaClienteResponse)
async def actualizar_suscripcion(
    mc_id: str, data: MembresiaClienteUpdate, empresa: Empresa = Depends(get_current_empresa)
):
    try:
        mid = PydanticObjectId(mc_id)
    except Exception:
        raise HTTPException(status_code=422, detail="ID inválido")
    mc = await membresia_service.actualizar_estado_suscripcion(empresa.id, mid, data)
    if not mc:
        raise HTTPException(status_code=404, detail="Suscripción no encontrada")
    res = await _hydrate_suscripciones([mc])
    return res[0]
