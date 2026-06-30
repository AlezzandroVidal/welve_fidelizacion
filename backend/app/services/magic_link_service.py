import json
import uuid

from app.core.redis_client import get_redis

_MAGIC_TTL = 900  # 15 minutos


async def crear_token(empresa_id: str, email: str | None, whatsapp: str | None, nombre: str | None) -> str:
    token = str(uuid.uuid4())
    data = json.dumps({"empresa_id": empresa_id, "email": email, "whatsapp": whatsapp, "nombre": nombre})
    r = get_redis()
    await r.setex(f"magic:{token}", _MAGIC_TTL, data)
    return token


async def verificar_y_consumir_token(token: str) -> dict | None:
    """Retorna el payload y borra el token (uso único)."""
    r = get_redis()
    raw = await r.get(f"magic:{token}")
    if raw is None:
        return None
    await r.delete(f"magic:{token}")
    return json.loads(raw)
