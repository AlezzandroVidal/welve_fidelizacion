from fastapi import APIRouter, Depends, HTTPException, status

from beanie import PydanticObjectId

from app.core.deps import get_current_empresa
from app.models.empresa import Empresa
from app.models.cliente import Cliente
from app.models.cupon import Cupon
from app.schemas.canje import CanjeCreate, CanjeResponse
from app.services import canje_service
from beanie.operators import In

router = APIRouter(prefix="/canjes", tags=["canjes"])


def _to_response(c, cliente: Cliente | None = None, cupon: Cupon | None = None) -> CanjeResponse:
    return CanjeResponse(
        id=str(c.id),
        empresaId=str(c.empresa_id),
        clienteId=str(c.cliente_id),
        cuponId=str(c.cupon_id),
        fecha=c.fecha,
        canal=c.canal,
        staffRef=c.staff_ref,
        clienteNombre=cliente.nombre if cliente else None,
        clienteCodigo=cliente.codigo_cliente if cliente else None,
        cuponNombre=cupon.nombre if cupon else None,
        cuponTipo=cupon.tipo if cupon else None,
        cuponValor=cupon.valor if cupon else None,
    )

async def _hydrate_canjes(canjes):
    if not canjes:
        return []

    cliente_ids = list({c.cliente_id for c in canjes})
    cupon_ids = list({c.cupon_id for c in canjes})

    clientes = await Cliente.find(In(Cliente.id, cliente_ids)).to_list()
    cupones = await Cupon.find(In(Cupon.id, cupon_ids)).to_list()

    cmap = {c.id: c for c in clientes}
    cupmap = {c.id: c for c in cupones}

    return [_to_response(c, cmap.get(c.cliente_id), cupmap.get(c.cupon_id)) for c in canjes]


@router.post("/{cliente_id}", response_model=CanjeResponse, status_code=status.HTTP_201_CREATED)
async def crear_canje(
    cliente_id: str,
    data: CanjeCreate,
    empresa: Empresa = Depends(get_current_empresa),
):
    try:
        cid = PydanticObjectId(cliente_id)
        cupon_id = PydanticObjectId(data.cupon_id)
    except Exception:
        raise HTTPException(status_code=422, detail="ID inválido")

    canje, error = await canje_service.crear_canje(
        empresa_id=empresa.id,
        cliente_id=cid,
        cupon_id=cupon_id,
        canal=data.canal,
        staff_ref=data.staff_ref,
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    # Hidratar el canje recién creado
    res = await _hydrate_canjes([canje])
    return res[0]


@router.get("", response_model=list[CanjeResponse])
async def listar_canjes(empresa: Empresa = Depends(get_current_empresa)):
    canjes = await canje_service.listar_canjes_empresa(empresa.id)
    return await _hydrate_canjes(canjes)


@router.get("/cliente/{cliente_id}", response_model=list[CanjeResponse])
async def listar_canjes_cliente(
    cliente_id: str, empresa: Empresa = Depends(get_current_empresa)
):
    try:
        cid = PydanticObjectId(cliente_id)
    except Exception:
        raise HTTPException(status_code=422, detail="cliente_id inválido")
    canjes = await canje_service.listar_canjes_cliente(empresa.id, cid)
    return await _hydrate_canjes(canjes)
