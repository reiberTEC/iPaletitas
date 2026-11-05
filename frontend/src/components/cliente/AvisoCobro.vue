<script setup lang="ts">
import { computed, ref } from 'vue'
import { Clock, CreditCard, Mail } from '@lucide/vue'
import ModalTarjeta from '../pago/ModalTarjeta.vue'
import { CORREO_PAGOS, enPrueba, estado, plazoDeCobro, puede } from '@/stores/negocio'
import { fecha, plural } from '@/lib/formato'
import { textoTarjeta } from '@/lib/tarjeta'

const administra = computed(() => puede('licencia.editar'))
const pagandoConTarjeta = ref(false)

const textos = computed(() => {
  const plazo = plazoDeCobro.value
  if (!plazo || !estado.licencia) return null
  const dias = plural(plazo.dias, 'día', 'días')
  const suspende = fecha(plazo.suspende)
  const termino = enPrueba.value ? 'Tu prueba gratis terminó' : 'Tu licencia venció'
  const tarjeta = estado.licencia.tarjeta
  return administra.value
    ? {
        titulo: `${termino} el ${fecha(estado.licencia.vence)}: ${plazo.dias === 1 ? 'te queda' : 'te quedan'} ${dias} para pagar`,
        detalle: tarjeta
          ? `No pudimos cobrar a tu ${textoTarjeta(tarjeta)}. Paga con otra tarjeta o por transferencia (comprobante a ${CORREO_PAGOS}) antes del ${suspende}, o tu panel se suspende.`
          : `Paga con tarjeta o por transferencia (comprobante a ${CORREO_PAGOS}) antes del ${suspende}, o tu panel se suspende.`,
      }
    : {
        titulo: `La licencia del negocio venció: ${plazo.dias === 1 ? 'queda' : 'quedan'} ${dias} para pagarla`,
        detalle: `Avísale al administrador. Si no se paga antes del ${suspende}, el sistema se suspende para todos.`,
      }
})

const correo = computed(() => {
  const asunto = `Comprobante de transferencia · ${estado.licencia?.negocio ?? ''} · ${estado.licencia?.clave ?? ''}`
  return `mailto:${CORREO_PAGOS}?subject=${encodeURIComponent(asunto)}`
})
</script>

<template>
  <div
    v-if="textos"
    role="status"
    class="mb-6 flex flex-col gap-3 rounded-2xl bg-orange-50 px-4 py-3.5 text-orange-900 ring-1 ring-orange-200 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
  >
    <div class="flex min-w-0 flex-1 items-start gap-3">
      <Clock class="mt-0.5 size-5 shrink-0 text-orange-700" aria-hidden="true" />
      <div class="min-w-0">
        <p class="font-semibold text-pretty">{{ textos.titulo }}</p>
        <p class="mt-0.5 text-sm text-pretty text-orange-800">{{ textos.detalle }}</p>
      </div>
    </div>
    <div v-if="administra" class="flex shrink-0 flex-wrap gap-2 self-start sm:self-center">
      <button
        type="button"
        class="aviso-cobro-boton ip-boton inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 px-4 text-sm font-semibold text-white"
        @click="pagandoConTarjeta = true"
      >
        <CreditCard class="size-4" aria-hidden="true" />
        Pagar con tarjeta
      </button>
      <a
        :href="correo"
        class="ip-boton inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-orange-900 no-underline ring-1 ring-orange-300 ring-inset"
      >
        <Mail class="size-4" aria-hidden="true" />
        Enviar comprobante
      </a>
    </div>

    <ModalTarjeta v-if="pagandoConTarjeta" @cerrar="pagandoConTarjeta = false" @listo="pagandoConTarjeta = false" />
  </div>
</template>

<style scoped>
.aviso-cobro-boton {
  background: #c2410c;
}

@media (hover: hover) and (pointer: fine) {
  .aviso-cobro-boton:hover {
    background: #9a3412;
  }
}

.aviso-cobro-boton:focus-visible {
  outline: 2px solid #ea580c;
  outline-offset: 2px;
}
</style>
