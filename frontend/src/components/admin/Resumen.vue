<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, HandCoins, Sparkles, Store, TrendingUp } from '@lucide/vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Encabezado from '../ui/Encabezado.vue'
import EstadoBadge from './EstadoBadge.vue'
import type { SeccionAdmin } from './secciones'
import { diasPara, estado, metricas, type EstadoCuenta } from '@/stores/admin'
import { dinero, fechaYHora } from '@/lib/formato'

defineEmits<{ ir: [seccion: SeccionAdmin]; verCuenta: [id: string] }>()

const kpis = computed(() => [
  {
    titulo: 'Ingreso mensual recurrente',
    valor: dinero(metricas.value.mrr),
    detalle: `${metricas.value.porEstado.Activa} cuentas pagando`,
    icono: TrendingUp,
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    titulo: 'Cuentas cliente',
    valor: String(metricas.value.total),
    detalle: `${metricas.value.porEstado.Suspendida} ${metricas.value.porEstado.Suspendida === 1 ? 'suspendida' : 'suspendidas'}`,
    icono: Store,
    color: 'bg-blue-600/10 text-blue-600',
  },
  {
    titulo: 'En prueba gratis',
    valor: String(metricas.value.porEstado.Prueba),
    detalle: `${dinero(metricas.value.potencial)} / mes potenciales`,
    icono: Sparkles,
    color: 'bg-amber-300/30 text-amber-700',
  },
  {
    titulo: 'Por cobrar',
    valor: dinero(metricas.value.porCobrar),
    detalle: `${metricas.value.vencidos} pagos vencidos`,
    icono: HandCoins,
    color: 'bg-rose-500/10 text-rose-600',
  },
])

const colorEstado: Record<EstadoCuenta, string> = {
  Activa: 'bg-emerald-500',
  Prueba: 'bg-blue-500',
  Vencida: 'bg-amber-400',
  Suspendida: 'bg-rose-500',
}

const distribucion = computed(() =>
  (Object.keys(colorEstado) as EstadoCuenta[]).map((clave) => ({
    clave,
    total: metricas.value.porEstado[clave],
    porcentaje: metricas.value.total ? (metricas.value.porEstado[clave] / metricas.value.total) * 100 : 0,
  })),
)

const maxAltas = computed(() => Math.max(1, ...metricas.value.altas.map((a) => a.total)))
const maxPlan = computed(() => Math.max(1, ...metricas.value.porPlan.map((p) => p.total)))
</script>

<template>
  <div>
    <Encabezado titulo="Resumen de la plataforma" descripcion="Todas las cuentas que contrataron iPaletitas, en un vistazo." />

    <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <UiCard v-for="kpi in kpis" :key="kpi.titulo" class="bg-white p-6">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-slate-500">{{ kpi.titulo }}</p>
          <span :class="['grid size-10 place-items-center rounded-xl', kpi.color]">
            <component :is="kpi.icono" class="size-5" />
          </span>
        </div>
        <p class="mt-4 text-3xl font-extrabold tracking-tight">{{ kpi.valor }}</p>
        <p class="mt-1 text-xs text-slate-400">{{ kpi.detalle }}</p>
      </UiCard>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-3">
      <UiCard class="min-w-0 bg-white p-6 lg:col-span-2">
        <h3 class="text-lg font-bold">Estado de las cuentas</h3>
        <div class="mt-5 flex h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            v-for="d in distribucion"
            :key="d.clave"
            :class="colorEstado[d.clave]"
            :style="{ width: `${d.porcentaje}%` }"
            :title="`${d.clave}: ${d.total}`"
          />
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div v-for="d in distribucion" :key="d.clave" class="rounded-xl bg-slate-50 p-3">
            <p class="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span :class="['size-2.5 rounded-full', colorEstado[d.clave]]" />
              {{ d.clave }}
            </p>
            <p class="mt-1 text-xl font-extrabold">{{ d.total }}</p>
          </div>
        </div>

        <div class="mt-8 grid gap-8 md:grid-cols-2">
          <div>
            <p class="text-sm font-bold">Altas de los últimos 6 meses</p>
            <div class="mt-4 flex h-36 items-end gap-3">
              <div v-for="mes in metricas.altas" :key="mes.etiqueta" class="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span class="text-xs font-bold text-slate-500">{{ mes.total }}</span>
                <div class="w-full rounded-t-lg bg-gradient-to-t from-blue-700 to-blue-500" :style="{ height: `${Math.max(4, (mes.total / maxAltas) * 100)}%` }" />
                <span class="text-xs font-semibold text-slate-400 capitalize">{{ mes.etiqueta }}</span>
              </div>
            </div>
          </div>
          <div>
            <p class="text-sm font-bold">Cuentas por plan</p>
            <ul class="mt-4 list-none space-y-4 p-0">
              <li v-for="p in metricas.porPlan" :key="p.plan.id">
                <div class="flex justify-between text-sm">
                  <span class="font-semibold">{{ p.plan.nombre }}</span>
                  <span class="text-slate-500">{{ p.total }} · {{ dinero(p.mrr) }}/mes</span>
                </div>
                <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div class="h-full rounded-full bg-amber-400" :style="{ width: `${(p.total / maxPlan) * 100}%` }" />
                </div>
              </li>
            </ul>
          </div>
        </div>
      </UiCard>

      <UiCard class="flex min-w-0 flex-col bg-white p-6">
        <h3 class="text-lg font-bold">Pruebas por vencer</h3>
        <p class="text-sm text-slate-500">Llama antes de que terminen para convertirlas en pago.</p>
        <ul v-if="metricas.porVencer.length" class="mt-4 flex-1 list-none space-y-2 p-0">
          <li v-for="cuenta in metricas.porVencer" :key="cuenta.id">
            <button
              type="button"
              class="flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-slate-50 p-3 text-left transition hover:bg-blue-50"
              @click="$emit('verCuenta', cuenta.id)"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">{{ cuenta.negocio }}</p>
                <p class="text-xs text-slate-400">{{ cuenta.titular }} · {{ cuenta.telefono }}</p>
              </div>
              <span :class="['text-xs font-bold', diasPara(cuenta.vence) <= 2 ? 'text-rose-600' : 'text-amber-600']">
                {{ diasPara(cuenta.vence) }} días
              </span>
            </button>
          </li>
        </ul>
        <p v-else class="grid flex-1 place-items-center py-8 text-sm text-slate-400">No hay pruebas por vencer esta semana.</p>
        <UiButton variant="outline" class="mt-4 w-full" @click="$emit('ir', 'cuentas')">
          Ver todas las cuentas
          <ArrowRight class="size-4" />
        </UiButton>
      </UiCard>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-2">
      <UiCard class="min-w-0 bg-white p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold">Cobros pendientes</h3>
          <UiButton variant="ghost" size="sm" @click="$emit('ir', 'cobranza')">
            Ir a cobranza
            <ArrowRight class="size-4" />
          </UiButton>
        </div>
        <ul class="mt-4 list-none space-y-2 p-0">
          <li
            v-for="pago in estado.pagos.filter((p) => p.estado !== 'Pagado').slice(0, 5)"
            :key="pago.id"
            class="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">{{ pago.negocio }}</p>
              <p class="text-xs text-slate-400">F-{{ pago.folio }} · {{ pago.concepto }}</p>
            </div>
            <EstadoBadge :estado="pago.estado" />
            <span class="w-24 text-right text-sm font-bold">{{ dinero(pago.monto) }}</span>
          </li>
          <li v-if="!estado.pagos.some((p) => p.estado !== 'Pagado')" class="py-6 text-center text-sm text-slate-400">
            Todo está cobrado.
          </li>
        </ul>
      </UiCard>

      <UiCard class="min-w-0 bg-white p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold">Actividad reciente</h3>
          <UiButton variant="ghost" size="sm" @click="$emit('ir', 'bitacora')">
            Ver bitácora
            <ArrowRight class="size-4" />
          </UiButton>
        </div>
        <ul class="mt-4 list-none space-y-3 p-0">
          <li v-for="evento in estado.bitacora.slice(0, 5)" :key="evento.id" class="flex gap-3 text-sm">
            <span class="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />
            <div class="min-w-0">
              <p><strong>{{ evento.autor }}</strong> {{ evento.accion.toLowerCase() }}</p>
              <p class="text-xs text-slate-400">{{ evento.detalle }} · {{ fechaYHora(evento.fecha) }}</p>
            </div>
          </li>
          <li v-if="!estado.bitacora.length" class="py-6 text-center text-sm text-slate-400">Sin actividad todavía.</li>
        </ul>
      </UiCard>
    </div>

  </div>
</template>
