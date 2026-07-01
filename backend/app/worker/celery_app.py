from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "welve",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.worker.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="America/Lima",
    enable_utc=True,
)

# Jobs periódicos (PRODUCT.MD 6.1-6.4 / DATABASE.MD) — requiere correr el worker
# con `-B` (beat embebido, ver CLAUDE.md) para que esto se ejecute solo.
celery_app.conf.beat_schedule = {
    "romper-rachas-diario": {
        "task": "jobs.romper_rachas",
        "schedule": crontab(hour=3, minute=0),
    },
    "expirar-cupones-diario": {
        "task": "jobs.expirar_cupones",
        "schedule": crontab(hour=3, minute=15),
    },
    "evaluar-exclusivos-diario": {
        "task": "jobs.evaluar_exclusivos",
        "schedule": crontab(hour=3, minute=30),
    },
    "notificar-retos-cada-15-min": {
        "task": "jobs.notificar_retos_activos",
        "schedule": crontab(minute="*/15"),
    },
}
