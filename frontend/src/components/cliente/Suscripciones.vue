<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { TriangleAlert } from '@lucide/vue'
import Encabezado from '../ui/Encabezado.vue'
import UiButton from '../ui/Button.vue'
import UiModal from '../ui/Modal.vue'
import TarjetaPlan from '../planes/TarjetaPlan.vue'
import SelectorCiclo from '../planes/SelectorCiclo.vue'
import { mascotaPlan } from '../planes/mascotas'
import {
  PLANES,
  cambiarPlan,
  diasRestantes,
  enPrueba,
  estado,
  excesosDelPlan,
  planActual,
  precioPlan,
  type CicloPago,
  type Plan,
} from '@/stores/negocio'
import { precio } from '@/lib/formato'

const ciclo = ref<CicloPago>(estado.licencia?.ciclo ?? 'mensual')
const seleccionado = ref<Plan | null>(null)

const esActual = (plan: Plan) => plan.id === estado.licencia?.planId && ciclo.value === estado.licencia?.ciclo

const esMejora = computed(() => {
  if (!seleccionado.value) return true
  const actual = PLANES.findIndex((p) => p.id === estado.licencia?.planId)
  return PLANES.findIndex((p) => p.id === seleccionado.value?.id) > actual
})

const excesos = computed(() => (seleccionado.value ? excesosDelPlan(seleccionado.value.id) : []))

const aviso = ref('')
let temporizador: ReturnType<typeof setTimeout> | undefined

function confirmar() {
  if (!seleccionado.value) return
  cambiarPlan(seleccionado.value.id, ciclo.value)
  aviso.value = `¡Listo! Ahora tienes el plan ${seleccionado.value.nombre}.`
  clearTimeout(temporizador)
  temporizador = setTimeout(() => (aviso.value = ''), 3000)
  seleccionado.value = null
}

onBeforeUnmount(() => clearTimeout(temporizador))
</script>

<template>
  <div>
    <Encabezado
      titulo="Suscripciones"
      :descripcion="`Plan ${planActual?.nombre} · ${enPrueba ? `prueba gratis, ${diasRestantes} días restantes` : `${diasRestantes} días para renovar`}. Puedes cambiarlo cuando quieras.`"
    >
      <SelectorCiclo v-model="ciclo" />
    </Encabezado>

    <div class="grid grid-cols-1 gap-x-6 gap-y-[150px] pt-[120px] sm:grid-cols-2 2xl:grid-cols-4">
      <TarjetaPlan
        v-for="plan in PLANES"
        :key="plan.id"
        :plan="plan"
        :ciclo="ciclo"
        :actual="esActual(plan)"
        texto-boton="Cambiar a este plan"
        @elegir="seleccionado = $event"
      />
    </div>

    <p class="mt-8 text-center text-sm text-slate-500">
      Precios en pesos mexicanos con IVA incluido. Sin plazos forzosos: cancela cuando quieras.
    </p>

    <UiModal v-if="seleccionado" titulo="Cambiar de plan" @cerrar="seleccionado = null">
      <div class="text-center">
        <img
          :src="mascotaPlan[seleccionado.id].src"
          alt=""
          aria-hidden="true"
          class="mx-auto mb-3 block h-32 w-auto"
        />
        <p class="leading-7 text-slate-600">
          ¿Quieres {{ esMejora ? 'mejorar' : 'cambiar' }} tu suscripción al plan
          <strong class="text-slate-900">{{ seleccionado.nombre }}</strong> por
          <strong class="text-slate-900">
            {{ precio(precioPlan(seleccionado, ciclo)) }} MXN al {{ ciclo === 'mensual' ? 'mes' : 'año' }}
          </strong>?
        </p>
        <p class="mt-2 text-sm text-slate-500">
          {{ enPrueba ? 'Sigues en tu prueba gratis; el cobro empieza al terminarla.' : 'El cambio se aplica de inmediato y se ajusta en tu próximo cobro.' }}
        </p>
      </div>

      <div v-if="excesos.length" class="mt-5 flex gap-3 rounded-2xl bg-rose-50 p-4 text-left text-sm text-rose-700">
        <TriangleAlert class="mt-0.5 size-5 shrink-0" />
        <div>
          <p class="font-bold">Tu negocio rebasa este plan</p>
          <p v-for="e in excesos" :key="e.limite" class="mt-1">
            Tienes {{ e.uso }} {{ e.limite }} y el plan permite {{ e.maximo }}. No podrás agregar más hasta ajustarlo.
          </p>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <UiButton variant="outline" @click="seleccionado = null">Cancelar</UiButton>
        <UiButton @click="confirmar">Confirmar cambio</UiButton>
      </div>
    </UiModal>

    <Transition name="aviso">
      <div
        v-if="aviso"
        role="status"
        class="fixed right-6 bottom-6 z-[70] rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white shadow-2xl"
      >
        {{ aviso }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.aviso-enter-active,
.aviso-leave-active {
  transition:
    opacity 0.25s,
    transform 0.25s;
}

.aviso-enter-from,
.aviso-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
