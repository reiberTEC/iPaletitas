# Pagos con Stripe (Checkout + suscripción)

Primer cobro al contratar y **renovaciones automáticas** vía Stripe Subscription. Mercado Pago / PayPal quedan fuera.

## Sin claves (modo demo)

Si `STRIPE_SECRET_KEY` no está en el backend, Activación usa el formulario local con el aviso **Modo demo: no se cobra de verdad**.

## Configurar modo prueba

1. Cuenta en [Stripe](https://dashboard.stripe.com/register) → **Test mode**.
2. Developers → API keys → **Secret key** (`sk_test_…`).
3. Settings → Billing → **Customer portal**: actívalo (cambiar método de pago / cancelar).
4. En `backend/.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_tu_clave
FRONTEND_URL=http://localhost:5173
# Con URL pública (o Stripe CLI en local):
# STRIPE_WEBHOOK_SECRET=whsec_…
```

5. Aplica la migración `database/003_auth_pagos.sql` en Postgres (local o Neon).
6. Reinicia el backend. Debe verse `Pagos: Stripe activo`.

## Flujo local (contratación)

1. Registro → plan → Activación → **Pagar con tarjeta**.
2. Checkout en modo **subscription** (MXN). Tarjeta test: `4242 4242 4242 4242`.
3. Vuelves a `/?pago=ok&session_id=…` → `POST /api/pagos/confirmar` activa la licencia, guarda `stripe_customer_id` / `stripe_subscription_id` e inserta el cobro.

Cupones (`PALETA10`, `BIENVENIDA15`) son descuento **una sola vez** en la primera factura; las renovaciones van a precio de lista.

## Renovaciones

- Stripe cobra solo al final de cada periodo (mes/año).
- Webhook `POST /api/pagos/webhook` (eventos `invoice.paid`, `invoice.payment_failed`, `customer.subscription.*`) actualiza `vence` / `cobros` / suspensión.
- Sin URL pública: en **Mi licencia** usa **Sincronizar con Stripe**, o al volver del Customer Portal (`?portal=ok`).
- **Administrar pago** abre el Customer Portal (cambiar tarjeta / cancelar).

### Webhook en local (opcional)

```bash
stripe listen --forward-to localhost:8788/api/pagos/webhook
```

Copia el `whsec_…` a `STRIPE_WEBHOOK_SECRET`.

## API

| Ruta | Auth | Descripción |
|------|------|-------------|
| `GET /api/pagos/estado` | no | `{ stripe: boolean }` |
| `POST /api/pagos/checkout` | JWT | Checkout Session `mode: subscription` |
| `POST /api/pagos/confirmar` | JWT | Activa + guarda ids Stripe (idempotente) |
| `POST /api/pagos/portal` | JWT | URL del Customer Portal |
| `POST /api/pagos/sincronizar` | JWT | Alinea licencia con la Subscription |
| `POST /api/pagos/webhook` | firma Stripe | Renovaciones / fallos / cancelación |

## Producción

- Claves **live** solo cuando cobres de verdad.
- `FRONTEND_URL` = dominio HTTPS público.
- Webhook en Dashboard → `https://tu-dominio/api/pagos/webhook` + `STRIPE_WEBHOOK_SECRET`.
