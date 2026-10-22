import { computed, reactive, watch } from 'vue'
import {
  DIAS_GARANTIA,
  PLANES,
  PLAN_RECOMENDADO,
  diasParaPagar,
  faseLicencia,
  finDeCobro,
  generarClave,
  migrarPlanId,
  type CicloPago,
  type Limite,
  type PlanId,
} from './catalogo'
import {
  abonarAnticipoApi,
  activarLicenciaApi,
  actualizarProductoApi,
  actualizarUsuarioApi,
  cambiarPlanApi,
  cambiarSucursalApi,
  crearProductoApi,
  crearSucursalApi,
  crearUsuarioApi,
  eliminarProductoApi,
  eliminarUsuarioApi,
  guardarMarcaApi,
  reactivarUsuarioApi,
  leerToken,
  obtenerNegocioApi,
  quitarMarcaApi,
  registrarEntradaApi,
  registrarPerdidaApi,
  registrarVentaApi,
  terminarTutorialApi,
  type SnapshotNegocio,
} from '@/lib/api'
import { nombreDesdeCorreo } from '@/lib/formato'
import { ahora } from '@/lib/reloj'
import type { TarjetaRegistrada } from '@/lib/tarjeta'
import { nuevoId } from '@/lib/utils'

export { DIAS_COBRO, DIAS_GARANTIA, DIAS_PRUEBA, PLANES, PLAN_RECOMENDADO, acentoPlan, planPorId, precioPlan } from './catalogo'
export type { CicloPago, FaseLicencia, Limite, Plan, PlanId } from './catalogo'

export const CORREO_PAGOS = 'soporte@ipaletitas.com'

export type Rol = 'Administrador' | 'Gerente' | 'Cajero' | 'Almacén'
export type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Transferencia'

export interface Sucursal {
  id: string
  nombre: string
  direccion: string
}

export const MODULOS = [
  { id: 'ventas', nombre: 'Punto de venta' },
  { id: 'productos', nombre: 'Productos' },
  { id: 'entradas', nombre: 'Entradas' },
  { id: 'perdidas', nombre: 'Caducados' },
  { id: 'historial', nombre: 'Historial' },
  { id: 'usuarios', nombre: 'Usuarios' },
  { id: 'sucursales', nombre: 'Sucursales' },
  { id: 'licencia', nombre: 'Licencia' },
] as const

export const ACCIONES = [
  { id: 'ver', nombre: 'Ver' },
  { id: 'crear', nombre: 'Crear' },
  { id: 'editar', nombre: 'Editar' },
  { id: 'eliminar', nombre: 'Eliminar' },
] as const

export type ModuloId = (typeof MODULOS)[number]['id']
export type AccionId = (typeof ACCIONES)[number]['id']
export type Permiso = `${ModuloId}.${AccionId}`

export interface Usuario {
  id: string
  nombre: string
  correo: string
  telefono: string
  puesto: string
  fechaIngreso: string
  rol: Rol
  sucursalId: string
  activo: boolean
  permisos: Permiso[]
}

export type DatosUsuario = Omit<Usuario, 'id'>

export interface Producto {
  id: string
  sku: string
  nombre: string
  categoria: string
  precio: number
  costo: number
  stockMinimo: number
  /** Fecha de caducidad (YYYY-MM-DD). Si no hay, no entra a avisos de caducados. */
  caducidad?: string
  existencias: Record<string, number>
}

export type MotivoPerdida = 'Caducidad' | 'Daño' | 'Merma' | 'Otro'

export interface Perdida {
  id: string
  folio: number
  fecha: string
  sucursalId: string
  productoId: string
  producto: string
  cantidad: number
  costoUnitario: number
  motivo: MotivoPerdida
  nota: string
}

export interface Entrada {
  id: string
  folio: number
  fecha: string
  sucursalId: string
  productoId: string
  producto: string
  cantidad: number
  costoUnitario: number
  proveedor: string
  nota: string
}

export interface Partida {
  productoId: string
  nombre: string
  cantidad: number
  precio: number
}

export interface Pago {
  fecha: string
  monto: number
  metodo: MetodoPago
  recibido: number
}

export interface Anticipo {
  cliente: string
  telefono: string
  entrega: string
  pagos: Pago[]
}

export type DatosAnticipo = Pick<Anticipo, 'cliente' | 'telefono' | 'entrega'> & { monto: number }

export interface Venta {
  id: string
  folio: number
  fecha: string
  sucursalId: string
  cajero: string
  metodoPago: MetodoPago
  partidas: Partida[]
  total: number
  recibido: number
  anticipo?: Anticipo
}

export interface Licencia {
  planId: PlanId
  ciclo: CicloPago
  clave: string
  inicio: string
  vence: string
  negocio: string
  giro: string
  telefono: string
  /** Prueba sin pago de las cuentas anteriores; las nuevas pagan al contratar. */
  enPrueba?: boolean
  suspendida?: boolean
  /** Tarjeta o billetera con la que se pagó: cada renovación se le cobra sola. */
  tarjeta?: TarjetaRegistrada
  /** Fin de la semana gratis: hasta entonces puede pedir la devolución completa de su primer pago. */
  garantiaHasta?: string
  /** Pidió su devolución en la semana gratis: la suscripción terminó. */
  cancelada?: boolean
  facturacion?: Facturacion
}

export interface Facturacion {
  pais: string
  estado: string
  direccion: string
  codigoPostal: string
}

/** Identidad del negocio dentro del panel: su logo y el color que lo pinta. */
export interface Marca {
  logo: string | null
  color: string | null
}

interface Estado {
  sesion: { correo: string; nombre: string } | null
  titular: string
  licencia: Licencia | null
  /** La semana gratis solo se da una vez por cuenta. */
  pruebaUsada: boolean
  /** Las cuentas recién creadas ven el recorrido guiado la primera vez que entran al panel. */
  tutorialPendiente: boolean
  marca: Marca
  planElegido: { planId: PlanId; ciclo: CicloPago } | null
  sucursalActivaId: string
  sucursales: Sucursal[]
  usuarios: Usuario[]
  productos: Producto[]
  entradas: Entrada[]
  perdidas: Perdida[]
  ventas: Venta[]
  folioVenta: number
  folioEntrada: number
  folioPerdida: number
}

export const IVA = 0.16

export const clavePermiso = (modulo: ModuloId, accion: AccionId): Permiso => `${modulo}.${accion}`

export const TODOS_LOS_PERMISOS: Permiso[] = MODULOS.flatMap((m) => ACCIONES.map((a) => clavePermiso(m.id, a.id)))

export const ordenarPermisos = (permisos: Permiso[]) => TODOS_LOS_PERMISOS.filter((p) => permisos.includes(p))

export const ROLES: { rol: Rol; descripcion: string; permisos: Permiso[] }[] = [
  {
    rol: 'Administrador',
    descripcion: 'Acceso total: licencia, usuarios, sucursales y reportes.',
    permisos: TODOS_LOS_PERMISOS,
  },
  {
    rol: 'Gerente',
    descripcion: 'Lleva la operación diaria y al personal, sin tocar la licencia.',
    permisos: [
      'ventas.ver', 'ventas.crear', 'ventas.editar', 'ventas.eliminar',
      'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
      'entradas.ver', 'entradas.crear', 'entradas.editar', 'entradas.eliminar',
      'perdidas.ver', 'perdidas.crear', 'perdidas.editar', 'perdidas.eliminar',
      'historial.ver',
      'usuarios.ver', 'usuarios.crear', 'usuarios.editar',
      'sucursales.ver',
      'licencia.ver',
    ],
  },
  {
    rol: 'Cajero',
    descripcion: 'Cobra en el punto de venta y consulta el historial.',
    permisos: ['ventas.ver', 'ventas.crear', 'productos.ver', 'historial.ver'],
  },
  {
    rol: 'Almacén',
    descripcion: 'Da de alta productos, registra entradas y baja caducados a pérdida.',
    permisos: [
      'productos.ver', 'productos.crear', 'productos.editar',
      'entradas.ver', 'entradas.crear', 'entradas.editar',
      'perdidas.ver', 'perdidas.crear', 'perdidas.editar',
    ],
  },
]

export const permisosDeRol = (rol: Rol): Permiso[] => [...(ROLES.find((r) => r.rol === rol) ?? ROLES[0]!).permisos]

const hoy = () => new Date().toLocaleDateString('en-CA')

const CLAVE_ALMACEN = 'ipaletitas:v1'
/** Los demás negocios registrados en este navegador, por correo del titular. El abierto vive en CLAVE_ALMACEN. */
const CLAVE_CUENTAS = 'ipaletitas:cuentas'

type DatosNegocio = Omit<Estado, 'sesion'>

function estadoVacio(): Estado {
  return {
    sesion: null,
    titular: '',
    licencia: null,
    pruebaUsada: false,
    tutorialPendiente: false,
    marca: { logo: null, color: null },
    planElegido: null,
    sucursalActivaId: '',
    sucursales: [],
    usuarios: [],
    productos: [],
    entradas: [],
    perdidas: [],
    ventas: [],
    folioVenta: 1001,
    folioEntrada: 1,
    folioPerdida: 1,
  }
}

function cargar(): Estado {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACEN)
    return guardado ? { ...estadoVacio(), ...JSON.parse(guardado) } : estadoVacio()
  } catch {
    return estadoVacio()
  }
}

function cargarOtrosNegocios(): Record<string, DatosNegocio> {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_CUENTAS) ?? '{}')
  } catch {
    return {}
  }
}

export const estado = reactive<Estado>(cargar())
const otrosNegocios = reactive<Record<string, DatosNegocio>>(cargarOtrosNegocios())

// Cuentas guardadas antes de caducados / pérdidas.
estado.perdidas ??= []
estado.folioPerdida ??= 1

// Usuarios guardados antes de que existieran puesto, teléfono, fecha de ingreso y permisos.
for (const usuario of estado.usuarios as Partial<Usuario>[]) {
  usuario.telefono ??= ''
  usuario.puesto ??= usuario.rol ?? 'Cajero'
  usuario.fechaIngreso ??= estado.licencia?.inicio.slice(0, 10) ?? hoy()
  usuario.permisos ??= permisosDeRol(usuario.rol ?? 'Cajero')
  // Quien ya podía ver o crear entradas también ve Caducados.
  if (usuario.permisos?.includes('entradas.ver') && !usuario.permisos.includes('perdidas.ver')) {
    usuario.permisos = ordenarPermisos([
      ...usuario.permisos,
      'perdidas.ver',
      ...(usuario.permisos.includes('entradas.crear') ? (['perdidas.crear', 'perdidas.editar'] as Permiso[]) : []),
      ...(usuario.permisos.includes('entradas.eliminar') ? (['perdidas.eliminar'] as Permiso[]) : []),
    ])
  }
}

// Antes cualquier sesión era la del dueño: se toma esa (o el primer administrador) como titular.
if (estado.licencia && !estado.titular) {
  estado.titular = estado.sesion?.correo ?? estado.usuarios.find((u) => u.rol === 'Administrador')?.correo ?? ''
}

if (estado.licencia) estado.licencia.planId = migrarPlanId(estado.licencia.planId)
// Las cuentas que ya tuvieron su prueba de 14 días no reciben además la semana gratis.
if (estado.licencia) estado.pruebaUsada = true
for (const negocio of Object.values(otrosNegocios)) if (negocio.licencia) negocio.pruebaUsada = true
if (estado.planElegido) estado.planElegido.planId = migrarPlanId(estado.planElegido.planId)

watch(estado, (valor) => localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(valor)), { deep: true })
watch(otrosNegocios, (valor) => localStorage.setItem(CLAVE_CUENTAS, JSON.stringify(valor)), { deep: true })

/** ¿Hay sesión JWT? El panel escribe en Postgres; si no, cae a localStorage. */
export const usaApi = () => Boolean(leerToken())

export function aplicarSnapshot(snap: SnapshotNegocio) {
  const s = snap as Partial<Estado>
  const sesionPrevia = estado.sesion
  const sucursalPrevia = estado.sucursalActivaId
  Object.assign(estado, {
    titular: s.titular ?? '',
    licencia: s.licencia ?? null,
    pruebaUsada: s.pruebaUsada ?? false,
    tutorialPendiente: s.tutorialPendiente ?? false,
    marca: s.marca ?? { logo: null, color: null },
    planElegido: s.planElegido ?? null,
    sucursales: s.sucursales ?? [],
    usuarios: s.usuarios ?? [],
    productos: s.productos ?? [],
    entradas: s.entradas ?? [],
    perdidas: s.perdidas ?? [],
    ventas: s.ventas ?? [],
    folioVenta: s.folioVenta ?? 1001,
    folioEntrada: s.folioEntrada ?? 1,
    folioPerdida: s.folioPerdida ?? 1,
    sucursalActivaId: s.sucursalActivaId || sucursalPrevia || s.sucursales?.[0]?.id || '',
    sesion: s.sesion ?? sesionPrevia,
  })
}

export async function sincronizarDesdeApi() {
  if (!usaApi()) return false
  const snap = await obtenerNegocioApi()
  aplicarSnapshot(snap)
  return true
}

export async function guardarMarca(marca: Partial<Marca>) {
  const siguiente = { ...estado.marca, ...marca }
  if (usaApi()) {
    aplicarSnapshot(await guardarMarcaApi(siguiente))
    return
  }
  estado.marca = siguiente
}

export async function quitarMarca() {
  if (usaApi()) {
    aplicarSnapshot(await quitarMarcaApi())
    return
  }
  estado.marca = { logo: null, color: null }
}

export const planActual = computed(() => PLANES.find((p) => p.id === estado.licencia?.planId) ?? null)

export const sucursalActiva = computed(
  () => estado.sucursales.find((s) => s.id === estado.sucursalActivaId) ?? estado.sucursales[0] ?? null,
)

export const diasRestantes = computed(() => {
  if (!estado.licencia) return 0
  const ms = new Date(estado.licencia.vence).getTime() - ahora.value
  return Math.max(0, Math.ceil(ms / 86_400_000))
})

export const faseActual = computed(() =>
  estado.licencia ? faseLicencia(estado.licencia, ahora.value) : 'vigente',
)

/** Mientras corre el plazo de cobro: cuántos días quedan y cuándo se suspende. */
export const plazoDeCobro = computed(() => {
  if (!estado.licencia || faseActual.value !== 'cobro') return null
  return { dias: diasParaPagar(estado.licencia.vence, ahora.value), suspende: finDeCobro(estado.licencia.vence) }
})

export const ventasSucursal = computed(() =>
  estado.ventas.filter((v) => v.sucursalId === sucursalActiva.value?.id),
)

export function pagadoDe(venta: Venta) {
  return venta.anticipo ? venta.anticipo.pagos.reduce((suma, p) => suma + p.monto, 0) : venta.total
}

export function saldoDe(venta: Venta) {
  return Math.max(0, Math.round((venta.total - pagadoDe(venta)) * 100) / 100)
}

export const anticiposPendientes = computed(() =>
  ventasSucursal.value.filter((v) => v.anticipo && saldoDe(v) > 0).sort((a, b) => a.fecha.localeCompare(b.fecha)),
)

export const enPrueba = computed(() => estado.licencia?.enPrueba !== false)

/** Semana gratis en curso: hasta cuándo puede pedir la devolución de su primer pago. */
export const semanaGratis = computed(() => {
  const hasta = estado.licencia?.garantiaHasta
  if (!hasta || estado.licencia?.cancelada || ahora.value >= new Date(hasta).getTime()) return null
  return { hasta, dias: Math.max(1, Math.ceil((new Date(hasta).getTime() - ahora.value) / 86_400_000)) }
})

export type MotivoBloqueo = 'suspendida' | 'sinPago' | 'devolucion'

/**
 * suspendida: la pausó un administrador de iPaletitas · sinPago: pasó el plazo de cobro sin pagar ·
 * devolucion: pidió su devolución en la semana gratis y la suscripción terminó.
 */
export const bloqueo = computed<MotivoBloqueo | null>(() => {
  if (!estado.licencia) return null
  if (estado.licencia.cancelada) return 'devolucion'
  if (estado.licencia.suspendida) return 'suspendida'
  return faseActual.value === 'suspendida' ? 'sinPago' : null
})

export function stock(producto: Producto, sucursalId = sucursalActiva.value?.id ?? '') {
  return producto.existencias[sucursalId] ?? 0
}

export type EstadoStock = 'agotado' | 'bajo' | 'ok'

export function estadoStock(producto: Producto): EstadoStock {
  const existencia = stock(producto)
  if (existencia <= 0) return 'agotado'
  return existencia <= producto.stockMinimo ? 'bajo' : 'ok'
}

export const agotados = computed(() => estado.productos.filter((p) => estadoStock(p) === 'agotado'))

export const porAcabarse = computed(() =>
  estado.productos.filter((p) => estadoStock(p) === 'bajo').sort((a, b) => stock(a) - stock(b)),
)

/** Días hasta la caducidad (negativo = ya venció). Null si el producto no tiene fecha. */
export function diasParaCaducar(producto: Producto): number | null {
  if (!producto.caducidad) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vence = new Date(`${producto.caducidad}T00:00:00`)
  return Math.round((vence.getTime() - hoy.getTime()) / 86_400_000)
}

export type EstadoCaducidad = 'caducado' | 'porCaducar' | 'ok' | 'sinFecha'

/** Por caducar: vence en 7 días o menos y aún tiene existencias. */
export function estadoCaducidad(producto: Producto): EstadoCaducidad {
  const dias = diasParaCaducar(producto)
  if (dias === null) return 'sinFecha'
  if (dias < 0) return 'caducado'
  if (dias <= 7) return 'porCaducar'
  return 'ok'
}

export const caducados = computed(() =>
  estado.productos
    .filter((p) => estadoCaducidad(p) === 'caducado' && stock(p) > 0)
    .sort((a, b) => (diasParaCaducar(a) ?? 0) - (diasParaCaducar(b) ?? 0)),
)

export const porCaducar = computed(() =>
  estado.productos
    .filter((p) => estadoCaducidad(p) === 'porCaducar' && stock(p) > 0)
    .sort((a, b) => (diasParaCaducar(a) ?? 0) - (diasParaCaducar(b) ?? 0)),
)

export const perdidasSucursal = computed(() =>
  estado.perdidas.filter((p) => p.sucursalId === sucursalActiva.value?.id),
)

export function nombreSucursal(id: string) {
  return estado.sucursales.find((s) => s.id === id)?.nombre ?? 'Sin sucursal'
}

export function uso(limite: Limite) {
  // Solo cuentan usuarios activos: las bajas quedan en historial y liberan cupo del plan.
  if (limite === 'usuarios') return estado.usuarios.filter((u) => u.activo).length
  return estado[limite].length
}

export function limiteDe(limite: Limite) {
  return planActual.value?.limites[limite] ?? 0
}

export function puedeAgregar(limite: Limite) {
  return uso(limite) < limiteDe(limite)
}

export function resumenUso(limite: Limite) {
  const maximo = limiteDe(limite)
  return maximo === Infinity
    ? `${uso(limite)} ${limite} · sin límite`
    : `${uso(limite)} de ${maximo.toLocaleString('es-MX')} ${limite}`
}

const mismoCorreo = (a = '', b = '') => a.trim().toLowerCase() === b.trim().toLowerCase()

export const usuarioActual = computed(
  () => estado.usuarios.find((u) => mismoCorreo(u.correo, estado.sesion?.correo)) ?? null,
)

export const sesionEsTitular = computed(() => !!estado.sesion && mismoCorreo(estado.sesion.correo, estado.titular))

export function puede(permiso: Permiso) {
  if (sesionEsTitular.value) return true
  const usuario = usuarioActual.value
  return !!usuario?.activo && usuario.permisos.includes(permiso)
}

/** Solo el titular y los administradores pueden moverse entre sucursales. */
export const sucursalFija = computed(
  () => !sesionEsTitular.value && usuarioActual.value?.rol !== 'Administrador',
)

/** Sesión de un empleado que ya fue dado de baja o desactivado. */
export const accesoRevocado = computed(
  () => !!estado.sesion && !!estado.licencia && !sesionEsTitular.value && !usuarioActual.value?.activo,
)

const perteneceA = (negocio: Pick<Estado, 'titular' | 'usuarios'>, correo: string) =>
  mismoCorreo(negocio.titular, correo) || negocio.usuarios.some((u) => mismoCorreo(u.correo, correo))

function negocioDe(correo: string): DatosNegocio | null {
  if (perteneceA(estado, correo)) return estado
  return Object.values(otrosNegocios).find((negocio) => perteneceA(negocio, correo)) ?? null
}

export const existeCuenta = (correo: string) => negocioDe(correo) !== null

/** Negocios con licencia registrados en este navegador; el abierto primero. */
export const negociosLocales = computed<DatosNegocio[]>(() =>
  [estado, ...Object.values(otrosNegocios)].filter((negocio) => negocio.licencia && negocio.titular),
)

/** Guarda el negocio abierto con los demás y deja cargado el indicado (o uno vacío). */
function abrirNegocio(siguiente: DatosNegocio | null) {
  const copia = (datos: DatosNegocio) => JSON.parse(JSON.stringify(datos)) as Estado
  const abierto = siguiente ? copia(siguiente) : null
  if (estado.titular) {
    const { sesion: _sesion, ...actual } = copia(estado)
    otrosNegocios[estado.titular.toLowerCase()] = actual
  }
  if (abierto) delete otrosNegocios[abierto.titular.toLowerCase()]
  Object.assign(estado, estadoVacio(), abierto, { sesion: null })
}

export function validarIngreso(correo: string): string | null {
  const negocio = negocioDe(correo)
  if (!negocio) return 'No encontramos una cuenta con ese correo. Revisa que esté bien escrito o crea tu cuenta.'
  if (!negocio.licencia || mismoCorreo(correo, negocio.titular)) return null
  const usuario = negocio.usuarios.find((u) => mismoCorreo(u.correo, correo))
  if (!usuario?.activo) return 'Tu usuario está desactivado. Habla con el administrador de tu negocio.'
  return null
}

/** Cuenta nueva: el correo queda como titular de un negocio vacío que todavía no elige plan. */
export function registrarCuenta(correo: string): string | null {
  const limpio = correo.trim().toLowerCase()
  if (existeCuenta(limpio)) return 'Ya hay una cuenta con este correo. Inicia sesión para entrar a ella.'
  abrirNegocio(null)
  estado.titular = limpio
  estado.sesion = { correo: limpio, nombre: nombreDesdeCorreo(limpio, 'Titular') }
  return null
}

export function iniciarSesion(correo: string) {
  const limpio = correo.trim().toLowerCase()
  const negocio = negocioDe(limpio)
  if (negocio) {
    if (!perteneceA(estado, limpio)) abrirNegocio(negocio)
  } else if (!perteneceA(estado, limpio)) {
    // Cuenta autenticada en la API pero aún sin datos locales en este dispositivo.
    abrirNegocio(null)
    estado.titular = limpio
  }
  const usuario = estado.usuarios.find((u) => mismoCorreo(u.correo, limpio))
  estado.sesion = { correo: limpio, nombre: usuario?.nombre ?? nombreDesdeCorreo(limpio, 'Titular') }
  if (usuario && sucursalFija.value) estado.sucursalActivaId = usuario.sucursalId
}

export function cerrarSesion() {
  estado.sesion = null
}

export function elegirPlan(planId: PlanId, ciclo: CicloPago) {
  estado.planElegido = { planId, ciclo }
}

export async function activarLicencia(datos: {
  negocio: string
  giro: string
  telefono: string
  sucursal: string
  tarjeta: TarjetaRegistrada
  facturacion: Facturacion
}) {
  const eleccion = estado.planElegido ?? { planId: PLAN_RECOMENDADO, ciclo: 'mensual' as const }

  if (usaApi()) {
    aplicarSnapshot(
      await activarLicenciaApi({
        ...datos,
        planId: eleccion.planId,
        ciclo: eleccion.ciclo,
      }),
    )
    estado.planElegido = null
    return
  }

  if (!estado.licencia || !estado.titular || !usuarioActual.value) estado.titular = estado.sesion?.correo ?? ''
  const inicio = new Date()
  ahora.value = inicio.getTime()
  const vence = new Date(inicio)
  vence.setMonth(vence.getMonth() + (eleccion.ciclo === 'anual' ? 12 : 1))
  const garantia = estado.pruebaUsada ? undefined : new Date(inicio.getTime() + DIAS_GARANTIA * 86_400_000)

  estado.licencia = {
    ...eleccion,
    clave: estado.licencia?.clave ?? generarClave(),
    inicio: inicio.toISOString(),
    vence: vence.toISOString(),
    negocio: datos.negocio,
    giro: datos.giro,
    telefono: datos.telefono,
    enPrueba: false,
    suspendida: false,
    tarjeta: datos.tarjeta,
    garantiaHasta: garantia?.toISOString(),
    facturacion: datos.facturacion,
  }
  estado.pruebaUsada = true
  estado.planElegido = null

  if (!estado.sucursales.length) {
    sembrarDatos(datos.sucursal)
    estado.tutorialPendiente = true
  }
}

export async function terminarTutorial() {
  if (usaApi()) {
    aplicarSnapshot(await terminarTutorialApi())
    return
  }
  estado.tutorialPendiente = false
}

function sembrarDatos(nombreMatriz: string) {
  const matriz: Sucursal = { id: nuevoId(), nombre: nombreMatriz || 'Matriz', direccion: 'Dirección por definir' }
  estado.sucursales = [matriz]
  estado.sucursalActivaId = matriz.id

  estado.usuarios = [
    {
      id: nuevoId(),
      nombre: estado.sesion?.nombre ?? 'Administrador',
      correo: estado.sesion?.correo ?? '',
      telefono: estado.licencia?.telefono.replace(/\D/g, '') ?? '',
      puesto: 'Dueño del negocio',
      fechaIngreso: hoy(),
      rol: 'Administrador',
      sucursalId: matriz.id,
      activo: true,
      permisos: permisosDeRol('Administrador'),
    },
    {
      id: nuevoId(),
      nombre: 'Laura Méndez',
      correo: 'laura@ejemplo.com',
      telefono: '5534567890',
      puesto: 'Cajera',
      fechaIngreso: hoy(),
      rol: 'Cajero',
      sucursalId: matriz.id,
      activo: true,
      permisos: permisosDeRol('Cajero'),
    },
  ]

  // Uno por categoría; chocolate bajo de stock; mango ya caducado y horchata por caducar para mostrar Caducados.
  const hace = (dias: number) => {
    const d = new Date()
    d.setDate(d.getDate() + dias)
    return d.toLocaleDateString('en-CA')
  }
  const catalogo: [string, string, number, number, number, string | undefined][] = [
    ['Paleta de mango', 'Paletas de agua', 18, 7, 12, hace(-3)],
    ['Paleta de chocolate', 'Paletas de leche', 22, 9, 6, hace(20)],
    ['Agua de horchata 1 L', 'Aguas frescas', 30, 11, 24, hace(4)],
  ]

  estado.productos = catalogo.map(([nombre, categoria, precio, costo, existencia, caducidad], i) => ({
    id: nuevoId(),
    sku: `PAL-${String(i + 1).padStart(3, '0')}`,
    nombre,
    categoria,
    precio,
    costo,
    stockMinimo: 10,
    caducidad,
    existencias: { [matriz.id]: existencia },
  }))
  estado.perdidas = []
  estado.folioPerdida = 1

  const metodos: MetodoPago[] = ['Efectivo', 'Tarjeta', 'Transferencia']
  const productos = estado.productos
  const ventas: Venta[] = []

  for (let dia = 6; dia >= 0; dia--) {
    const tickets = 3 + ((dia * 7) % 5)
    for (let t = 0; t < tickets; t++) {
      const fecha = new Date()
      fecha.setDate(fecha.getDate() - dia)
      fecha.setHours(10 + t, (t * 17) % 60, 0, 0)
      if (fecha.getTime() > Date.now()) continue

      const a = productos[(dia + t) % productos.length]!
      const b = productos[(dia + t * 3 + 1) % productos.length]!
      const partidas: Partida[] = [{ productoId: a.id, nombre: a.nombre, cantidad: 1 + (t % 3), precio: a.precio }]
      if (b !== a) partidas.push({ productoId: b.id, nombre: b.nombre, cantidad: 1, precio: b.precio })
      const total = partidas.reduce((suma, p) => suma + p.precio * p.cantidad, 0)

      ventas.push({
        id: nuevoId(),
        folio: estado.folioVenta++,
        fecha: fecha.toISOString(),
        sucursalId: matriz.id,
        cajero: 'Laura Méndez',
        metodoPago: metodos[t % metodos.length]!,
        partidas,
        total,
        recibido: total,
      })
    }
  }

  estado.ventas = ventas
}

export async function crearProducto(datos: {
  sku: string
  nombre: string
  categoria: string
  precio: number
  costo: number
  stockMinimo: number
  caducidad?: string
  existenciaInicial: number
}) {
  if (usaApi()) {
    aplicarSnapshot(await crearProductoApi(datos))
    return
  }
  const { existenciaInicial, caducidad, ...resto } = datos
  const sucursalId = sucursalActiva.value?.id ?? ''
  estado.productos.unshift({
    id: nuevoId(),
    ...resto,
    caducidad: caducidad || undefined,
    existencias: { [sucursalId]: existenciaInicial },
  })
}

export async function actualizarProducto(
  id: string,
  datos: Pick<Producto, 'sku' | 'nombre' | 'categoria' | 'precio' | 'costo' | 'stockMinimo' | 'caducidad'>,
) {
  if (usaApi()) {
    aplicarSnapshot(await actualizarProductoApi(id, datos))
    return
  }
  const producto = estado.productos.find((p) => p.id === id)
  if (!producto) return
  Object.assign(producto, { ...datos, caducidad: datos.caducidad || undefined })
}

export async function eliminarProducto(id: string) {
  if (usaApi()) {
    aplicarSnapshot(await eliminarProductoApi(id))
    return
  }
  estado.productos = estado.productos.filter((p) => p.id !== id)
}

export async function registrarEntrada(datos: {
  productoId: string
  cantidad: number
  costoUnitario: number
  proveedor: string
  nota: string
}) {
  if (usaApi()) {
    aplicarSnapshot(
      await registrarEntradaApi({ ...datos, sucursalId: sucursalActiva.value?.id }),
    )
    return
  }
  const producto = estado.productos.find((p) => p.id === datos.productoId)
  const sucursalId = sucursalActiva.value?.id
  if (!producto || !sucursalId) return

  producto.existencias[sucursalId] = stock(producto, sucursalId) + datos.cantidad
  producto.costo = datos.costoUnitario

  estado.entradas.unshift({
    id: nuevoId(),
    folio: estado.folioEntrada++,
    fecha: new Date().toISOString(),
    sucursalId,
    producto: producto.nombre,
    ...datos,
  })
}

export async function registrarPerdida(datos: {
  productoId: string
  cantidad: number
  motivo: MotivoPerdida
  nota: string
}) {
  if (usaApi()) {
    const antes = estado.perdidas[0]?.id
    aplicarSnapshot(
      await registrarPerdidaApi({ ...datos, sucursalId: sucursalActiva.value?.id }),
    )
    return estado.perdidas.find((p) => p.id !== antes) ?? estado.perdidas[0] ?? null
  }
  const producto = estado.productos.find((p) => p.id === datos.productoId)
  const sucursalId = sucursalActiva.value?.id
  if (!producto || !sucursalId) return null

  const disponible = stock(producto, sucursalId)
  const cantidad = Math.min(Math.max(0, Math.floor(datos.cantidad)), disponible)
  if (cantidad <= 0) return null

  producto.existencias[sucursalId] = disponible - cantidad

  const perdida: Perdida = {
    id: nuevoId(),
    folio: estado.folioPerdida++,
    fecha: new Date().toISOString(),
    sucursalId,
    productoId: producto.id,
    producto: producto.nombre,
    cantidad,
    costoUnitario: producto.costo,
    motivo: datos.motivo,
    nota: datos.nota,
  }
  estado.perdidas.unshift(perdida)
  return perdida
}

export async function registrarVenta(
  partidas: Partida[],
  metodoPago: MetodoPago,
  recibido: number,
  anticipo?: DatosAnticipo,
) {
  if (usaApi()) {
    const antes = new Set(estado.ventas.map((v) => v.id))
    aplicarSnapshot(
      await registrarVentaApi({
        partidas,
        metodoPago,
        recibido,
        anticipo,
        sucursalId: sucursalActiva.value?.id,
      }),
    )
    return estado.ventas.find((v) => !antes.has(v.id)) ?? estado.ventas.at(-1)!
  }
  const sucursalId = sucursalActiva.value?.id ?? ''
  const total = partidas.reduce((suma, p) => suma + p.precio * p.cantidad, 0)
  const fecha = new Date().toISOString()
  const cobrado = anticipo ? anticipo.monto : total

  for (const partida of partidas) {
    const producto = estado.productos.find((p) => p.id === partida.productoId)
    if (producto) producto.existencias[sucursalId] = Math.max(0, stock(producto, sucursalId) - partida.cantidad)
  }

  const venta: Venta = {
    id: nuevoId(),
    folio: estado.folioVenta++,
    fecha,
    sucursalId,
    cajero: estado.sesion?.nombre ?? 'Cajero',
    metodoPago,
    partidas,
    total,
    recibido: metodoPago === 'Efectivo' ? recibido : cobrado,
  }

  if (anticipo) {
    const { monto, ...cliente } = anticipo
    venta.anticipo = { ...cliente, pagos: [{ fecha, monto, metodo: metodoPago, recibido: venta.recibido }] }
  }

  estado.ventas.push(venta)
  return estado.ventas[estado.ventas.length - 1]!
}

export async function abonarAnticipo(ventaId: string, monto: number, metodo: MetodoPago, recibido: number) {
  if (usaApi()) {
    aplicarSnapshot(await abonarAnticipoApi(ventaId, { monto, metodo, recibido }))
    return estado.ventas.find((v) => v.id === ventaId) ?? null
  }
  const venta = estado.ventas.find((v) => v.id === ventaId)
  if (!venta?.anticipo) return null
  const abono = Math.min(monto, saldoDe(venta))
  if (abono <= 0) return null
  venta.anticipo.pagos.push({
    fecha: new Date().toISOString(),
    monto: abono,
    metodo,
    recibido: metodo === 'Efectivo' ? recibido : abono,
  })
  return venta
}

export function esTitular(usuario: Pick<Usuario, 'correo'>) {
  return mismoCorreo(usuario.correo, estado.titular)
}

export function esSesionActual(usuario: Pick<Usuario, 'correo'>) {
  return mismoCorreo(usuario.correo, estado.sesion?.correo)
}

export function correoEnUso(correo: string, exceptoId?: string) {
  return estado.usuarios.some((u) => u.correo === correo && u.id !== exceptoId)
}

export async function crearUsuario(datos: DatosUsuario) {
  if (usaApi()) {
    const antes = new Set(estado.usuarios.map((u) => u.id))
    aplicarSnapshot(await crearUsuarioApi({ ...datos, permisos: ordenarPermisos(datos.permisos) }))
    return estado.usuarios.find((u) => !antes.has(u.id))!
  }
  const usuario: Usuario = { id: nuevoId(), ...datos, permisos: ordenarPermisos(datos.permisos) }
  estado.usuarios.push(usuario)
  return usuario
}

export async function actualizarUsuario(id: string, datos: DatosUsuario) {
  if (esTitular({ correo: datos.correo }) || estado.usuarios.find((u) => u.id === id && esTitular(u))) {
    Object.assign(datos, { rol: 'Administrador' as const, activo: true, permisos: TODOS_LOS_PERMISOS })
  }
  if (usaApi()) {
    aplicarSnapshot(await actualizarUsuarioApi(id, { ...datos, permisos: ordenarPermisos(datos.permisos) }))
    return
  }
  const usuario = estado.usuarios.find((u) => u.id === id)
  if (!usuario) return
  if (esTitular(usuario)) Object.assign(datos, { rol: 'Administrador', activo: true, permisos: TODOS_LOS_PERMISOS })
  Object.assign(usuario, { ...datos, permisos: ordenarPermisos(datos.permisos) })
}

/** Baja del equipo: permanece en historial (activo = false) y libera cupo del plan. */
export async function eliminarUsuario(id: string) {
  if (usaApi()) {
    aplicarSnapshot(await eliminarUsuarioApi(id))
    return
  }
  const usuario = estado.usuarios.find((u) => u.id === id)
  if (!usuario || esTitular(usuario)) return
  usuario.activo = false
}

/** Reincorpora a alguien que estaba en bajas, si hay cupo en el plan. */
export async function reactivarUsuario(id: string) {
  const usuario = estado.usuarios.find((u) => u.id === id)
  if (!usuario || usuario.activo) return
  if (!puedeAgregar('usuarios')) return
  if (usaApi()) {
    aplicarSnapshot(await reactivarUsuarioApi(id))
    return
  }
  usuario.activo = true
}

export async function crearSucursal(datos: Omit<Sucursal, 'id'>) {
  if (usaApi()) {
    aplicarSnapshot(await crearSucursalApi(datos))
    return
  }
  estado.sucursales.push({ id: nuevoId(), ...datos })
}

export async function cambiarSucursal(id: string) {
  if (sucursalFija.value) return
  if (usaApi()) {
    aplicarSnapshot(await cambiarSucursalApi(id))
    return
  }
  estado.sucursalActivaId = id
}

export type AjusteLicencia = Partial<
  Pick<Licencia, 'planId' | 'ciclo' | 'clave' | 'vence' | 'enPrueba' | 'suspendida' | 'tarjeta' | 'cancelada'>
>

export function ajustarLicencia(cambios: AjusteLicencia) {
  if (estado.licencia) Object.assign(estado.licencia, cambios)
}

/** Ajuste desde la consola de iPaletitas a cualquier negocio de este navegador, abierto o no. */
export function ajustarLicenciaDe(titular: string, cambios: AjusteLicencia) {
  const negocio = mismoCorreo(titular, estado.titular) ? estado : otrosNegocios[titular.toLowerCase()]
  if (negocio?.licencia) Object.assign(negocio.licencia, cambios)
}

export async function cambiarPlan(planId: PlanId, ciclo: CicloPago) {
  if (usaApi()) {
    aplicarSnapshot(await cambiarPlanApi(planId, ciclo))
    return
  }
  ajustarLicencia({ planId, ciclo })
}

export function excesosDelPlan(planId: PlanId) {
  const plan = PLANES.find((p) => p.id === planId)
  if (!plan) return []
  return (['sucursales', 'usuarios', 'productos'] as const)
    .filter((limite) => uso(limite) > plan.limites[limite])
    .map((limite) => ({ limite, uso: uso(limite), maximo: plan.limites[limite] }))
}
