<script setup lang="ts">
import { computed, ref } from 'vue'
import { Eye, Search } from '@lucide/vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Encabezado from '../ui/Encabezado.vue'
import EstadoBadge from './EstadoBadge.vue'
import { PLANES, planPorId, type PlanId } from '@/stores/catalogo'
import { cuentas, diasPara, estadoDe, metricas, type EstadoCuenta } from '@/stores/admin'
import { fecha, iniciales } from '@/lib/formato'

defineEmits<{ verCuenta: [id: string] }>()

const busqueda = ref('')
const filtroEstado = ref<'Todas' | EstadoCuenta>('Todas')
const filtroPlan = ref<'todos' | PlanId>('todos')

const opcionesEstado = computed(() => [
  { id: 'Todas' as const, total: metricas.value.total },
  ...(['Activa', 'Prueba', 'Vencida', 'Suspendida'] as EstadoCuenta[]).map((id) => ({
    id,
    total: metricas.value.porEstado[id],
  })),
])

const lista = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return cuentas.value.filter(
    (c) =>
      (filtroEstado.value === 'Todas' || estadoDe(c) === filtroEstado.value) &&
      (filtroPlan.value === 'todos' || c.planId === filtroPlan.value) &&
      `${c.negocio} ${c.titular} ${c.correo} ${c.ciudad} ${c.giro}`.toLowerCase().includes(texto),
  )
})

function textoVence(iso: string) {
  const dias = diasPara(iso)
  if (dias < 0) return `hace ${Math.abs(dias)} días`
  if (dias === 0) return 'hoy'
  return `en ${dias} días`
}
</script>

<template>
  <div>
    <Encabezado titulo="Cuentas cliente" :descripcion="`${metricas.total} negocios usan iPaletitas.`" />

    <UiCard class="mb-6 bg-white p-4">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center">
        <label class="relative flex-1">
          <span class="sr-only">Buscar cuenta</span>
          <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input v-model="busqueda" class="ip-input ip-input-icono" placeholder="Negocio, titular, correo o ciudad" />
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opcion in opcionesEstado"
            :key="opcion.id"
            type="button"
            :class="[
              'cursor-pointer rounded-full border-0 px-3.5 py-2 text-sm font-semibold transition',
              filtroEstado === opcion.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:ring-blue-300',
            ]"
            @click="filtroEstado = opcion.id"
          >
            {{ opcion.id }} <span class="opacity-60">{{ opcion.total }}</span>
          </button>
        </div>
        <label class="xl:w-48">
          <span class="sr-only">Plan</span>
          <select v-model="filtroPlan" class="ip-input cursor-pointer">
            <option value="todos">Todos los planes</option>
            <option v-for="plan in PLANES" :key="plan.id" :value="plan.id">{{ plan.nombre }}</option>
          </select>
        </label>
      </div>
    </UiCard>

    <UiCard class="overflow-hidden bg-white">
      <div class="overflow-x-auto">
        <table class="ip-table">
          <thead>
            <tr>
              <th>Negocio</th>
              <th>Titular</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Vence</th>
              <th class="text-center">Uso</th>
              <th class="text-right">Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cuenta in lista" :key="cuenta.id" class="cursor-pointer" @click="$emit('verCuenta', cuenta.id)">
              <td>
                <div class="flex items-center gap-3">
                  <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-300 text-xs font-extrabold text-slate-900">
                    {{ iniciales(cuenta.negocio) }}
                  </span>
                  <div class="min-w-0">
                    <p class="font-semibold text-slate-900">
                      {{ cuenta.negocio }}
                      <span v-if="cuenta.local" class="ml-1 rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">DEMO</span>
                    </p>
                    <p class="text-xs text-slate-400">{{ cuenta.giro }} · {{ cuenta.ciudad }}</p>
                  </div>
                </div>
              </td>
              <td>
                <p class="font-medium text-slate-800">{{ cuenta.titular }}</p>
                <p class="text-xs text-slate-400">{{ cuenta.correo }}</p>
              </td>
              <td>
                <p class="font-semibold text-slate-800">{{ planPorId(cuenta.planId).nombre }}</p>
                <p class="text-xs text-slate-400 capitalize">{{ cuenta.ciclo }}</p>
              </td>
              <td><EstadoBadge :estado="estadoDe(cuenta)" /></td>
              <td class="whitespace-nowrap">
                <p>{{ fecha(cuenta.vence) }}</p>
                <p :class="['text-xs', diasPara(cuenta.vence) < 0 ? 'text-rose-600' : 'text-slate-400']">{{ textoVence(cuenta.vence) }}</p>
              </td>
              <td class="text-center text-xs whitespace-nowrap text-slate-500">
                {{ cuenta.uso.sucursales }} suc · {{ cuenta.uso.usuarios }} usu · {{ cuenta.uso.productos }} prod
              </td>
              <td class="text-right">
                <UiButton variant="ghost" size="sm" @click.stop="$emit('verCuenta', cuenta.id)">
                  <Eye class="size-4" />
                  Ver
                </UiButton>
              </td>
            </tr>
            <tr v-if="!lista.length">
              <td colspan="7" class="py-14 text-center text-slate-400">No hay cuentas con esos filtros.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>
  </div>
</template>
