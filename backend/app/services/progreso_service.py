"""Cálculo de progreso de un cliente contra la condición de un Reto o de un
RequisitoAcceso (Cupon.requisito) — compartido por recompensas_engine
(retos "clásicos", otorgan un Canje automático) y cupon_acceso_service
(cupones visibilidad=por_reto/por_requisito/privado, solo desbloquean).
Siempre se computa en vivo, nunca cacheado."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from beanie import PydanticObjectId

from app.models.cupon import RequisitoAcceso
from app.models.enums import TipoRequisito, TipoReto
from app.models.historial_visita import HistorialVisita
from app.models.producto import Producto
from app.models.relacion import RelacionClienteEmpresa
from app.models.reto import Reto
from app.models.venta import Venta

_PERIODO_DEFAULT_DIAS = 30


async def _contar_visitas_periodo(empresa_id: PydanticObjectId, cliente_id: PydanticObjectId, periodo_dias: int) -> int:
    cutoff = datetime.now(timezone.utc) - timedelta(days=periodo_dias)
    return await HistorialVisita.find(
        HistorialVisita.empresa_id == empresa_id,
        HistorialVisita.cliente_id == cliente_id,
        HistorialVisita.fecha >= cutoff,
    ).count()


async def _sumar_monto_periodo(empresa_id: PydanticObjectId, cliente_id: PydanticObjectId, periodo_dias: int) -> float:
    cutoff = datetime.now(timezone.utc) - timedelta(days=periodo_dias)
    registros = await HistorialVisita.find(
        HistorialVisita.empresa_id == empresa_id,
        HistorialVisita.cliente_id == cliente_id,
        HistorialVisita.fecha >= cutoff,
    ).to_list()
    return sum(r.monto or 0.0 for r in registros)


async def _contar_productos_comprados(
    empresa_id: PydanticObjectId,
    cliente_id: PydanticObjectId,
    producto_objetivo_id: Optional[PydanticObjectId],
    categoria_objetivo: Optional[str],
) -> int:
    """Best-effort: solo cuenta compras vía Caja (Venta) — no cubre
    visitas/canjes registrados sin una venta asociada."""
    if not producto_objetivo_id and not categoria_objetivo:
        return 0
    categoria_ids: Optional[set[str]] = None
    if categoria_objetivo and not producto_objetivo_id:
        productos = await Producto.find(
            Producto.empresa_id == empresa_id, Producto.categoria == categoria_objetivo,
        ).to_list()
        categoria_ids = {str(p.id) for p in productos}

    ventas = await Venta.find(Venta.empresa_id == empresa_id, Venta.cliente_id == cliente_id).to_list()
    total = 0
    for venta in ventas:
        for item in venta.items:
            if producto_objetivo_id and str(item.producto_id) == str(producto_objetivo_id):
                total += item.cantidad
            elif categoria_ids and str(item.producto_id) in categoria_ids:
                total += item.cantidad
    return total


async def calcular_progreso_reto(
    reto: Reto, relacion: RelacionClienteEmpresa, empresa_id: PydanticObjectId, cliente_id: PydanticObjectId,
) -> float:
    if reto.condicion_tipo == TipoReto.num_visitas:
        return relacion.visitas_totales
    if reto.condicion_tipo == TipoReto.monto_acumulado:
        return relacion.monto_acumulado
    if reto.condicion_tipo == TipoReto.puntos_acumulados:
        return relacion.puntos
    if reto.condicion_tipo == TipoReto.visitas_en_periodo:
        return await _contar_visitas_periodo(empresa_id, cliente_id, reto.periodo_dias or _PERIODO_DEFAULT_DIAS)
    if reto.condicion_tipo == TipoReto.monto_en_periodo:
        return await _sumar_monto_periodo(empresa_id, cliente_id, reto.periodo_dias or _PERIODO_DEFAULT_DIAS)
    if reto.condicion_tipo == TipoReto.productos_comprados:
        return await _contar_productos_comprados(
            empresa_id, cliente_id, reto.producto_objetivo_id, reto.categoria_objetivo,
        )
    return 0.0


async def calcular_progreso_requisito(
    requisito: RequisitoAcceso, relacion: RelacionClienteEmpresa, empresa_id: PydanticObjectId, cliente_id: PydanticObjectId,
) -> float:
    if requisito.tipo == TipoRequisito.visitas_totales:
        return relacion.visitas_totales
    if requisito.tipo == TipoRequisito.gasto_total:
        return relacion.monto_acumulado
    if requisito.tipo == TipoRequisito.puntos_acumulados:
        return relacion.puntos
    if requisito.tipo == TipoRequisito.visitas_en_periodo:
        return await _contar_visitas_periodo(empresa_id, cliente_id, requisito.periodo_dias or _PERIODO_DEFAULT_DIAS)
    if requisito.tipo == TipoRequisito.gasto_en_periodo:
        return await _sumar_monto_periodo(empresa_id, cliente_id, requisito.periodo_dias or _PERIODO_DEFAULT_DIAS)
    return 0.0
