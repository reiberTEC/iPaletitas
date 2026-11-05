<script setup lang="ts">
import { computed, ref } from 'vue'
import FormTarjeta from './FormTarjeta.vue'
import UiButton from '../ui/Button.vue'
import UiModal from '../ui/Modal.vue'
import { ajustarLicencia, estado } from '@/stores/negocio'
import { cargoPendienteActual, cobrarPendienteATarjeta } from '@/stores/admin'
import { dinero, fecha } from '@/lib/formato'
import { textoTarjeta } from '@/lib/tarjeta'

const emit = defineEmits<{ cerrar: []; listo: [mensaje: string] }>()

const formTarjeta = ref<InstanceType<typeof FormTarjeta>>()
const pendiente = computed(() => cargoPendienteActual())

function guardar() {
  const tarjeta = formTarjeta.value?.validar()
  if (!tarjeta) return
  ajustarLicencia({ tarjeta })
  const cobrado = cobrarPendienteATarjeta()
  const vence = estado.licencia ? fecha(estado.licencia.vence) : ''
  emit(
    'listo',
    cobrado
      ? `Cobramos ${dinero(cobrado.monto)} a tu ${textoTarjeta(tarjeta)}. Tu licencia está activa hasta el ${vence}.`
      : `Listo: tus renovaciones se cobrarán a tu ${textoTarjeta(tarjeta)}.`,
  )
}
</script>

<template>
  <UiModal :titulo="pendiente ? 'Pagar con tarjeta' : 'Cambiar tarjeta'" ancho="max-w-xl" @cerrar="emit('cerrar')">
    <form @submit.prevent="guardar">
      <p class="m-0 text-base leading-7 text-slate-600">
        <template v-if="pendiente">
          Debes {{ dinero(pendiente.monto) }} de {{ pendiente.concepto }}. Lo cobramos a esta tarjeta y tus siguientes
          renovaciones también se cobrarán ahí.
        </template>
        <template v-else>Tus siguientes renovaciones se cobrarán a esta tarjeta.</template>
      </p>

      <FormTarjeta ref="formTarjeta" class="mt-5" />

      <div class="mt-6 flex justify-end gap-3">
        <UiButton type="button" variant="outline" @click="emit('cerrar')">Cancelar</UiButton>
        <UiButton type="submit">{{ pendiente ? `Pagar ${dinero(pendiente.monto)}` : 'Guardar tarjeta' }}</UiButton>
      </div>
    </form>
  </UiModal>
</template>
