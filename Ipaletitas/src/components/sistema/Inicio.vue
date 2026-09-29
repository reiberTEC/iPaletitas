<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ArrowRight,
  Banknote,
  Package,
  PackagePlus,
  Receipt,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
} from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import UiBadge from '../ui/Badge.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Ticket from './Ticket.vue'
import type { Seccion } from './secciones'
import { estado, stock, sucursalActiva, ventasSucursal, type Venta } from '@/stores/negocio'
import { dinero, hora, mismoDia } from '@/lib/formato'

defineEmits<{ ir: [seccion: Seccion]; cambiarPlan: [] }>()

const ventaVista = ref<Venta | null>(null)

const saludo = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
})

const deHoy = computed(() => ventasSucursal.value.filter((v) => mismoDia(v.fecha)))
const totalHoy = computed(() => deHoy.value.reduce((suma, v) => suma + v.total, 0))
const promedio = computed(() => (deHoy.value.length ? totalHoy.value / deHoy.value.length : 0))

const bajoStock = computed(() =>
  estado.productos.filter((p) => stock(p) <= p.stockMinimo).sort((a, b) => stock(a) - stock(b)),
)

const semana = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const dia = new Date()
    dia.setDate(dia.getDate() - (6 - i))
    const total = ventasSucursal.value
      .filter((v) => mismoDia(v.fecha, dia))
      .reduce((suma, v) => suma + v.total, 0)
    return { etiqueta: dia.toLocaleDateString('es-MX', { weekday: 'short' }), total, esHoy: i === 6 }
  }),
)
const maximo = computed(() => Math.max(1, ...semana.value.map((d) => d.total)))
const totalSemana = computed(() => semana.value.reduce((suma, d) => suma + d.total, 0))

const ultimas = computed(() => [...ventasSucursal.value].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6))

const kpis = computed(() => [
  { titulo: 'Ventas de hoy', valor: dinero(totalHoy.value), detalle: 'IVA incluido', icono: Banknote, color: 'bg-blue-600/10 text-blue-600' },
  { titulo: 'Tickets', valor: String(deHoy.value.length), detalle: 'emitidos hoy', icono: Receipt, color: 'bg-emerald-500/10 text-emerald-600' },
  { titulo: 'Ticket promedio', valor: dinero(promedio.value), detalle: 'por cliente', icono: TrendingUp, color: 'bg-amber-300/30 text-amber-700' },
  { titulo: 'Bajo stock', valor: String(bajoStock.value.length), detalle: 'productos por surtir', icono: TriangleAlert, color: 'bg-rose-500/10 text-rose-600' },
])
</script>

<template>
  <div>
    <section class="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white sm:p-10">
      <div class="absolute -top-16 right-10 size-64 rounded-full bg-amber-300/25 blur-3xl" />
      <div class="absolute right-10 bottom-6 hidden gap-4 md:flex">
        <PaletaIcon variant="gold" :size="64" />
        <PaletaIcon variant="white" :size="52" class="mt-8" />
        <PaletaIcon variant="green" :size="44" />
      </div>
      <div class="relative max-w-xl">
        <UiBadge variant="outline">Sucursal {{ sucursalActiva?.nombre }}</UiBadge>
        <h1 class="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {{ saludo }}, {{ estado.sesion?.nombre?.split(' ')[0] }}
        </h1>
        <p class="mt-2 text-blue-100">Este es el resumen de tu negocio. ¿Qué quieres hacer ahora?</p>
        <div class="mt-6 flex flex-wrap gap-3">
          <UiButton variant="secondary" size="lg" @click="$emit('ir', 'venta')">
            <ShoppingCart class="size-5" />
            Nueva venta
          </UiButton>
          <UiButton variant="outline" size="lg" class="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white" @click="$emit('ir', 'entradas')">
            <PackagePlus class="size-5" />
            Registrar entrada
          </UiButton>
        </div>
      </div>
    </section>

    <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <UiCard v-for="kpi in kpis" :key="kpi.titulo" class="p-6">
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
      <UiCard class="p-6 lg:col-span-2">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-bold">Ventas de los últimos 7 días</h3>
            <p class="text-sm text-slate-500">Total de la semana: <strong class="text-slate-900">{{ dinero(totalSemana) }}</strong></p>
          </div>
          <UiBadge variant="blue">Esta semana</UiBadge>
        </div>
        <div class="mt-8 flex h-56 items-end gap-3 sm:gap-5">
          <div v-for="dia in semana" :key="dia.etiqueta" class="group flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span class="text-[11px] font-semibold text-slate-400 opacity-0 transition group-hover:opacity-100">
              {{ dinero(dia.total) }}
            </span>
            <div
              :class="[
                'w-full rounded-t-xl transition-all duration-500',
                dia.esHoy ? 'bg-gradient-to-t from-blue-700 to-blue-500' : 'bg-blue-100 group-hover:bg-blue-200',
              ]"
              :style="{ height: `${Math.max(4, (dia.total / maximo) * 100)}%` }"
            />
            <span :class="['text-xs font-semibold capitalize', dia.esHoy ? 'text-blue-700' : 'text-slate-400']">
              {{ dia.esHoy ? 'Hoy' : dia.etiqueta }}
            </span>
          </div>
        </div>
      </UiCard>

      <UiCard class="flex flex-col p-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold">Por surtir</h3>
          <UiBadge :variant="bajoStock.length ? 'gold' : 'default'">{{ bajoStock.length }}</UiBadge>
        </div>
        <ul v-if="bajoStock.length" class="mt-4 flex-1 list-none space-y-3 p-0">
          <li v-for="producto in bajoStock.slice(0, 5)" :key="producto.id" class="flex items-center gap-3">
            <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
              <Package class="size-4" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">{{ producto.nombre }}</p>
              <p class="text-xs text-slate-400">Mínimo {{ producto.stockMinimo }}</p>
            </div>
            <span :class="['text-sm font-bold', stock(producto) <= 5 ? 'text-rose-600' : 'text-amber-600']">
              {{ stock(producto) }} pzas
            </span>
          </li>
        </ul>
        <div v-else class="grid flex-1 place-items-center py-8 text-center text-sm text-slate-400">
          <div>
            <PaletaIcon variant="green" :size="40" class="mx-auto" />
            <p class="mt-3">Todo tu inventario está en orden.</p>
          </div>
        </div>
        <UiButton variant="outline" class="mt-5 w-full" @click="$emit('ir', 'entradas')">
          Surtir productos
          <ArrowRight class="size-4" />
        </UiButton>
      </UiCard>
    </div>

    <UiCard class="mt-6 overflow-hidden">
      <div class="flex items-center justify-between p-6 pb-4">
        <h3 class="text-lg font-bold">Últimas ventas</h3>
        <UiButton variant="ghost" size="sm" @click="$emit('ir', 'historial')">
          Ver historial
          <ArrowRight class="size-4" />
        </UiButton>
      </div>
      <div class="overflow-x-auto">
        <table class="ip-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Hora</th>
              <th>Productos</th>
              <th>Pago</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="venta in ultimas" :key="venta.id" class="cursor-pointer" @click="ventaVista = venta">
              <td class="font-bold text-slate-900">#{{ venta.folio }}</td>
              <td>{{ hora(venta.fecha) }}</td>
              <td class="max-w-xs truncate">{{ venta.partidas.map((p) => p.nombre).join(', ') }}</td>
              <td><UiBadge>{{ venta.metodoPago }}</UiBadge></td>
              <td class="text-right font-bold text-slate-900">{{ dinero(venta.total) }}</td>
            </tr>
            <tr v-if="!ultimas.length">
              <td colspan="5" class="py-10 text-center text-slate-400">Aún no hay ventas en esta sucursal.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <Ticket v-if="ventaVista" :venta="ventaVista" @cerrar="ventaVista = null" />
  </div>
</template>
