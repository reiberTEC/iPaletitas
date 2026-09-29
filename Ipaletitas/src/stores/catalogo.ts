export type PlanId = 'emprendedor' | 'negocio' | 'empresarial'
export type CicloPago = 'mensual' | 'anual'
export type Limite = 'sucursales' | 'usuarios' | 'productos'

export interface Plan {
  id: PlanId
  nombre: string
  lema: string
  precioMensual: number
  destacado?: boolean
  limites: Record<Limite, number> & { historialMeses: number }
  incluye: string[]
}

export const DIAS_PRUEBA = 14

export const PLANES: Plan[] = [
  {
    id: 'emprendedor',
    nombre: 'Emprendedor',
    lema: 'Para tu primer local o puesto.',
    precioMensual: 299,
    limites: { sucursales: 1, usuarios: 2, productos: 300, historialMeses: 3 },
    incluye: [
      'Punto de venta con tickets',
      'Inventario y entradas de productos',
      'Historial de ventas de 3 meses',
      'Datos en la nube y en local',
      'Soporte por correo',
    ],
  },
  {
    id: 'negocio',
    nombre: 'Negocio',
    lema: 'Para negocios que ya están creciendo.',
    precioMensual: 599,
    destacado: true,
    limites: { sucursales: 3, usuarios: 8, productos: 3000, historialMeses: 12 },
    incluye: [
      'Todo lo de Emprendedor',
      'Hasta 3 sucursales',
      'Roles: administrador, cajero y almacén',
      'Historial de ventas de 12 meses',
      'Soporte por chat',
    ],
  },
  {
    id: 'empresarial',
    nombre: 'Empresarial',
    lema: 'Para cadenas y franquicias.',
    precioMensual: 1199,
    limites: {
      sucursales: Infinity,
      usuarios: Infinity,
      productos: Infinity,
      historialMeses: Infinity,
    },
    incluye: [
      'Todo lo de Negocio',
      'Sucursales y usuarios ilimitados',
      'Historial de ventas sin límite',
      'Capacitación para tu equipo',
      'Soporte prioritario',
    ],
  },
]

export function planPorId(id: PlanId) {
  return PLANES.find((p) => p.id === id) ?? PLANES[0]!
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
