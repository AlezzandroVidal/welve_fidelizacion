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

Aplica igual para `feature/`, `fix/`, `docs/` o `chore/` — cualquier rama que
se abra sigue estos mismos pasos, con `gh` CLI (ver instalación más abajo).

1. Crea tu rama desde `main`, con el prefijo que corresponda:
   ```bash
   git checkout main && git pull
   git checkout -b feature/mi-feature   # o fix/, docs/, chore/
   ```

2. Desarrolla en commits pequeños y semánticos (Conventional Commits, ver arriba).

3. Antes de abrir el PR, asegúrate de que los tests pasen:
   ```bash
   # Backend
   cd backend && pytest

   # Frontend
   cd frontend && npm test
   ```

4. Pushea la rama y abre el PR (usa la plantilla de `.github/PULL_REQUEST_TEMPLATE.md` en el body):
   ```bash
   git push -u origin feature/mi-feature
   gh pr create --base main --title "feat(scope): descripción corta" --body "..."
   ```

5. Agrega el PR al roadmap con fecha de inicio de hoy (ver comandos en
   "Seguimiento del roadmap" más abajo) — así queda visible en
   [**Welve Roadmap**](https://github.com/users/AlezzandroVidal/projects/1)
   desde que se abre, no solo cuando se mergea.

6. Al menos 1 aprobación antes de hacer merge.

7. Mergear con **Squash and Merge**:
   ```bash
   gh pr merge <número> --squash --subject "..." --body "..."
   ```

8. Actualiza la fecha de fin (`Target date`) del item en el roadmap a la fecha de merge.

9. **No borrar la rama** — queda visible junto al PR para poder auditar qué
   se hizo. El historial en `main` no depende de esto: una vez mergeado el
   PR, el commit ya vive en `main` sin importar si la rama sigue existiendo.

---

## Seguimiento del roadmap

El avance del proyecto se trackea en la vista **Roadmap** del proyecto
[**Welve Roadmap**](https://github.com/users/AlezzandroVidal/projects/1) — no
con un Gantt hecho a mano. Cada PR se agrega como item con fecha de
inicio/fin, así el roadmap queda actualizado solo.

### GitHub CLI (`gh`)

Todo el flujo de arriba (crear PR, agregarlo al roadmap, mergear) usa `gh`.
Si no está instalado:

```bash
type -p curl >/dev/null || (sudo apt update && sudo apt install curl -y)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh -y
```

En Codespaces, `gh` ya viene autenticado vía `GITHUB_TOKEN`, pero ese token
**no** tiene el scope `project` (API de GitHub Projects). Para los comandos
`gh project *` hace falta un token con ese scope:

```bash
gh auth refresh -s project,read:project   # flujo interactivo, correrlo en una terminal propia
```

...y anteponer `env -u GITHUB_TOKEN` a los comandos `gh project *` para que
use ese token en vez del de Codespaces (que `gh` prioriza por default y no
tiene el scope necesario).

### Agregar un PR al roadmap

La API de GitHub Projects no expone un comando para crear o editar *vistas*
(Board/Table/Roadmap) — ese paso es manual, un clic, una sola vez (ya está
hecho para este repo). Agregar items y fechas sí es 100% scriptable:

```bash
# IDs fijos del proyecto "Welve Roadmap" (owner: AlezzandroVidal, project #1)
PROJECT_ID="PVT_kwHOEGdJUc4BcJfC"
START_FIELD="PVTF_lAHOEGdJUc4BcJfCzhW0Yk8"
TARGET_FIELD="PVTF_lAHOEGdJUc4BcJfCzhW0YlU"

# 1. Agregar el PR (devuelve el item ID — guardalo para los pasos 2 y 3)
ITEM_ID=$(env -u GITHUB_TOKEN gh project item-add 1 --owner AlezzandroVidal \
  --url https://github.com/AlezzandroVidal/welve_fidelizacion/pull/<número> \
  --format json -q .id)

# 2. Fecha de inicio = hoy (al abrir el PR)
env -u GITHUB_TOKEN gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" \
  --field-id "$START_FIELD" --date "$(date +%F)"

# 3. Fecha de fin = hoy (al mergear el PR)
env -u GITHUB_TOKEN gh project item-edit --id "$ITEM_ID" --project-id "$PROJECT_ID" \
  --field-id "$TARGET_FIELD" --date "$(date +%F)"
```

Si se agregan campos nuevos al proyecto, correr
`gh project field-list 1 --owner AlezzandroVidal` para ver los IDs
actuales — no asumir que los de arriba son los únicos que existen.

---

## Protección de rama `main` (configurar en GitHub)

Ir a **Settings → Branches → Add rule** y activar:

- ✅ Require a pull request before merging
- ✅ Require approvals: **1**
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require status checks to pass before merging (cuando se configure CI)
- ✅ Do not allow bypassing the above settings
