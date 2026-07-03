from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from beanie import PydanticObjectId

from app.core.dependencies import get_current_empresa
from app.models.empresa import Empresa
from app.schemas.cliente import ClienteResponse
from app.services import cliente_service

router = APIRouter(prefix="/clientes", tags=["clientes"])


@router.get("", response_model=list[ClienteResponse])
async def listar_clientes(empresa: Empresa = Depends(get_current_empresa)):
    clientes = await cliente_service.listar_clientes_empresa(empresa.id)
    return [
        ClienteResponse(
            id=str(c.id),
            nombre=c.nombre,
            codigoCliente=c.codigo_cliente,
            email=c.email,
            whatsapp=c.whatsapp,
            fechaAlta=c.fecha_alta.isoformat(),
            visitasTotales=r.visitas_totales,
            montoAcumulado=r.monto_acumulado,
            rachaActual=r.racha_actual,
            puntos=r.puntos,
            segmento=r.segmento,
            ultimaVisita=r.ultima_visita.isoformat() if r.ultima_visita else None,
        )
        for c, r in clientes
    ]


@router.get("/{cliente_id}", response_model=ClienteResponse)
async def obtener_cliente(
    cliente_id: str,
    empresa: Empresa = Depends(get_current_empresa),
):
    try:
        cid = PydanticObjectId(cliente_id)
    except Exception:
        raise HTTPException(status_code=422, detail="cliente_id inválido")

    res = await cliente_service.obtener_cliente_con_relacion_opcional(empresa.id, cid)
    if not res:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    cliente, relacion = res
    # relacion es None si el cliente existe globalmente pero aún no está
    # afiliado a esta empresa — no es un 404: la afiliación es un efecto
    # secundario del primer canje/visita, no un prerequisito para verlo.
    if relacion is None:
        return ClienteResponse(
            id=str(cliente.id),
            nombre=cliente.nombre,
            codigoCliente=cliente.codigo_cliente,
            email=cliente.email,
            whatsapp=cliente.whatsapp,
            fechaAlta=cliente.fecha_alta.isoformat(),
        )
    return ClienteResponse(
        id=str(cliente.id),
        nombre=cliente.nombre,
        codigoCliente=cliente.codigo_cliente,
        email=cliente.email,
        whatsapp=cliente.whatsapp,
        fechaAlta=cliente.fecha_alta.isoformat(),
        visitasTotales=relacion.visitas_totales,
        montoAcumulado=relacion.monto_acumulado,
        rachaActual=relacion.racha_actual,
        puntos=relacion.puntos,
        segmento=relacion.segmento,
        ultimaVisita=relacion.ultima_visita.isoformat() if relacion.ultima_visita else None,
    )


@router.get("/{cliente_id}/cupones", response_model=List[Dict[str, Any]])
async def listar_cupones_cliente(
    cliente_id: str, empresa: Empresa = Depends(get_current_empresa),
):
    """Cupones vigentes de la empresa con el AccesoCupon de este cliente
    embebido — pestaña "Cupones" del detalle de cliente. El canjeado=None
    del "límite alcanzado" ya distingue disponible/en_progreso/etc, ver
    cliente_service.listar_cupones_cliente."""
    try:
        cid = PydanticObjectId(cliente_id)
    except Exception:
        raise HTTPException(status_code=422, detail="cliente_id inválido")
    return await cliente_service.listar_cupones_cliente(empresa.id, cid)
