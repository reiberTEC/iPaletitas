import { computed, reactive, watch } from 'vue'
import {
  DIAS_PRUEBA,
  PLANES,
  generarClave,
  planPorId,
  precioPlan,
  type CicloPago,
  type Limite,
  type PlanId,
} from './catalogo'
import { ajustarLicencia, estado as cliente, type AjusteLicencia } from './negocio'
import { nombreDesdeCorreo } from '@/lib/formato'
import { nuevoId } from '@/lib/utils'

export type EstadoCuenta = 'Prueba' | 'Activa' | 'Suspendida' | 'Vencida'
export type EstadoPago = 'Pagado' | 'Pendiente' | 'Vencido'
export type MetodoCobro = 'Transferencia' | 'Depósito' | 'Efectivo'

export interface Cuenta {
  id: string
  negocio: string
  titular: string
  correo: string
  telefono: string
  giro: string
  ciudad: string
  planId: PlanId
  ciclo: CicloPago
  clave: string
  alta: string
  vence: string
  enPrueba: boolean
  suspendida: boolean
  uso: Record<Limite, number>
  ventasMes: number
  ultimoAcceso: string
  local?: boolean
}

export interface Pago {
  id: string
  folio: number
  cuentaId: string
  negocio: string
  concepto: string
  monto: number
  emitido: string
  limite: string
  estado: EstadoPago
  metodo?: MetodoCobro
  pagadoEl?: string
}

export interface Evento {
  id: string
  fecha: string
  autor: string
  accion: string
  detalle: string
}

interface EstadoAdmin {
  sesion: { correo: string; nombre: string } | null
  cuentas: Cuenta[]
  pagos: Pago[]
  bitacora: Evento[]
  folioPago: number
}

export const DOMINIO_ADMIN = '@ipaletitas.com'
export const ID_CUENTA_LOCAL = 'cuenta-local'
const CLAVE_ALMACEN = 'ipaletitas:admin'
const DIA = 86_400_000

const haceDias = (dias: number) => new Date(Date.now() - dias * DIA).toISOString()
const enDias = (dias: number) => new Date(Date.now() + dias * DIA).toISOString()
const sinAcentos = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function esCorreoAdmin(correo: string) {
  return correo.trim().toLowerCase().endsWith(DOMINIO_ADMIN)
}

type Situacion = 'prueba' | 'activa' | 'suspendida' | 'vencida'

const semilla: [string, string, string, string, PlanId, CicloPago, number, Situacion, [number, number, number], number][] = [
  ['Paletería La Flor de Michoacán', 'Rosa Hernández', 'Paletería', 'Morelia', 'negocio', 'mensual', 210, 'activa', [3, 6, 184], 1320],
  ['Nevería El Oso Polar', 'Jorge Ramírez', 'Nevería', 'Guadalajara', 'empresarial', 'anual', 400, 'activa', [7, 22, 540], 4870],
  ['Abarrotes Don Chuy', 'Jesús Castillo', 'Abarrotes', 'Querétaro', 'emprendedor', 'mensual', 95, 'activa', [1, 2, 262], 910],
  ['Helados Tropicana', 'Mariana López', 'Nevería', 'Veracruz', 'negocio', 'anual', 330, 'activa', [2, 5, 97], 1650],
  ['Frutería Los Pinos', 'Alberto Sánchez', 'Frutería', 'Puebla', 'emprendedor', 'mensual', 9, 'prueba', [1, 1, 48], 64],
  ['Café Aroma de Olla', 'Daniela Torres', 'Cafetería', 'Oaxaca', 'negocio', 'mensual', 12, 'prueba', [1, 3, 35], 210],
  ['Papelería Arcoíris', 'Luis Mendoza', 'Papelería', 'León', 'emprendedor', 'mensual', 4, 'prueba', [1, 1, 120], 18],
  ['Paletas Doña Lupe', 'Guadalupe Ortiz', 'Paletería', 'Ciudad de México', 'emprendedor', 'mensual', 150, 'suspendida', [1, 2, 60], 0],
  ['Farmacia San Rafael', 'Ricardo Flores', 'Farmacia', 'Monterrey', 'negocio', 'mensual', 70, 'vencida', [2, 4, 890], 12],
  ['Tortillería La Güera', 'Patricia Ruiz', 'Tortillería', 'Toluca', 'emprendedor', 'anual', 280, 'activa', [1, 2, 12], 2200],
  ['Minisúper El Güero', 'Fernando Díaz', 'Abarrotes', 'Mérida', 'negocio', 'mensual', 32, 'activa', [3, 7, 1430], 2980],
]

function crearSemilla(): Pick<EstadoAdmin, 'cuentas' | 'pagos' | 'folioPago'> {
  let folioPago = 5001
  const pagos: Pago[] = []

  const cuentas: Cuenta[] = semilla.map(
    ([negocio, titular, giro, ciudad, planId, ciclo, altaHace, situacion, [sucursales, usuarios, productos], ventasMes], i) => {
      const dominio = sinAcentos(negocio).toLowerCase().replace(/[^a-z]+/g, '')
      const vence = {
        prueba: enDias(DIAS_PRUEBA - altaHace),
        activa: ciclo === 'anual' ? enDias(365 - (altaHace % 365)) : enDias(30 - (altaHace % 30) || 30),
        suspendida: haceDias(18),
        vencida: haceDias(5),
      }[situacion]

      const cuenta: Cuenta = {
        id: nuevoId(),
        negocio,
        titular,
        correo: `${sinAcentos(titular.split(' ')[0] ?? '').toLowerCase()}@${dominio.slice(0, 18)}.mx`,
        telefono: `${String(33 + i * 7).padStart(2, '0')} ${1400 + i * 173} ${2100 + i * 389}`,
        giro,
        ciudad,
        planId,
        ciclo,
        clave: generarClave(),
        alta: haceDias(altaHace),
        vence,
        enPrueba: situacion === 'prueba',
        suspendida: situacion === 'suspendida',
        uso: { sucursales, usuarios, productos },
        ventasMes,
        ultimoAcceso: haceDias(situacion === 'suspendida' ? 20 : situacion === 'vencida' ? 6 : (i % 3) * 0.4),
      }

      if (situacion !== 'prueba') {
        const plan = planPorId(planId)
        const cargos = ciclo === 'anual' ? 1 : Math.min(3, Math.floor(altaHace / 30) + 1)
        const desfase =
          situacion === 'suspendida' ? 23 : situacion === 'vencida' ? 10 : ciclo === 'anual' ? altaHace % 365 : altaHace % 30
        for (let n = cargos - 1; n >= 0; n--) {
          const emitido = new Date(Date.now() - (n * 30 + desfase) * DIA)
          const limite = new Date(emitido.getTime() + 5 * DIA)
          const reciente = n === 0
          const estadoPago: EstadoPago =
            situacion === 'vencida' && reciente
              ? 'Vencido'
              : situacion === 'suspendida' && n <= 1
                ? 'Vencido'
                : negocio.startsWith('Minisúper') && reciente
                  ? 'Pendiente'
                  : 'Pagado'
          pagos.push({
            id: nuevoId(),
            folio: folioPago++,
            cuentaId: cuenta.id,
            negocio,
            concepto: `Licencia ${plan.nombre} · ${ciclo} · ${emitido.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}`,
            monto: precioPlan(plan, ciclo),
            emitido: emitido.toISOString(),
            limite: limite.toISOString(),
            estado: estadoPago,
            metodo: estadoPago === 'Pagado' ? (['Transferencia', 'Depósito', 'Efectivo'] as const)[i % 3] : undefined,
            pagadoEl:
              estadoPago === 'Pagado' ? new Date(Math.min(Date.now(), emitido.getTime() + 2 * DIA)).toISOString() : undefined,
          })
        }
      }

      return cuenta
    },
  )

  return { cuentas, pagos, folioPago }
}

function cargar(): EstadoAdmin {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACEN)
    if (guardado) return JSON.parse(guardado) as EstadoAdmin
  } catch {
    /* se regenera abajo */
  }
  return { sesion: null, bitacora: [], ...crearSemilla() }
}

export const estado = reactive<EstadoAdmin>(cargar())

watch(estado, (valor) => localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(valor)), { deep: true })

const cuentaLocal = computed<Cuenta | null>(() => {
  const licencia = cliente.licencia
  if (!licencia) return null
  const titular = cliente.usuarios.find((u) => u.rol === 'Administrador')
  const hace30 = Date.now() - 30 * DIA
  return {
    id: ID_CUENTA_LOCAL,
    local: true,
    negocio: licencia.negocio,
    titular: titular?.nombre ?? 'Sin titular',
    correo: titular?.correo ?? '',
    telefono: licencia.telefono,
    giro: licencia.giro,
    ciudad: 'Este navegador',
    planId: licencia.planId,
    ciclo: licencia.ciclo,
    clave: licencia.clave,
    alta: licencia.inicio,
    vence: licencia.vence,
    enPrueba: licencia.enPrueba !== false,
    suspendida: Boolean(licencia.suspendida),
    uso: {
      sucursales: cliente.sucursales.length,
      usuarios: cliente.usuarios.length,
      productos: cliente.productos.length,
    },
    ventasMes: cliente.ventas.filter((v) => new Date(v.fecha).getTime() >= hace30).length,
    ultimoAcceso: cliente.ventas.at(-1)?.fecha ?? licencia.inicio,
  }
})

export const cuentas = computed(() => (cuentaLocal.value ? [cuentaLocal.value, ...estado.cuentas] : estado.cuentas))

export function buscarCuenta(id: string) {
  return cuentas.value.find((c) => c.id === id) ?? null
}

export function estadoDe(cuenta: Cuenta): EstadoCuenta {
  if (cuenta.suspendida) return 'Suspendida'
  if (new Date(cuenta.vence).getTime() < Date.now()) return 'Vencida'
  return cuenta.enPrueba ? 'Prueba' : 'Activa'
}

export function diasPara(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DIA)
}

export function mensualidad(cuenta: Cuenta) {
  const plan = planPorId(cuenta.planId)
  return cuenta.ciclo === 'anual' ? precioPlan(plan, 'anual') / 12 : plan.precioMensual
}

export function pagosDe(cuentaId: string) {
  return estado.pagos.filter((p) => p.cuentaId === cuentaId).sort((a, b) => b.emitido.localeCompare(a.emitido))
}

export const metricas = computed(() => {
  const lista = cuentas.value
  const porEstado: Record<EstadoCuenta, number> = { Activa: 0, Prueba: 0, Vencida: 0, Suspendida: 0 }
  for (const cuenta of lista) porEstado[estadoDe(cuenta)]++

  const activas = lista.filter((c) => estadoDe(c) === 'Activa')
  const enPrueba = lista.filter((c) => estadoDe(c) === 'Prueba')
  const pendientes = estado.pagos.filter((p) => p.estado !== 'Pagado')
  const mesActual = new Date().toISOString().slice(0, 7)

  return {
    total: lista.length,
    porEstado,
    mrr: activas.reduce((suma, c) => suma + mensualidad(c), 0),
    potencial: enPrueba.reduce((suma, c) => suma + mensualidad(c), 0),
    porCobrar: pendientes.reduce((suma, p) => suma + p.monto, 0),
    vencidos: pendientes.filter((p) => p.estado === 'Vencido').length,
    cobradoMes: estado.pagos
      .filter((p) => p.estado === 'Pagado' && p.pagadoEl?.startsWith(mesActual))
      .reduce((suma, p) => suma + p.monto, 0),
    porPlan: PLANES.map((plan) => {
      const delPlan = lista.filter((c) => c.planId === plan.id)
      return {
        plan,
        total: delPlan.length,
        mrr: delPlan.filter((c) => estadoDe(c) === 'Activa').reduce((suma, c) => suma + mensualidad(c), 0),
      }
    }),
    altas: Array.from({ length: 6 }, (_, i) => {
      const mes = new Date()
      mes.setDate(1)
      mes.setMonth(mes.getMonth() - (5 - i))
      const clave = mes.toISOString().slice(0, 7)
      return {
        etiqueta: mes.toLocaleDateString('es-MX', { month: 'short' }),
        total: lista.filter((c) => c.alta.startsWith(clave)).length,
      }
    }),
    porVencer: enPrueba
      .filter((c) => diasPara(c.vence) <= 7)
      .sort((a, b) => a.vence.localeCompare(b.vence)),
  }
})

function registrar(accion: string, detalle: string) {
  estado.bitacora.unshift({
    id: nuevoId(),
    fecha: new Date().toISOString(),
    autor: estado.sesion?.nombre ?? 'Sistema',
    accion,
    detalle,
  })
}

function modificar(id: string, cambios: AjusteLicencia) {
  if (id === ID_CUENTA_LOCAL) {
    ajustarLicencia(cambios)
    return
  }
  const cuenta = estado.cuentas.find((c) => c.id === id)
  if (cuenta) Object.assign(cuenta, cambios)
}

function emitirCargo(cuenta: Cuenta) {
  const plan = planPorId(cuenta.planId)
  const hoy = new Date()
  estado.pagos.push({
    id: nuevoId(),
    folio: estado.folioPago++,
    cuentaId: cuenta.id,
    negocio: cuenta.negocio,
    concepto: `Licencia ${plan.nombre} · ${cuenta.ciclo} · ${hoy.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}`,
    monto: precioPlan(plan, cuenta.ciclo),
    emitido: hoy.toISOString(),
    limite: new Date(hoy.getTime() + 5 * DIA).toISOString(),
    estado: 'Pendiente',
  })
}

export function iniciarSesionAdmin(correo: string) {
  estado.sesion = { correo, nombre: nombreDesdeCorreo(correo, 'Administrador') }
  registrar('Inició sesión', correo)
}

export function cerrarSesionAdmin() {
  registrar('Cerró sesión', estado.sesion?.correo ?? '')
  estado.sesion = null
}

export function suspenderCuenta(id: string) {
  const cuenta = buscarCuenta(id)
  if (!cuenta) return
  modificar(id, { suspendida: true })
  registrar('Suspendió la cuenta', cuenta.negocio)
}

export function reactivarCuenta(id: string) {
  const cuenta = buscarCuenta(id)
  if (!cuenta) return
  modificar(id, { suspendida: false })
  registrar('Reactivó la cuenta', cuenta.negocio)
}

export function extenderPrueba(id: string, dias = 7) {
  const cuenta = buscarCuenta(id)
  if (!cuenta) return
  const base = Math.max(Date.now(), new Date(cuenta.vence).getTime())
  modificar(id, { vence: new Date(base + dias * DIA).toISOString() })
  registrar('Extendió la prueba', `${cuenta.negocio} · +${dias} días`)
}

export function cambiarPlanCuenta(id: string, planId: PlanId, ciclo: CicloPago) {
  const cuenta = buscarCuenta(id)
  if (!cuenta) return
  modificar(id, { planId, ciclo })
  registrar('Cambió el plan', `${cuenta.negocio} · ${planPorId(planId).nombre} ${ciclo}`)
}

export function regenerarClave(id: string) {
  const cuenta = buscarCuenta(id)
  if (!cuenta) return
  modificar(id, { clave: generarClave() })
  registrar('Regeneró la clave de licencia', cuenta.negocio)
}

export function activarSuscripcion(id: string) {
  const cuenta = buscarCuenta(id)
  if (!cuenta) return
  const vence = new Date()
  vence.setMonth(vence.getMonth() + (cuenta.ciclo === 'anual' ? 12 : 1))
  modificar(id, { enPrueba: false, suspendida: false, vence: vence.toISOString() })
  emitirCargo(cuenta)
  registrar('Activó la suscripción de pago', `${cuenta.negocio} · ${planPorId(cuenta.planId).nombre} ${cuenta.ciclo}`)
}

export function registrarPago(pagoId: string, metodo: MetodoCobro) {
  const pago = estado.pagos.find((p) => p.id === pagoId)
  if (!pago) return
  pago.estado = 'Pagado'
  pago.metodo = metodo
  pago.pagadoEl = new Date().toISOString()
  registrar('Registró un pago', `${pago.negocio} · F-${pago.folio} · ${metodo}`)
}
