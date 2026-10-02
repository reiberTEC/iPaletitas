import { computed, reactive, watch } from 'vue'
import { DIAS_PRUEBA, PLANES, generarClave, type CicloPago, type Limite, type PlanId } from './catalogo'
import { nombreDesdeCorreo } from '@/lib/formato'
import { nuevoId } from '@/lib/utils'

export { DIAS_PRUEBA, PLANES, precioPlan } from './catalogo'
export type { CicloPago, Limite, Plan, PlanId } from './catalogo'

export type Rol = 'Administrador' | 'Cajero' | 'Almacén'
export type MetodoPago = 'Efectivo' | 'Tarjeta' | 'Transferencia'

export interface Sucursal {
  id: string
  nombre: string
  direccion: string
}

export interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: Rol
  sucursalId: string
  activo: boolean
}

export interface Producto {
  id: string
  sku: string
  nombre: string
  categoria: string
  precio: number
  costo: number
  stockMinimo: number
  existencias: Record<string, number>
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
  enPrueba?: boolean
  suspendida?: boolean
}

interface Estado {
  sesion: { correo: string; nombre: string } | null
  licencia: Licencia | null
  planElegido: { planId: PlanId; ciclo: CicloPago } | null
  sucursalActivaId: string
  sucursales: Sucursal[]
  usuarios: Usuario[]
  productos: Producto[]
  entradas: Entrada[]
  ventas: Venta[]
  folioVenta: number
  folioEntrada: number
}

export const IVA = 0.16

export const ROLES: { rol: Rol; descripcion: string }[] = [
  { rol: 'Administrador', descripcion: 'Acceso total: licencia, usuarios, sucursales y reportes.' },
  { rol: 'Cajero', descripcion: 'Cobra en el punto de venta y consulta el historial.' },
  { rol: 'Almacén', descripcion: 'Da de alta productos y registra entradas.' },
]

const CLAVE_ALMACEN = 'ipaletitas:v1'

function estadoVacio(): Estado {
  return {
    sesion: null,
    licencia: null,
    planElegido: null,
    sucursalActivaId: '',
    sucursales: [],
    usuarios: [],
    productos: [],
    entradas: [],
    ventas: [],
    folioVenta: 1001,
    folioEntrada: 1,
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

export const estado = reactive<Estado>(cargar())

watch(estado, (valor) => localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(valor)), { deep: true })

export const planActual = computed(() => PLANES.find((p) => p.id === estado.licencia?.planId) ?? null)

export const sucursalActiva = computed(
  () => estado.sucursales.find((s) => s.id === estado.sucursalActivaId) ?? estado.sucursales[0] ?? null,
)

export const diasRestantes = computed(() => {
  if (!estado.licencia) return 0
  const ms = new Date(estado.licencia.vence).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 86_400_000))
})

export const ventasSucursal = computed(() =>
  estado.ventas.filter((v) => v.sucursalId === sucursalActiva.value?.id),
)

export const enPrueba = computed(() => estado.licencia?.enPrueba !== false)

export const bloqueo = computed<'suspendida' | 'vencida' | null>(() => {
  if (!estado.licencia) return null
  if (estado.licencia.suspendida) return 'suspendida'
  return diasRestantes.value === 0 ? 'vencida' : null
})

export function stock(producto: Producto, sucursalId = sucursalActiva.value?.id ?? '') {
  return producto.existencias[sucursalId] ?? 0
}

export function nombreSucursal(id: string) {
  return estado.sucursales.find((s) => s.id === id)?.nombre ?? 'Sin sucursal'
}

export function uso(limite: Limite) {
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

export function iniciarSesion(correo: string) {
  estado.sesion = { correo, nombre: nombreDesdeCorreo(correo, 'Titular') }
}

export function cerrarSesion() {
  estado.sesion = null
}

export function elegirPlan(planId: PlanId, ciclo: CicloPago) {
  estado.planElegido = { planId, ciclo }
}

export function activarLicencia(datos: { negocio: string; giro: string; telefono: string; sucursal: string }) {
  const eleccion = estado.planElegido ?? { planId: 'negocio' as const, ciclo: 'mensual' as const }
  const inicio = new Date()
  const vence = new Date(inicio)
  vence.setDate(vence.getDate() + DIAS_PRUEBA)

  estado.licencia = {
    ...eleccion,
    clave: estado.licencia?.clave ?? generarClave(),
    inicio: inicio.toISOString(),
    vence: vence.toISOString(),
    negocio: datos.negocio,
    giro: datos.giro,
    telefono: datos.telefono,
    enPrueba: true,
    suspendida: false,
  }
  estado.planElegido = null

  if (!estado.sucursales.length) sembrarDatos(datos.sucursal)
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
      rol: 'Administrador',
      sucursalId: matriz.id,
      activo: true,
    },
    {
      id: nuevoId(),
      nombre: 'Laura Méndez',
      correo: 'laura@ejemplo.com',
      rol: 'Cajero',
      sucursalId: matriz.id,
      activo: true,
    },
  ]

  const catalogo: [string, string, number, number, number][] = [
    ['Paleta de mango', 'Paletas de agua', 18, 7, 42],
    ['Paleta de fresa', 'Paletas de agua', 18, 7, 35],
    ['Paleta de limón', 'Paletas de agua', 16, 6, 8],
    ['Paleta de chocolate', 'Paletas de leche', 22, 9, 28],
    ['Paleta de nuez', 'Paletas de leche', 24, 10, 5],
    ['Paleta de coco', 'Paletas de leche', 22, 9, 19],
    ['Agua de horchata 1 L', 'Aguas frescas', 30, 11, 14],
    ['Agua de jamaica 1 L', 'Aguas frescas', 30, 10, 3],
    ['Helado de vainilla 1/2 L', 'Helados', 65, 28, 12],
  ]

  estado.productos = catalogo.map(([nombre, categoria, precio, costo, existencia], i) => ({
    id: nuevoId(),
    sku: `PAL-${String(i + 1).padStart(3, '0')}`,
    nombre,
    categoria,
    precio,
    costo,
    stockMinimo: 10,
    existencias: { [matriz.id]: existencia },
  }))

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
      const partidas: Partida[] = [
        { productoId: a.id, nombre: a.nombre, cantidad: 1 + (t % 3), precio: a.precio },
        { productoId: b.id, nombre: b.nombre, cantidad: 1, precio: b.precio },
      ]
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

export function crearProducto(datos: {
  sku: string
  nombre: string
  categoria: string
  precio: number
  costo: number
  stockMinimo: number
  existenciaInicial: number
}) {
  const { existenciaInicial, ...resto } = datos
  const sucursalId = sucursalActiva.value?.id ?? ''
  estado.productos.unshift({ id: nuevoId(), ...resto, existencias: { [sucursalId]: existenciaInicial } })
}

export function actualizarProducto(
  id: string,
  datos: Pick<Producto, 'sku' | 'nombre' | 'categoria' | 'precio' | 'costo' | 'stockMinimo'>,
) {
  const producto = estado.productos.find((p) => p.id === id)
  if (producto) Object.assign(producto, datos)
}

export function eliminarProducto(id: string) {
  estado.productos = estado.productos.filter((p) => p.id !== id)
}

export function registrarEntrada(datos: {
  productoId: string
  cantidad: number
  costoUnitario: number
  proveedor: string
  nota: string
}) {
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

export function registrarVenta(partidas: Partida[], metodoPago: MetodoPago, recibido: number) {
  const sucursalId = sucursalActiva.value?.id ?? ''
  const total = partidas.reduce((suma, p) => suma + p.precio * p.cantidad, 0)

  for (const partida of partidas) {
    const producto = estado.productos.find((p) => p.id === partida.productoId)
    if (producto) producto.existencias[sucursalId] = Math.max(0, stock(producto, sucursalId) - partida.cantidad)
  }

  const venta: Venta = {
    id: nuevoId(),
    folio: estado.folioVenta++,
    fecha: new Date().toISOString(),
    sucursalId,
    cajero: estado.sesion?.nombre ?? 'Cajero',
    metodoPago,
    partidas,
    total,
    recibido: metodoPago === 'Efectivo' ? recibido : total,
  }
  estado.ventas.push(venta)
  return venta
}

export function crearUsuario(datos: Omit<Usuario, 'id' | 'activo'>) {
  estado.usuarios.push({ id: nuevoId(), activo: true, ...datos })
}

export function alternarUsuario(id: string) {
  const usuario = estado.usuarios.find((u) => u.id === id)
  if (usuario) usuario.activo = !usuario.activo
}

export function crearSucursal(datos: Omit<Sucursal, 'id'>) {
  estado.sucursales.push({ id: nuevoId(), ...datos })
}

export function cambiarSucursal(id: string) {
  estado.sucursalActivaId = id
}

export type AjusteLicencia = Partial<
  Pick<Licencia, 'planId' | 'ciclo' | 'clave' | 'vence' | 'enPrueba' | 'suspendida'>
>

export function ajustarLicencia(cambios: AjusteLicencia) {
  if (estado.licencia) Object.assign(estado.licencia, cambios)
}
