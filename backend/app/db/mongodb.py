import asyncio
import logging

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError

from app.core.config import settings

logger = logging.getLogger(__name__)


async def init_db() -> None:
    """Inicializa Motor + Beanie con reintentos para evitar race condition con Mongo."""
    from app.models.welve_admin import WelveAdmin
    from app.models.empresa import Empresa
    from app.models.cliente import Cliente
    from app.models.relacion import RelacionClienteEmpresa
    from app.models.cupon import Cupon
    from app.models.reto import Reto
    from app.models.membresia import Membresia
    from app.models.membresia_cliente import MembresiaCliente
    from app.models.canje import Canje
    from app.models.resena import Resena
    from app.models.pago import Pago
    from app.models.producto import Producto, MovimientoInventario
    from app.models.venta import Venta
    from app.models.cupon_desbloqueado import CuponDesbloqueado
    from app.models.notificacion import Notificacion
    from app.models.historial_visita import HistorialVisita

    delays = [2, 4, 8, 16, 32]
    last_error = None

    for attempt, delay in enumerate(delays, start=1):
        try:
            logger.info(f"Conectando a MongoDB (intento {attempt}/5)...")
            client = AsyncIOMotorClient(
                settings.mongo_uri,
                serverSelectionTimeoutMS=10000,
            )
            await init_beanie(
                database=client[settings.mongo_db],
                document_models=[
                    WelveAdmin,
                    Empresa,
                    Cliente,
                    RelacionClienteEmpresa,
                    Cupon,
                    Reto,
                    Membresia,
                    MembresiaCliente,
                    Canje,
                    Resena,
                    Pago,
                    Producto,
                    MovimientoInventario,
                    Venta,
                    CuponDesbloqueado,
                    Notificacion,
                    HistorialVisita,
                ],
            )
            logger.info("Conexión a MongoDB exitosa.")
            return
        except (ServerSelectionTimeoutError, Exception) as e:
            last_error = e
            logger.warning(f"Intento {attempt} fallido: {e}. Reintentando en {delay}s...")
            await asyncio.sleep(delay)

    raise RuntimeError(f"No se pudo conectar a MongoDB tras 5 intentos: {last_error}")
