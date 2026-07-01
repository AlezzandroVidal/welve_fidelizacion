# Guía de contribución — Welve

## Branching Strategy: GitHub Flow

Elegimos **GitHub Flow** sobre Git Flow por las siguientes razones:

| Criterio | GitHub Flow | Git Flow |
|---|---|---|
| Tamaño del equipo | Ideal para 2-3 personas | Pensado para equipos grandes |
| Complejidad | Simple: solo `main` + feature branches | Múltiples ramas permanentes (`develop`, `release`, `hotfix`) |
| Releases | Continuo (cada merge a main es desplegable) | Versionado estricto |
| Overhead | Bajo | Alto para un proyecto académico |

En un proyecto académico de un semestre con 2 personas, Git Flow añade burocracia
sin beneficio real. GitHub Flow mantiene `main` siempre desplegable y el flujo
se reduce a: **branch → PR → review → merge**.

---

## Ramas

| Tipo | Patrón | Ejemplo |
|---|---|---|
| Funcionalidad | `feature/<descripción>` | `feature/login-empresa` |
| Corrección | `fix/<descripción>` | `fix/calculo-puntos` |
| Documentación | `docs/<descripción>` | `docs/README-docker` |
| Configuración | `chore/<descripción>` | `chore/actualizar-deps` |

### Reglas
- Ramas cortas: viven días o una semana como máximo.
- Nunca commitear directo a `main`.
- Nombrar en minúsculas, separado con guiones, sin espacios.

---

## Convención de commits (Conventional Commits)

```
<tipo>(<scope opcional>): <descripción corta en imperativo>

[cuerpo opcional]

[footer opcional: BREAKING CHANGE o referencia a issue]
```

### Tipos permitidos

| Tipo | Cuándo usarlo |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `style` | Formato, espacios (sin cambio de lógica) |
| `refactor` | Refactorización sin cambiar comportamiento externo |
| `test` | Agregar o corregir tests |
| `chore` | Build, dependencias, configuración |

### Ejemplos

```
feat(clientes): agregar endpoint de creación de cliente
fix(cupones): corregir validación de fecha de expiración
docs: agregar diagrama de arquitectura al README
chore: actualizar versión de FastAPI a 0.115
```

---

## Flujo de Pull Request

1. Crea tu rama desde `main`:
   ```bash
   git checkout main && git pull
   git checkout -b feature/mi-feature
   ```

2. Desarrolla en commits pequeños y semánticos.

3. Antes de abrir el PR, asegúrate de que los tests pasen:
   ```bash
   # Backend
   cd backend && pytest

   # Frontend
   cd frontend && npm test
   ```

4. Abre el PR contra `main` usando la plantilla en `.github/PULL_REQUEST_TEMPLATE.md`.

5. Al menos 1 aprobación antes de hacer merge.

6. Usar **Squash and Merge** para mantener el historial limpio en `main`.

---

## Seguimiento del roadmap

El avance del proyecto se trackea en el tab **Projects** del repo (vista
**Roadmap**) — no con un Gantt hecho a mano. Cada PR se agrega como item del
proyecto con fecha de inicio/fin, así el roadmap queda actualizado solo, sin
mantenimiento manual.

- Al abrir un PR, agregarlo al proyecto **"Welve Roadmap"**.
- Las ramas **no se borran automáticamente al mergear**. Quedan visibles junto
  al PR (en el selector de ramas y en `Insights → Network`) para poder
  auditar qué se hizo — se limpian manualmente más adelante si hace falta.
  El historial en `main` no depende de esto: una vez mergeado el PR, el
  commit ya vive en `main` sin importar si la rama sigue existiendo o no.

---

## Protección de rama `main` (configurar en GitHub)

Ir a **Settings → Branches → Add rule** y activar:

- ✅ Require a pull request before merging
- ✅ Require approvals: **1**
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging (cuando se configure CI)
- ✅ Do not allow bypassing the above settings
