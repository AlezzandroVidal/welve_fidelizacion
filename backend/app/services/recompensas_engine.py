"""Evaluación de recompensas automáticas y retos por número de visitas.

Extraído de visita_service.py (que orquesta el conteo de la visita en sí) para
mantener cada archivo enfocado y bajo el límite de 200 líneas del proyecto.
"""

from datetime import datetime, timezone

from beanie import PydanticObjectId

from app.models.canje import Canje
from app.models.cupon import Cupon
from app.models.empresa import Empresa
from app.models.enums import CanalCanje, TipoCondicionReto
from app.models.relacion import RelacionClienteEmpresa
from app.models.reto import Reto
from app.services import canje_service


async def evaluar_recompensas_automaticas(
    empresa: Empresa, cliente_id: PydanticObjectId, visitas_totales: int
) -> list[dict]:
    desbloqueadas = []
    for r in empresa.config.recompensas_automaticas:
        if not r.activa or r.visitas_requeridas != visitas_totales:
            continue
        ya_otorgado = await Canje.find_one(
            Canje.empresa_id == empresa.id,
            Canje.cliente_id == cliente_id,
            Canje.cupon_id == r.cupon_id,
            Canje.canal == CanalCanje.automatico,
        )
        if ya_otorgado:
            continue
        _, error = await canje_service.crear_canje(
            empresa_id=empresa.id,
            cliente_id=cliente_id,
            cupon_id=r.cupon_id,
            canal=CanalCanje.automatico,
            staff_ref="sistema:recompensa_automatica",
            registrar_visita=False,
        )
        if error:
            continue  # cupón pausado/expirado/sin usos — no se otorga, no se rompe el flujo de visita
        cupon = await Cupon.get(r.cupon_id)
        desbloqueadas.append({
            "cupon_id": str(r.cupon_id),
            "nombre": cupon.nombre if cupon else r.descripcion,
            "tipo": cupon.tipo.value if cupon else None,
        })
    return desbloqueadas


async def evaluar_retos(
    empresa: Empresa, cliente_id: PydanticObjectId, relacion: RelacionClienteEmpresa
) -> list[dict]:
    """Evalúa retos de num_visitas y de monto_acumulado (antes solo evaluaba
    num_visitas — los retos por monto nunca se completaban)."""
    now = datetime.now(timezone.utc)
    candidatos = await Reto.find(
        Reto.empresa_id == empresa.id, Reto.cancelado == False,  # noqa: E712
    ).to_list()

    progreso_por_tipo = {
        TipoCondicionReto.num_visitas: relacion.visitas_totales,
        TipoCondicionReto.monto_acumulado: relacion.monto_acumulado,
    }

    completados = []
    for reto in candidatos:
        fecha_inicio, fecha_fin = reto.fecha_inicio, reto.fecha_fin
        if fecha_inicio.tzinfo is None:
            fecha_inicio = fecha_inicio.replace(tzinfo=timezone.utc)
        if fecha_fin.tzinfo is None:
            fecha_fin = fecha_fin.replace(tzinfo=timezone.utc)
        if not (fecha_inicio <= now <= fecha_fin):
            continue
        progreso = progreso_por_tipo[reto.condicion_tipo]
        if reto.recompensa_cupon_id is None or progreso < reto.condicion_valor:
            continue

        ya_otorgado = await Canje.find_one(
            Canje.empresa_id == empresa.id,
            Canje.cliente_id == cliente_id,
            Canje.cupon_id == reto.recompensa_cupon_id,
            Canje.canal == CanalCanje.automatico,
        )
        if ya_otorgado:
            continue
        _, error = await canje_service.crear_canje(
            empresa_id=empresa.id,
            cliente_id=cliente_id,
            cupon_id=reto.recompensa_cupon_id,
            canal=CanalCanje.automatico,
            staff_ref="sistema:reto_completado",
            registrar_visita=False,
        )
        if error:
            continue
        cupon = await Cupon.get(reto.recompensa_cupon_id)
        completados.append({
            "reto_id": str(reto.id),
            "nombre": reto.nombre,
            "recompensa": cupon.nombre if cupon else None,
        })
    return completados
