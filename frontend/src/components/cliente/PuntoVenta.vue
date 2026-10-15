<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRightLeft, Banknote, CreditCard, HandCoins, Minus, Plus, Search, ShoppingCart, X } from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Ticket from './Ticket.vue'
import Anticipos from './Anticipos.vue'
import { colorCategoria } from './secciones'
import {
  IVA,
  anticiposPendientes,
  estado,
  registrarVenta,
  stock,
  type MetodoPago,
  type Partida,
  type Producto,
  type Venta,
} from '@/stores/negocio'
import { dinero, plural } from '@/lib/formato'

const busqueda = ref('')
const categoria = ref('Todas')
const carrito = ref<Partida[]>([])
const metodo = ref<MetodoPago>('Efectivo')
const recibido = ref<number | null>(null)
const ventaHecha = ref<Venta | null>(null)
const verAnticipos = ref(false)

const conAnticipo = ref(false)
const cliente = ref('')
const telefono = ref('')
const entrega = ref('')
const anticipo = ref<number | null>(null)

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
const anticipoValido = computed(
  () => cliente.value.trim().length > 0 && (anticipo.value ?? 0) > 0 && (anticipo.value ?? 0) < total.value,
)
const aCobrar = computed(() => (conAnticipo.value ? (anticipo.value ?? 0) : total.value))
const saldo = computed(() => Math.max(0, total.value - (anticipo.value ?? 0)))
const cambio = computed(() => Math.max(0, (recibido.value ?? 0) - aCobrar.value))
const puedeCobrar = computed(
  () =>
    carrito.value.length > 0 &&
    (!conAnticipo.value || anticipoValido.value) &&
    (metodo.value !== 'Efectivo' || (recibido.value ?? 0) >= aCobrar.value),
)

function anticipoPorcentaje(porcentaje: number) {
  anticipo.value = Math.round(total.value * porcentaje) / 100
}

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
  conAnticipo.value = false
  cliente.value = ''
  telefono.value = ''
  entrega.value = ''
  anticipo.value = null
}

function cobrar() {
  if (!puedeCobrar.value) return
  ventaHecha.value = registrarVenta(
    carrito.value.map((l) => ({ ...l })),
    metodo.value,
    recibido.value ?? aCobrar.value,
    conAnticipo.value
      ? { cliente: cliente.value.trim(), telefono: telefono.value.trim(), entrega: entrega.value, monto: aCobrar.value }
      : undefined,
  )
  vaciar()
  metodo.value = 'Efectivo'
}

function alAbonar(venta: Venta) {
  verAnticipos.value = false
  ventaHecha.value = venta
}
</script>

<template>
  <div class="grid gap-6 xl:grid-cols-[1fr_400px]">
    <section class="min-w-0">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
        <label class="relative flex-1">
          <span class="sr-only">Buscar producto</span>
          <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
          <input v-model="busqueda" class="ip-input ip-input-icono" placeholder="Buscar por nombre o código (SKU)" />
        </label>
        <UiButton variant="outline" class="h-[2.9rem] shrink-0" @click="verAnticipos = true">
          <HandCoins class="size-4" />
          Anticipos
          <span
            v-if="anticiposPendientes.length"
            class="grid min-w-5 place-items-center rounded-full bg-rose-600 px-1.5 text-[11px] leading-5 font-bold text-white tabular-nums"
          >
            {{ anticiposPendientes.length }}
          </span>
        </UiButton>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="opcion in categorias"
          :key="opcion"
          type="button"
          :class="[
            'min-h-10 cursor-pointer rounded-full border-0 px-4 py-2 text-sm font-semibold transition-colors',
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
            'ip-boton group relative flex min-w-0 cursor-pointer flex-col rounded-2xl border-0 bg-white p-5 text-left ring-1 disabled:cursor-not-allowed disabled:opacity-50',
            enCarrito(producto.id) ? 'ring-2 ring-blue-500' : 'ring-slate-200 hover:ring-blue-300',
          ]"
          :title="producto.nombre"
          @click="agregar(producto)"
        >
          <span
            v-if="enCarrito(producto.id)"
            class="absolute top-3 right-3 grid h-7 min-w-7 place-items-center rounded-full bg-blue-600 px-1.5 text-xs font-bold text-white tabular-nums"
          >
            {{ enCarrito(producto.id)?.cantidad }}
          </span>
          <div class="grid h-20 place-items-center rounded-xl bg-slate-50">
            <PaletaIcon :variant="colorCategoria(producto.categoria)" :size="44" />
          </div>
          <p class="mt-4 line-clamp-2 leading-snug font-bold [overflow-wrap:anywhere] text-slate-900">{{ producto.nombre }}</p>
          <p class="truncate text-xs text-slate-500">{{ producto.sku }} · {{ producto.categoria }}</p>
          <div class="mt-auto flex flex-wrap items-center justify-between gap-x-2 pt-3">
            <span class="ip-cifra text-lg text-blue-700">{{ dinero(producto.precio) }}</span>
            <span
              :class="[
                'text-xs font-semibold tabular-nums',
                stock(producto) === 0 ? 'text-rose-700' : stock(producto) <= producto.stockMinimo ? 'text-orange-700' : 'text-slate-500',
              ]"
            >
              {{ stock(producto) === 0 ? 'Agotado' : `${stock(producto).toLocaleString('es-MX')} disp.` }}
            </span>
          </div>
        </button>
      </div>

      <p v-if="!visibles.length" class="mt-10 text-center text-slate-500">No encontramos productos con esa búsqueda.</p>
    </section>

    <aside>
      <UiCard class="sticky top-24 flex flex-col bg-white p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-display text-lg font-semibold">Venta actual</h3>
            <p class="text-xs text-slate-500 tabular-nums">Ticket #{{ estado.folioVenta }} · {{ plural(piezas, 'pieza', 'piezas') }}</p>
          </div>
          <UiButton v-if="carrito.length" variant="ghost" size="sm" @click="vaciar">Vaciar</UiButton>
        </div>

        <ul v-if="carrito.length" class="mt-5 max-h-72 list-none space-y-3 overflow-y-auto p-0">
          <li v-for="linea in carrito" :key="linea.productoId" class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div class="min-w-0 flex-1">
              <p class="line-clamp-2 text-sm leading-snug font-semibold [overflow-wrap:anywhere]">{{ linea.nombre }}</p>
              <p class="text-xs text-slate-500 tabular-nums">{{ dinero(linea.precio) }} c/u</p>
            </div>
            <div class="flex items-center gap-1 rounded-lg bg-white p-1 ring-1 ring-slate-200">
              <button type="button" class="grid size-7 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-slate-600 hover:bg-slate-100" aria-label="Quitar una" @click="cambiarCantidad(linea, -1)">
                <Minus class="size-3.5" />
              </button>
              <span class="min-w-6 text-center text-sm font-bold tabular-nums">{{ linea.cantidad }}</span>
              <button type="button" class="grid size-7 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-slate-600 hover:bg-slate-100" aria-label="Agregar una" @click="cambiarCantidad(linea, 1)">
                <Plus class="size-3.5" />
              </button>
            </div>
            <p class="min-w-20 text-right text-sm font-bold whitespace-nowrap tabular-nums">{{ dinero(linea.precio * linea.cantidad) }}</p>
            <button type="button" class="grid size-7 cursor-pointer place-items-center rounded-md border-0 bg-transparent text-slate-500 hover:text-rose-600" aria-label="Eliminar" @click="quitar(linea)">
              <X class="size-4" />
            </button>
          </li>
        </ul>

        <div v-else class="mt-5 grid place-items-center rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center">
          <ShoppingCart class="size-8 text-slate-300" />
          <p class="mt-3 text-sm text-slate-500">Toca un producto para agregarlo</p>
        </div>

        <div class="mt-5 space-y-2 border-t border-slate-100 pt-5 text-sm">
          <p class="flex justify-between text-slate-500"><span>Subtotal</span><span class="tabular-nums">{{ dinero(subtotal) }}</span></p>
          <p class="flex justify-between text-slate-500"><span>IVA 16%</span><span class="tabular-nums">{{ dinero(total - subtotal) }}</span></p>
          <p class="flex flex-wrap items-end justify-between gap-x-3 pt-1">
            <span class="font-bold">Total</span>
            <span class="ip-cifra text-3xl">{{ dinero(total) }}</span>
          </p>
        </div>

        <div class="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <label class="flex cursor-pointer items-center justify-between gap-3">
            <span>
              <span class="block text-sm font-bold text-slate-900">Venta con anticipo</span>
              <span class="block text-xs text-slate-500">El cliente paga una parte ahora y el resto después.</span>
            </span>
            <input v-model="conAnticipo" type="checkbox" class="interruptor" :disabled="!carrito.length" />
          </label>

          <div v-if="conAnticipo" class="mt-4 space-y-3">
            <div>
              <label class="ip-label" for="a-cliente">Cliente</label>
              <input id="a-cliente" v-model="cliente" class="ip-input" placeholder="Nombre de quien encarga" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="ip-label" for="a-telefono">Teléfono</label>
                <input id="a-telefono" v-model="telefono" type="tel" class="ip-input" placeholder="Opcional" />
              </div>
              <div>
                <label class="ip-label" for="a-entrega">Entrega</label>
                <input id="a-entrega" v-model="entrega" type="date" class="ip-input" />
              </div>
            </div>
            <div>
              <label class="ip-label" for="a-monto">Anticipo</label>
              <input
                id="a-monto"
                v-model.number="anticipo"
                type="number"
                inputmode="decimal"
                min="0.01"
                :max="total"
                step="0.01"
                class="ip-input"
                placeholder="$0.00"
              />
              <div class="mt-2 grid grid-cols-3 gap-2">
                <button
                  v-for="porcentaje in [30, 50, 70]"
                  :key="porcentaje"
                  type="button"
                  class="min-h-9 cursor-pointer rounded-lg border-0 bg-blue-50 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"
                  @click="anticipoPorcentaje(porcentaje)"
                >
                  {{ porcentaje }}%
                </button>
              </div>
            </div>
            <p v-if="(anticipo ?? 0) >= total" class="text-xs font-semibold text-rose-700">
              El anticipo debe ser menor al total. Si paga todo, cóbralo como venta normal.
            </p>
            <p v-else class="flex justify-between rounded-xl bg-white px-4 py-2.5 text-sm font-semibold ring-1 ring-slate-200">
              <span class="text-slate-500">Saldo pendiente</span><span class="text-rose-700 tabular-nums">{{ dinero(saldo) }}</span>
            </p>
          </div>
        </div>

        <p class="mt-5 mb-2 text-sm font-semibold text-slate-700">Método de pago</p>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="opcion in metodos"
            :key="opcion.id"
            type="button"
            :class="[
              'ip-boton flex min-w-0 cursor-pointer flex-col items-center gap-1.5 rounded-xl border-0 px-1 py-3 text-xs font-semibold',
              metodo === opcion.id ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:ring-blue-300',
            ]"
            :aria-pressed="metodo === opcion.id"
            @click="metodo = opcion.id"
          >
            <component :is="opcion.icono" class="size-5" />
            {{ opcion.id }}
          </button>
        </div>

        <div v-if="metodo === 'Efectivo'" class="mt-4">
          <label class="ip-label" for="recibido">Recibido</label>
          <input id="recibido" v-model.number="recibido" type="number" inputmode="decimal" min="0" class="ip-input" placeholder="$0.00" />
          <div class="mt-2 grid grid-cols-4 gap-2">
            <button
              v-for="billete in billetes"
              :key="billete"
              type="button"
              class="min-h-9 cursor-pointer rounded-lg border-0 bg-emerald-50 py-1.5 text-xs font-bold text-emerald-700 tabular-nums transition-colors hover:bg-emerald-100"
              @click="recibido = billete"
            >
              ${{ billete }}
            </button>
          </div>
          <p class="mt-3 flex justify-between rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <span>Cambio</span><span class="tabular-nums">{{ dinero(cambio) }}</span>
          </p>
        </div>

        <UiButton size="lg" class="mt-5 w-full" :disabled="!puedeCobrar" @click="cobrar">
          {{ conAnticipo ? 'Cobrar anticipo' : 'Cobrar' }} {{ dinero(aCobrar) }}
        </UiButton>
      </UiCard>
    </aside>

    <Ticket v-if="ventaHecha" :venta="ventaHecha" @cerrar="ventaHecha = null" />
    <Anticipos v-if="verAnticipos" @cerrar="verAnticipos = false" @abonado="alAbonar" />
  </div>
</template>

<style scoped>
.interruptor {
  position: relative;
  width: 2.75rem;
  height: 1.5rem;
  flex-shrink: 0;
  appearance: none;
  border-radius: 999px;
  background: #cbd5e1;
  cursor: pointer;
  transition: background-color 160ms ease;
}

.interruptor::after {
  content: '';
  position: absolute;
  top: 0.2rem;
  left: 0.2rem;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.3);
  transition: transform 160ms var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .interruptor::after {
    transition: none;
  }
}

.interruptor:checked {
  background: var(--marca-600);
}

.interruptor:checked::after {
  transform: translateX(1.25rem);
}

.interruptor:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.interruptor:focus-visible {
  outline: 2px solid var(--marca-500);
  outline-offset: 2px;
}

html.oscuro .interruptor:not(:checked) {
  background: #2b3950;
}
</style>
