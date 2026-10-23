/** Precios alineados con frontend/src/stores/catalogo.ts (MXN con IVA incluido). */

export type PlanId = 'basica' | 'doble' | 'doble-especial' | 'especial-super'
export type CicloPago = 'mensual' | 'anual'

const PRECIOS_MENSUALES: Record<PlanId, number> = {
  basica: 199,
  doble: 399,
  'doble-especial': 699,
  'especial-super': 1199,
}

const NOMBRES: Record<PlanId, string> = {
  basica: 'Básica',
  doble: 'Doble',
  'doble-especial': 'Doble Especial',
  'especial-super': 'Especial Super',
}

const CUPONES: Record<string, number> = {
  PALETA10: 10,
  BIENVENIDA15: 15,
}

export function esPlanId(v: string): v is PlanId {
  return v in PRECIOS_MENSUALES
}

export function precioPlan(planId: PlanId, ciclo: CicloPago) {
  const mensual = PRECIOS_MENSUALES[planId]
  return ciclo === 'anual' ? mensual * 10 : mensual
}

export function nombrePlan(planId: PlanId) {
  return NOMBRES[planId]
}

/** Monto final en pesos (2 decimales) tras cupón. */
export function montoConCupon(planId: PlanId, ciclo: CicloPago, codigoCupon?: string) {
  const base = precioPlan(planId, ciclo)
  const codigo = (codigoCupon ?? '').trim().toUpperCase()
  const pct = CUPONES[codigo] ?? 0
  const monto = pct > 0 ? Math.round(base * (100 - pct) * 100) / 100 : base
  return { monto, porcentaje: pct, cupon: pct > 0 ? codigo : undefined }
}

/** Centavos para Stripe (MXN). */
export function aCentavos(pesos: number) {
  return Math.round(pesos * 100)
}
