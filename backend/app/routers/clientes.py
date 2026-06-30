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

    res = await cliente_service.obtener_cliente_empresa(empresa.id, cid)
    if not res:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    cliente, relacion = res
    return ClienteResponse(
        id=str(cliente.id),
        nombre=cliente.nombre,
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
