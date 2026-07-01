from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import get_current_empresa, get_global_cliente
from app.models.cliente import Cliente
from app.models.empresa import Empresa
from app.schemas.resena import ResenaCreate, ResenaResponse, ResenaResumen, ResenasEmpresaResponse
from app.services import resena_service

router = APIRouter(prefix="/resenas", tags=["resenas"])


def _parse_id(value: str, campo: str = "id") -> PydanticObjectId:
    try:
        return PydanticObjectId(value)
    except Exception:
        raise HTTPException(status_code=422, detail=f"{campo} inválido")


def _to_response(r, cliente_nombre: str, cliente_foto_url: str | None = None) -> ResenaResponse:
    return ResenaResponse(
        id=str(r.id),
        empresaId=str(r.empresa_id),
        clienteId=str(r.cliente_id),
        clienteNombre=cliente_nombre,
        clienteFotoUrl=cliente_foto_url,
        estrellas=r.estrellas,
        comentario=r.comentario,
        fecha=r.fecha,
    )


@router.post("/empresa/{empresa_id}", response_model=ResenaResponse)
async def dejar_resena(empresa_id: str, data: ResenaCreate, cliente: Cliente = Depends(get_global_cliente)):
    eid = _parse_id(empresa_id, "empresa_id")
    resena, error = await resena_service.crear_o_actualizar_resena(eid, cliente.id, data)
    if error:
        raise HTTPException(status_code=403, detail=error)
    return _to_response(resena, cliente.nombre, getattr(cliente, "foto_url", None))


@router.get("/empresa/{empresa_id}/mia", response_model=ResenaResponse | None)
async def mi_resena(empresa_id: str, cliente: Cliente = Depends(get_global_cliente)):
    eid = _parse_id(empresa_id, "empresa_id")
    resena = await resena_service.obtener_mi_resena(eid, cliente.id)
    if not resena:
        return None
    return _to_response(resena, cliente.nombre, getattr(cliente, "foto_url", None))


@router.get("/empresa/{empresa_id}", response_model=ResenasEmpresaResponse)
async def resenas_de_empresa(empresa_id: str, cliente: Cliente = Depends(get_global_cliente)):
    eid = _parse_id(empresa_id, "empresa_id")
    if not await Empresa.get(eid):
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    resumen = await resena_service.calcular_resumen(eid)
    items = await resena_service.listar_resenas_empresa(eid)
    return ResenasEmpresaResponse(
        resumen=ResenaResumen(**resumen),
        resenas=[_to_response(i["resena"], i["cliente_nombre"], i["cliente_foto_url"]) for i in items],
    )


@router.get("/me", response_model=ResenasEmpresaResponse)
async def mis_resenas_empresa(empresa: Empresa = Depends(get_current_empresa)):
    resumen = await resena_service.calcular_resumen(empresa.id)
    items = await resena_service.listar_resenas_empresa(empresa.id)
    return ResenasEmpresaResponse(
        resumen=ResenaResumen(**resumen),
        resenas=[_to_response(i["resena"], i["cliente_nombre"], i["cliente_foto_url"]) for i in items],
    )
