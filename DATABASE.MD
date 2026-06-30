# DATABASE.md — Schema de MongoDB (Welve)

> Referencia detallada de colecciones para implementar modelos Beanie.
> `CLAUDE.md` apunta aquí — no dupliques este contenido ahí.
> Todas las colecciones con datos de una empresa llevan `empresa_id` (regla de
> multi-tenancy, ver PRODUCTO.md sección 4). Los índices compuestos siempre
> empiezan por `empresa_id`.

---

## Convenciones generales

- IDs: `PydanticObjectId` (Beanie). Se serializan como `str` en schemas de respuesta.
- Timestamps: `created_at` / `updated_at` en UTC (`datetime`), default `datetime.utcnow`.
- Montos: `float` en v1 (soles, sin centavos de precisión crítica). Si en algún
  momento se requiere precisión financiera exacta, migrar a `Decimal128`.
- Enums: `str, Enum` de Python, mapeados a `Indexed(str)` cuando se filtra por ellos.
- Todo campo opcional usa `Optional[X] = None`, nunca strings vacíos como default.

---

## 1. `empresas`

El tenant raíz. No lleva `empresa_id` (es la raíz).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `PydanticObjectId` | |
| `nombre` | `str` | |
| `rubro` | `enum RubroEmpresa` | `food_beverage`, `belleza`, `retail`, `otro` |
| `admin_email` | `Indexed(str, unique=True)` | login del panel admin |
| `admin_password_hash` | `str` | bcrypt/argon2 |
| `plan_suscripcion` | `enum PlanSuscripcion` | `starter`, `growth`, `pro` — plan que la empresa paga a Welve |
| `estado` | `enum EstadoEmpresa` | `activo`, `suspendido`, `cancelado` |
| `config` | `EmpresaConfig` (embedded) | `racha_dias_ruptura: int = 7` |
| `fecha_registro` | `datetime` | |
| `created_at` / `updated_at` | `datetime` | |

---

## 2. `clientes`

Cliente B2C global — puede relacionarse con varias empresas (ver `relaciones_cliente_empresa`).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `PydanticObjectId` | |
| `nombre` | `str` | |
| `email` | `Optional[Indexed(str, sparse=True)]` | uno de los dos (email/whatsapp) requerido |
| `whatsapp` | `Optional[Indexed(str, sparse=True)]` | formato E.164 |
| `fecha_alta` | `datetime` | |
| `created_at` | `datetime` | |

**No** guardar aquí historial, racha ni puntos — eso vive en `relaciones_cliente_empresa` (regla de multi-tenancy: el cliente es global, su comportamiento por tenant no).

---

## 3. `relaciones_cliente_empresa`

El corazón del engine de fidelización. Una fila por par (cliente, empresa).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `PydanticObjectId` | |
| `empresa_id` | `Indexed(PydanticObjectId)` | |
| `cliente_id` | `Indexed(PydanticObjectId)` | |
| `visitas_totales` | `int = 0` | |
| `monto_acumulado` | `float = 0.0` | |
| `racha_actual` | `int = 0` | semanas/días consecutivos según `empresas.config.racha_dias_ruptura` |
| `racha_maxima` | `int = 0` | histórico, para métricas |
| `ultima_visita` | `Optional[datetime]` | usada por el job de Celery que rompe rachas |
| `segmento` | `enum SegmentoCliente` | `regular`, `exclusivo` |
| `fecha_entrada_segmento` | `Optional[datetime]` | cuándo pasó a exclusivo (para regla de gracia) |
| `puntos` | `int = 0` | |
| `created_at` / `updated_at` | `datetime` | |

**Índice compuesto único:** `(empresa_id, cliente_id)`.
**Índice adicional:** `(empresa_id, segmento)` — usado por el job de evaluación de exclusivos y por el dashboard.

---

## 4. `cupones`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `PydanticObjectId` | |
| `empresa_id` | `Indexed(PydanticObjectId)` | |
| `nombre` | `str` | |
| `tipo` | `enum TipoCupon` | `descuento_porcentual`, `descuento_fijo`, `producto_gratis`, `dos_por_uno` |
| `valor` | `Optional[float]` | requerido si tipo es descuento_*, `None` si producto_gratis/2x1 |
| `monto_minimo` | `Optional[float]` | condición de compra mínima |
| `fecha_inicio` | `datetime` | |
| `fecha_expiracion` | `datetime` | |
| `estado` | `enum EstadoCupon` | `activo`, `pausado`, `expirado` |
| `limite_usos_total` | `Optional[int]` | `None` = ilimitado |
| `limite_usos_por_cliente` | `Optional[int]` | default sugerido: `1` |
| `usos_actuales` | `int = 0` | incrementado en cada `Canje` |
| `exclusivo` | `bool = False` | visible solo para `segmento = exclusivo` (sección 6.4 de PRODUCTO.md) |
| `created_at` / `updated_at` | `datetime` | |

**Índice compuesto:** `(empresa_id, estado)` — listado del panel admin y del wallet del cliente.

**Regla de servicio (no de schema):** un cupón con `fecha_expiracion < now()` nunca debe ser canjeable aunque su `estado` siga en `activo` — esto se valida en `services/cupon_service.py`, no se asume desde el campo `estado` solamente.

---

## 5. `retos`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `PydanticObjectId` | |
| `empresa_id` | `Indexed(PydanticObjectId)` | |
| `nombre` | `str` | |
| `condicion_tipo` | `enum TipoCondicionReto` | `num_visitas`, `monto_acumulado` |
| `condicion_valor` | `float` | ej. `5` visitas, o `50.0` soles |
| `fecha_inicio` | `datetime` | |
| `fecha_fin` | `datetime` | si `fecha_fin` está cerca, es un reto de tiempo límite (sección 6.2) |
| `recompensa_cupon_id` | `Optional[PydanticObjectId]` | referencia a `cupones` que se entrega al completar |
| `notificado` | `bool = False` | evita reenviar la notificación de activación vía Celery |
| `created_at` | `datetime` | |

**Índice compuesto:** `(empresa_id, fecha_fin)` — el job de Celery que revisa retos próximos a vencer.

---

## 6. `membresias`

Definición del club que la empresa ofrece (el plan, no la suscripción del cliente).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `PydanticObjectId` | |
| `empresa_id` | `Indexed(PydanticObjectId)` | |
| `nombre` | `str` | ej. "Club Café Lunes" |
| `precio` | `float` | |
| `beneficio_descripcion` | `str` | texto libre, ej. "café gratis cada lunes" |
| `frecuencia` | `enum FrecuenciaMembresia` | `mensual` (única opción en v1) |
| `estado` | `enum EstadoMembresia` | `activa`, `pausada` |
| `created_at` | `datetime` | |

---

## 7. `membresias_clientes`

Estado de suscripción de un cliente a una membresía. **Sin pasarela de pago real en v1** (ver PRODUCTO.md sección 9) — solo modela el estado.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `PydanticObjectId` | |
| `empresa_id` | `Indexed(PydanticObjectId)` | |
| `cliente_id` | `Indexed(PydanticObjectId)` | |
| `membresia_id` | `Indexed(PydanticObjectId)` | |
| `estado` | `enum EstadoMembresiaCliente` | `activa`, `vencida`, `cancelada` |
| `fecha_inicio` | `datetime` | |
| `fecha_proximo_cobro` | `Optional[datetime]` | placeholder, no dispara cobro real todavía |
| `created_at` / `updated_at` | `datetime` | |

**Índice compuesto único:** `(empresa_id, cliente_id, membresia_id)`.

---

## 8. `canjes`

Registro inmutable de cada redención. Nunca se actualiza, solo se inserta.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `PydanticObjectId` | |
| `empresa_id` | `Indexed(PydanticObjectId)` | |
| `cliente_id` | `Indexed(PydanticObjectId)` | |
| `cupon_id` | `Indexed(PydanticObjectId)` | |
| `fecha` | `datetime` | default `utcnow` |
| `canal` | `enum CanalCanje` | `qr`, `magic_link`, `staff_manual` |
| `staff_ref` | `Optional[str]` | identificador simple del staff que lo registró; no se modela `Staff` como entidad en v1 |
| `created_at` | `datetime` | |

**Índices compuestos:**
- `(empresa_id, cliente_id, fecha)` — historial de canjes del cliente.
- `(empresa_id, cupon_id)` — tasa de redención por cupón (dashboard, sección 6.6).

**Efecto secundario al crear un `Canje`** (en `services/canje_service.py`, no en el modelo):
1. Incrementa `cupones.usos_actuales`.
2. Actualiza `relaciones_cliente_empresa` (visitas, monto, racha).
3. Encola evaluación de retos/exclusivos si aplica (Celery, no síncrono).

---

## Jobs de Celery que tocan estas colecciones

| Job | Colecciones que lee/escribe | Frecuencia sugerida |
|---|---|---|
| `evaluar_exclusivos` | lee `canjes`/`relaciones_cliente_empresa`, escribe `segmento` en `relaciones_cliente_empresa` | diario |
| `romper_rachas` | lee/escribe `relaciones_cliente_empresa.racha_actual` según `ultima_visita` y `empresas.config.racha_dias_ruptura` | diario |
| `notificar_retos_activos` | lee `retos` (`notificado = False`, `fecha_inicio <= now`), escribe `notificado = True` | cada N minutos |
| `expirar_cupones` | actualiza `cupones.estado = expirado` donde `fecha_expiracion < now` | diario |