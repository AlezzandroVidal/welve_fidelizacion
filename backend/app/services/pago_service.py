import random
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4

from beanie import PydanticObjectId

from app.models.empresa import Empresa
from app.models.enums import EstadoPago, MetodoPago, PlanSuscripcion
from app.models.pago import Pago
from app.schemas.pago import TarjetaInput

PLAN_PRECIOS: dict[PlanSuscripcion, float] = {
    PlanSuscripcion.starter: 49.0,
    PlanSuscripcion.growth: 99.0,
    PlanSuscripcion.pro: 199.0,
}

PLAN_LABEL: dict[PlanSuscripcion, str] = {
    PlanSuscripcion.starter: "Starter",
    PlanSuscripcion.growth: "Growth",
    PlanSuscripcion.pro: "Pro",
}

_MESES_ES = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]


def _generar_referencia() -> str:
    hoy = datetime.now(timezone.utc)
    return f"WLV-PAY-{hoy:%Y%m%d}-{uuid4().hex[:8].upper()}"


def _evaluar_resultado(pago: Pago) -> tuple[bool, Optional[str]]:
    """Simulación determinística por número de tarjeta de prueba, ver PRODUCT.MD
    fuera de alcance v1: esto no procesa pagos reales, solo modela el estado."""
    if pago.ultimos_4 == "4242":
        return True, None
    if pago.ultimos_4 == "4000":
        return False, "Fondos insuficientes"
    if pago.ultimos_4 == "4111":
        return False, "Tarjeta expirada"
    aprobado = random.random() < 0.9
    return aprobado, None if aprobado else "Pago rechazado por el emisor"


async def iniciar_pago(
    empresa_id: PydanticObjectId,
    plan: PlanSuscripcion,
    metodo_pago: MetodoPago,
    tarjeta: Optional[TarjetaInput] = None,
    ip_origen: Optional[str] = None,
) -> Pago:
    hoy = datetime.now(timezone.utc)
    concepto = f"Suscripción mensual Plan {PLAN_LABEL[plan]} - {_MESES_ES[hoy.month - 1].capitalize()} {hoy.year}"

    pago = Pago(
        empresa_id=empresa_id,
        monto=PLAN_PRECIOS[plan],
        plan=plan,
        concepto=concepto,
        metodo_pago=metodo_pago,
        ultimos_4=tarjeta.ultimos_4 if tarjeta else None,
        marca_tarjeta=tarjeta.marca_tarjeta if tarjeta else None,
        nombre_titular=tarjeta.nombre_titular if tarjeta else None,
        referencia=_generar_referencia(),
        ip_origen=ip_origen,
    )
    await pago.insert()
    return pago


async def procesar_pago(pago_id: PydanticObjectId, empresa_id: PydanticObjectId) -> tuple[Optional[Pago], Optional[str]]:
    """Retorna (pago, error_msg). Simula el procesamiento — no llama APIs externas."""
    pago = await Pago.get(pago_id)
    if not pago or pago.empresa_id != empresa_id:
        return None, "Pago no encontrado"
    if pago.estado != EstadoPago.pendiente:
        return None, "Este pago ya fue procesado"

    aprobado, motivo = _evaluar_resultado(pago)
    now = datetime.now(timezone.utc)

    if aprobado:
        vencimiento = now + timedelta(days=30)
        await pago.set({
            "estado": EstadoPago.aprobado,
            "fecha_pago": now,
            "fecha_vencimiento_plan": vencimiento,
            "updated_at": now,
        })
        empresa = await Empresa.get(empresa_id)
        if empresa:
            await empresa.set({
                "plan_suscripcion": pago.plan,
                "fecha_vencimiento_plan": vencimiento,
                "updated_at": now,
            })
    else:
        await pago.set({
            "estado": EstadoPago.rechazado,
            "motivo_rechazo": motivo,
            "updated_at": now,
        })

    pago = await Pago.get(pago_id)
    return pago, None


async def historial_pagos(empresa_id: PydanticObjectId) -> list[Pago]:
    return await Pago.find(Pago.empresa_id == empresa_id).sort("-created_at").to_list()


async def obtener_pago(pago_id: PydanticObjectId, empresa_id: PydanticObjectId) -> Optional[Pago]:
    pago = await Pago.get(pago_id)
    if not pago or pago.empresa_id != empresa_id:
        return None
    return pago
