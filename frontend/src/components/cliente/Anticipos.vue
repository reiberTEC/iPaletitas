<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRightLeft, Banknote, CalendarDays, CreditCard, HandCoins, Phone } from '@lucide/vue'
import UiButton from '../ui/Button.vue'
import UiModal from '../ui/Modal.vue'
import {
  abonarAnticipo,
  anticiposPendientes,
  pagadoDe,
  saldoDe,
  type MetodoPago,
  type Venta,
} from '@/stores/negocio'
import { dinero, fecha, fechaDia } from '@/lib/formato'

const emit = defineEmits<{ cerrar: []; abonado: [venta: Venta] }>()

const metodos = [
  { id: 'Efectivo' as const, icono: Banknote },
  { id: 'Tarjeta' as const, icono: CreditCard },
  { id: 'Transferencia' as const, icono: ArrowRightLeft },
]

const seleccionada = ref<Venta | null>(null)
const monto = ref<number | null>(null)
const metodo = ref<MetodoPago>('Efectivo')
const recibido = ref<number | null>(null)

const saldo = computed(() => (seleccionada.value ? saldoDe(seleccionada.value) : 0))
const cambio = computed(() => Math.max(0, (recibido.value ?? 0) - (monto.value ?? 0)))
const puedeCobrar = computed(() => {
  const abono = monto.value ?? 0
  if (abono <= 0 || abono > saldo.value) return false
  return metodo.value !== 'Efectivo' || (recibido.value ?? 0) >= abono
})

function elegir(venta: Venta) {
  seleccionada.value = venta
  monto.value = saldoDe(venta)
  metodo.value = 'Efectivo'
  recibido.value = null
}

function cobrar() {
  if (!seleccionada.value || !puedeCobrar.value) return
  const venta = abonarAnticipo(seleccionada.value.id, monto.value ?? 0, metodo.value, recibido.value ?? 0)
  seleccionada.value = null
  if (venta) emit('abonado', venta)
}

const porcentaje = (venta: Venta) => Math.round((pagadoDe(venta) / venta.total) * 100)
</script>

<template>
  <UiModal titulo="Anticipos pendientes" ancho="max-w-2xl" @cerrar="emit('cerrar')">
    <div v-if="!anticiposPendientes.length" class="grid place-items-center py-10 text-center">
      <HandCoins class="size-10 text-slate-300" />
      <p class="mt-3 font-semibold text-slate-700">No hay anticipos por cobrar</p>
      <p class="mt-1 text-sm text-slate-500">
        Al cobrar una venta, activa "Venta con anticipo" para que el cliente pague una parte ahora y el resto después.
      </p>
    </div>

    <ul v-else class="list-none space-y-3 p-0">
      <li
        v-for="venta in anticiposPendientes"
        :key="venta.id"
        :class="[
          'rounded-2xl p-4 ring-1 transition-colors',
          seleccionada?.id === venta.id ? 'bg-blue-50 ring-blue-300' : 'bg-slate-50 ring-slate-200',
        ]"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-bold [overflow-wrap:anywhere] text-slate-900">{{ venta.anticipo?.cliente }}</p>
            <p class="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>Ticket #{{ venta.folio }} · {{ fecha(venta.fecha) }}</span>
              <span v-if="venta.anticipo?.telefono" class="inline-flex items-center gap-1">
                <Phone class="size-3" />{{ venta.anticipo.telefono }}
              </span>
              <span v-if="venta.anticipo?.entrega" class="inline-flex items-center gap-1">
                <CalendarDays class="size-3" />Entrega {{ fechaDia(venta.anticipo.entrega) }}
              </span>
            </p>
            <p class="mt-1 line-clamp-1 text-xs text-slate-500">
              {{ venta.partidas.map((p) => `${p.cantidad}× ${p.nombre}`).join(', ') }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-500">Saldo</p>
            <p class="ip-cifra text-xl text-rose-700">{{ dinero(saldoDe(venta)) }}</p>
          </div>
        </div>

        <div class="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div class="h-full rounded-full bg-emerald-600" :style="{ width: `${porcentaje(venta)}%` }" />
        </div>
        <p class="mt-1.5 flex flex-wrap justify-between gap-x-3 text-xs text-slate-500 tabular-nums">
          <span>Pagado {{ dinero(pagadoDe(venta)) }} ({{ porcentaje(venta) }}%)</span>
          <span>Total {{ dinero(venta.total) }}</span>
        </p>

        <UiButton v-if="seleccionada?.id !== venta.id" variant="outline" size="sm" class="mt-3" @click="elegir(venta)">
          <HandCoins class="size-4" />
          Cobrar saldo
        </UiButton>

        <form v-else class="mt-4 space-y-3 border-t border-slate-200 pt-4" @submit.prevent="cobrar">
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="ip-label" :for="`abono-${venta.id}`">Monto a cobrar</label>
              <input
                :id="`abono-${venta.id}`"
                v-model.number="monto"
                type="number"
                inputmode="decimal"
                min="0.01"
                :max="saldo"
                step="0.01"
                class="ip-input"
              />
              <p class="mt-1 text-xs text-slate-500">Puedes cobrar todo el saldo o solo un abono.</p>
            </div>
            <div v-if="metodo === 'Efectivo'">
              <label class="ip-label" :for="`recibido-${venta.id}`">Recibido</label>
              <input
                :id="`recibido-${venta.id}`"
                v-model.number="recibido"
                type="number"
                inputmode="decimal"
                min="0"
                class="ip-input"
                placeholder="$0.00"
              />
              <p class="mt-1 text-xs font-semibold text-emerald-700">Cambio {{ dinero(cambio) }}</p>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="opcion in metodos"
              :key="opcion.id"
              type="button"
              :class="[
                'ip-boton flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-0 px-1 py-2.5 text-xs font-semibold',
                metodo === opcion.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-blue-300',
              ]"
              @click="metodo = opcion.id"
            >
              <component :is="opcion.icono" class="size-4" />
              {{ opcion.id }}
            </button>
          </div>

          <div class="flex justify-end gap-2">
            <UiButton variant="ghost" size="sm" @click="seleccionada = null">Cancelar</UiButton>
            <UiButton type="submit" size="sm" :disabled="!puedeCobrar">
              {{ (monto ?? 0) >= saldo ? 'Liquidar' : 'Abonar' }} {{ dinero(monto ?? 0) }}
            </UiButton>
          </div>
        </form>
      </li>
    </ul>
  </UiModal>
</template>
