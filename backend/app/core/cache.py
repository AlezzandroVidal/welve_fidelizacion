"""Caché simple de solo lectura sobre Redis, para endpoints de métricas que
recalculan lo mismo en cada request. Reutiliza el cliente singleton de
`redis_client.py` (mismo que usa `magic_link_service.py`) en vez de abrir una
conexión aparte.

Graceful degradation: si Redis no está disponible, cache_get/cache_set nunca
rompen el flujo — devuelven/ignoran en silencio y el caller recalcula como si
no hubiera caché. El dato correcto (Mongo) sigue siendo la fuente de verdad;
esto es una optimización de latencia, no de consistencia.
"""
import json
import logging
from typing import Any, Optional

from app.core.redis_client import get_redis

logger = logging.getLogger(__name__)


async def cache_get(key: str) -> Optional[Any]:
    try:
        r = get_redis()
        val = await r.get(key)
        return json.loads(val) if val else None
    except Exception as e:
        logger.warning(f"cache_get({key}) falló, sigue sin caché: {e}")
        return None


async def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    try:
        r = get_redis()
        await r.setex(key, ttl_seconds, json.dumps(value, default=str))
    except Exception as e:
        logger.warning(f"cache_set({key}) falló, continúa sin cachear: {e}")


async def cache_delete(*keys: str) -> None:
    if not keys:
        return
    try:
        r = get_redis()
        await r.delete(*keys)
    except Exception as e:
        logger.warning(f"cache_delete({keys}) falló: {e}")


async def cache_delete_pattern(pattern: str) -> None:
    """Borra todas las keys que matcheen `pattern` (ej. "metricas:top_cupones:{id}:*")
    — necesario porque varias métricas incluyen parámetros de query (dias, limit)
    en la key, así que no hay una sola key fija que invalidar. Usa SCAN (cursor,
    no bloqueante) en vez de KEYS, seguro para producción."""
    try:
        r = get_redis()
        cursor = 0
        while True:
            cursor, keys = await r.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                await r.delete(*keys)
            if cursor == 0:
                break
    except Exception as e:
        logger.warning(f"cache_delete_pattern({pattern}) falló: {e}")
