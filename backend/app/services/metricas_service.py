from datetime import datetime, timedelta, timezone

from beanie import PydanticObjectId

from app.core.cache import cache_get, cache_set
from app.models.canje import Canje
from app.models.cupon import Cupon
from app.models.enums import EstadoCupon
from app.models.relacion import RelacionClienteEmpresa
from app.schemas.metricas import PuntoTiempo, ResumenResponse, TopCupon

# TTL corto (5 min): el dashboard no necesita el segundo exacto, y así una
# racha de refrescos de pantalla no re-agrega toda la colección cada vez.
CACHE_TTL = 300


async def obtener_resumen(empresa_id: PydanticObjectId) -> ResumenResponse:
    cache_key = f"metricas:resumen:{empresa_id}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return ResumenResponse(**cached)

    now = datetime.now(timezone.utc)
    start_hoy = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_semana = now - timedelta(days=7)
    start_mes = now - timedelta(days=30)

    total_clientes = await RelacionClienteEmpresa.find(
        RelacionClienteEmpresa.empresa_id == empresa_id
    ).count()

    # Un solo aggregation para los tres conteos de canjes
    pipeline_canjes = [
        {"$match": {"empresa_id": empresa_id, "fecha": {"$gte": start_mes}}},
        {"$group": {
            "_id": None,
            "mes":    {"$sum": 1},
            "semana": {"$sum": {"$cond": [{"$gte": ["$fecha", start_semana]}, 1, 0]}},
            "hoy":    {"$sum": {"$cond": [{"$gte": ["$fecha", start_hoy]}, 1, 0]}},
        }},
    ]
    canjes_res = await Canje.aggregate(pipeline_canjes).to_list()
    canjes_mes    = canjes_res[0]["mes"]    if canjes_res else 0
    canjes_semana = canjes_res[0]["semana"] if canjes_res else 0
    canjes_hoy    = canjes_res[0]["hoy"]    if canjes_res else 0

    cupones_activos = await Cupon.find(
        Cupon.empresa_id == empresa_id, Cupon.estado == EstadoCupon.activo
    ).count()

    clientes_recurrentes = await RelacionClienteEmpresa.find(
        RelacionClienteEmpresa.empresa_id == empresa_id,
        RelacionClienteEmpresa.visitas_totales > 1,
    ).count()

    racha_pipeline = [
        {"$match": {"empresa_id": empresa_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$racha_actual"}}},
    ]
    racha_res = await RelacionClienteEmpresa.aggregate(racha_pipeline).to_list()
    racha_promedio = round(racha_res[0]["avg"], 1) if racha_res and racha_res[0]["avg"] else 0.0

    tasa = round((canjes_mes / total_clientes) * 100, 1) if total_clientes > 0 else 0.0

    resultado = ResumenResponse(
        total_clientes=total_clientes,
        canjes_hoy=canjes_hoy,
        canjes_semana=canjes_semana,
        canjes_mes=canjes_mes,
        cupones_activos=cupones_activos,
        tasa_redencion=tasa,
        clientes_recurrentes=clientes_recurrentes,
        racha_promedio=racha_promedio,
    )
    await cache_set(cache_key, resultado.model_dump(), CACHE_TTL)
    return resultado


async def canjes_por_dia(empresa_id: PydanticObjectId, dias: int) -> list[PuntoTiempo]:
    cache_key = f"metricas:canjes_por_dia:{empresa_id}:{dias}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return [PuntoTiempo(**r) for r in cached]

    start = datetime.now(timezone.utc) - timedelta(days=dias)
    pipeline = [
        {"$match": {"empresa_id": empresa_id, "fecha": {"$gte": start}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$fecha"}},
            "cantidad": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
        {"$project": {"fecha": "$_id", "cantidad": 1, "_id": 0}},
    ]
    rows = await Canje.aggregate(pipeline).to_list()
    resultado = [PuntoTiempo(**r) for r in rows]
    await cache_set(cache_key, [r.model_dump() for r in resultado], CACHE_TTL)
    return resultado


async def top_cupones(empresa_id: PydanticObjectId, limit: int) -> list[TopCupon]:
    cache_key = f"metricas:top_cupones:{empresa_id}:{limit}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return [TopCupon(**r) for r in cached]

    cupones = await Cupon.find(Cupon.empresa_id == empresa_id) \
        .sort(-Cupon.usos_actuales).limit(limit).to_list()
    resultado = [
        TopCupon(cupon_id=str(c.id), nombre=c.nombre, tipo=c.tipo, usos_actuales=c.usos_actuales)
        for c in cupones
    ]
    await cache_set(cache_key, [r.model_dump() for r in resultado], CACHE_TTL)
    return resultado


async def clientes_nuevos_por_dia(empresa_id: PydanticObjectId, dias: int) -> list[PuntoTiempo]:
    cache_key = f"metricas:clientes_nuevos:{empresa_id}:{dias}"
    cached = await cache_get(cache_key)
    if cached is not None:
        return [PuntoTiempo(**r) for r in cached]

    start = datetime.now(timezone.utc) - timedelta(days=dias)
    pipeline = [
        {"$match": {"empresa_id": empresa_id, "created_at": {"$gte": start}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "cantidad": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
        {"$project": {"fecha": "$_id", "cantidad": 1, "_id": 0}},
    ]
    rows = await RelacionClienteEmpresa.aggregate(pipeline).to_list()
    resultado = [PuntoTiempo(**r) for r in rows]
    await cache_set(cache_key, [r.model_dump() for r in resultado], CACHE_TTL)
    return resultado
