from datetime import datetime, timezone

from beanie import PydanticObjectId

from app.models.cliente import Cliente
from app.models.relacion import RelacionClienteEmpresa
from app.models.resena import Resena
from app.schemas.resena import ResenaCreate


async def crear_o_actualizar_resena(
    empresa_id: PydanticObjectId, cliente_id: PydanticObjectId, data: ResenaCreate,
) -> tuple[Resena | None, str | None]:
    """Retorna (resena, error_msg). Solo puede calificar un cliente afiliado a
    la empresa (anti-abuso: no cualquiera puede opinar de un negocio que nunca
    visitó). Una reseña nueva sobrescribe la anterior del mismo cliente."""
    relacion = await RelacionClienteEmpresa.find_one(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.cliente_id == cliente_id,
    )
    if not relacion:
        return None, "Debes ser cliente de esta empresa para dejar una reseña"

    now = datetime.now(timezone.utc)
    existente = await Resena.find_one(
        Resena.empresa_id == empresa_id, Resena.cliente_id == cliente_id,
    )
    if existente:
        await existente.set({
            "estrellas": data.estrellas,
            "comentario": data.comentario,
            "updated_at": now,
        })
        return existente, None

    resena = Resena(
        empresa_id=empresa_id,
        cliente_id=cliente_id,
        estrellas=data.estrellas,
        comentario=data.comentario,
    )
    await resena.insert()
    return resena, None


async def obtener_mi_resena(empresa_id: PydanticObjectId, cliente_id: PydanticObjectId) -> Resena | None:
    return await Resena.find_one(Resena.empresa_id == empresa_id, Resena.cliente_id == cliente_id)


async def listar_resenas_empresa(empresa_id: PydanticObjectId, limit: int = 100) -> list[dict]:
    """Retorna las reseñas hidratadas con nombre/foto del cliente, más recientes primero."""
    resenas = await Resena.find(Resena.empresa_id == empresa_id).sort("-fecha").limit(limit).to_list()
    if not resenas:
        return []
    clientes = await Cliente.find({"_id": {"$in": [r.cliente_id for r in resenas]}}).to_list()
    cmap = {c.id: c for c in clientes}
    resultado = []
    for r in resenas:
        cliente = cmap.get(r.cliente_id)
        resultado.append({
            "resena": r,
            "cliente_nombre": cliente.nombre if cliente else "Cliente",
            "cliente_foto_url": getattr(cliente, "foto_url", None) if cliente else None,
        })
    return resultado


async def calcular_resumen(empresa_id: PydanticObjectId) -> dict:
    resenas = await Resena.find(Resena.empresa_id == empresa_id).to_list()
    distribucion = {str(i): 0 for i in range(1, 6)}
    for r in resenas:
        distribucion[str(r.estrellas)] += 1
    total = len(resenas)
    promedio = round(sum(r.estrellas for r in resenas) / total, 1) if total else 0.0
    return {"promedio": promedio, "total": total, "distribucion": distribucion}
