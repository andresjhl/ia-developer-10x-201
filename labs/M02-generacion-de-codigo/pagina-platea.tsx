import type React from 'react';
import { Cart, Checkout, SeatPicker, formatDate, useEvent } from '@telon/ui';

// Página del evento con platea, carrito y pago. Acento verde.
export default function EventoPlatea() {
  const event = useEvent();

  return (
    <main
      style={{
        '--telon-accent': '#2e9e5b',
        background: '#10150f',
        color: '#eef3ec',
        minHeight: '100vh',
        fontFamily: 'Georgia, serif',
      } as React.CSSProperties}
    >
      <header style={{ padding: '56px 24px 32px', textAlign: 'center', borderBottom: '1px solid #26402c' }}>
        <h1 style={{ fontSize: 48, margin: '0 0 12px' }}>{event.title}</h1>
        <p style={{ margin: 0 }}>{formatDate(event.starts_at)} · {event.venue}</p>
      </header>

      <section
        style={{
          maxWidth: 1040,
          margin: '0 auto',
          padding: 24,
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
        }}
      >
        <div>
          <h2>Elige tu butaca en la platea</h2>
          <SeatPicker zone="platea" />
        </div>
        <aside>
          <Cart />
          <Checkout />
        </aside>
      </section>
    </main>
  );
}
