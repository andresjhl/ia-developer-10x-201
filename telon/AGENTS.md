# AGENTS.md — Telón

Monorepo npm workspaces (`apps/*`, `packages/*`, `services/*`), TypeScript ESM, Node >= 22.
Venta de entradas multi-promotor (tenant). Todo el texto de cara al usuario, errores y comentarios está en español.

## Arranque y pruebas (desde la raíz de `telon/`)
- `npm run dev` — levanta api, payments, notifier, storefront, backoffice y editor-mfe (concurrently).
- Un solo servicio: `npm run dev -w @telon/api` (también `@telon/payments`, `@telon/notifier`, `@telon/storefront`…).
- `npm test` — vitest (projects `packages/*` y `services/*`); uno solo: `npm test -w @telon/api`.
- `npm run lint` — eslint; `npm run typecheck` — `tsc -p` en cada workspace.
- `npm run db:reset` — borra el esquema, migra y carga los datos de ejemplo.
- `npm run qr -- <args>` — script `services/api/src/scripts/qr.ts`.
- Requiere Postgres y Redis (BullMQ) + SMTP en :1025; variables en `.env.example`.
- Puertos: api 3000 (`API_PORT`), payments 3001 (`PAYMENTS_PORT`), storefront 5173, backoffice 5174, editor-mfe 5175.
- Las apps no tienen tests; solo `packages/*` y `services/*`.

## Mapa
- `services/api/` (`@telon/api`, Fastify + pg): `src/routes/{public,admin,tickets}.ts`, `src/orders/{service,pricing,payments-client}.ts`,
  `src/tenants/resolve.ts` (tenant por dominio, slug o token admin), `src/tickets/qr.ts`, `src/queue.ts` (cola `emails`),
  `src/seed.ts` + `seed/*.tsx`, `migrations/*.sql`, `src/scripts/`.
- `services/payments/` (`@telon/payments`): pasarela de pago emulada; el comportamiento depende de la tarjeta de prueba.
- `services/notifier/` (`@telon/notifier`): worker BullMQ que envía correos; `src/providers/` (smtp real; sendgrid/mailgun/ses/postmark emulados), `templates.ts`, `jobs.ts`.
- `packages/ui/` (`@telon/ui`): componentes React de venta (Cart, Checkout, SeatPicker, PassSelector, TicketQR), `api.ts`, `format.ts`.
  `src/editor-types.ts` duplica su API pública para Monaco: actualízalo si cambias la API.
- `packages/page-runtime/` (`@telon/page-runtime`): compila con sucrase y renderiza la página TSX de cada evento;
  solo permite importar `react`, `react/jsx-runtime` y `@telon/ui` (lista `ALLOWED` en `compile.ts`).
- `apps/storefront/`: tienda pública (Vite, :5173); rutas en `routing.ts` (`/t/<slug>` o dominio propio).
- `apps/backoffice/`: panel del promotor (Vite, :5174); `editor-host.ts` es su lado del contrato con el editor.
- `apps/editor-mfe/`: microfrontend con Monaco (Vite, :5175); contrato de mensajes `telon:*` en `src/protocol.ts`.

## Convenciones
- **Dinero**: enteros en céntimos, columnas y campos `*_cents` (`price_cents`, `fee_cents`, `total_cents`); comisión en puntos básicos (`commission_bps`, /10000, redondeo por entrada).
  Se formatea solo en la UI con `formatEuros` / `formatDate` (`es-ES`, `Europe/Madrid`). Los cálculos viven en `orders/pricing.ts`.
- **Errores**: en la API se lanza `HttpError(status, mensaje)` (`errors.ts`); el handler de `server.ts` responde `{ error }`
  y oculta lo demás como 500. Los errores de dominio puros (`pricing.ts`) son `Error` y el servicio los convierte en `HttpError(400)`.
  El cliente (`packages/ui/src/api.ts`) lanza `ApiError(status, mensaje)`.
- **SQL**: SQL a mano con `pg`, sin ORM; parámetros `$1…`, nunca interpolados. Plantillas multilínea con backticks.
  Transacciones con `withTransaction(fn)`; `FOR UPDATE` al reservar butacas/pases. Toda consulta de datos del promotor filtra por `tenant_id`.
  Migraciones numeradas `NNN_nombre.sql` en `services/api/migrations/` (se aplican en orden y se registran en `schema_migrations`).
  IDs de texto legibles (`EV-FARO-0042`, `PED-2026-0107`); columnas en snake_case.
- **Imports**: ESM; en los servicios los relativos llevan extensión `.js` (`'./config.js'`); entre workspaces por nombre `@telon/*`.
  `verbatimModuleSyntax`: los tipos se importan con `import type` / `type` inline. Config por variables de entorno con valor por defecto en `config.ts` de cada servicio.
- **Estilo**: `strict`; variables sin usar prohibidas salvo prefijo `_`. Tests en `test/*.test.ts(x)` junto a cada paquete (`ui` usa jsdom).

## Reglas de negocio

- Un pedido pagado no se modifica. Cambios posteriores (devoluciones) son registros nuevos que lo referencian.
- Gastos de gestión: por entrada, no se reembolsan nunca.
- Comisión de plataforma: `commission_bps` sobre el precio, redondeada por entrada. La de un pedido o una devolución es la suma de las de sus entradas.
- Devoluciones: solo de pedidos pagados, solo entradas válidas, hasta 48 h antes del evento. La entrada devuelta deja de validar en puerta y su butaca vuelve a la venta.
- Lo que sale por la cola tiene que poder reintentarse sin efectos duplicados.
- Máximo 10 entradas por pedido.

## Páginas de eventos (TSX de los promotores)

- Solo se puede importar `react`, `react/jsx-runtime` y `@telon/ui`; cualquier otro módulo lanza `PageCompileError` (`packages/page-runtime/src/compile.ts`, `ALLOWED` y `require`).
- Hay que hacer `export default` de un componente (función); si no, `PageCompileError` (`compile.ts`). Sucrase solo transpila TS/JSX, no comprueba tipos.
- `PageRenderer` debe ir dentro de `<TelonProvider>` (lo ponen las apps, p. ej. `apps/storefront/src/pages.tsx`); sin él los componentes lanzan error (`page-runtime/src/PageRenderer.tsx`, `ui/src/context.tsx`).
- Componentes: `Cart`, `Checkout`, `PassSelector`, `SeatPicker` (prop opcional `zone`) y `TicketQR` (`token`, `label`, `filename?`); funciones `formatEuros`, `formatDate`; hooks `useEvent`, `useCart`, `useTelon`; `ApiError`, `createApi`, `MAX_TICKETS` (`ui/src/index.ts`).
- Color: los componentes leen la variable CSS `--telon-accent` (por defecto `#f2b544`) y heredan color y tipografía de la página (`ui/src/styles.ts`). Se define en un elemento que envuelva los componentes: `style={{ '--telon-accent': '#e63946' } as React.CSSProperties}`.
- Ejemplos completos: `services/api/seed/*.tsx` (no los edites, ver «No hacer»). Si cambias la API de `@telon/ui`, actualiza también `ui/src/editor-types.ts`.

## No hacer

- No pegar credenciales reales ni API keys de proveedores de los promotores.
- No añadir dependencias sin comprobar que existen en npm y que hacen falta.
- No editar migraciones ya aplicadas ni los datos de ejemplo para que un test pase.
