import { query } from '../db.ts'
import { stripe, stripeActivo } from './stripe.ts'

/** Alinea vence / suspendida / cancelada con el estado de la Subscription en Stripe. */
export async function sincronizarSuscripcionStripe(cuentaId: string) {
  if (!stripeActivo()) return false

  const cuenta = await query<{
    stripe_subscription_id: string | null
    stripe_customer_id: string | null
  }>(
    `SELECT stripe_subscription_id, stripe_customer_id FROM cuentas WHERE id = $1 LIMIT 1`,
    [cuentaId],
  )
  const subId = cuenta.rows[0]?.stripe_subscription_id
  if (!subId) return false

  const sub = await stripe().subscriptions.retrieve(subId, {
    expand: ['default_payment_method'],
  })

  // API reciente: el periodo vive en cada subscription item.
  const fines = (sub.items?.data ?? [])
    .map((item) => item.current_period_end)
    .filter((n): n is number => typeof n === 'number' && n > 0)
  const periodEnd = fines.length ? Math.max(...fines) : sub.cancel_at ?? Math.floor(Date.now() / 1000) + 30 * 86_400
  const vence = new Date(periodEnd * 1000)
  // Suspender solo si el cobro falló de forma persistente.
  const suspendida = sub.status === 'past_due' || sub.status === 'unpaid' || sub.status === 'incomplete_expired'
  const marcadaCancelada = sub.status === 'canceled'

  await query(
    `UPDATE cuentas SET
       vence = $2,
       suspendida = $3,
       cancelada = CASE WHEN $4 THEN true ELSE cancelada END,
       actualizado_en = now()
     WHERE id = $1`,
    [cuentaId, vence.toISOString(), suspendida, marcadaCancelada],
  )

  const pm = sub.default_payment_method
  if (pm && typeof pm !== 'string' && pm.card) {
    await query(
      `UPDATE medios_pago SET marca = $2, ultimos4 = $3, vence = $4
       WHERE cuenta_id = $1`,
      [
        cuentaId,
        'Tarjeta',
        pm.card.last4 ?? '',
        pm.card.exp_month && pm.card.exp_year
          ? `${String(pm.card.exp_month).padStart(2, '0')}/${String(pm.card.exp_year).slice(-2)}`
          : '',
      ],
    )
  }

  return true
}

export async function guardarIdsStripe(
  cuentaId: string,
  customerId: string | null | undefined,
  subscriptionId: string | null | undefined,
) {
  if (!customerId && !subscriptionId) return
  await query(
    `UPDATE cuentas SET
       stripe_customer_id = COALESCE($2, stripe_customer_id),
       stripe_subscription_id = COALESCE($3, stripe_subscription_id),
       actualizado_en = now()
     WHERE id = $1`,
    [cuentaId, customerId ?? null, subscriptionId ?? null],
  )
}

export async function registrarCobroPagado(opts: {
  cuentaId: string
  monto: number
  concepto: string
  referencia: string
  periodo?: Date
}) {
  const ya = await query(`SELECT 1 FROM cobros WHERE referencia = $1 LIMIT 1`, [opts.referencia])
  if (ya.rowCount) return false

  const folioQ = await query<{ folio: number }>(
    `SELECT COALESCE(MAX(folio), 1000) + 1 AS folio FROM cobros`,
  )
  const folio = folioQ.rows[0]?.folio ?? 1001
  await query(
    `INSERT INTO cobros (
       cuenta_id, folio, concepto, monto, emitido, limite, estado, periodo, metodo, referencia, pagado_el
     ) VALUES (
       $1, $2, $3, $4, now(), now() + interval '3 days', 'Pagado', $5, 'Tarjeta', $6, now()
     )`,
    [
      opts.cuentaId,
      folio,
      opts.concepto,
      opts.monto,
      (opts.periodo ?? new Date()).toISOString(),
      opts.referencia,
    ],
  )
  return true
}
