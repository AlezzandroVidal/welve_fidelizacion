# DATABASE.md — Schema de MongoDB (Welve)

> Referencia detallada de colecciones para implementar modelos Beanie.
> `CLAUDE.md` apunta aquí — no dupliques este contenido ahí.
> Todas las colecciones con datos de una empresa llevan `empresa_id` (regla de
> multi-tenancy, ver PRODUCTO.md sección 4). Los índices compuestos siempre
> empiezan por `empresa_id`.
>
> **Cobertura parcial**: este documento detalla campo por campo las primeras
> 8 colecciones del proyecto (`empresas` hasta `canjes`). Las que se
> agregaron después — `resenas`, `productos`, `movimientos_inventario`,
> `ventas`, `pagos`, `cupones_desbloqueados`, `notificaciones`,
> `historial_visitas`, `welve_admins` — todavía no tienen su sección de
> detalle acá; están listadas (propósito + tenant-scoping) en la tabla de
> `CLAUDE.md` § Modelo de datos, y sus campos clave en el ER de
> [`docs/ARQUITECTURA.md`](./ARQUITECTURA.md). Fuente de verdad exacta
> siempre: los modelos Beanie en `backend/app/models/`.

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
| `rubro` | `enum RubroEmpresa` | `food_beverage`, `belleza`, `retail`, `fitness`, `educacion`, `salud`, `entretenimiento`, `otro` |
| `admin_email` | `Indexed(str, unique=True)` | login del panel admin |
| `admin_password_hash` | `str` | bcrypt/argon2 |
| `admin_nombre` | `str` | nombre del dueño/admin que se registró; default `""` en empresas sembradas antes de este campo |
| `admin_telefono` | `Optional[str]` | |
| `plan_suscripcion` | `enum PlanSuscripcion` | `starter`, `growth`, `pro` — plan que la empresa paga a Welve |
| `estado` | `enum EstadoEmpresa` | `activo`, `suspendido`, `cancelado` |
| `config` | `EmpresaConfig` (embedded) | `racha_dias_ruptura: int = 7`, `soles_por_punto`, `expiracion_meses`, `recompensas_automaticas: list[RecompensaAutomatica] = []` |
| `fecha_registro` | `datetime` | |
| `created_at` / `updated_at` | `datetime` | |

**`RecompensaAutomatica`** (embebido dentro de `config.recompensas_automaticas`): regla "en la visita N,
entrega este cupón" que la empresa configura desde el panel (sección de QR codes). Campos:
`visitas_requeridas: int`, `cupon_id: PydanticObjectId`, `activa: bool = True`, `descripcion: str`. El
índice de la empresa en la lista actúa como identificador (no tiene `_id` propio). La evalúa
`services/visita_service.py` en cada visita registrada — ver sección "Jobs..." más abajo, aunque en este
caso la evaluación es síncrona (parte de `registrar_visita()`), no un job de Celery.

---

## 2. `clientes`

Cliente B2C global — puede relacionarse con varias empresas (ver `relaciones_cliente_empresa`).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `PydanticObjectId` | |
| `nombre` | `str` | |
| `apellido` | `Optional[str]` | |
| `email` | `Optional[Indexed(str, sparse=True)]` | uno de los dos (email/whatsapp) requerido |
| `whatsapp` | `Optional[Indexed(str, sparse=True)]` | formato E.164 |
| `password_hash` | `Optional[str]` | `None` si el cliente solo ha usado magic link — login por password y magic link coexisten |
| `fecha_nacimiento` | `Optional[date]` | |
| `genero` | `Optional[str]` | `"M"` / `"F"` / `"otro"` / `"prefiero_no_decir"` (`enum Genero`) |
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
| `codigo` | `Optional[Indexed(str, unique=True, sparse=True)]` | corto, ej. `CUP-4F2A` — identifica el cupón en Caja sin buscar por nombre. Puede ser `None` en cupones creados antes de este campo |
| `tipo` | `enum TipoCupon` | `porcentual`, `monto_fijo`, `producto_gratis`, `dos_por_uno`, `n_por_m`, `envio_gratis`, `personalizado` |
| `valor` | `Optional[float]` | `None` válido solo para `producto_gratis`/`dos_por_uno`/`envio_gratis`/`personalizado` |
| `cantidad_paga` / `cantidad_lleva` | `Optional[int]` | solo para `tipo=n_por_m` (ej. 3×2 → paga=2, lleva=3) |
| `producto_gratis_id` | `Optional[PydanticObjectId]` | producto que se da gratis, o el que entra en la promo si aplica a uno específico |
| `monto_minimo` | `Optional[float]` | condición de compra mínima, por compra individual |
| `fecha_inicio` / `fecha_expiracion` | `datetime` | |
| `estado` | `enum EstadoCupon` | `activo`, `pausado`, `expirado` |
| `limite_usos_total` | `Optional[int]` | `None` = ilimitado |
| `limite_usos_por_cliente` | `Optional[int] = 1` | |
| `usos_actuales` | `int = 0` | incrementado en cada `Canje` |
| `aplica_a` | `enum AplicaCupon` | `todo` / `productos_especificos` / `categoria` — restricción para el módulo Caja; si es `todo`, ignora los dos campos siguientes |
| `productos_validos` | `list[PydanticObjectId]` | |
| `categorias_validas` | `list[str]` | |
| `monto_minimo_carrito` | `Optional[float]` | sobre el total del carrito en Caja — distinto de `monto_minimo` (por compra individual) |
| `visibilidad` | `enum AccesoVisibilidad` | `publico` / `vip` / `por_reto` / `por_requisito` / `privado` — **reemplaza al viejo campo `exclusivo: bool`**; `vip` conserva la misma semántica (gate por `segmento=exclusivo`) |
| `reto_id` | `Optional[PydanticObjectId]` | si `visibilidad=por_reto`: qué `Reto` lo desbloquea |
| `requisito` | `Optional[RequisitoAcceso]` (embebido) | si `visibilidad=por_requisito`: `{tipo, valor, periodo_dias?, producto_objetivo_id?, categoria_objetivo?}` — condición inline, sin depender de un `Reto` |
| `notificar_al_desbloquear` | `bool = True` | |
| `mensaje_notificacion` | `Optional[str]` | `None` → mensaje default en `cupon_acceso_service` |
| `destacado` | `bool = False` | la empresa lo marca a mano para promocionarlo en el inicio del cliente |
| `imagen_url`, `terminos_condiciones`, `descripcion_larga`, `instrucciones_canje`, `tags`, `color_tema` | — | contenido de presentación en el wallet del cliente |
| `created_at` / `updated_at` | `datetime` | |

**Índice compuesto:** `(empresa_id, estado)` — listado del panel admin y del wallet del cliente.

**Regla de servicio (no de schema):** un cupón con `fecha_expiracion < now()` nunca debe ser canjeable aunque su `estado` siga en `activo` — esto se valida en `services/cupon_validacion_service.py`, no se asume desde el campo `estado` solamente.

**Desbloqueo vs. canje:** un cupón `por_reto`/`por_requisito` primero se
**desbloquea** (crea un `CuponDesbloqueado`, colección aparte — ver nota al
final de este documento) cuando el cliente cumple la condición; el cliente
igual tiene que mostrar su QR al staff para el canje final. Ver
[`docs/REGLAS_NEGOCIO.md`](./REGLAS_NEGOCIO.md) § Cupones para el flujo
completo.

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
| `canal` | `enum CanalCanje` | `qr`, `magic_link`, `staff_manual`, `automatico` (otorgado por `visita_service` — recompensa por visitas o reto completado, sin intervención del staff) |
| `staff_ref` | `Optional[str]` | identificador simple del staff que lo registró; `"sistema:recompensa_automatica"` / `"sistema:reto_completado"` cuando `canal=automatico`. No se modela `Staff` como entidad en v1 |
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