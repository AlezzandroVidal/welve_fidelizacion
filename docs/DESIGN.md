# DESIGN.md — Sistema de diseño de Welve

> Tokens visuales concretos para implementar en `tailwind.config.js`. Este
> documento fija las decisiones de diseño tomadas a partir de una referencia
> visual aprobada — no se deben inventar valores nuevos componente por
> componente, todo debe derivar de aquí.
> `CLAUDE.md` y el skill `.claude/skills/welve-design/SKILL.md` apuntan a
> este archivo para los valores exactos; no los dupliques ahí.

---

## 1. Referencia de estilo

Dirección visual: **dashboard SaaS amigable** — sidebar oscuro fijo, tarjetas
claras muy redondeadas con sombra suave, badges de color pastel por
categoría/tipo, anillos de progreso circulares, jerarquía tipográfica bold
para títulos. Sensación: profesional pero cálido, nunca corporativo-frío.

Este lenguaje visual aplica principalmente al **panel de administración
(B2B)** — es donde tiene sentido la densidad de información tipo dashboard.
El wallet del cliente (B2C) reutiliza la misma paleta y tipografía, pero con
layout mobile-first más simple (ver `welve-design` skill, sección "Wallet del
cliente").

---

## 2. Paleta de colores

Definir como tokens en `tailwind.config.js` bajo `theme.extend.colors`, namespace `welve`:

| Token | Hex aprox. | Uso |
|---|---|---|
| `welve-bg-canvas` | `#EDEBFB` | Fondo general detrás de las tarjetas (lavanda muy claro) |
| `welve-bg-card` | `#FFFFFF` | Fondo de tarjetas y paneles |
| `welve-sidebar` | `#16161D` | Fondo del sidebar de navegación (casi negro) |
| `welve-primary` | `#7C5CFC` | Acento primario — morado/violeta, estados activos, CTAs principales |
| `welve-primary-soft` | `#E4DDFF` | Variante suave del primario — fondo de badges/pills activos |
| `welve-success` | `#3FD17A` | Anillos de progreso, estados positivos, confirmaciones |
| `welve-text-primary` | `#15151A` | Texto principal sobre fondo claro |
| `welve-text-secondary` | `#8A8A99` | Texto secundario, metadatos, labels |
| `welve-text-inverse` | `#F5F5FA` | Texto sobre el sidebar oscuro |

**Colores de badge por categoría** (para tipos de cupón, rubro de empresa, o
estado de reto — rotar entre estos, nunca usar el `welve-primary` para
distinguir categorías entre sí):

| Token | Hex aprox. | Uso sugerido |
|---|---|---|
| `welve-badge-lilac` | `#C9BBFF` fondo / `#5B3FD9` ícono | categoría 1 |
| `welve-badge-pink` | `#FAC9DC` fondo / `#D9407A` ícono | categoría 2 |
| `welve-badge-amber` | `#FCE38A` fondo / `#B8860B` ícono | categoría 3 |

**Reservado para "exclusivo"** (sección 6.4 de PRODUCTO.md): no reutilizar
ninguno de los de arriba. Definir un quinto tono propio, más saturado o con
tratamiento distinto (ej. degradado sutil), para que el cliente reconozca
de inmediato que es un estado especial.

---

## 3. Tipografía

- Familia: una sans-serif geométrica y redondeada (ej. **Plus Jakarta Sans**
  o **General Sans** vía Google Fonts/Fontshare) — no uses la default de
  sistema, la personalidad tipográfica es parte de esta dirección visual.
- Pesos: `bold`/`extrabold` para títulos de sección y nombres de tarjeta
  (ej. "Welcome back"), `medium` para labels y metadatos, `regular` para
  texto de cuerpo.
- Tamaños sugeridos (escala Tailwind): títulos de página `text-2xl`/`text-3xl`
  bold, títulos de tarjeta `text-lg` bold, body `text-sm`/`text-base`,
  metadatos `text-xs` con `welve-text-secondary`.

---

## 4. Layout y componentes (panel admin)

- **Sidebar fijo** (`welve-sidebar`, ancho ~240px): logo arriba, items de
  navegación con ícono + label, el item activo tiene un fondo en
  `welve-primary` con esquinas muy redondeadas (`rounded-xl` o más) como
  "pill" — no solo un subrayado o cambio de color de texto.
- **Tarjetas**: `rounded-2xl` o `rounded-3xl`, sombra suave (`shadow-sm` a
  `shadow-md`, nunca dura), padding generoso. Cada tarjeta de "curso/cupón/
  reto" lleva: badge de categoría arriba a la derecha, ícono o avatar
  representativo, título bold, fila de metadatos abajo (participantes,
  progreso).
- **Anillos de progreso circulares**: usar para todo lo que sea "% de avance"
  — tasa de redención, progreso de un reto, completitud de racha. Es el
  elemento de data-viz por defecto de este sistema, no barras lineales.
- **Avatares en stack** (círculos superpuestos): para mostrar clientes
  asociados a un cupón/reto en el panel admin.
- **Calendario / widget lateral**: tarjeta con header de mes y navegación
  `‹ ›`, día activo resaltado con `welve-primary` como círculo sólido.
- **Lista de "próximas acciones"** (ej. retos por vencer, cupones por
  expirar): fila con ícono de categoría a la izquierda, texto al centro,
  botón de acción tipo pill a la derecha (`Submit →` en la referencia →
  en Welve sería algo como `Revisar →` / `Configurar →`).

---

## 5. Librería de íconos

**Usar [`lucide-react`](https://lucide.dev/)** como librería oficial de
íconos del proyecto (ya está disponible en el stack de artifacts/React, es
MIT, line-icons consistentes con el estilo redondeado de la referencia).

Reglas:
- Stroke width consistente: `1.5` o `2` en todos los íconos, no mezclar grosores.
- Tamaño base `20px`–`24px` para íconos de navegación/sidebar, `16px` para
  íconos inline en texto o metadatos.
- Los íconos dentro de los badges de categoría (fondo de color pastel,
  ej. `welve-badge-lilac`) van centrados en un contenedor `rounded-xl` o
  `rounded-full` de ~40px, con el ícono en el tono oscuro correspondiente
  del badge (ej. `#5B3FD9` sobre fondo `#C9BBFF`).
- Íconos de navegación del sidebar van en `welve-text-inverse` (o un gris
  claro) en estado inactivo, y en blanco puro sobre el pill `welve-primary`
  cuando el item está activo.

No mezclar `lucide-react` con otra librería de íconos (ej. Heroicons,
Font Awesome) en el mismo proyecto — la consistencia del trazo es parte del
sistema.

---

## 6. Qué NO replicar de la referencia

- Las ilustraciones de personajes (el panel derecho con personas) — eso es
  arte original de la referencia, no se reproduce. Si se quiere un elemento
  ilustrativo similar en el wallet del cliente (ej. para el momento de
  "desbloqueaste un exclusivo"), debe diseñarse como pieza original propia
  o sustituirse por una composición de íconos/formas geométricas en la
  paleta de Welve.
- El branding "CourseCo" y cualquier copy literal de la referencia.
- La densidad exacta de información si no aplica al dominio de Welve — usa
  el lenguaje visual (tarjetas, badges, anillos), no calques el layout
  campo por campo.