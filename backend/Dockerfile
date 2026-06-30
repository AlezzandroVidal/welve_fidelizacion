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

# Copiar el código fuente
COPY app/ ./app/

# Usuario no-root para seguridad
RUN useradd -m -u 1000 welve && chown -R welve:welve /app
USER welve

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
