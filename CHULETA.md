# Chuleta — Developer 10x · proyecto Telón

Guía rápida para tener a mano en cada lab. Lo detallado está en [README.md](README.md) y en `labs/MXX-*/`.

---

## 1. Preparar el entorno

### Primera vez (ruta local con Dev Container)

```bash
git clone https://github.com/andresjhl/ia-developer-10x-201.git
cd ia-developer-10x-201
code .            # o: cursor .
# Ctrl+Shift+P → «Dev Containers: Reopen in Container»
```

El Dev Container trae Node 22, PostgreSQL, Redis, Mailpit, `gh` y Claude Code, y ejecuta `make setup` (`npm install`) al crearse. Se abre en `telon/`.

> **Codespaces:** en tu fork → **Code** → **Codespaces** → **Create codespace on main**. Las URLs se abren desde la pestaña **Ports**.

### Configuración de Git (una vez)

```bash
git config --global user.name "Tu nombre"
git config --global user.email "tu@correo"
gh auth login     # necesario para PRs (M05) y para el modo github del M06
```

### Al empezar cada lab

Todos los `make` funcionan desde la raíz o desde `telon/`.

```bash
make status            # ¿en qué lab está telon/?
make init-m0X          # ⚠️ OPCIONAL: deja telon/ en el punto de partida del lab (DESCARTA cambios no subidos)
make up-m0X            # arranca la plataforma (6 procesos). Deja esta terminal abierta
```

En otra terminal:

```bash
curl -s localhost:3000/api/health   # → {"ok":true}
npm test                            # punto de partida en verde antes de tocar nada
```

> Antes de un `make init-mXX`, haz commit/push de lo que quieras conservar. Pide confirmación (`CONFIRM=1` para saltarla).

### Fuera del Dev Container (Node 22 + Docker en tu máquina)

```bash
make setup                                   # npm install en telon/
docker compose -f infra/compose.yaml up -d   # Postgres, Redis, Mailpit (make up-mXX lo hace solo)
make up-docker                               # alternativa: toda la plataforma en contenedores, sin Node local
```

---

## 2. URLs

### Plataforma (local)

| Qué | URL | Notas |
|-----|-----|-------|
| Tienda Sala Faro | http://entradas.salafaro.localhost:5173 | Por dominio del promotor |
| Tienda Sala Faro (por ruta) | http://localhost:5173/t/sala-faro | Si `*.localhost` no resuelve (Safari) y en Codespaces |
| Tienda Teatro Lumen | http://localhost:5173/t/teatro-lumen | Mismo código, otro tenant |
| Mis entradas del pedido de ejemplo | http://entradas.salafaro.localhost:5173/mis-entradas?pedido=PED-2026-0107&email=ana.compradora@ejemplo.test | |
| Backoffice | http://localhost:5174 | Token `faro-dev-token` (Faro) o `lumen-dev-token` (Lumen) |
| Mailpit (correos) | http://localhost:8025 | Aquí llega todo lo que se envía por SMTP |
| API | http://localhost:3000 | `/api/health`. El README heredado dice 8080: **es falso** |
| Pasarela de pagos (emulada) | http://localhost:3001 | |
| Editor (microfrontend Monaco) | http://localhost:5175 | Se usa embebido en el backoffice |

**Codespaces:** pestaña **Ports** → globo del puerto. Para la tienda añade `/t/sala-faro` a la URL.

### Del curso

| Qué | URL |
|-----|-----|
| Tu fork | https://github.com/andresjhl/ia-developer-10x-201 |
| Tus PRs | https://github.com/andresjhl/ia-developer-10x-201/pulls |
| GitHub Actions (CI, M05) | https://github.com/andresjhl/ia-developer-10x-201/actions |
| Tus Codespaces | https://github.com/codespaces |

### Documentación de referencia

| Qué | URL |
|-----|-----|
| AGENTS.md (formato estándar) | https://agents.md |
| Claude Code | https://docs.claude.com/en/docs/claude-code/overview |
| GitHub Copilot (instrucciones de repo) | https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot |
| Cursor Rules | https://docs.cursor.com/context/rules |
| Model Context Protocol (MCP) | https://modelcontextprotocol.io |
| Vitest | https://vitest.dev |
| Fastify | https://fastify.dev |
| BullMQ (colas) | https://docs.bullmq.io |
| Mailpit | https://mailpit.axllent.org |
| GitHub Actions | https://docs.github.com/en/actions |
| Redocly CLI (lint OpenAPI, M04) | https://redocly.com/docs/cli |

---

## 3. Comandos del día a día

### Make (raíz del repo)

| Comando | Qué hace |
|---------|----------|
| `make help` | Lista de comandos y URLs |
| `make up-m01` … `up-m05` | Arranca la plataforma tal como está `telon/` (avisa si no está en ese lab) |
| `make init-m01` … `init-m05` | ⚠️ Resetea `telon/` al inicio del lab + `npm install` + `db:reset` |
| `make status` | En qué lab está `telon/` |
| `make db-reset` | Base de datos limpia con los datos de ejemplo |
| `make test` | Tests de Telón |
| `make up-docker` | Toda la plataforma en contenedores |
| `make init-m06` | ⚠️ Crea desde cero `workspace/m06/` (remotos + clones `dev1`/`dev2`) |
| `make up-m06` | Estado de cada clon del M06 (no cambia nada) |
| `make contexto-m06` | Sube el contexto de referencia como `dev1` (para hacer solo el lab de `dev2`) |

### npm (dentro de `telon/`)

```bash
npm run dev                      # lo que lanza make up-mXX
npm test                         # todos los tests (vitest)
npm test -w @telon/api           # solo un workspace (@telon/api, @telon/notifier, @telon/payments, @telon/ui…)
npm run lint
npm run typecheck
npm test && npm run typecheck && npm run lint   # «¿está todo bien?» antes de commit/PR
npm run db:reset                 # BD limpia + seed
npm run qr -- <args>             # utilidad de QR de la API
```

> `npm run seed` aparece en el README pero **no existe** (`Missing script: "seed"`). Es uno de los fallos a propósito del README heredado (M04). Usa `npm run db:reset`.

### Git para los labs

```bash
git status --short && git diff --stat     # qué ha tocado el asistente
git diff <fichero>                        # revisar antes de aceptar
git checkout <fichero>                    # descartar lo que ha hecho en ese fichero
git switch -c feat/dev-412-devoluciones   # rama de la devolución (M05)
git push -u origin feat/dev-412-devoluciones
git diff main...HEAD --stat -- telon/     # lo que lleva tu rama
gh pr create                              # abrir el PR desde la terminal
```

### Comprobaciones rápidas

```bash
curl -s localhost:3000/api/health                        # API viva
npm view <paquete> version                               # ¿existe de verdad la dependencia que propone la IA?
npx -y @redocly/cli@2 lint openapi.yaml                  # validar el OpenAPI (M04)
psql postgres://telon:telon@localhost:5432/telon         # BD (en Dev Container: host «postgres»)
```

---

## 4. Datos de prueba

### Tarjetas (pasarela emulada)

| Tarjeta | Resultado |
|---------|-----------|
| `4242 4242 4242 4242` | Aprueba |
| `4000 0000 0000 0002` | Rechaza: fondos insuficientes |
| `4000 0000 0000 9995` | Aprueba tras 3 s (pasarela lenta) |
| Cualquier otra | Rechaza: tarjeta no válida |

### Tenants

| Promotor | Slug | Token backoffice | Correo |
|----------|------|------------------|--------|
| Sala Faro | `sala-faro` | `faro-dev-token` | SMTP → Mailpit |
| Teatro Lumen | `teatro-lumen` | `lumen-dev-token` | SendGrid (emulado: no envía) |

### El pedido de ejemplo (aparece en todo el curso)

- **`PED-2026-0107`** · Sala Faro · evento `EV-FARO-0042` «Jazz en el Faro» · comprador `ana.compradora@ejemplo.test` · pagado
- Butacas **F-12** y **F-13** (35,50 € + 2,66 € comisión cada una) y un pase **VIP** (60,00 € + 4,50 €)
- Gastos de gestión: 0,90 € por entrada · Cargo en la pasarela: `ch_seed_0107` por 133,70 €

### Variables de entorno (`telon/.env.example`)

`DATABASE_URL=postgres://telon:telon@localhost:5432/telon` · `REDIS_URL=redis://localhost:6379` · `SMTP_HOST=localhost` · `SMTP_PORT=1025` · `PAYMENTS_URL=http://localhost:3001` · `TICKETS_SECRET=telon-dev-solo-para-el-curso`

---

## 5. Mapa del proyecto

| Pieza | Ruta | Puerto |
|-------|------|--------|
| Tienda (comprador) | `telon/apps/storefront` | 5173 |
| Backoffice (promotor) | `telon/apps/backoffice` | 5174 |
| Editor Monaco (microfrontend) | `telon/apps/editor-mfe` | 5175 |
| API REST (Fastify) | `telon/services/api` | 3000 |
| Pasarela de pagos emulada | `telon/services/payments` | 3001 |
| Notifier (cola `emails` → correo) | `telon/services/notifier` | — |
| Componentes (`SeatPicker`, `Cart`, `Checkout`…) | `telon/packages/ui` | — |
| Render/compilación de páginas TSX | `telon/packages/page-runtime` | — |

Ficheros que conviene conocer:

- Importes (precio, comisión, gastos): `services/api/src/orders/pricing.ts`
- Pedidos: `services/api/src/orders/service.ts` · cliente de pagos: `orders/payments-client.ts`
- QR: `services/api/src/tickets/qr.ts`
- Esquema BD: `services/api/migrations/001_init.sql` · seed: `services/api/src/seed.ts`
- Configuración y puertos: `services/api/src/config.ts`
- Proveedores de correo: `services/notifier/src/providers/` · trabajos de cola: `services/notifier/src/jobs.ts`

### Reglas de negocio de la devolución (la petición DEV-412)

1. Un pedido pagado **no se modifica**: la devolución es un movimiento nuevo que referencia el pedido.
2. Los **gastos de gestión no se reembolsan**.
3. La comisión se **redondea por entrada**, no sobre el total.
4. Solo hasta **48 h antes** del evento.
5. El **QR devuelto deja de validar** y la butaca **vuelve a estar libre**.
6. El correo de confirmación sale **una sola vez**, aunque la cola reintente el trabajo.

---

## 6. Ficheros de contexto para la IA

| Fichero | Para qué |
|---------|----------|
| `telon/AGENTS.md` | Stack, convenciones, reglas de negocio, cómo arrancar y probar. Lo leen todas las herramientas |
| `telon/CLAUDE.md` | Claude Code (apunta a `AGENTS.md`) |
| `telon/.github/copilot-instructions.md` | GitHub Copilot |
| `telon/.cursor/rules/*.mdc` | Cursor |

Van al repo: reglas, `AGENTS.md`, prompts reutilizables, Dev Container, scripts, CI.
Se quedan en tu máquina: conversaciones, memoria del chat, preferencias, `.env`, tokens.

### Abrir el asistente en modo agente

| Asistente | Cómo |
|-----------|------|
| Copilot (VS Code / Codespaces) | `Ctrl+Alt+I` → **+** → modo **Agent** |
| Cursor | `Ctrl+L` → **+** → **Agent** |
| Claude Code | Terminal nueva → `claude` |

Claude Code útil: `/clear` (chat limpio), `/init` (genera un `CLAUDE.md`), `/model`, `/code-review`, `/security-review`, `/memory`, `Esc` (interrumpir), `Shift+Tab` (cambiar modo de permisos / plan).

---

## 7. Plantilla de prompt que funciona

```text
Intención:   <qué quiero conseguir>
Contexto:    lee AGENTS.md y <ficheros concretos>
Restricción: <lo que NO se puede hacer / reglas de negocio>
Ejemplo:     <caso concreto, p. ej. devolver la butaca F-13 de PED-2026-0107>
Hecho si:    <tests que pasan, lo que se ve en Mailpit / tienda>
Cómo:        primero el plan, sin tocar código. Para cada afirmación, dime fichero y línea.
```

Variantes útiles:

- **Entender:** «Explícame X. Para cada afirmación, dime en qué fichero y línea lo has visto. No cambies nada.»
- **Depurar:** «Esta es la traza completa y el test que falla. Dame la **causa** antes que el arreglo; el arreglo, el diff más pequeño que deje el test en verde.»
- **Tests:** «Genera tests a partir de las reglas de `AGENTS.md`, no del código actual.»
- **Documentar:** «Cada comando que pongas en el README, ejecútalo y dime la salida.»
- **Refactorizar:** «Primero tests de caracterización en verde; luego refactoriza sin cambiar un céntimo.»

---

## 8. Hábitos del curso (checklist antes de aceptar)

- [ ] ¿Le he dado contexto (AGENTS.md + ficheros) en vez de esperar que lo adivine?
- [ ] ¿He pedido un criterio de hecho comprobable?
- [ ] ¿He leído el diff entero? (`git diff`)
- [ ] ¿Imports que no existen, nombres fuera de convención, lógica duplicada?
- [ ] ¿Ha cambiado algún test para que pase? (sospechoso)
- [ ] ¿Pasan `npm test && npm run typecheck && npm run lint`?
- [ ] ¿Lo he comprobado ejecutando (tienda, Mailpit, `curl`)?
- [ ] ¿Las dependencias nuevas existen en npm (`npm view`)?
- [ ] ¿Nada de secretos, API keys de promotores ni datos reales en el prompt o en el diff?

**Recuerda:** el README miente (puerto 8080, `npm run seed`, SendGrid). Lo que diga el asistente se comprueba en el código o ejecutando.

---

## 9. Problemas frecuentes

| Síntoma | Arreglo |
|---------|---------|
| `entradas.salafaro.localhost` no carga | Usa http://localhost:5173/t/sala-faro |
| `Port 5173 is already in use` | `Ctrl+C` en el `make up-mXX` anterior |
| `ECONNREFUSED 5432` / `6379` | Fuera del Dev Container: `docker compose -f infra/compose.yaml up -d` |
| El pago se queda en «Pagando…» | Tarjeta `…9995`: espera 3 s, es a propósito |
| No llega el correo | Mira las líneas `[correo]` del `make up`; los proveedores distintos de SMTP están emulados |
| Datos raros tras varias pruebas | `make db-reset` |
| `telon/` en un estado incoherente | `make init-m0X` (⚠️ descarta cambios) |
| `dev2` no ve los cambios de `dev1` (M06) | Falta `git push` en el clon de `dev1` |
| M06: memorias del asistente cuelan contexto | Desactiva/borra memorias (Cursor, Copilot, `~/.claude`) antes de `dev2` |

---

## 10. Índice de módulos

| Módulo | Fase | Lab clave | Arranque |
|--------|------|-----------|----------|
| [M01](labs/M01-ia-aplicada-al-desarrollo/README.md) | Entender | Entorno, primera compra, mapa de la plataforma | `make up-m01` |
| [M02](labs/M02-generacion-de-codigo/README.md) | Construir | `AGENTS.md`, generar la devolución, refactorizar importes | `make up-m02` |
| [M03](labs/M03-testing-y-calidad/README.md) | Probar | Tests desde reglas, mocks, redondeo, correo duplicado | `make up-m03` |
| [M04](labs/M04-documentacion-y-automatizacion/README.md) | Documentar | README, OpenAPI, `npm run escenario`, `SeatPicker` | `make up-m04` |
| [M05](labs/M05-workflows-con-ia/README.md) | Entregar | PR revisado, CI en Actions, seguridad | `make up-m05` |
| [M06](labs/M06-caso-integral/README.md) | Escalar | Legado, `dev1`/`dev2`, contexto versionado | `make init-m06` → `make up-m06` |

M06: `cp .env.example .env` en la **raíz** (modo `local` por defecto; `github` necesita `gh auth login` + `M06_GH_OWNER`). Claude Code por desarrollador: `cd ../workspace/m06/dev1 && claude` y `cd ../workspace/m06/dev2 && claude`.
