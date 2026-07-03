# ── Stage 1: dependencias ─────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# Instalar dependencias de compilación solo en el stage builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: imagen de producción ─────────────────────────────────────────────
FROM python:3.11-slim AS production

WORKDIR /app

# Copiar solo las dependencias instaladas del stage builder
COPY --from=builder /install /usr/local

# Copiar el código fuente (scripts/ incluido — Railway corre scripts/seed.py
# como Run Command puntual, ver DEPLOY.md)
COPY app/ ./app/
COPY scripts/ ./scripts/

# Usuario no-root para seguridad
RUN useradd -m -u 1000 welve && chown -R welve:welve /app
USER welve

EXPOSE 8000

# Railway inyecta $PORT dinámicamente; localmente (docker run sin -e PORT)
# cae a 8000. Usa urllib en vez de curl para no instalar nada extra en la
# imagen final.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python3 -c "import os, urllib.request; urllib.request.urlopen('http://localhost:' + os.environ.get('PORT', '8000') + '/health', timeout=5)"

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
