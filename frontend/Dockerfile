# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Vite incrusta las env VITE_* en el bundle estático en build time, no en
# runtime — por eso viene como build-arg (docker build --build-arg
# VITE_API_URL=...) y no como variable de entorno del contenedor final. Sin
# valor (docker-compose local), cae al proxy relativo — ver src/api/client.ts.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


# ── Stage 2: servidor nginx ───────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
