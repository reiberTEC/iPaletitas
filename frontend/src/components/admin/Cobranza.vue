<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Banknote, HandCoins, Search, TriangleAlert } from '@lucide/vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Encabezado from '../ui/Encabezado.vue'
import EstadoBadge from './EstadoBadge.vue'
import ModalPago from './ModalPago.vue'
import { DIAS_COBRO } from '@/stores/catalogo'
import {
  diasPara,
  estado,
  metricas,
  porCobrar,
  registrarPago,
  vencimientoAlPagar,
  type EstadoPago,
  type Pago,
} from '@/stores/admin'
import { dinero, fecha, plural } from '@/lib/formato'

defineEmits<{ verCuenta: [id: string] }>()

const filtro = ref<'Todos' | EstadoPago>('Todos')
const busqueda = ref('')
const cobrando = ref<Pago | null>(null)
const aviso = ref('')
let temporizador: ReturnType<typeof setTimeout> | undefined

const lista = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return [...estado.pagos]
    .filter((p) => filtro.value === 'Todos' || p.estado === filtro.value)
    .filter((p) => `F-${p.folio} ${p.negocio} ${p.concepto}`.toLowerCase().includes(texto))
    .sort((a, b) => b.emitido.localeCompare(a.emitido))
})

const conteo = (valor: EstadoPago) => estado.pagos.filter((p) => p.estado === valor).length

function confirmar(referencia: string) {
  const pago = cobrando.value
  if (!pago) return
  const vence = registrarPago(pago.id, referencia)
  cobrando.value = null
  aviso.value = vence
    ? `Pago de ${pago.negocio} registrado. Su licencia queda activa hasta el ${fecha(vence)}.`
    : `Pago de ${pago.negocio} registrado.`
  clearTimeout(temporizador)
  temporizador = setTimeout(() => (aviso.value = ''), 4000)
}

function plazo(pago: Pago) {
  const dias = diasPara(pago.limite)
  return dias <= 0 ? 'Vence hoy' : `${plural(dias, 'día', 'días')} para pagar`
}

onBeforeUnmount(() => clearTimeout(temporizador))
</script>

<template>
  <div>
    <Encabezado titulo="Cobranza" descripcion="Cargos de licencias emitidos a cada cuenta y su estado de pago." />

    <div class="mb-6 grid gap-5 sm:grid-cols-3">
      <UiCard class="flex items-center gap-4 bg-white p-5">
        <span class="grid size-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600"><Banknote class="size-5" /></span>
        <div>
          <p class="text-sm text-slate-500">Cobrado este mes</p>
          <p class="text-2xl font-extrabold">{{ dinero(metricas.cobradoMes) }}</p>
        </div>
      </UiCard>
      <UiCard class="flex items-center gap-4 bg-white p-5">
        <span class="grid size-11 place-items-center rounded-xl bg-amber-300/30 text-amber-700"><HandCoins class="size-5" /></span>
        <div>
          <p class="text-sm text-slate-500">Por cobrar</p>
          <p class="text-2xl font-extrabold">{{ dinero(metricas.porCobrar) }}</p>
        </div>
      </UiCard>
      <UiCard class="flex items-center gap-4 bg-white p-5">
        <span class="grid size-11 place-items-center rounded-xl bg-rose-500/10 text-rose-600"><TriangleAlert class="size-5" /></span>
        <div>
          <p class="text-sm text-slate-500">Pagos vencidos</p>
          <p class="text-2xl font-extrabold">{{ metricas.vencidos }}</p>
        </div>
      </UiCard>
    </div>

    <div class="mb-6 space-y-1 rounded-2xl bg-blue-50 px-5 py-4 text-sm text-blue-900 ring-1 ring-blue-100">
      <p>
        <strong>Solo recibimos transferencias.</strong> iPaletitas no se conecta con bancos: cuando confirmes la transferencia
        del cliente, regístrala aquí y su licencia se renueva un periodo.
      </p>
      <p>
        El cargo se genera el día que vence la licencia. El cliente sigue entrando {{ DIAS_COBRO }} días para pagar; si llega la
        fecha límite sin pago, su licencia se suspende hasta que lo registres.
      </p>
    </div>

    <UiCard class="overflow-hidden bg-white">
      <div class="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opcion in (['Todos', 'Pendiente', 'Vencido', 'Pagado', 'Reembolsado'] as const)"
            :key="opcion"
            type="button"
            :class="[
              'cursor-pointer rounded-full border-0 px-3.5 py-2 text-sm font-semibold transition',
              filtro === opcion ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:ring-blue-300',
            ]"
            @click="filtro = opcion"
          >
            {{ opcion }}
            <span class="opacity-60">{{ opcion === 'Todos' ? estado.pagos.length : conteo(opcion) }}</span>
          </button>
        </div>
        <label class="relative lg:ml-auto lg:w-80">
          <span class="sr-only">Buscar</span>
          <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input v-model="busqueda" class="ip-input ip-input-icono" placeholder="Folio, negocio o concepto" />
        </label>
      </div>
      <div class="overflow-x-auto">
        <table class="ip-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Negocio</th>
              <th>Concepto</th>
              <th>Emitido</th>
              <th>Fecha límite</th>
              <th>Estado</th>
              <th class="text-right">Monto</th>
              <th class="text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pago in lista" :key="pago.id">
              <td class="font-bold whitespace-nowrap text-slate-900">F-{{ pago.folio }}</td>
              <td>
                <button
                  type="button"
                  class="cursor-pointer border-0 bg-transparent p-0 text-left font-semibold text-slate-900 hover:text-blue-700"
                  @click="$emit('verCuenta', pago.cuentaId)"
                >
                  {{ pago.negocio }}
                </button>
              </td>
              <td class="text-slate-500">{{ pago.concepto }}</td>
              <td class="whitespace-nowrap">{{ fecha(pago.emitido) }}</td>
              <td class="whitespace-nowrap">{{ fecha(pago.limite) }}</td>
              <td>
                <EstadoBadge :estado="pago.estado" />
                <p v-if="!porCobrar(pago) && pago.metodo" class="mt-1 text-xs [overflow-wrap:anywhere] text-slate-400">
                  {{ pago.metodo }}<template v-if="pago.referencia"> · {{ pago.referencia }}</template>
                </p>
                <p v-else-if="pago.estado === 'Pendiente'" class="mt-1 text-xs whitespace-nowrap text-amber-800">{{ plazo(pago) }}</p>
                <p v-else-if="pago.periodo" class="mt-1 text-xs whitespace-nowrap text-rose-600">Licencia suspendida</p>
              </td>
              <td class="text-right font-bold text-slate-900">{{ dinero(pago.monto) }}</td>
              <td class="text-right">
                <UiButton v-if="porCobrar(pago)" size="sm" class="whitespace-nowrap" @click="cobrando = pago">Registrar pago</UiButton>
                <span v-else class="text-xs whitespace-nowrap text-slate-400">{{ pago.pagadoEl ? fecha(pago.pagadoEl) : '' }}</span>
              </td>
            </tr>
            <tr v-if="!lista.length">
              <td colspan="8" class="py-14 text-center text-slate-400">No hay cargos con ese filtro.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <ModalPago
      v-if="cobrando"
      :cargo="cobrando"
      :vence-nuevo="vencimientoAlPagar(cobrando.cuentaId)"
      @confirmar="confirmar"
      @cerrar="cobrando = null"
    />

    <Transition name="aviso">
      <div v-if="aviso" role="status" class="ip-aviso">{{ aviso }}</div>
    </Transition>
  </div>
</template>
