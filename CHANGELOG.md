# Changelog

Registro de cambios notables que llegan a `main`. Cada PR mergeado agrega su
propia entrada acá — es la forma de saber "qué cambió" sin tener que leer
commit por commit. Formato adaptado de
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/): agrupado por
fecha de merge y número de PR en vez de versión semver (no manejamos
releases versionados todavía).

Categorías por entrada: `Agregado`, `Cambiado`, `Corregido`, `Documentación`.

## [Sin publicar]

### Documentación
- PR #2 — Flujo de PR con `gh` CLI documentado paso a paso (branch → PR →
  agregar al roadmap → merge → actualizar fecha de fin), scope `project`
  para `gh` en Codespaces, y convención de no borrar ramas al mergear.

## [2026-07-01] — PR #1: Sistema de QR + rediseño de sidebar

### Agregado
- Sistema de códigos QR de Welve: QR único de visita (registra al cliente
  si no existe), QR por cupón con validación de canje por staff, y motor
  de recompensas automáticas por número de visitas / retos completados.
- Panel admin de QR (`/admin/qr`): QR de visita, lista de QR por cupón, y
  CRUD completo de recompensas automáticas vía modal.
- Sidebar compartido entre el panel de empresa y el wallet del cliente —
  mismo componente, mismo diseño.

### Corregido
- Mismatch de `tipo` de cupón en el wallet que hacía que las tarjetas
  cayeran siempre al estilo por defecto.
- Menú de avatar recortado por las esquinas redondeadas del sidebar
  (ahora se renderiza por portal) y sin centrar en modo colapsado.
- Nombre/email del cliente en blanco en el sidebar y saludo del wallet
  (el JWT de cliente no los lleva — ahora se usa el perfil real).

### Documentación
- `CLAUDE.md` actualizado al estado real de infraestructura (MongoDB
  Atlas, flujo de Codespaces sin contenedor Mongo local).
