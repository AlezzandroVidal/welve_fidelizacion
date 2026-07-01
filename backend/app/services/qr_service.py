"""Constructores puros de las URLs codificadas en cada tipo de QR de Welve.

El QR visual se genera en el frontend (ver frontend/src/components/admin/QRDisplay.tsx),
que arma estas mismas URLs con window.location.origin. Estas funciones quedan
disponibles para reutilizarse en notificaciones futuras (WhatsApp/email vía Celery).
"""

from app.core.config import settings


def generar_url_qr_empresa(empresa_id: str, base_url: str | None = None) -> str:
    return f"{base_url or settings.frontend_url}/qr/empresa/{empresa_id}"


def generar_url_qr_visita(empresa_id: str, base_url: str | None = None) -> str:
    return f"{base_url or settings.frontend_url}/qr/visita/{empresa_id}"


def generar_url_qr_cupon(cupon_id: str, cliente_id: str, base_url: str | None = None) -> str:
    return f"{base_url or settings.frontend_url}/qr/cupon/{cupon_id}?cliente={cliente_id}"
