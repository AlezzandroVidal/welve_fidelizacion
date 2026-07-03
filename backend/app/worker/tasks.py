import asyncio

from app.worker.celery_app import celery_app


@celery_app.task(name="notificaciones.enviar_whatsapp")
def enviar_whatsapp(telefono: str, mensaje: str) -> dict:
    # TODO: integrar WhatsApp Cloud API
    print(f"[Celery] Enviando WhatsApp a {telefono}: {mensaje}")
    return {"status": "enviado", "telefono": telefono}


@celery_app.task(name="notificaciones.enviar_email")
def enviar_email(email: str, asunto: str, cuerpo: str) -> dict:
    # TODO: integrar SendGrid / Resend
    print(f"[Celery] Enviando email a {email}: {asunto}")
    return {"status": "enviado", "email": email}


def _run(coro):
    """Cada invocación crea su propio loop + cliente Motor (init_db no cachea
    nada) — evita el error de 'Future attached to a different loop' que pasaría
    si se reusara una conexión entre corridas de una tarea sync de Celery."""
    return asyncio.run(coro)


async def _con_db(fn):
    from app.db.mongodb import init_db
    await init_db()
    return await fn()


@celery_app.task(name="jobs.romper_rachas")
def romper_rachas() -> int:
    """Diario: resetea racha_actual=0 en relaciones inactivas (PRODUCT.MD 6.3)."""
    from app.services.visita_service import romper_rachas_inactivas
    return _run(_con_db(romper_rachas_inactivas))


@celery_app.task(name="jobs.expirar_cupones")
def expirar_cupones() -> int:
    """Diario: pasa a `expirado` los cupones vencidos (PRODUCT.MD 6.1)."""
    from app.services.cupon_validacion_service import expirar_cupones_vencidos
    return _run(_con_db(expirar_cupones_vencidos))


@celery_app.task(name="jobs.evaluar_exclusivos")
def evaluar_exclusivos() -> int:
    """Diario: sube/baja el segmento exclusivo según el umbral y la regla de
    gracia de cada empresa (PRODUCT.MD 6.4)."""
    from app.services.segmento_service import evaluar_exclusivos_todas_empresas
    return _run(_con_db(evaluar_exclusivos_todas_empresas))


@celery_app.task(name="jobs.notificar_retos_activos")
def notificar_retos_activos() -> int:
    """Cada 15 min: avisa por WhatsApp/email a los clientes de una empresa
    cuando un reto de tiempo límite se activa (PRODUCT.MD 6.2)."""
    async def _job():
        from app.services.reto_service import notificar_retos_pendientes
        notificaciones = await notificar_retos_pendientes()
        for n in notificaciones:
            if n["canal"] == "whatsapp":
                enviar_whatsapp.delay(n["destino"], n["mensaje"])
            else:
                enviar_email.delay(n["destino"], "Nuevo reto disponible", n["mensaje"])
        return len(notificaciones)

    return _run(_con_db(_job))
