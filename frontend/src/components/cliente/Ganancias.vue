<script setup lang="ts">
import { computed, ref } from 'vue'
import { TrendingDown, TrendingUp } from '@lucide/vue'
import UiCard from '../ui/Card.vue'
import Encabezado from '../ui/Encabezado.vue'
import { PERIODOS, enRango, rango, type Periodo } from './historial/periodos'
import {
  estado,
  perdidasSucursal,
  planActual,
  stock,
  ventasSucursal,
  type Producto,
} from '@/stores/negocio'
import { dinero, plural } from '@/lib/formato'

const periodo = ref<Periodo>('semana')

const meses = computed(() => planActual.value?.limites.historialMeses ?? 3)
const fechaLimite = computed(() => {
  if (meses.value === Infinity) return null
  const fecha = new Date()
  fecha.setMonth(fecha.getMonth() - meses.value)
  return fecha
})

const ventasDisponibles = computed(() =>
  fechaLimite.value
    ? ventasSucursal.value.filter((v) => new Date(v.fecha) >= fechaLimite.value!)
    : ventasSucursal.value,
)

const perdidasDisponibles = computed(() =>
  fechaLimite.value
    ? perdidasSucursal.value.filter((p) => new Date(p.fecha) >= fechaLimite.value!)
    : perdidasSucursal.value,
)

const infoPeriodo = computed(() => PERIODOS.find((p) => p.id === periodo.value)!)
const ventasPeriodo = computed(() => enRango(ventasDisponibles.value, rango(periodo.value)))
const perdidasPeriodo = computed(() => {
  const { desde, hasta } = rango(periodo.value)
  return perdidasDisponibles.value.filter((p) => {
    const fecha = new Date(p.fecha)
    return fecha >= desde && fecha < hasta
  })
})

const costoDe = (productoId: string) =>
  estado.productos.find((p) => p.id === productoId)?.costo ?? 0

const ingresos = computed(() => ventasPeriodo.value.reduce((suma, v) => suma + v.total, 0))

const costoVentas = computed(() =>
  ventasPeriodo.value.reduce(
    (suma, v) =>
      suma + v.partidas.reduce((s, p) => s + costoDe(p.productoId) * p.cantidad, 0),
    0,
  ),
)

const costoPerdidas = computed(() =>
  perdidasPeriodo.value.reduce((suma, p) => suma + p.costoUnitario * p.cantidad, 0),
)

const utilidad = computed(() => ingresos.value - costoVentas.value - costoPerdidas.value)

const margen = computed(() =>
  ingresos.value ? Math.round((utilidad.value / ingresos.value) * 100) : null,
)

const tickets = computed(() => ventasPeriodo.value.length)

const valorInventario = computed(() =>
  estado.productos.reduce((suma, p: Producto) => suma + p.costo * stock(p), 0),
)

const utilidadAnterior = computed(() => {
  const ventasAnt = enRango(ventasDisponibles.value, rango(periodo.value, 1))
  const { desde, hasta } = rango(periodo.value, 1)
  const perdidasAnt = perdidasDisponibles.value.filter((p) => {
    const fecha = new Date(p.fecha)
    return fecha >= desde && fecha < hasta
  })
  const ingresosAnt = ventasAnt.reduce((suma, v) => suma + v.total, 0)
  const costoV = ventasAnt.reduce(
    (suma, v) =>
      suma + v.partidas.reduce((s, p) => s + costoDe(p.productoId) * p.cantidad, 0),
    0,
  )
  const costoP = perdidasAnt.reduce((suma, p) => suma + p.costoUnitario * p.cantidad, 0)
  return ingresosAnt - costoV - costoP
})

const variacion = computed(() => {
  if (!utilidadAnterior.value && !utilidad.value) return null
  if (!utilidadAnterior.value) return utilidad.value > 0 ? 100 : utilidad.value < 0 ? -100 : 0
  return Math.round(((utilidad.value - utilidadAnterior.value) / Math.abs(utilidadAnterior.value)) * 100)
})
</script>

<template>
  <div>
    <Encabezado
      titulo="Ganancias"
      descripcion="Ingresos, costo de lo vendido y utilidad de esta sucursal. Solo visible para administradores."
    />

    <UiCard class="mb-6 bg-white p-5 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="font-display text-lg font-semibold text-slate-900">Resumen del periodo</h2>
          <p class="text-sm text-slate-500">{{ infoPeriodo.descripcion }}</p>
        </div>
        <div class="flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Periodo">
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

      <div class="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
        <p
          :class="[
            'ip-cifra text-3xl tabular-nums',
            utilidad >= 0 ? 'text-emerald-700' : 'text-rose-700',
          ]"
        >
          {{ dinero(utilidad) }}
        </p>
        <p class="text-sm text-slate-500 tabular-nums">
          {{ plural(tickets, 'ticket', 'tickets') }} ·
          {{ margen === null ? 'sin ventas' : `margen ${margen}%` }}
        </p>
        <p
          v-if="variacion !== null"
          :class="[
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums',
            variacion >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
          ]"
        >
          <component :is="variacion >= 0 ? TrendingUp : TrendingDown" class="size-3.5" />
          {{ variacion > 0 ? '+' : '' }}{{ variacion }}% vs {{ infoPeriodo.anterior }}
        </p>
      </div>
    </UiCard>

    <div class="ip-tira mb-6 sm:grid-cols-2 lg:grid-cols-4">
      <div class="p-5">
        <p class="text-sm text-slate-500">Ingresos (ventas)</p>
        <p class="ip-cifra mt-2 text-2xl text-slate-900 tabular-nums">{{ dinero(ingresos) }}</p>
      </div>
      <div class="p-5">
        <p class="text-sm text-slate-500">Costo de lo vendido</p>
        <p class="ip-cifra mt-2 text-2xl text-slate-900 tabular-nums">{{ dinero(costoVentas) }}</p>
      </div>
      <div class="p-5">
        <p class="text-sm text-slate-500">Pérdidas (caducados)</p>
        <p class="ip-cifra mt-2 text-2xl text-rose-700 tabular-nums">{{ dinero(costoPerdidas) }}</p>
      </div>
      <div class="p-5">
        <p class="text-sm text-slate-500">Utilidad neta</p>
        <p
          :class="[
            'ip-cifra mt-2 text-2xl tabular-nums',
            utilidad >= 0 ? 'text-emerald-700' : 'text-rose-700',
          ]"
        >
          {{ dinero(utilidad) }}
        </p>
      </div>
    </div>

    <UiCard class="bg-white p-5 sm:p-6">
      <h2 class="font-display text-lg font-semibold text-slate-900">Inventario a costo</h2>
      <p class="mt-1 text-sm text-slate-500">
        Valor de la existencia actual en esta sucursal, según el costo de cada producto.
      </p>
      <p class="ip-cifra mt-4 text-2xl text-slate-900 tabular-nums">{{ dinero(valorInventario) }}</p>
      <p class="mt-2 text-xs text-slate-500">
        La utilidad usa el costo actual del catálogo por cada pieza vendida. Si cambiaste costos,
        los periodos viejos son una estimación.
      </p>
    </UiCard>
  </div>
</template>
