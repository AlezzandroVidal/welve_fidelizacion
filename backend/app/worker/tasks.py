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
