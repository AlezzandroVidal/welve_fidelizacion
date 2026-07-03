"""Única fuente de verdad para el segmento (regular/exclusivo) de un cliente en
una empresa (PRODUCT.MD 6.4: umbral de canjes en una ventana móvil + regla de
gracia antes de bajarlo). Se llama desde dos sitios:

1. visita_service._evaluar_y_actualizar — inline, tras cada visita (feedback
   instantáneo `subioAExclusivo`).
2. El job diario `evaluar_exclusivos` (worker/tasks.py) — barre todas las
   relaciones de todas las empresas; es el único que puede *bajar* a alguien,
   ya que el chequeo inline de una visita nunca lo hace.
"""

from datetime import datetime, timedelta, timezone

from app.models.canje import Canje
from app.models.empresa import Empresa
from app.models.enums import SegmentoCliente
from app.models.relacion import RelacionClienteEmpresa


async def evaluar_segmento(empresa: Empresa, relacion: RelacionClienteEmpresa) -> dict:
    """Evalúa y aplica (si corresponde) el segmento de `relacion`. Retorna
    {"segmento": SegmentoCliente, "subio_a_exclusivo": bool}."""
    cfg = empresa.config
    ahora = datetime.now(timezone.utc)
    desde = ahora - timedelta(days=cfg.umbral_exclusivo_dias)

    canjes_en_ventana = await Canje.find(
        Canje.empresa_id == empresa.id,
        Canje.cliente_id == relacion.cliente_id,
        Canje.fecha >= desde,
    ).count()
    cumple = canjes_en_ventana >= cfg.umbral_exclusivo_canjes

    updates: dict = {}
    subio = False

    if cumple:
        updates["fecha_ultimo_cumplimiento_exclusivo"] = ahora
        if relacion.segmento != SegmentoCliente.exclusivo:
            updates["segmento"] = SegmentoCliente.exclusivo
            updates["fecha_entrada_segmento"] = ahora
            subio = True
    elif relacion.segmento == SegmentoCliente.exclusivo:
        ultimo = relacion.fecha_ultimo_cumplimiento_exclusivo or relacion.fecha_entrada_segmento or ahora
        if ultimo.tzinfo is None:
            ultimo = ultimo.replace(tzinfo=timezone.utc)
        if (ahora - ultimo) > timedelta(days=cfg.dias_gracia_exclusivo):
            updates["segmento"] = SegmentoCliente.regular
            updates["fecha_entrada_segmento"] = None

    if updates:
        updates["updated_at"] = ahora
        await relacion.set(updates)
        for k, v in updates.items():
            setattr(relacion, k, v)

    return {"segmento": relacion.segmento, "subio_a_exclusivo": subio}


async def evaluar_exclusivos_todas_empresas() -> int:
    """Job diario: recorre todas las relaciones de todas las empresas y aplica
    evaluar_segmento — es el único camino que puede bajar a alguien de exclusivo
    a regular tras vencer la regla de gracia."""
    evaluadas = 0
    for empresa in await Empresa.find_all().to_list():
        relaciones = await RelacionClienteEmpresa.find(RelacionClienteEmpresa.empresa_id == empresa.id).to_list()
        for relacion in relaciones:
            await evaluar_segmento(empresa, relacion)
            evaluadas += 1
    return evaluadas
