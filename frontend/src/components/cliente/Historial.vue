<script setup lang="ts">
import { computed, ref } from 'vue'
import { Eye, Search, TrendingDown, TrendingUp } from '@lucide/vue'
import UiBadge from '../ui/Badge.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Encabezado from '../ui/Encabezado.vue'
import Ticket from './Ticket.vue'
import GraficaVentas from './historial/GraficaVentas.vue'
import ProductoEstrella from './historial/ProductoEstrella.vue'
import { PERIODOS, barras, enRango, rango, ranking, type Periodo } from './historial/periodos'
import { planActual, puede, saldoDe, ventasSucursal, type MetodoPago, type Venta } from '@/stores/negocio'
import { dinero, fechaYHora, plural } from '@/lib/formato'

defineEmits(['cambiarPlan'])

const busqueda = ref('')
const metodo = ref<'Todos' | MetodoPago>('Todos')
const desde = ref('')
const hasta = ref('')
const ventaVista = ref<Venta | null>(null)
const periodo = ref<Periodo>('semana')

const meses = computed(() => planActual.value?.limites.historialMeses ?? 3)
const fechaLimite = computed(() => {
  if (meses.value === Infinity) return null
  const fecha = new Date()
  fecha.setMonth(fecha.getMonth() - meses.value)
  return fecha
})

const disponibles = computed(() =>
  fechaLimite.value ? ventasSucursal.value.filter((v) => new Date(v.fecha) >= fechaLimite.value!) : ventasSucursal.value,
)

const infoPeriodo = computed(() => PERIODOS.find((p) => p.id === periodo.value)!)
const delPeriodo = computed(() => enRango(disponibles.value, rango(periodo.value)))
const totalPeriodo = computed(() => delPeriodo.value.reduce((suma, v) => suma + v.total, 0))
const totalAnterior = computed(() =>
  enRango(disponibles.value, rango(periodo.value, 1)).reduce((suma, v) => suma + v.total, 0),
)
const variacion = computed(() =>
  totalAnterior.value ? Math.round(((totalPeriodo.value - totalAnterior.value) / totalAnterior.value) * 100) : null,
)
const barrasPeriodo = computed(() => barras(delPeriodo.value, periodo.value))
const rankingPeriodo = computed(() => ranking(delPeriodo.value))

const lista = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return disponibles.value
    .filter((v) => {
      const fecha = new Date(v.fecha)
      if (metodo.value !== 'Todos' && v.metodoPago !== metodo.value) return false
      if (desde.value && fecha < new Date(`${desde.value}T00:00`)) return false
      if (hasta.value && fecha > new Date(`${hasta.value}T23:59:59`)) return false
      return `${v.folio} ${v.cajero} ${v.anticipo?.cliente ?? ''} ${v.partidas.map((p) => p.nombre).join(' ')}`
        .toLowerCase()
        .includes(texto)
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
})

const total = computed(() => lista.value.reduce((suma, v) => suma + v.total, 0))
const piezas = computed(() =>
  lista.value.reduce((suma, v) => suma + v.partidas.reduce((s, p) => s + p.cantidad, 0), 0),
)

function limpiar() {
  busqueda.value = ''
  metodo.value = 'Todos'
  desde.value = ''
  hasta.value = ''
}
</script>

<template>
  <div>
    <Encabezado
      titulo="Historial de ventas"
      :descripcion="
        meses === Infinity
          ? `Tu licencia ${planActual?.nombre} guarda todo tu historial.`
          : `Tu licencia ${planActual?.nombre} guarda ${meses} meses de historial.`
      "
    >
      <UiButton v-if="meses !== Infinity && puede('licencia.editar')" variant="outline" @click="$emit('cambiarPlan')">Ampliar historial</UiButton>
    </Encabezado>

    <UiCard class="mb-6 bg-white p-5 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="font-display text-lg font-semibold text-slate-900">Ventas por periodo</h2>
          <p class="text-sm text-slate-500">{{ infoPeriodo.descripcion }}</p>
        </div>
        <div class="flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Periodo de la gráfica">
          <button
            v-for="opcion in PERIODOS"
            :key="opcion.id"
            type="button"
            :class="[
              'min-h-9 cursor-pointer rounded-lg border-0 px-4 py-1.5 text-sm font-semibold transition-colors',
              periodo === opcion.id ? 'bg-white text-blue-700 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900',
            ]"
            :aria-pressed="periodo === opcion.id"
            @click="periodo = opcion.id"
          >
            {{ opcion.etiqueta }}
          </button>
        </div>
      </div>

      <div class="mt-5 grid gap-6 xl:grid-cols-[1fr_300px]">
        <div class="min-w-0">
          <div class="mb-4 flex flex-wrap items-end gap-x-6 gap-y-2">
            <p class="ip-cifra text-3xl text-slate-900">{{ dinero(totalPeriodo) }}</p>
            <p class="text-sm text-slate-500 tabular-nums">{{ plural(delPeriodo.length, 'ticket', 'tickets') }}</p>
            <p
              v-if="variacion !== null"
              :class="[
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums',
                variacion >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
              ]"
            >
              <component :is="variacion >= 0 ? TrendingUp : TrendingDown" class="size-3.5" />
              {{ variacion >= 0 ? '+' : '' }}{{ variacion }}% vs {{ infoPeriodo.anterior }}
            </p>
          </div>
          <GraficaVentas :barras="barrasPeriodo" />
        </div>
        <ProductoEstrella
          :key="`${periodo}-${rankingPeriodo[0]?.productoId ?? 'nada'}`"
          :ranking="rankingPeriodo"
          :periodo="infoPeriodo.descripcion"
        />
      </div>
    </UiCard>

    <UiCard class="mb-6 bg-white p-5">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_170px_170px_180px_auto] xl:items-end">
        <div>
          <label class="ip-label" for="h-buscar">Buscar</label>
          <div class="relative">
            <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
            <input id="h-buscar" v-model="busqueda" class="ip-input ip-input-icono" placeholder="Folio, cajero o producto" />
          </div>
        </div>
        <div>
          <label class="ip-label" for="h-desde">Desde</label>
          <input id="h-desde" v-model="desde" type="date" class="ip-input" />
        </div>
        <div>
          <label class="ip-label" for="h-hasta">Hasta</label>
          <input id="h-hasta" v-model="hasta" type="date" class="ip-input" />
        </div>
        <div>
          <label class="ip-label" for="h-metodo">Método de pago</label>
          <select id="h-metodo" v-model="metodo" class="ip-input cursor-pointer">
            <option>Todos</option>
            <option>Efectivo</option>
            <option>Tarjeta</option>
            <option>Transferencia</option>
          </select>
        </div>
        <UiButton variant="ghost" class="h-[2.9rem]" @click="limpiar">Limpiar</UiButton>
      </div>
    </UiCard>

    <div class="ip-tira mb-6 sm:grid-cols-3">
      <div class="p-5">
        <p class="text-sm text-slate-500">Ventas encontradas</p>
        <p class="ip-cifra mt-2 text-2xl text-slate-900">{{ lista.length.toLocaleString('es-MX') }}</p>
      </div>
      <div class="p-5">
        <p class="text-sm text-slate-500">Total vendido</p>
        <p class="ip-cifra mt-2 text-2xl text-slate-900">{{ dinero(total) }}</p>
      </div>
      <div class="p-5">
        <p class="text-sm text-slate-500">Piezas vendidas</p>
        <p class="ip-cifra mt-2 text-2xl text-slate-900">{{ piezas.toLocaleString('es-MX') }}</p>
      </div>
    </div>

    <UiCard class="overflow-hidden bg-white">
      <div class="overflow-x-auto">
        <table class="ip-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Atendió</th>
              <th>Productos</th>
              <th>Pago</th>
              <th class="text-right">Total</th>
              <th class="text-right">Ticket</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="venta in lista" :key="venta.id">
              <td class="font-bold text-slate-900">#{{ venta.folio }}</td>
              <td class="whitespace-nowrap">{{ fechaYHora(venta.fecha) }}</td>
              <td>{{ venta.cajero }}</td>
              <td>
                <span class="block max-w-xs truncate" :title="venta.partidas.map((p) => `${p.cantidad}× ${p.nombre}`).join(', ')">
                  {{ venta.partidas.map((p) => `${p.cantidad}× ${p.nombre}`).join(', ') }}
                </span>
              </td>
              <td>
                <UiBadge :variant="venta.metodoPago === 'Efectivo' ? 'default' : venta.metodoPago === 'Tarjeta' ? 'blue' : 'gold'">
                  {{ venta.metodoPago }}
                </UiBadge>
                <UiBadge v-if="venta.anticipo" :variant="saldoDe(venta) > 0 ? 'aviso' : 'default'" class="mt-1">
                  {{ saldoDe(venta) > 0 ? `Debe ${dinero(saldoDe(venta))}` : 'Anticipo liquidado' }}
                </UiBadge>
              </td>
              <td class="text-right font-bold whitespace-nowrap text-slate-900 tabular-nums">{{ dinero(venta.total) }}</td>
              <td class="text-right">
                <UiButton variant="ghost" size="sm" @click="ventaVista = venta">
                  <Eye class="size-4" />
                  Ver
                </UiButton>
              </td>
            </tr>
            <tr v-if="!lista.length">
              <td colspan="7" class="py-14 text-center text-slate-500">No hay ventas con esos filtros.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <Ticket v-if="ventaVista" :venta="ventaVista" @cerrar="ventaVista = null" />
  </div>
</template>
