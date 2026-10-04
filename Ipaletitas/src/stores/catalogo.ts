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

export const DIAS_PRUEBA = 14

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
