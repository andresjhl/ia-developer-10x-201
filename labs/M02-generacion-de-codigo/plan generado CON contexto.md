He leído el esquema, el servicio de pedidos, la
  pasarela, la cola y la página «Mis entradas». Todavía
  no he tocado nada. Este es el plan.

  Plan DEV-412: devolución de entradas

  Reglas que aplica (de AGENTS.md):
  - Solo pedidos paid y entradas valid.
  - Hasta 48 h antes de starts_at.
  - Los gastos de gestión no se reembolsan.
  - Un pedido pagado no se modifica.
  - La butaca vuelve a la venta.

  1. Migración 002_refunds.sql

  No edito la 001.
  - Tabla refunds:
    - id
    - order_id
    - tenant_id
    - amount_cents
    - commission_cents
    - status (pending | completed | failed)
    - gateway_refund_id
    - created_at
  - Columna tickets.refund_id, nullable, que referencia
    a refunds.
  - No se toca la fila de orders. Las entradas devueltas
    pasan a status = 'refunded'.
    - El estado refunded ya lo etiqueta el storefront,
      aunque hoy el esquema no lo usa.
    - Al salir de pending/valid, el índice único de
      butacas y el conteo de capacidad de pases liberan
      la plaza sin más cambios.

  2. API (services/api)

  - src/refunds/pricing.ts: función pura
    calcRefundAmounts(tickets).
    - El importe es la suma de price_cents de las
      entradas.
    - La comisión es la suma de las commission_cents ya
      guardadas por entrada, sin recalcular.
    - Los gastos no se incluyen.
  - src/refunds/service.ts: refundTickets(tenantId,
    orderId, email, ticketIds[]).
    - Valida lo siguiente, con errores HttpError en
      español:
      - lista no vacía y sin duplicados
      - pedido y email correctos (mismo criterio que
        getBuyerOrder)
      - pedido paid
      - todas las entradas pertenecen al pedido
      - todas están valid
      - ninguna tiene checked_in_at
      - faltan más de 48 h para el evento
    - Es todo o nada, no hay devoluciones parciales
      dentro de una petición.
    - Flujo:
      i. Transacción: SELECT … FOR UPDATE de las
         entradas, inserta refunds(pending) y marca las
         entradas refunded con refund_id. Así dos
         peticiones simultáneas no pueden devolver lo
         mismo.
      ii. Llamada a la pasarela fuera de la transacción.
      iii. Si aprueba, la devolución pasa a completed.
      iv. Si falla, otra transacción revierte las
          entradas a valid y marca la devolución failed.
    - Con eso, un fallo de la pasarela no deja el estado
      a medias.
  - src/orders/payments-client.ts: añade
    refund(chargeId, amountCents), que llama a POST 
    /refunds.
  - src/routes/public.ts: POST 
    /api/public/orders/:id/refund con { email, 
    ticket_ids }. Devuelve el importe devuelto y las
    entradas afectadas.
  - getBuyerOrder: añade can_refund y refund_deadline al
    pedido para que la UI no recalcule la regla de 48
    h.

  3. Frontend

  - packages/ui/src/api.ts: método refundTickets y tipos
    nuevos.
  - apps/storefront/src/pages.tsx («Mis entradas»):
    - Casilla por entrada válida.
    - Botón «Devolver seleccionadas» con importe
      estimado y aviso de que los gastos no se
      reembolsan.
    - Confirmación antes de enviar.
    - Recarga del pedido y mensaje de resultado.
    - Entradas devueltas mostradas como «devuelta».
    - Si ya pasó el plazo, se muestra el motivo en lugar
      del botón.

  4. Tests

  - Vitest para calcRefundAmounts:
    - comisión sumada por entrada, con redondeo
    - gastos excluidos
    - entradas de precio 0
  - Vitest para las validaciones:
    - plazo de 48 h, en el límite
    - estado del pedido
    - entrada ya usada
    - entrada ajena
    - duplicados
  - Verificación manual, con el pedido semilla
    PED-2026-0107: devolver F-12 y comprobar que F-13 y
    el VIP siguen válidos. Después, que F-12 se puede
    comprar de nuevo y que el QR devuelto falla en
    /api/tickets/validate.
  - Antes de darlo por bueno: npm test, npm run lint y
    npm run typecheck.

  Cosas que no voy a hacer

  Tocar 001_init.sql, los datos semilla o
  package-lock.json, ni añadir dependencias.

  Decisiones para ti

  1. Correo de confirmación de devolución. Por defecto
     lo dejo fuera, porque DEV-412 no lo menciona.
     Añadirlo supone un tipo nuevo en la cola y una
     plantilla, reintentable por refund_id. ¿Lo incluyo?
  2. Entradas de precio 0 (invitaciones). La pasarela
     probablemente rechaza un reembolso de 0 €. Por
     defecto las devuelvo sin llamar a la pasarela
     cuando el importe total es 0. ¿Te vale?
  3. Fallo de pasarela. Planteo revertir las entradas a
     valid y devolver 502 con un mensaje claro. La
     alternativa es dejarlas en pending para reintentar,
     pero complica la UI.