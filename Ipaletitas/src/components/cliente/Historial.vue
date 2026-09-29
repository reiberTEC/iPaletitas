<script setup lang="ts">
import { computed, ref } from 'vue'
import { Eye, Search } from '@lucide/vue'
import UiBadge from '../ui/Badge.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Encabezado from '../ui/Encabezado.vue'
import Ticket from './Ticket.vue'
import { planActual, ventasSucursal, type MetodoPago, type Venta } from '@/stores/negocio'
import { dinero, fechaYHora } from '@/lib/formato'

defineEmits(['cambiarPlan'])

const busqueda = ref('')
const metodo = ref<'Todos' | MetodoPago>('Todos')
const desde = ref('')
const hasta = ref('')
const ventaVista = ref<Venta | null>(null)

const meses = computed(() => planActual.value?.limites.historialMeses ?? 3)
const fechaLimite = computed(() => {
  if (meses.value === Infinity) return null
  const fecha = new Date()
  fecha.setMonth(fecha.getMonth() - meses.value)
  return fecha
})

const lista = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return ventasSucursal.value
    .filter((v) => {
      const fecha = new Date(v.fecha)
      if (fechaLimite.value && fecha < fechaLimite.value) return false
      if (metodo.value !== 'Todos' && v.metodoPago !== metodo.value) return false
      if (desde.value && fecha < new Date(`${desde.value}T00:00`)) return false
      if (hasta.value && fecha > new Date(`${hasta.value}T23:59:59`)) return false
      return `${v.folio} ${v.cajero} ${v.partidas.map((p) => p.nombre).join(' ')}`.toLowerCase().includes(texto)
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
      <UiButton v-if="meses !== Infinity" variant="outline" @click="$emit('cambiarPlan')">Ampliar historial</UiButton>
    </Encabezado>

    <UiCard class="mb-6 bg-white p-5">
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_170px_170px_180px_auto] xl:items-end">
        <div>
          <label class="ip-label" for="h-buscar">Buscar</label>
          <div class="relative">
            <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
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

    <div class="mb-6 grid gap-5 sm:grid-cols-3">
      <UiCard class="p-5">
        <p class="text-sm text-slate-500">Ventas encontradas</p>
        <p class="mt-2 text-2xl font-extrabold">{{ lista.length }}</p>
      </UiCard>
      <UiCard class="p-5">
        <p class="text-sm text-slate-500">Total vendido</p>
        <p class="mt-2 text-2xl font-extrabold">{{ dinero(total) }}</p>
      </UiCard>
      <UiCard class="p-5">
        <p class="text-sm text-slate-500">Piezas vendidas</p>
        <p class="mt-2 text-2xl font-extrabold">{{ piezas }}</p>
      </UiCard>
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
              <td class="max-w-xs truncate">{{ venta.partidas.map((p) => `${p.cantidad}× ${p.nombre}`).join(', ') }}</td>
              <td>
                <UiBadge :variant="venta.metodoPago === 'Efectivo' ? 'default' : venta.metodoPago === 'Tarjeta' ? 'blue' : 'gold'">
                  {{ venta.metodoPago }}
                </UiBadge>
              </td>
              <td class="text-right font-bold text-slate-900">{{ dinero(venta.total) }}</td>
              <td class="text-right">
                <UiButton variant="ghost" size="sm" @click="ventaVista = venta">
                  <Eye class="size-4" />
                  Ver
                </UiButton>
              </td>
            </tr>
            <tr v-if="!lista.length">
              <td colspan="7" class="py-14 text-center text-slate-400">No hay ventas con esos filtros.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <Ticket v-if="ventaVista" :venta="ventaVista" @cerrar="ventaVista = null" />
  </div>
</template>
