import Stripe from 'stripe'

let cliente: Stripe | null = null

export function stripeActivo() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new Error('stripe_no_configurado')
  if (!cliente) {
    cliente = new Stripe(key, {
      apiVersion: '2026-09-30.endive',
    })
  }
  return cliente
}

export function frontendUrl() {
  return (process.env.FRONTEND_URL ?? 'http://localhost:5173').replace(/\/+$/, '')
}
