import { computed, reactive, watch, watchEffect } from 'vue'
import {
  DIAS_COBRO,
  DIAS_PRUEBA,
  PLANES,
  faseLicencia,
  finDeCobro,
  generarClave,
  migrarPlanId,
  planPorId,
  precioPlan,
  renovarVencimiento,
  type CicloPago,
  type Limite,
  type PlanId,
} from './catalogo'
import { ajustarLicenciaDe, estado as cliente, negociosLocales, type AjusteLicencia } from './negocio'
import { dinero, fecha, nombreDesdeCorreo } from '@/lib/formato'
import { ahora } from '@/lib/reloj'
import { BILLETERAS, esBilletera, tarjetaVigente, textoTarjeta, type Billetera } from '@/lib/tarjeta'
import { nuevoId } from '@/lib/utils'

export type EstadoCuenta = 'Activa' | 'En prueba' | 'En periodo de cobro' | 'Suspendida' | 'Cancelada'
export type EstadoPago = 'Pagado' | 'Pendiente' | 'Vencido' | 'Reembolsado'

/** Pagos que registra a mano un administrador de iPaletitas: solo por transferencia. */
export const METODO_COBRO = 'Transferencia'
/** La suscripción se paga con tarjeta (o billetera) al contratar y cada renovación se le cobra sola. */
export const METODO_TARJETA = 'Tarjeta'
export type MetodoCobro = typeof METODO_COBRO | typeof METODO_TARJETA | Billetera
const METODOS: string[] = [METODO_COBRO, METODO_TARJETA, ...BILLETERAS]

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
  tarjeta?: string
  /** MM/AA: si ya venció al renovar, el cargo queda pendiente en lugar de cobrarse. */
  tarjetaVence?: string
  /** Con qué se le cobran las renovaciones: tarjeta o una billetera. */
  medioPago?: MetodoCobro
  garantiaHasta?: string
  cancelada?: boolean
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
  /** Vencimiento de la licencia que cubre este cargo. */
  periodo?: string
  metodo?: MetodoCobro
  referencia?: string
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
/** Cada negocio registrado en este navegador tiene su id, para que sus cargos no pasen a otro. */
const PREFIJO_LOCAL = 'local:'
const idDeTitular = (titular: string) => `${PREFIJO_LOCAL}${titular.toLowerCase()}`
const CLAVE_ALMACEN = 'ipaletitas:admin'
const DIA = 86_400_000
const AUTOR_SISTEMA = 'Sistema'

const haceDias = (dias: number) => new Date(Date.now() - dias * DIA).toISOString()
const enDias = (dias: number) => new Date(Date.now() + dias * DIA).toISOString()
const sinAcentos = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const mesDe = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })

export function esCorreoAdmin(correo: string) {
  return correo.trim().toLowerCase().endsWith(DOMINIO_ADMIN)
}

function conceptoCargo(planId: PlanId, ciclo: CicloPago, periodo: string) {
  return `Licencia ${planPorId(planId).nombre} · ${ciclo} · ${mesDe(periodo)}`
}

type Situacion = 'prueba' | 'activa' | 'cobro' | 'suspendida'

const semilla: [string, string, string, string, PlanId, CicloPago, number, Situacion, [number, number, number], number][] = [
  ['Paletería La Flor de Michoacán', 'Rosa Hernández', 'Paletería', 'Morelia', 'doble-especial', 'mensual', 210, 'activa', [3, 6, 184], 1320],
  ['Nevería El Oso Polar', 'Jorge Ramírez', 'Nevería', 'Guadalajara', 'especial-super', 'anual', 400, 'activa', [7, 22, 540], 4870],
  ['Abarrotes Don Chuy', 'Jesús Castillo', 'Abarrotes', 'Querétaro', 'doble', 'mensual', 95, 'activa', [1, 2, 262], 910],
  ['Helados Tropicana', 'Mariana López', 'Nevería', 'Veracruz', 'doble', 'anual', 330, 'activa', [2, 5, 97], 1650],
  ['Frutería Los Pinos', 'Alberto Sánchez', 'Frutería', 'Puebla', 'basica', 'mensual', 9, 'prueba', [1, 1, 48], 64],
  ['Café Aroma de Olla', 'Daniela Torres', 'Cafetería', 'Oaxaca', 'doble', 'mensual', 12, 'prueba', [1, 3, 35], 210],
  ['Papelería Arcoíris', 'Luis Mendoza', 'Papelería', 'León', 'doble', 'mensual', 15, 'prueba', [1, 1, 120], 18],
  ['Paletas Doña Lupe', 'Guadalupe Ortiz', 'Paletería', 'Ciudad de México', 'basica', 'mensual', 150, 'suspendida', [1, 2, 45], 0],
  ['Farmacia San Rafael', 'Ricardo Flores', 'Farmacia', 'Monterrey', 'doble', 'mensual', 70, 'cobro', [2, 4, 890], 12],
  ['Tortillería La Güera', 'Patricia Ruiz', 'Tortillería', 'Toluca', 'basica', 'anual', 280, 'activa', [1, 2, 12], 2200],
  ['Minisúper El Güero', 'Fernando Díaz', 'Abarrotes', 'Mérida', 'doble-especial', 'mensual', 32, 'cobro', [3, 7, 1430], 2980],
]

/**
 * Cuentas de ejemplo con su historial de cobros ya pagados. El cargo del periodo que acaba de vencer
 * (cuentas en cobro o suspendidas) no se siembra: lo genera `sincronizarCobros` como en la vida real.
 */
function crearSemilla(): Pick<EstadoAdmin, 'cuentas' | 'pagos' | 'folioPago'> {
  const pagos: Omit<Pago, 'folio'>[] = []

  const cuentas: Cuenta[] = semilla.map(
    ([negocio, titular, giro, ciudad, planId, ciclo, altaHace, situacion, [sucursales, usuarios, productos], ventasMes], i) => {
      const dominio = sinAcentos(negocio).toLowerCase().replace(/[^a-z]+/g, '')
      const diasPeriodo = ciclo === 'anual' ? 365 : 30
      const vence = {
        prueba: enDias(DIAS_PRUEBA - altaHace),
        activa: enDias(diasPeriodo - (altaHace % diasPeriodo) || diasPeriodo),
        cobro: haceDias(0.4 + (i % DIAS_COBRO)),
        suspendida: haceDias(18),
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
        suspendida: false,
        uso: { sucursales, usuarios, productos },
        ventasMes,
        ultimoAcceso: haceDias(situacion === 'suspendida' ? 20 : (i % 3) * 0.4),
      }

      if (situacion !== 'prueba') {
        const cargos = ciclo === 'anual' ? 1 : Math.max(1, Math.min(3, Math.floor(altaHace / 30)))
        for (let k = 1; k <= cargos; k++) {
          const periodo = new Date(new Date(vence).getTime() - k * diasPeriodo * DIA)
          if (periodo.getTime() < Date.now() - (altaHace + 1) * DIA) break
          const iso = periodo.toISOString()
          pagos.push({
            id: nuevoId(),
            cuentaId: cuenta.id,
            negocio,
            concepto: conceptoCargo(planId, ciclo, iso),
            monto: precioPlan(planPorId(planId), ciclo),
            emitido: iso,
            limite: finDeCobro(iso),
            periodo: iso,
            estado: 'Pagado',
            metodo: METODO_COBRO,
            pagadoEl: new Date(
              Math.min(Date.now() - 3_600_000, periodo.getTime() + ((k + i) % DIAS_COBRO) * DIA + 3_600_000),
            ).toISOString(),
          })
        }
      }

      return cuenta
    },
  )

  let folioPago = 5001
  const ordenados = pagos
    .sort((a, b) => a.emitido.localeCompare(b.emitido))
    .map((pago) => ({ ...pago, folio: folioPago++ }))

  return { cuentas, pagos: ordenados, folioPago }
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

for (const cuenta of estado.cuentas) cuenta.planId = migrarPlanId(cuenta.planId)

// Antes se registraban pagos en depósito o efectivo; ahora todo cobro de licencia es por transferencia.
for (const pago of estado.pagos as { metodo?: string; cuentaId: string }[]) {
  if (pago.metodo && !METODOS.includes(pago.metodo)) pago.metodo = METODO_COBRO
  if (pago.cuentaId === 'cuenta-local') pago.cuentaId = idDeTitular(cliente.titular)
}

watch(estado, (valor) => localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(valor)), {
  deep: true,
  immediate: true,
})

const cuentasLocales = computed<Cuenta[]>(() =>
  negociosLocales.value.map((negocio) => {
    const licencia = negocio.licencia!
    const titular = negocio.usuarios.find((u) => u.correo.toLowerCase() === negocio.titular.toLowerCase())
    const hace30 = Date.now() - 30 * DIA
    return {
      id: idDeTitular(negocio.titular),
      local: true,
      tarjeta: licencia.tarjeta ? textoTarjeta(licencia.tarjeta) : undefined,
      tarjetaVence: licencia.tarjeta?.vence,
      medioPago: licencia.tarjeta && esBilletera(licencia.tarjeta.marca) ? licencia.tarjeta.marca : METODO_TARJETA,
      garantiaHasta: licencia.garantiaHasta,
      cancelada: Boolean(licencia.cancelada),
      negocio: licencia.negocio,
      titular: titular?.nombre ?? nombreDesdeCorreo(negocio.titular, 'Titular'),
      correo: negocio.titular,
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
        sucursales: negocio.sucursales.length,
        usuarios: negocio.usuarios.length,
        productos: negocio.productos.length,
      },
      ventasMes: negocio.ventas.filter((v) => new Date(v.fecha).getTime() >= hace30).length,
      ultimoAcceso: negocio.ventas.at(-1)?.fecha ?? licencia.inicio,
    }
  }),
)

export const cuentas = computed(() => [...cuentasLocales.value, ...estado.cuentas])

export function buscarCuenta(id: string) {
  return cuentas.value.find((c) => c.id === id) ?? null
}

/** Semana gratis en curso: pagó, pero todavía puede pedir su devolución. */
export function enSemanaGratis(cuenta: Cuenta) {
  return Boolean(cuenta.garantiaHasta && !cuenta.cancelada && ahora.value < new Date(cuenta.garantiaHasta).getTime())
}

export function estadoDe(cuenta: Cuenta): EstadoCuenta {
  if (cuenta.cancelada) return 'Cancelada'
  const fase = faseLicencia(cuenta, ahora.value)
  if (fase === 'suspendida') return 'Suspendida'
  if (fase === 'cobro') return 'En periodo de cobro'
  return cuenta.enPrueba || enSemanaGratis(cuenta) ? 'En prueba' : 'Activa'
}

/** Cargo que todavía se debe (ni pagado ni reembolsado). */
export const porCobrar = (pago: Pago) => pago.estado === 'Pendiente' || pago.estado === 'Vencido'

/** Suspendida porque pasó el plazo de cobro, no porque un administrador la pausara. */
export function suspendidaPorFaltaDePago(cuenta: Cuenta) {
  return !cuenta.suspendida && faseLicencia(cuenta, ahora.value) === 'suspendida'
}

export function diasPara(iso: string) {
  return Math.ceil((new Date(iso).getTime() - ahora.value) / DIA)
}

export function mensualidad(cuenta: Cuenta) {
  const plan = planPorId(cuenta.planId)
  return cuenta.ciclo === 'anual' ? precioPlan(plan, 'anual') / 12 : plan.precioMensual
}

export function pagosDe(cuentaId: string) {
  return estado.pagos.filter((p) => p.cuentaId === cuentaId).sort((a, b) => b.emitido.localeCompare(a.emitido))
}

/** El cargo sin pagar más antiguo de la cuenta: es el primero que se cobra. */
export function cargoPendienteDe(cuentaId: string) {
  return (
    estado.pagos
      .filter((p) => p.cuentaId === cuentaId && porCobrar(p))
      .sort((a, b) => a.emitido.localeCompare(b.emitido))[0] ?? null
  )
}

/** Hasta cuándo queda activa la licencia si hoy se registra su pago. */
export function vencimientoAlPagar(cuentaId: string) {
  const cuenta = buscarCuenta(cuentaId)
  return cuenta ? renovarVencimiento(cuenta.vence, cuenta.ciclo, ahora.value) : null
}

export const metricas = computed(() => {
  const lista = cuentas.value
  const porEstado: Record<EstadoCuenta, number> = {
    Activa: 0,
    'En prueba': 0,
    'En periodo de cobro': 0,
    Suspendida: 0,
    Cancelada: 0,
  }
  for (const cuenta of lista) porEstado[estadoDe(cuenta)]++

  const activas = lista.filter((c) => estadoDe(c) === 'Activa')
  const enPrueba = lista.filter((c) => estadoDe(c) === 'En prueba')
  const pendientes = estado.pagos.filter(porCobrar)
  const mesActual = new Date(ahora.value).toISOString().slice(0, 7)

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

/** La bitácora va de lo más reciente a lo más antiguo; los eventos automáticos llevan su fecha real. */
function registrar(accion: string, detalle: string, opciones: { autor?: string; fecha?: string } = {}) {
  const evento: Evento = {
    id: nuevoId(),
    fecha: opciones.fecha ?? new Date().toISOString(),
    autor: opciones.autor ?? estado.sesion?.nombre ?? AUTOR_SISTEMA,
    accion,
    detalle,
  }
  const lugar = estado.bitacora.findIndex((e) => e.fecha <= evento.fecha)
  estado.bitacora.splice(lugar === -1 ? estado.bitacora.length : lugar, 0, evento)
}

function modificar(id: string, cambios: AjusteLicencia) {
  if (id.startsWith(PREFIJO_LOCAL)) {
    ajustarLicenciaDe(id.slice(PREFIJO_LOCAL.length), cambios)
    return
  }
  const cuenta = estado.cuentas.find((c) => c.id === id)
  if (cuenta) Object.assign(cuenta, cambios)
}

function emitirCargo(cuenta: Cuenta, periodo: string, emitido = periodo) {
  estado.pagos.push({
    id: nuevoId(),
    folio: estado.folioPago++,
    cuentaId: cuenta.id,
    negocio: cuenta.negocio,
    concepto: conceptoCargo(cuenta.planId, cuenta.ciclo, periodo),
    monto: precioPlan(planPorId(cuenta.planId), cuenta.ciclo),
    emitido,
    limite: finDeCobro(periodo),
    periodo,
    estado: 'Pendiente',
  })
  return estado.pagos[estado.pagos.length - 1]!
}

const tarjetaCobrable = (cuenta: Cuenta, momento: string) =>
  Boolean(cuenta.tarjeta && tarjetaVigente({ vence: cuenta.tarjetaVence ?? '' }, momento))

/** Cobra el cargo a la tarjeta (o billetera) de la cuenta y renueva la licencia un periodo. */
function cobrarATarjeta(cargo: Pago, cuenta: Cuenta, cuando: string) {
  const vence = renovarVencimiento(cuenta.vence, cuenta.ciclo, new Date(cuando).getTime())
  Object.assign(cargo, {
    estado: 'Pagado',
    metodo: cuenta.medioPago ?? METODO_TARJETA,
    referencia: cuenta.tarjeta,
    pagadoEl: cuando,
  } satisfies Partial<Pago>)
  modificar(cuenta.id, { vence, enPrueba: false, suspendida: false })
  registrar(
    'Cobró la renovación automática',
    `${cuenta.negocio} · F-${cargo.folio} · ${cuenta.tarjeta} · licencia activa hasta el ${fecha(vence)}`,
    { autor: AUTOR_SISTEMA, fecha: cuando },
  )
}

/** Primer pago al contratar desde este navegador, con el medio que acaba de registrar. */
export function cobrarContratacion(opciones: { cupon?: string; porcentaje?: number; meses?: number } = {}) {
  const cuenta = buscarCuenta(idDeTitular(cliente.titular))
  if (!cuenta) return
  const ahoraIso = new Date().toISOString()
  const cargo = emitirCargo(cuenta, cuenta.alta, ahoraIso)
  if (opciones.porcentaje) cargo.monto = Math.round(cargo.monto * (100 - opciones.porcentaje)) / 100
  Object.assign(cargo, {
    estado: 'Pagado',
    metodo: cuenta.medioPago ?? METODO_TARJETA,
    referencia: cuenta.tarjeta,
    pagadoEl: ahoraIso,
  } satisfies Partial<Pago>)
  registrar(
    'Cobró la contratación',
    [
      cuenta.negocio,
      `F-${cargo.folio}`,
      dinero(cargo.monto),
      cuenta.tarjeta ?? METODO_TARJETA,
      opciones.meses ? `${opciones.meses} meses sin intereses` : '',
      opciones.cupon ? `cupón ${opciones.cupon} (-${opciones.porcentaje}%)` : '',
      cuenta.garantiaHasta ? `semana gratis hasta el ${fecha(cuenta.garantiaHasta)}` : 'sin semana gratis',
    ]
      .filter(Boolean)
      .join(' · '),
    { autor: AUTOR_SISTEMA, fecha: ahoraIso },
  )
}

/** El cargo de la contratación que cubre la semana gratis de la cuenta abierta, si todavía se puede devolver. */
export function cargoDevolvible() {
  const cuenta = buscarCuenta(idDeTitular(cliente.titular))
  if (!cuenta || !enSemanaGratis(cuenta)) return null
  return (
    estado.pagos.find((p) => p.cuentaId === cuenta.id && p.periodo === cuenta.alta && p.estado === 'Pagado') ?? null
  )
}

/** Devolución de la semana gratis: se reembolsa el primer pago a su tarjeta y la suscripción termina. */
export function devolverSemanaGratis() {
  const cuenta = buscarCuenta(idDeTitular(cliente.titular))
  const cargo = cargoDevolvible()
  if (!cuenta || !cargo) return null
  cargo.estado = 'Reembolsado'
  modificar(cuenta.id, { cancelada: true })
  registrar(
    'Devolvió el pago de la semana gratis',
    `${cuenta.negocio} · F-${cargo.folio} · ${dinero(cargo.monto)} a ${cargo.referencia ?? METODO_TARJETA}`,
    { autor: cliente.sesion?.nombre ?? cuenta.titular },
  )
  return cargo
}

/** Lo que debe el negocio abierto en este navegador, si debe algo. */
export const cargoPendienteActual = () => cargoPendienteDe(idDeTitular(cliente.titular))

/** Con una tarjeta nueva, el cliente paga lo que debía y su licencia se renueva (o se reactiva). */
export function cobrarPendienteATarjeta() {
  const cuenta = buscarCuenta(idDeTitular(cliente.titular))
  const cargo = cuenta && cargoPendienteDe(cuenta.id)
  if (!cuenta || !cargo || !tarjetaCobrable(cuenta, new Date().toISOString())) return null
  cobrarATarjeta(cargo, cuenta, new Date().toISOString())
  return cargo
}

/**
 * Al vencer una licencia (o su prueba) se genera su cargo con fecha límite a DIAS_COBRO días.
 * Si llega la fecha límite sin pago, el cargo pasa a Vencido y la licencia queda suspendida.
 */
function sincronizarCobros() {
  const momento = ahora.value
  for (const cuenta of cuentas.value) {
    if (cuenta.cancelada || momento <= new Date(cuenta.vence).getTime()) continue
    if (estado.pagos.some((p) => p.cuentaId === cuenta.id && p.periodo === cuenta.vence)) continue

    const anterior = estado.pagos.find((p) => p.cuentaId === cuenta.id && porCobrar(p) && !p.periodo)
    if (anterior) {
      anterior.periodo = cuenta.vence
      anterior.limite = finDeCobro(cuenta.vence)
      continue
    }

    const cargo = emitirCargo(cuenta, cuenta.vence)
    if (tarjetaCobrable(cuenta, cuenta.vence)) {
      cobrarATarjeta(cargo, cuenta, cuenta.vence)
      continue
    }
    const motivo = cuenta.tarjeta ? `su tarjeta ${cuenta.tarjeta} está vencida` : `terminó su ${cuenta.enPrueba ? 'prueba gratis' : 'periodo'}`
    registrar(
      'Generó un cargo',
      `${cuenta.negocio} · F-${cargo.folio} · ${motivo}; tiene ${DIAS_COBRO} días para pagar`,
      { autor: AUTOR_SISTEMA, fecha: cuenta.vence },
    )
  }

  for (const pago of estado.pagos) {
    if (!porCobrar(pago)) continue
    const nuevo: EstadoPago = momento >= new Date(pago.limite).getTime() ? 'Vencido' : 'Pendiente'
    if (pago.estado === nuevo) continue
    pago.estado = nuevo
    if (nuevo === 'Vencido' && pago.periodo) {
      registrar('Suspendió la licencia por falta de pago', `${pago.negocio} · F-${pago.folio}`, {
        autor: AUTOR_SISTEMA,
        fecha: pago.limite,
      })
    }
  }
}

watchEffect(sincronizarCobros)

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
  // El cargo que se generó al terminar la prueba deja de aplicar: la prueba sigue.
  estado.pagos = estado.pagos.filter((p) => !(p.cuentaId === id && porCobrar(p) && p.periodo === cuenta.vence))
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

/**
 * Registra la transferencia de un cargo: la licencia se renueva un periodo (mensual o anual),
 * sale de la prueba y se reactiva si estaba suspendida. Devuelve la nueva fecha de vencimiento.
 */
export function registrarPago(pagoId: string, referencia = '') {
  const pago = estado.pagos.find((p) => p.id === pagoId)
  if (!pago || !porCobrar(pago)) return null
  const folio = referencia.trim()

  pago.estado = 'Pagado'
  pago.metodo = METODO_COBRO
  pago.referencia = folio || undefined
  pago.pagadoEl = new Date().toISOString()

  const cuenta = buscarCuenta(pago.cuentaId)
  const vence = cuenta ? renovarVencimiento(cuenta.vence, cuenta.ciclo) : null
  if (cuenta && vence) modificar(cuenta.id, { vence, enPrueba: false, suspendida: false })

  registrar(
    'Registró un pago',
    [
      pago.negocio,
      `F-${pago.folio}`,
      folio ? `${METODO_COBRO} ${folio}` : METODO_COBRO,
      vence ? `licencia activa hasta el ${fecha(vence)}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
  )
  return vence
}

/** Cobra el cargo pendiente más antiguo de la cuenta o, si no debe nada, su siguiente periodo por adelantado. */
export function registrarPagoCuenta(cuentaId: string, referencia = '') {
  const cuenta = buscarCuenta(cuentaId)
  if (!cuenta) return null
  const cargo = cargoPendienteDe(cuentaId) ?? emitirCargo(cuenta, cuenta.vence, new Date().toISOString())
  return registrarPago(cargo.id, referencia)
}

/** Vista previa del cargo que cobraría `registrarPagoCuenta`, sin guardarlo. */
export function cargoPorCobrar(cuentaId: string) {
  const pendiente = cargoPendienteDe(cuentaId)
  if (pendiente) return pendiente
  const cuenta = buscarCuenta(cuentaId)
  if (!cuenta) return null
  return {
    folio: estado.folioPago,
    negocio: cuenta.negocio,
    concepto: conceptoCargo(cuenta.planId, cuenta.ciclo, cuenta.vence),
    monto: precioPlan(planPorId(cuenta.planId), cuenta.ciclo),
  }
}
