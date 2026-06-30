from datetime import datetime, timedelta, timezone

from beanie import PydanticObjectId

from app.models.canje import Canje
from app.models.cupon import Cupon
from app.models.enums import EstadoCupon
from app.models.relacion import RelacionClienteEmpresa
from app.schemas.metricas import PuntoTiempo, ResumenResponse, TopCupon


async def obtener_resumen(empresa_id: PydanticObjectId) -> ResumenResponse:
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

    return ResumenResponse(
        total_clientes=total_clientes,
        canjes_hoy=canjes_hoy,
        canjes_semana=canjes_semana,
        canjes_mes=canjes_mes,
        cupones_activos=cupones_activos,
        tasa_redencion=tasa,
        clientes_recurrentes=clientes_recurrentes,
        racha_promedio=racha_promedio,
    )


async def canjes_por_dia(empresa_id: PydanticObjectId, dias: int) -> list[PuntoTiempo]:
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
    return [PuntoTiempo(**r) for r in rows]


async def top_cupones(empresa_id: PydanticObjectId, limit: int) -> list[TopCupon]:
    cupones = await Cupon.find(Cupon.empresa_id == empresa_id) \
        .sort(-Cupon.usos_actuales).limit(limit).to_list()
    return [
        TopCupon(cupon_id=str(c.id), nombre=c.nombre, tipo=c.tipo, usos_actuales=c.usos_actuales)
        for c in cupones
    ]


async def clientes_nuevos_por_dia(empresa_id: PydanticObjectId, dias: int) -> list[PuntoTiempo]:
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
    return [PuntoTiempo(**r) for r in rows]
