# PRODUCTO.md — Welve

> Este es el documento **original de planeación/discovery** del producto —
> visión, modelo de negocio y alcance inicial. Varias secciones (cupones,
> retos, "fuera de alcance") quedaron desactualizadas a medida que el
> producto se construyó más allá de lo previsto acá (motor de cupones
> flexibles, módulo Caja/POS, QR, pagos simulados). Para las reglas de
> negocio **tal como están implementadas hoy**, verificadas contra el código
> real, ver [`docs/REGLAS_NEGOCIO.md`](./REGLAS_NEGOCIO.md) — este archivo se
> mantiene como contexto histórico de la visión inicial, no como spec viva.

---

## 1. Visión del producto

Welve es una plataforma SaaS B2B que digitaliza programas de fidelización para
negocios físicos y digitales (restaurantes, cafeterías, salones de belleza, retail).
Reemplaza tarjetas perforadas y stickers físicos por un sistema configurable de
cupones, retos, rachas de visita y recompensas exclusivas, administrado desde un
panel web y consumido por el cliente final sin necesidad de registrarse ni instalar
una app.

**Mercado inicial:** PYMEs de Perú en los rubros de food & beverage, belleza y retail.

---

## 2. Modelo de negocio

| Actor | Rol | Paga |
|---|---|---|
| **Empresa (tenant B2B)** | Configura cupones, retos, rachas y umbrales de exclusividad. Absorbe el costo de los descuentos que ofrece. | Suscripción mensual a Welve, según volumen de clientes activos y funcionalidades habilitadas. |
| **Cliente final (B2C)** | Accede gratis vía QR o magic link. Acumula historial, canjea beneficios. | Nada a Welve. Opcionalmente puede pagar una membresía/club que la propia empresa ofrezca. |
| **Welve** | Provee el engine de reglas, infraestructura, notificaciones. | Cobra la suscripción SaaS. **No cobra comisión por canje.** |

**Regla de negocio clave:** Welve nunca toca el dinero del descuento — ese costo
es 100% de la empresa. Welve monetiza solo la suscripción de plataforma.

---

## 3. Problema que resuelve

Los negocios pequeños y medianos con fidelización física (tarjetas/stickers):
- Pierden la tarjeta o no la llevan → fricción de uso.
- No generan datos de comportamiento del cliente.
- No pueden personalizar la recompensa según historial.
- Son difíciles de actualizar, medir o escalar a varias sucursales.

Welve digitaliza el flujo completo y centraliza los datos de comportamiento.

---

## 4. Multi-tenancy (regla transversal — leer antes de tocar cualquier modelo)

Welve es **multi-tenant desde el diseño**: una sola instancia de base de datos
sirve a múltiples empresas, aisladas lógicamente.

- Toda colección que contenga datos propios de una empresa (cupones, retos,
  rachas, membresías, canjes, configuración de reglas) **debe** incluir el campo
  `empresa_id`.
- Toda query de lectura/escritura sobre esas colecciones **debe** filtrar por
  `empresa_id` del contexto autenticado — nunca confiar en un `empresa_id` que
  venga del body/query del cliente final sin validar contra el token/sesión.
- `Cliente` (el consumidor B2C) puede pertenecer a múltiples empresas a la vez
  (ej. el mismo usuario es cliente de una cafetería y de un salón de belleza),
  por lo tanto su relación con cada empresa vive en una colección/subdocumento
  aparte (historial, puntos, racha), no en el documento raíz del cliente.
- Los índices de MongoDB sobre estas colecciones deben ser compuestos,
  empezando por `empresa_id`, para que las queries de un tenant nunca escaneen
  datos de otro.

---

## 5. Actores y autenticación

| Actor | Mecanismo de acceso | Notas |
|---|---|---|
| Admin de empresa | Login con email/password → JWT | Accede al panel de administración web. Puede haber roles (owner, staff) — ver sección 9 (fuera de alcance v1 si no se prioriza). |
| Cliente final | Magic link (email/WhatsApp) o sesión ligera al escanear QR | Sin password. El link/QR identifica al cliente + la empresa con la que interactúa. |
| Welve (sistema) | Tareas internas (Celery) | Sin interacción humana directa; opera con credenciales de servicio. |

---

## 6. Funcionalidades — Panel de administración (B2B)

### 6.1 Gestión de cupones
- Tipos: descuento porcentual, descuento fijo, producto gratis, 2x1.
- Campos: nombre, tipo, valor, fecha de inicio, fecha de expiración, condiciones
  (ej. monto mínimo de compra), estado (activo/pausado/expirado), límite de usos
  totales y/o por cliente.
- Un cupón expirado no debe ser canjeable aunque siga visible en el historial.

### 6.2 Retos / Challenges
- Meta configurable por la empresa: ej. "visita 5 veces este mes y obtén X".
- Campos: nombre, condición (número de visitas, monto acumulado, etc.), ventana
  de tiempo (fecha inicio/fin), recompensa al completarse.
- Pueden ser de **tiempo límite** (ej. "este fin de semana, consume S/50 y obtén
  postre gratis") — al activarse, dispara notificación a todos los clientes de
  esa empresa (vía Celery + WhatsApp/email).

### 6.3 Rachas de visita ("streaks")
- Si el cliente visita N semanas/días consecutivos (configurable por la
  empresa), desbloquea un beneficio especial.
- Debe definirse la regla de "ruptura de racha": cuántos días sin visita
  resetean el contador (configurable, default sugerido: 7 días sin visita rompe
  la racha semanal).
- El conteo de racha vive en la relación cliente–empresa, no en el cliente
  global (ver sección 4).

### 6.4 Recompensas exclusivas por historial
- La empresa define un umbral una sola vez (ej. "10+ canjes en 3 meses").
- El engine evalúa periódicamente (job de Celery) qué clientes cumplen el
  umbral y les desbloquea cupones que el resto de clientes no ve.
- Esta es la pieza diferenciadora del producto: **automatización**, la empresa
  no gestiona manualmente quién califica.
- Debe quedar registrado cuándo un cliente "entra" o "sale" de un segmento
  exclusivo (para métricas y para no perder el beneficio si baja de umbral a
  mitad de un ciclo, según la regla de "gracia" que se defina).

### 6.5 Membresías / suscripciones para el cliente final
- La empresa puede ofrecer un club mensual pago (ej. "S/25/mes, café gratis
  cada lunes").
- Esto es un cobro de la empresa al cliente final — **no pasa por Welve**, es
  responsabilidad de la empresa gestionar el cobro (en v1 puede modelarse solo
  como estado de membresía activa/inactiva, sin procesar pagos reales todavía;
  confirmar alcance antes de implementar pasarela de pago).

### 6.6 Dashboard de métricas
- Tasa de redención de cupones (canjes / cupones emitidos).
- Clientes recurrentes vs. nuevos.
- Segmentación por frecuencia de visita.
- Todas las métricas filtradas estrictamente por `empresa_id` del admin logueado.

---

## 7. Funcionalidades — Vista del cliente final (B2C)

- **Acceso:** QR físico en el local (apunta a un link único por empresa) o
  magic link enviado por WhatsApp/email (identifica al cliente).
- **Wallet digital:** lista de cupones y recompensas activas para esa empresa.
- **Progreso visible:** barra o indicador hacia la siguiente recompensa
  (ej. "3 de 5 visitas para tu próximo café gratis").
- **Historial de canjes:** lista cronológica de beneficios ya usados.
- **Cupones exclusivos:** visibles solo si el cliente superó el umbral definido
  por la empresa (sección 6.4) — no deben aparecer ni mencionarse a clientes
  que no califican.

---

## 8. Flujo de canje (alto nivel)

1. Cliente ve un cupón activo en su wallet (vía link/QR).
2. Cliente presenta el cupón en el local (pantalla del celular o código).
3. Staff de la empresa marca el cupón como canjeado (desde el panel o una
   vista simplificada de staff).
4. Sistema registra el canje (`Canje`), descuenta el límite de usos si aplica,
   y actualiza el historial del cliente (lo cual puede disparar retos, rachas
   o desbloqueo de exclusivos en el siguiente job de evaluación).

---

## 9. Fuera de alcance v1 (estado real, no la previsión original)

- ~~Procesamiento real de pagos~~ — implementado como **simulación
  determinística** (`pagos`, número de tarjeta de prueba terminado en 4242
  aprueba), no una pasarela real. Cubre la suscripción de la empresa a
  Welve; las membresías del cliente final siguen sin procesar pagos reales.
- Roles granulares dentro de una empresa (multi-usuario admin con permisos)
  — sigue sin existir: Staff y Caja operan con el mismo JWT que el admin.
- App móvil nativa (el producto sigue siendo deliberadamente "sin app").
- Multi-sucursal por empresa (una empresa con varios locales) — sigue sin
  modelarse.

**No previsto originalmente en este documento, pero sí implementado:**
módulo Caja/POS completo (catálogo de productos, inventario, checkout con
IGV y aplicación de cupón en el mismo flujo), motor de cupones flexibles
(visibilidad `publico`/`vip`/`por_reto`/`por_requisito`/`privado`, con
desbloqueo previo al canje), sistema de QR (afiliación, QR personal del
cliente, validación por staff) y regla anti-fraude explícita (el cliente
nunca puede registrarse una visita a sí mismo tras la afiliación inicial).
Detalle completo en [`docs/REGLAS_NEGOCIO.md`](./REGLAS_NEGOCIO.md).

---

## 10. Entidades del dominio (referencia rápida)

| Entidad | Pertenece a | Campos clave |
|---|---|---|
| `Empresa` | — (raíz, es el tenant) | nombre, rubro, plan de suscripción, estado |
| `Cliente` | Global (puede relacionarse con varias empresas) | nombre, contacto (email/WhatsApp), fecha de alta |
| `RelacionClienteEmpresa` | empresa_id + cliente_id | historial de visitas, racha actual, puntos, segmento (exclusivo o no) |
| `Cupon` | empresa_id | tipo, valor, vigencia, condiciones, límite de uso |
| `Reto` | empresa_id | condición, ventana de tiempo, recompensa |
| `Membresia` | empresa_id | precio, beneficio, estado del cliente suscrito |
| `Canje` | empresa_id + cliente_id + cupon_id | fecha, canal, staff que lo registró |

> Nota: el detalle exacto de campos y validaciones se define en el momento de
> implementar cada modelo con Beanie — esta tabla es la referencia conceptual,
> no el schema final.

---

## 11. Glosario rápido

- **Canje:** acto de usar un cupón o recompensa.
- **Racha (streak):** contador de visitas consecutivas según la regla de la empresa.
- **Exclusivo:** cupón visible solo para clientes que superan un umbral de historial.
- **Tenant:** una empresa dentro del sistema multi-tenant.