export type PlanId = 'basica' | 'doble' | 'doble-especial' | 'especial-super'
export type CicloPago = 'mensual' | 'anual'
export type Limite = 'sucursales' | 'usuarios' | 'productos'

export interface Plan {
  id: PlanId
  nombre: string
  lema: string
  precioMensual: number
  acento: string
  acentoOscuro?: string
  incluyeDe?: string
  destacado?: boolean
  limites: Record<Limite, number> & { historialMeses: number }
  incluye: string[]
}

/** Prueba de las cuentas creadas antes de que la suscripción se pagara al contratar. */
export const DIAS_PRUEBA = 14

/** Semana gratis: días después del primer pago en los que el cliente puede pedir la devolución completa. */
export const DIAS_GARANTIA = 7

/** Días que el cliente sigue entrando después de que vence su licencia (o su prueba) para pagarla. */
export const DIAS_COBRO = 3

/** Los precios de los planes ya incluyen este IVA; el resumen del pago lo desglosa. */
export const IVA = 0.16

/** Plazos a meses sin intereses con tarjeta de crédito, solo en planes anuales. */
export const MESES_SIN_INTERESES = [3, 6, 12] as const

/** Cupones vigentes: descuentan un porcentaje del primer pago; las renovaciones van a precio normal. */
export const CUPONES: Record<string, { porcentaje: number; descripcion: string }> = {
  PALETA10: { porcentaje: 10, descripcion: '10% en tu primer pago' },
  BIENVENIDA15: { porcentaje: 15, descripcion: '15% de bienvenida en tu primer pago' },
}

const DIA = 86_400_000

/** vigente: dentro de su periodo · cobro: venció y corre el plazo para pagar · suspendida: sin acceso. */
export type FaseLicencia = 'vigente' | 'cobro' | 'suspendida'

export function finDeCobro(vence: string) {
  return new Date(new Date(vence).getTime() + DIAS_COBRO * DIA).toISOString()
}

export function faseLicencia(licencia: { vence: string; suspendida?: boolean }, ahora = Date.now()): FaseLicencia {
  if (licencia.suspendida) return 'suspendida'
  if (ahora <= new Date(licencia.vence).getTime()) return 'vigente'
  return ahora < new Date(finDeCobro(licencia.vence)).getTime() ? 'cobro' : 'suspendida'
}

/** Días completos o parciales que le quedan para pagar antes de la suspensión. */
export function diasParaPagar(vence: string, ahora = Date.now()) {
  return Math.max(0, Math.ceil((new Date(finDeCobro(vence)).getTime() - ahora) / DIA))
}

/**
 * Nueva fecha de vencimiento al pagar un periodo. Si paga a tiempo (antes de vencer o dentro del
 * plazo de cobro) el periodo corre desde su vencimiento; si ya estaba suspendida, desde hoy.
 */
export function renovarVencimiento(vence: string, ciclo: CicloPago, ahora = Date.now()) {
  const desde = new Date(ahora >= new Date(finDeCobro(vence)).getTime() ? ahora : new Date(vence).getTime())
  desde.setMonth(desde.getMonth() + (ciclo === 'anual' ? 12 : 1))
  return desde.toISOString()
}

export const PLANES: Plan[] = [
  {
    id: 'basica',
    nombre: 'Básica',
    lema: 'Para la paletería que va empezando.',
    precioMensual: 199,
    acento: '#10b981',
    limites: { sucursales: 1, usuarios: 2, productos: 50, historialMeses: 3 },
    incluye: [
      '1 sucursal',
      'Hasta 2 usuarios',
      'Punto de venta para registrar tus ventas',
      'Catálogo de hasta 50 productos',
      'Control de inventario básico',
      'Reporte diario de ventas',
      'Soporte por correo',
    ],
  },
  {
    id: 'doble',
    nombre: 'Doble',
    lema: 'Para negocios que ya despegaron.',
    precioMensual: 399,
    acento: '#3b82f6',
    incluyeDe: 'Básica',
    limites: { sucursales: 2, usuarios: 5, productos: Infinity, historialMeses: 12 },
    incluye: [
      'Hasta 2 sucursales',
      'Hasta 5 usuarios',
      'Productos ilimitados',
      'Recetario digital vinculado al inventario',
      'Alertas de stock bajo',
      'Reportes semanales y mensuales',
      'Soporte por chat',
    ],
  },
  {
    id: 'doble-especial',
    nombre: 'Doble Especial',
    lema: 'Para crecer con varias sucursales y equipo.',
    precioMensual: 699,
    acento: '#7c3aed',
    incluyeDe: 'Doble',
    destacado: true,
    limites: { sucursales: 5, usuarios: 15, productos: Infinity, historialMeses: 24 },
    incluye: [
      'Hasta 5 sucursales',
      'Hasta 15 usuarios',
      'Gestión de empleados con roles y permisos',
      'Control de insumos y producción por lotes',
      'Dashboards con gráficas en tiempo real',
      'Exporta reportes a Excel y PDF',
      'Soporte prioritario',
    ],
  },
  {
    id: 'especial-super',
    nombre: 'Especial Super',
    lema: 'Todo iPaletitas, sin límites.',
    precioMensual: 1199,
    acento: '#f59e0b',
    acentoOscuro: '#93c5fd',
    incluyeDe: 'Doble Especial',
    limites: {
      sucursales: Infinity,
      usuarios: Infinity,
      productos: Infinity,
      historialMeses: Infinity,
    },
    incluye: [
      'Sucursales y usuarios ilimitados',
      'Pronóstico de demanda por temporada',
      'Programa de lealtad para tus clientes',
      'Facturación electrónica (CFDI) integrada',
      'API e integraciones con otras plataformas',
      'Asesor dedicado y soporte 24/7',
    ],
  },
]

export const PLAN_RECOMENDADO: PlanId = 'doble-especial'

// Planes de la versión anterior; cada uno pasa al nuevo que conserva sus límites.
const PLANES_ANTERIORES: Record<string, PlanId> = {
  emprendedor: 'basica',
  negocio: 'doble-especial',
  empresarial: 'especial-super',
}

export function migrarPlanId(id: string): PlanId {
  if (PLANES.some((p) => p.id === id)) return id as PlanId
  return PLANES_ANTERIORES[id] ?? 'basica'
}

export function planPorId(id: PlanId) {
  return PLANES.find((p) => p.id === id) ?? PLANES[0]!
}

// En modo oscuro no se usa amarillo: el plan puede definir un acento alterno
export function acentoPlan(plan: Plan, oscuro: boolean) {
  return (oscuro && plan.acentoOscuro) || plan.acento
}

export function precioPlan(plan: Plan, ciclo: CicloPago) {
  return ciclo === 'anual' ? plan.precioMensual * 10 : plan.precioMensual
}

export function generarClave() {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bloque = () =>
    Array.from({ length: 4 }, () => letras[Math.floor(Math.random() * letras.length)]).join('')
  return `IPAL-${bloque()}-${bloque()}-${bloque()}`
}
