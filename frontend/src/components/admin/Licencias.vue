<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from '@lucide/vue'
import UiCard from '../ui/Card.vue'
import Encabezado from '../ui/Encabezado.vue'
import EstadoBadge from './EstadoBadge.vue'
import { DIAS_PRUEBA, planPorId } from '@/stores/catalogo'
import { cuentas, diasPara, estadoDe, type Cuenta } from '@/stores/admin'
import { fecha } from '@/lib/formato'

defineEmits<{ verCuenta: [id: string] }>()

type Filtro = 'todas' | 'porVencer' | 'vencidas' | 'suspendidas'

const filtro = ref<Filtro>('todas')
const busqueda = ref('')

const reglas: Record<Filtro, { etiqueta: string; cumple: (c: Cuenta) => boolean }> = {
  todas: { etiqueta: 'Todas', cumple: () => true },
  porVencer: {
    etiqueta: 'Vencen en 7 días',
    cumple: (c) => !c.suspendida && diasPara(c.vence) >= 0 && diasPara(c.vence) <= 7,
  },
  vencidas: { etiqueta: 'Vencidas', cumple: (c) => estadoDe(c) === 'Vencida' },
  suspendidas: { etiqueta: 'Suspendidas', cumple: (c) => c.suspendida },
}

const filtros = computed(() =>
  (Object.keys(reglas) as Filtro[]).map((id) => ({
    id,
    etiqueta: reglas[id].etiqueta,
    total: cuentas.value.filter(reglas[id].cumple).length,
  })),
)

const lista = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return cuentas.value
    .filter(reglas[filtro.value].cumple)
    .filter((c) => `${c.clave} ${c.negocio}`.toLowerCase().includes(texto))
    .sort((a, b) => a.vence.localeCompare(b.vence))
})

function barra(cuenta: Cuenta) {
  const dias = diasPara(cuenta.vence)
  const total = cuenta.enPrueba ? DIAS_PRUEBA : cuenta.ciclo === 'anual' ? 365 : 30
  return {
    ancho: `${Math.max(0, Math.min(100, (dias / total) * 100))}%`,
    color: dias < 0 ? 'bg-rose-500' : dias <= 7 ? 'bg-amber-400' : 'bg-emerald-500',
    texto: dias < 0 ? `Venció hace ${-dias} días` : dias === 0 ? 'Vence hoy' : `${dias} días restantes`,
  }
}
</script>

<template>
  <div>
    <Encabezado titulo="Licencias" descripcion="Claves emitidas, tipo de licencia y cuándo vence cada una." />

    <UiCard class="mb-6 bg-white p-4">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="f in filtros"
            :key="f.id"
            type="button"
            :class="[
              'cursor-pointer rounded-full border-0 px-3.5 py-2 text-sm font-semibold transition',
              filtro === f.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:ring-blue-300',
            ]"
            @click="filtro = f.id"
          >
            {{ f.etiqueta }} <span class="opacity-60">{{ f.total }}</span>
          </button>
        </div>
        <label class="relative lg:ml-auto lg:w-80">
          <span class="sr-only">Buscar clave</span>
          <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input v-model="busqueda" class="ip-input ip-input-icono" placeholder="Clave o negocio" />
        </label>
      </div>
    </UiCard>

    <UiCard class="overflow-hidden bg-white">
      <div class="overflow-x-auto">
        <table class="ip-table">
          <thead>
            <tr>
              <th>Clave</th>
              <th>Negocio</th>
              <th>Plan</th>
              <th>Tipo</th>
              <th>Vigencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cuenta in lista" :key="cuenta.id" class="cursor-pointer" @click="$emit('verCuenta', cuenta.id)">
              <td class="font-mono text-xs font-semibold tracking-wider text-slate-900">{{ cuenta.clave }}</td>
              <td class="font-semibold text-slate-900">{{ cuenta.negocio }}</td>
              <td>{{ planPorId(cuenta.planId).nombre }} <span class="text-xs text-slate-400">· {{ cuenta.ciclo }}</span></td>
              <td>
                <span :class="['text-xs font-bold', cuenta.enPrueba ? 'text-blue-600' : 'text-slate-600']">
                  {{ cuenta.enPrueba ? 'Prueba gratis' : 'De pago' }}
                </span>
              </td>
              <td class="min-w-52">
                <div class="flex justify-between text-xs">
                  <span class="text-slate-500">{{ fecha(cuenta.vence) }}</span>
                  <span class="font-semibold">{{ barra(cuenta).texto }}</span>
                </div>
                <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div :class="['h-full rounded-full', barra(cuenta).color]" :style="{ width: barra(cuenta).ancho }" />
                </div>
              </td>
              <td><EstadoBadge :estado="estadoDe(cuenta)" /></td>
            </tr>
            <tr v-if="!lista.length">
              <td colspan="6" class="py-14 text-center text-slate-400">No hay licencias en este filtro.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>
  </div>
</template>
