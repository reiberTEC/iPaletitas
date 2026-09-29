<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRightLeft, Banknote, CreditCard, Minus, Plus, Search, ShoppingCart, X } from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Ticket from './Ticket.vue'
import { colorCategoria } from './secciones'
import {
  IVA,
  estado,
  registrarVenta,
  stock,
  type MetodoPago,
  type Partida,
  type Producto,
  type Venta,
} from '@/stores/negocio'
import { dinero } from '@/lib/formato'

const busqueda = ref('')
const categoria = ref('Todas')
const carrito = ref<Partida[]>([])
const metodo = ref<MetodoPago>('Efectivo')
const recibido = ref<number | null>(null)
const ventaHecha = ref<Venta | null>(null)

const metodos = [
  { id: 'Efectivo' as const, icono: Banknote },
  { id: 'Tarjeta' as const, icono: CreditCard },
  { id: 'Transferencia' as const, icono: ArrowRightLeft },
]
const billetes = [50, 100, 200, 500]

const categorias = computed(() => ['Todas', ...new Set(estado.productos.map((p) => p.categoria))])

const visibles = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return estado.productos.filter(
    (p) =>
      (categoria.value === 'Todas' || p.categoria === categoria.value) &&
      `${p.nombre} ${p.sku}`.toLowerCase().includes(texto),
  )
})

const total = computed(() => carrito.value.reduce((suma, l) => suma + l.precio * l.cantidad, 0))
const subtotal = computed(() => total.value / (1 + IVA))
const piezas = computed(() => carrito.value.reduce((suma, l) => suma + l.cantidad, 0))
const cambio = computed(() => Math.max(0, (recibido.value ?? 0) - total.value))
const puedeCobrar = computed(
  () => carrito.value.length > 0 && (metodo.value !== 'Efectivo' || (recibido.value ?? 0) >= total.value),
)

const enCarrito = (id: string) => carrito.value.find((l) => l.productoId === id)

function agregar(producto: Producto) {
  const linea = enCarrito(producto.id)
  if (linea) {
    if (linea.cantidad < stock(producto)) linea.cantidad++
  } else if (stock(producto) > 0) {
    carrito.value.push({ productoId: producto.id, nombre: producto.nombre, cantidad: 1, precio: producto.precio })
  }
}

function cambiarCantidad(linea: Partida, cambioCantidad: number) {
  const producto = estado.productos.find((p) => p.id === linea.productoId)
  const maximo = producto ? stock(producto) : linea.cantidad
  linea.cantidad = Math.min(maximo, linea.cantidad + cambioCantidad)
  if (linea.cantidad <= 0) quitar(linea)
}

function quitar(linea: Partida) {
  carrito.value = carrito.value.filter((l) => l !== linea)
}

function vaciar() {
  carrito.value = []
  recibido.value = null
}

function cobrar() {
  if (!puedeCobrar.value) return
  ventaHecha.value = registrarVenta(
    carrito.value.map((l) => ({ ...l })),
    metodo.value,
    recibido.value ?? total.value,
  )
  vaciar()
  metodo.value = 'Efectivo'
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[1fr_400px]">
    <section class="min-w-0">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <label class="relative flex-1">
          <span class="sr-only">Buscar producto</span>
          <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input v-model="busqueda" class="ip-input ip-input-icono" placeholder="Buscar por nombre o código (SKU)" />
        </label>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="opcion in categorias"
          :key="opcion"
          type="button"
          :class="[
            'cursor-pointer rounded-full border-0 px-4 py-2 text-sm font-semibold transition',
            categoria === opcion
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-blue-300',
          ]"
          @click="categoria = opcion"
        >
          {{ opcion }}
        </button>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        <button
          v-for="producto in visibles"
          :key="producto.id"
          type="button"
          :disabled="stock(producto) === 0"
          :class="[
            'group relative cursor-pointer rounded-2xl border-0 bg-white p-5 text-left ring-1 transition disabled:cursor-not-allowed disabled:opacity-50',
            enCarrito(producto.id) ? 'ring-2 ring-blue-500' : 'ring-slate-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-blue-300',
          ]"
          @click="agregar(producto)"
        >
          <span
            v-if="enCarrito(producto.id)"
            class="absolute top-3 right-3 grid size-7 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white"
          >
            {{ enCarrito(producto.id)?.cantidad }}
          </span>
          <div class="grid h-20 place-items-center rounded-xl bg-slate-50">
            <PaletaIcon :variant="colorCategoria(producto.categoria)" :size="44" />
          </div>
          <p class="mt-4 line-clamp-1 font-bold text-slate-900">{{ producto.nombre }}</p>
          <p class="text-xs text-slate-400">{{ producto.sku }} · {{ producto.categoria }}</p>
          <div class="mt-3 flex items-center justify-between">
            <span class="text-lg font-extrabold text-blue-700">{{ dinero(producto.precio) }}</span>
            <span
              :class="[
                'text-xs font-semibold',
                stock(producto) === 0 ? 'text-rose-600' : stock(producto) <= producto.stockMinimo ? 'text-amber-600' : 'text-slate-400',
              ]"
            >
              {{ stock(producto) === 0 ? 'Agotado' : `${stock(producto)} disp.` }}
            </span>
          </div>
        </button>
      </div>

      <p v-if="!visibles.length" class="mt-10 text-center text-slate-400">No encontramos productos con esa búsqueda.</p>
    </section>

    <aside>
      <UiCard class="sticky top-24 flex flex-col bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold">Venta actual</h3>
            <p class="text-xs text-slate-400">Ticket #{{ estado.folioVenta }} · {{ piezas }} piezas</p>
          </div>
          <UiButton v-if="carrito.length" variant="ghost" size="sm" @click="vaciar">Vaciar</UiButton>
        </div>

        <ul v-if="carrito.length" class="mt-5 max-h-72 list-none space-y-3 overflow-y-auto p-0">
          <li v-for="linea in carrito" :key="linea.productoId" class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div class="min-w-0 flex-1">
              <p class="line-clamp-2 text-sm leading-snug font-semibold">{{ linea.nombre }}</p>
              <p class="text-xs text-slate-400">{{ dinero(linea.precio) }} c/u</p>
            </div>
            <div class="flex items-center gap-1 rounded-lg bg-white p-1 ring-1 ring-slate-200">
              <button type="button" class="grid size-7 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-slate-600 hover:bg-slate-100" aria-label="Quitar una" @click="cambiarCantidad(linea, -1)">
                <Minus class="size-3.5" />
              </button>
              <span class="w-6 text-center text-sm font-bold">{{ linea.cantidad }}</span>
              <button type="button" class="grid size-7 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-slate-600 hover:bg-slate-100" aria-label="Agregar una" @click="cambiarCantidad(linea, 1)">
                <Plus class="size-3.5" />
              </button>
            </div>
            <p class="w-20 text-right text-sm font-bold">{{ dinero(linea.precio * linea.cantidad) }}</p>
            <button type="button" class="grid size-7 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-slate-400 hover:text-rose-600" aria-label="Eliminar" @click="quitar(linea)">
              <X class="size-4" />
            </button>
          </li>
        </ul>

        <div v-else class="mt-5 grid place-items-center rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center">
          <ShoppingCart class="size-8 text-slate-300" />
          <p class="mt-3 text-sm text-slate-400">Toca un producto para agregarlo</p>
        </div>

        <div class="mt-5 space-y-2 border-t border-slate-100 pt-5 text-sm">
          <p class="flex justify-between text-slate-500"><span>Subtotal</span><span>{{ dinero(subtotal) }}</span></p>
          <p class="flex justify-between text-slate-500"><span>IVA 16%</span><span>{{ dinero(total - subtotal) }}</span></p>
          <p class="flex items-end justify-between pt-1">
            <span class="font-bold">Total</span>
            <span class="text-3xl font-extrabold tracking-tight">{{ dinero(total) }}</span>
          </p>
        </div>

        <p class="mt-5 mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">Método de pago</p>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="opcion in metodos"
            :key="opcion.id"
            type="button"
            :class="[
              'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-0 py-3 text-xs font-semibold transition',
              metodo === opcion.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:ring-blue-300',
            ]"
            @click="metodo = opcion.id"
          >
            <component :is="opcion.icono" class="size-5" />
            {{ opcion.id }}
          </button>
        </div>

        <div v-if="metodo === 'Efectivo'" class="mt-4">
          <label class="ip-label" for="recibido">Recibido</label>
          <input id="recibido" v-model.number="recibido" type="number" min="0" class="ip-input" placeholder="$0.00" />
          <div class="mt-2 grid grid-cols-4 gap-2">
            <button
              v-for="billete in billetes"
              :key="billete"
              type="button"
              class="cursor-pointer rounded-lg border-0 bg-emerald-50 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
              @click="recibido = billete"
            >
              ${{ billete }}
            </button>
          </div>
          <p class="mt-3 flex justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <span>Cambio</span><span>{{ dinero(cambio) }}</span>
          </p>
        </div>

        <UiButton size="lg" class="mt-5 w-full" :disabled="!puedeCobrar" @click="cobrar">
          Cobrar {{ dinero(total) }}
        </UiButton>
      </UiCard>
    </aside>

    <Ticket v-if="ventaHecha" :venta="ventaHecha" @cerrar="ventaHecha = null" />
  </div>
</template>
