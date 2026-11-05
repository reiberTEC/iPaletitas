import { ref, watch } from 'vue'

export const CATEGORIAS = [
  { id: 'agua', nombre: 'Paletas de agua' },
  { id: 'leche', nombre: 'Paletas de leche' },
  { id: 'especiales', nombre: 'Especiales' },
  { id: 'bebidas', nombre: 'Aguas frescas' },
] as const

export type CategoriaId = (typeof CATEGORIAS)[number]['id']
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia'

export interface Producto {
  id: string
  nombre: string
  categoria: CategoriaId
  precio: number
  stock: number
  icono: string
  color: string
}

export interface LineaVenta {
  productoId: string
  nombre: string
  precio: number
  cantidad: number
}

export interface Venta {
  folio: string
  fecha: string
  lineas: LineaVenta[]
  total: number
  metodo: MetodoPago
  recibido: number
  cambio: number
}

export const TASA_IVA = 0.16

export const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

const productosIniciales = (): Producto[] => [
  { id: 'agua-limon', nombre: 'Limón', categoria: 'agua', precio: 18, stock: 42, icono: '🍋', color: '#fef9c3' },
  { id: 'agua-fresa', nombre: 'Fresa', categoria: 'agua', precio: 18, stock: 6, icono: '🍓', color: '#fee2e2' },
  { id: 'agua-mango-chile', nombre: 'Mango con chile', categoria: 'agua', precio: 22, stock: 120, icono: '🥭', color: '#ffedd5' },
  { id: 'agua-tamarindo', nombre: 'Tamarindo', categoria: 'agua', precio: 20, stock: 35, icono: '🟤', color: '#f5e6d3' },
  { id: 'agua-sandia', nombre: 'Sandía', categoria: 'agua', precio: 18, stock: 28, icono: '🍉', color: '#fce7f3' },
  { id: 'agua-pina', nombre: 'Piña', categoria: 'agua', precio: 18, stock: 0, icono: '🍍', color: '#fef3c7' },
  { id: 'leche-fresas-crema', nombre: 'Fresas con crema', categoria: 'leche', precio: 25, stock: 30, icono: '🍓', color: '#ffe4e6' },
  { id: 'leche-coco', nombre: 'Coco', categoria: 'leche', precio: 25, stock: 24, icono: '🥥', color: '#f1f5f9' },
  { id: 'leche-nuez', nombre: 'Nuez', categoria: 'leche', precio: 28, stock: 18, icono: '🌰', color: '#efe3d3' },
  { id: 'leche-chocolate', nombre: 'Chocolate', categoria: 'leche', precio: 25, stock: 40, icono: '🍫', color: '#ede0d4' },
  { id: 'leche-arroz', nombre: 'Arroz con leche', categoria: 'leche', precio: 25, stock: 15, icono: '🍚', color: '#fdf6e3' },
  { id: 'esp-mazapan', nombre: 'Mazapán', categoria: 'especiales', precio: 30, stock: 20, icono: '🥜', color: '#fde68a' },
  { id: 'esp-cheesecake', nombre: 'Cheesecake de zarzamora', categoria: 'especiales', precio: 35, stock: 12, icono: '🫐', color: '#ede9fe' },
  { id: 'esp-rellena-cajeta', nombre: 'Rellena de cajeta', categoria: 'especiales', precio: 32, stock: 4, icono: '🍯', color: '#fef3c7' },
  { id: 'bebida-horchata', nombre: 'Horchata 1 L', categoria: 'bebidas', precio: 35, stock: 16, icono: '🥛', color: '#f8fafc' },
  { id: 'bebida-jamaica', nombre: 'Jamaica 1 L', categoria: 'bebidas', precio: 35, stock: 14, icono: '🌺', color: '#fce7f3' },
]

const cargar = <T>(clave: string, inicial: () => T): T => {
  try {
    const guardado = localStorage.getItem(clave)
    if (guardado) return JSON.parse(guardado) as T
  } catch {
    localStorage.removeItem(clave)
  }
  return inicial()
}

// TODO: reemplazar localStorage por la API cuando exista el backend
const productos = ref<Producto[]>(cargar('ipaletitas:productos', productosIniciales))
const ventas = ref<Venta[]>(cargar<Venta[]>('ipaletitas:ventas', () => []))

watch(productos, (lista) => localStorage.setItem('ipaletitas:productos', JSON.stringify(lista)), { deep: true, immediate: true })
watch(ventas, (lista) => localStorage.setItem('ipaletitas:ventas', JSON.stringify(lista)), { deep: true })

export function useCatalogo() {
  const siguienteFolio = () => `V-${String(ventas.value.length + 1).padStart(6, '0')}`

  const registrarVenta = (datos: Omit<Venta, 'folio' | 'fecha'>): Venta => {
    const venta: Venta = { ...datos, folio: siguienteFolio(), fecha: new Date().toISOString() }

    for (const linea of venta.lineas) {
      const producto = productos.value.find((p) => p.id === linea.productoId)
      if (producto) producto.stock = Math.max(0, producto.stock - linea.cantidad)
    }

    ventas.value.push(venta)
    return venta
  }

  return { productos, ventas, siguienteFolio, registrarVenta }
}
