"""CRUD de notificaciones en-app del cliente (campana en WalletLayout) — las
crea cupon_desbloqueo_service.desbloquear_cupon(), este archivo solo las lista
y las marca como leídas."""

from typing import List

from beanie import PydanticObjectId
from fastapi import HTTPException

from app.models.notificacion import Notificacion


async def listar_no_leidas(cliente_id: PydanticObjectId) -> List[Notificacion]:
    return await Notificacion.find(
        Notificacion.cliente_id == cliente_id,
        Notificacion.leida == False,  # noqa: E712
    ).sort("-created_at").to_list()


async def marcar_leida(notificacion_id: PydanticObjectId, cliente_id: PydanticObjectId) -> None:
    notif = await Notificacion.get(notificacion_id)
    if not notif or notif.cliente_id != cliente_id:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    await notif.set({"leida": True})


async def marcar_todas_leidas(cliente_id: PydanticObjectId) -> int:
    notifs = await Notificacion.find(
        Notificacion.cliente_id == cliente_id,
        Notificacion.leida == False,  # noqa: E712
    ).to_list()
    for n in notifs:
        await n.set({"leida": True})
    return len(notifs)
