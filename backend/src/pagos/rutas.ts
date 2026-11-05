import type { IncomingMessage, ServerResponse } from 'node:http'
import type Stripe from 'stripe'
import { exigirUsuario } from '../auth/sesion.ts'
import { query } from '../db.ts'
import { error, json, leerCuerpoRaw, leerJson } from '../http.ts'
import { activarCuenta, type DatosActivacion } from '../negocio/activar.ts'
import { snapshotNegocio } from '../negocio/snapshot.ts'
import {
  aCentavos,
  esPlanId,
  montoConCupon,
  nombrePlan,
  precioPlan,
  type CicloPago,
  type PlanId,
} from './precios.ts'
import { frontendUrl, stripe, stripeActivo } from './stripe.ts'
import {
  guardarIdsStripe,
  registrarCobroPagado,
  sincronizarSuscripcionStripe,
} from './suscripcion.ts'

type Cuerpo = Record<string, unknown>

function str(v: unknown, max = 200) {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

async function cuerpo(req: IncomingMessage, res: ServerResponse): Promise<Cuerpo | null> {
  try {
    return (await leerJson(req)) as Cuerpo
  } catch {
    error(res, 400, 'JSON inválido.')
    return null
  }
}

export async function manejarPagos(req: IncomingMessage, res: ServerResponse, ruta: string) {
  if (req.method === 'GET' && ruta === '/api/pagos/estado') {
    return json(res, 200, { stripe: stripeActivo() })
  }

  if (req.method === 'POST' && ruta === '/api/pagos/webhook') {
    return webhook(req, res)
  }

  const sesion = await exigirUsuario(req, res)
  if (!sesion) return

  if (req.method === 'POST' && ruta === '/api/pagos/checkout') {
    return checkout(req, res, sesion)
  }
  if (req.method === 'POST' && ruta === '/api/pagos/confirmar') {
    return confirmar(req, res, sesion)
  }
  if (req.method === 'POST' && ruta === '/api/pagos/portal') {
    return portal(res, sesion)
  }
  if (req.method === 'POST' && ruta === '/api/pagos/sincronizar') {
    return sincronizar(res, sesion)
  }

  error(res, 404, 'Ruta no encontrada.')
}

async function asegurarCuponStripe(codigo: string, porcentaje: number) {
  try {
    return await stripe().coupons.retrieve(codigo)
  } catch {
    return await stripe().coupons.create({
      id: codigo,
      percent_off: porcentaje,
      duration: 'once',
      name: codigo,
    })
  }
}

async function checkout(
  req: IncomingMessage,
  res: ServerResponse,
  sesion: { id: string; cuentaId: string; correo: string; nombre: string },
) {
  if (!stripeActivo()) {
    return error(res, 503, 'Stripe no está configurado. Usa el modo demo o pon STRIPE_SECRET_KEY en .env.local.')
  }

  const datos = await cuerpo(req, res)
  if (!datos) return

  const planId = str(datos.planId)
  const ciclo: CicloPago = str(datos.ciclo) === 'anual' ? 'anual' : 'mensual'
  if (!esPlanId(planId)) return error(res, 400, 'Plan inválido.')

  const cuenta = await query<{ negocio: string; stripe_customer_id: string | null }>(
    `SELECT negocio, stripe_customer_id FROM cuentas WHERE id = $1 LIMIT 1`,
    [sesion.cuentaId],
  )
  if (!cuenta.rows[0]) return error(res, 404, 'Cuenta no encontrada.')
  if (cuenta.rows[0].negocio?.trim()) {
    return error(res, 409, 'Esta cuenta ya tiene licencia activa.')
  }

  const negocio = str(datos.negocio, 120)
  if (!negocio) return error(res, 400, 'El nombre del negocio es obligatorio.')

  const activacion: DatosActivacion = {
    negocio,
    giro: str(datos.giro, 80),
    telefono: str(datos.telefono, 40),
    sucursal: str(datos.sucursal, 80) || 'Matriz',
    planId,
    ciclo,
    tarjeta: {
      marca: 'Tarjeta',
      ultimos4: '',
      vence: '',
      titular: sesion.nombre,
    },
    facturacion: {
      pais: str((datos.facturacion as Cuerpo | undefined)?.pais, 60) || 'México',
      estado: str((datos.facturacion as Cuerpo | undefined)?.estado, 60),
      direccion: str((datos.facturacion as Cuerpo | undefined)?.direccion, 200),
      codigoPostal: str((datos.facturacion as Cuerpo | undefined)?.codigoPostal, 12),
    },
  }

  const precioBase = precioPlan(planId as PlanId, ciclo)
  const { monto, porcentaje, cupon } = montoConCupon(planId as PlanId, ciclo, str(datos.cupon, 40))
  const base = frontendUrl()

  try {
    const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = []
    if (cupon && porcentaje > 0) {
      const c = await asegurarCuponStripe(cupon, porcentaje)
      discounts.push({ coupon: c.id })
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      locale: 'es',
      client_reference_id: sesion.cuentaId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'mxn',
            unit_amount: aCentavos(precioBase),
            recurring: { interval: ciclo === 'anual' ? 'year' : 'month' },
            product_data: {
              name: `iPaletitas · plan ${nombrePlan(planId as PlanId)}`,
              description: 'Suscripción con renovación automática',
            },
          },
        },
      ],
      metadata: {
        cuentaId: sesion.cuentaId,
        usuarioId: sesion.id,
        planId,
        ciclo,
        cupon: cupon ?? '',
        monto: String(monto),
        negocio: activacion.negocio.slice(0, 120),
        giro: activacion.giro.slice(0, 80),
        telefono: activacion.telefono.slice(0, 40),
        sucursal: activacion.sucursal.slice(0, 80),
        fact_estado: activacion.facturacion.estado.slice(0, 60),
        fact_dir: activacion.facturacion.direccion.slice(0, 120),
        fact_cp: activacion.facturacion.codigoPostal.slice(0, 12),
      },
      subscription_data: {
        metadata: {
          cuentaId: sesion.cuentaId,
          planId,
          ciclo,
        },
      },
      success_url: `${base}/?pago=ok&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?pago=cancelado`,
    }

    if (discounts.length) sessionParams.discounts = discounts

    if (cuenta.rows[0].stripe_customer_id) {
      sessionParams.customer = cuenta.rows[0].stripe_customer_id
    } else {
      sessionParams.customer_email = sesion.correo
    }

    const session = await stripe().checkout.sessions.create(sessionParams)

    if (!session.url) return error(res, 500, 'Stripe no devolvió URL de pago.')
    json(res, 200, { url: session.url, sessionId: session.id })
  } catch (e) {
    console.error(e)
    error(res, 500, 'No se pudo crear la sesión de pago.')
  }
}

async function confirmar(
  req: IncomingMessage,
  res: ServerResponse,
  sesion: { id: string; cuentaId: string; correo: string; nombre: string },
) {
  if (!stripeActivo()) {
    return error(res, 503, 'Stripe no está configurado.')
  }

  const datos = await cuerpo(req, res)
  if (!datos) return
  const sessionId = str(datos.sessionId, 200)
  if (!sessionId) return error(res, 400, 'Falta session_id.')

  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'subscription.default_payment_method', 'payment_intent.payment_method'],
    })

    if (session.metadata?.cuentaId !== sesion.cuentaId) {
      return error(res, 403, 'Esta sesión de pago no corresponde a tu cuenta.')
    }
    if (session.payment_status !== 'paid') {
      return error(res, 402, 'El pago aún no está confirmado.')
    }

    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id

    await guardarIdsStripe(sesion.cuentaId, customerId, subscriptionId)

    const cuenta = await query<{ negocio: string }>(
      `SELECT negocio FROM cuentas WHERE id = $1 LIMIT 1`,
      [sesion.cuentaId],
    )
    if (!cuenta.rows[0]) return error(res, 404, 'Cuenta no encontrada.')

    if (!cuenta.rows[0].negocio?.trim()) {
      const activacion = activacionDesdeMeta(session.metadata, sesion.nombre)
      if (!activacion) return error(res, 400, 'No se pudieron recuperar los datos de activación.')

      const ultimos4 = extraerUltimos4(session)
      activacion.tarjeta = {
        marca: 'Tarjeta',
        ultimos4: ultimos4 ?? '',
        vence: '',
        titular: sesion.nombre,
      }

      await activarCuenta(sesion.cuentaId, sesion.id, sesion.correo, sesion.nombre, activacion)
    }

    if (subscriptionId) {
      await sincronizarSuscripcionStripe(sesion.cuentaId)
    }

    const monto = Number(session.metadata?.monto ?? (session.amount_total ?? 0) / 100)
    const planId = session.metadata?.planId ?? 'basica'
    const ciclo = session.metadata?.ciclo === 'anual' ? 'anual' : 'mensual'
    await registrarCobroPagado({
      cuentaId: sesion.cuentaId,
      monto: Number.isFinite(monto) ? monto : 0,
      concepto: `Contratación plan ${planId} (${ciclo})`,
      referencia: sessionId,
    })

    const snap = await snapshotNegocio(sesion.cuentaId, sesion.correo)
    json(res, 200, snap)
  } catch (e) {
    console.error(e)
    error(res, 500, 'No se pudo confirmar el pago.')
  }
}

async function portal(
  res: ServerResponse,
  sesion: { cuentaId: string },
) {
  if (!stripeActivo()) return error(res, 503, 'Stripe no está configurado.')

  const cuenta = await query<{ stripe_customer_id: string | null }>(
    `SELECT stripe_customer_id FROM cuentas WHERE id = $1 LIMIT 1`,
    [sesion.cuentaId],
  )
  const customerId = cuenta.rows[0]?.stripe_customer_id
  if (!customerId) {
    return error(res, 400, 'Esta cuenta aún no tiene un cliente de Stripe. Contrata con tarjeta primero.')
  }

  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendUrl()}/?portal=ok`,
    })
    json(res, 200, { url: session.url })
  } catch (e) {
    console.error(e)
    error(res, 500, 'No se pudo abrir el portal de pagos.')
  }
}

async function sincronizar(
  res: ServerResponse,
  sesion: { cuentaId: string; correo: string },
) {
  try {
    await sincronizarSuscripcionStripe(sesion.cuentaId)
    const snap = await snapshotNegocio(sesion.cuentaId, sesion.correo)
    json(res, 200, snap)
  } catch (e) {
    console.error(e)
    error(res, 500, 'No se pudo sincronizar la suscripción.')
  }
}

async function webhook(req: IncomingMessage, res: ServerResponse) {
  if (!stripeActivo()) return error(res, 503, 'Stripe no está configurado.')

  const secreto = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  let evento: Stripe.Event

  try {
    const raw = await leerCuerpoRaw(req)
    if (secreto) {
      const firma = req.headers['stripe-signature']
      if (typeof firma !== 'string') return error(res, 400, 'Falta firma de Stripe.')
      evento = stripe().webhooks.constructEvent(raw, firma, secreto)
    } else {
      // Sin secreto (dev): acepta el JSON tal cual. En producción configura STRIPE_WEBHOOK_SECRET.
      evento = JSON.parse(raw.toString('utf8')) as Stripe.Event
      console.warn('[pagos] Webhook sin STRIPE_WEBHOOK_SECRET: no se verifica la firma.')
    }
  } catch (e) {
    console.error(e)
    return error(res, 400, 'Webhook inválido.')
  }

  try {
    await procesarEvento(evento)
    json(res, 200, { recibido: true })
  } catch (e) {
    console.error(e)
    error(res, 500, 'Error al procesar webhook.')
  }
}

async function procesarEvento(evento: Stripe.Event) {
  switch (evento.type) {
    case 'invoice.paid': {
      const invoice = evento.data.object as Stripe.Invoice
      const subId = subscriptionIdDeFactura(invoice)
      if (!subId) return
      const cuentaId = await cuentaPorSubscription(subId, invoice.metadata?.cuentaId)
      if (!cuentaId) return
      await sincronizarSuscripcionStripe(cuentaId)
      const monto = (invoice.amount_paid ?? 0) / 100
      await registrarCobroPagado({
        cuentaId,
        monto,
        concepto:
          invoice.billing_reason === 'subscription_create'
            ? 'Primer pago suscripción'
            : 'Renovación suscripción',
        referencia: invoice.id,
      })
      break
    }
    case 'invoice.payment_failed': {
      const invoice = evento.data.object as Stripe.Invoice
      const subId = subscriptionIdDeFactura(invoice)
      if (!subId) return
      const cuentaId = await cuentaPorSubscription(subId)
      if (cuentaId) await sincronizarSuscripcionStripe(cuentaId)
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = evento.data.object as Stripe.Subscription
      const cuentaId = await cuentaPorSubscription(sub.id, sub.metadata?.cuentaId)
      if (cuentaId) await sincronizarSuscripcionStripe(cuentaId)
      break
    }
    default:
      break
  }
}

function subscriptionIdDeFactura(invoice: Stripe.Invoice): string | null {
  const sub = invoice.parent?.subscription_details?.subscription
  if (!sub) return null
  return typeof sub === 'string' ? sub : sub.id
}

async function cuentaPorSubscription(subscriptionId: string, metaCuentaId?: string) {
  if (metaCuentaId) {
    const porMeta = await query<{ id: string }>(`SELECT id FROM cuentas WHERE id = $1 LIMIT 1`, [metaCuentaId])
    if (porMeta.rows[0]) return porMeta.rows[0].id
  }
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM cuentas WHERE stripe_subscription_id = $1 LIMIT 1`,
    [subscriptionId],
  )
  return rows[0]?.id ?? null
}

function activacionDesdeMeta(
  meta: Record<string, string> | null | undefined,
  nombreFallback: string,
): DatosActivacion | null {
  const planId = meta?.planId
  if (!planId || !esPlanId(planId)) return null
  return {
    negocio: (meta.negocio ?? 'Negocio').trim() || 'Negocio',
    giro: meta.giro ?? '',
    telefono: meta.telefono ?? '',
    sucursal: (meta.sucursal ?? 'Matriz').trim() || 'Matriz',
    planId,
    ciclo: meta.ciclo === 'anual' ? 'anual' : 'mensual',
    tarjeta: { marca: 'Tarjeta', ultimos4: '', vence: '', titular: nombreFallback },
    facturacion: {
      pais: 'México',
      estado: meta.fact_estado ?? '',
      direccion: meta.fact_dir ?? '',
      codigoPostal: meta.fact_cp ?? '',
    },
  }
}

function extraerUltimos4(session: Stripe.Checkout.Session): string | null {
  const sub = session.subscription
  if (sub && typeof sub !== 'string') {
    const pm = sub.default_payment_method
    if (pm && typeof pm !== 'string' && pm.card?.last4) return pm.card.last4
  }
  const pi = session.payment_intent
  if (!pi || typeof pi === 'string') return null
  const pm = pi.payment_method
  if (!pm || typeof pm === 'string') return null
  return pm.card?.last4 ?? null
}
