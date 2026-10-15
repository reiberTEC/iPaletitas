<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { CreditCard, Lock, LogOut, Mail, RotateCcw } from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import ModalTarjeta from '../pago/ModalTarjeta.vue'
import UiButton from '../ui/Button.vue'
import { CORREO_PAGOS, DIAS_COBRO, estado, puede, type MotivoBloqueo } from '@/stores/negocio'
import { fecha } from '@/lib/formato'
import { aplicarMarca } from '@/lib/marca'

const props = defineProps<{ motivo: MotivoBloqueo }>()
defineEmits(['salir', 'contratar'])

onMounted(() => aplicarMarca(estado.marca?.color))
onUnmounted(() => aplicarMarca(null))

const administra = computed(() => puede('licencia.editar'))
const vence = computed(() => (estado.licencia ? fecha(estado.licencia.vence) : ''))
const pagandoConTarjeta = ref(false)

const textos = computed(() => {
  if (props.motivo === 'devolucion') {
    return administra.value
      ? {
          titulo: 'Cancelaste tu suscripción',
          detalle:
            'Te devolvimos tu pago a la tarjeta con la que pagaste. Tus productos, ventas y sucursales siguen guardados: si quieres volver, contrata de nuevo cuando gustes (la semana gratis ya no aplica).',
        }
      : {
          titulo: 'El negocio canceló su suscripción',
          detalle: 'El administrador de tu negocio canceló la suscripción. La información sigue guardada; avísale si necesitas volver a usar el sistema.',
        }
  }
  if (props.motivo === 'suspendida') {
    return {
      titulo: 'Tu cuenta está suspendida',
      detalle:
        'El acceso a tu punto de venta se pausó temporalmente. Tus productos, ventas y sucursales siguen guardados; en cuanto se regularice la cuenta vuelves a entrar como siempre.',
    }
  }
  return administra.value
    ? {
        titulo: 'Tu licencia está suspendida por falta de pago',
        detalle: `Venció el ${vence.value} y pasaron los ${DIAS_COBRO} días para pagarla. Paga con tarjeta y vuelves a entrar al momento, o paga por transferencia y manda tu comprobante a ${CORREO_PAGOS}. Tus productos, ventas y sucursales siguen guardados.`,
      }
    : {
        titulo: 'La licencia del negocio está suspendida',
        detalle: `Venció el ${vence.value} y no se pagó a tiempo. Avísale al administrador de tu negocio: en cuanto pague, todos vuelven a entrar. La información sigue guardada.`,
      }
})

const correo = computed(() => {
  if (props.motivo === 'suspendida') return `mailto:${CORREO_PAGOS}`
  const asunto = `Comprobante de transferencia · ${estado.licencia?.negocio ?? ''} · ${estado.licencia?.clave ?? ''}`
  return `mailto:${CORREO_PAGOS}?subject=${encodeURIComponent(asunto)}`
})

const muestraCorreo = computed(() => props.motivo === 'suspendida' || (props.motivo === 'sinPago' && administra.value))
const muestraTarjeta = computed(() => props.motivo === 'sinPago' && administra.value)
const muestraContratar = computed(() => props.motivo === 'devolucion' && administra.value)
</script>

<template>
  <div class="ip-fondo grid min-h-screen place-items-center px-6 py-16 font-sans text-slate-900">
    <div class="w-full max-w-lg rounded-3xl bg-white p-6 text-center ring-1 ring-slate-200 sm:p-10">
      <div class="relative mx-auto grid size-20 place-items-center rounded-3xl bg-slate-950 text-blue-200">
        <Lock class="size-9" />
        <PaletaIcon variant="gold" :size="28" class="absolute -top-3 -right-3" />
      </div>
      <h1 class="mt-6 font-display text-3xl font-semibold tracking-tight text-balance">{{ textos.titulo }}</h1>
      <p class="mt-3 leading-7 text-pretty text-slate-600">{{ textos.detalle }}</p>
      <p class="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm [overflow-wrap:anywhere] text-slate-600">
        <strong>{{ estado.licencia?.negocio }}</strong> · Clave {{ estado.licencia?.clave }}
      </p>

      <div class="mt-8 grid gap-3">
        <UiButton v-if="muestraTarjeta" size="lg" @click="pagandoConTarjeta = true">
          <CreditCard class="size-5" />
          Pagar con tarjeta
        </UiButton>
        <UiButton v-if="muestraContratar" size="lg" @click="$emit('contratar')">
          <RotateCcw class="size-5" />
          Contratar de nuevo
        </UiButton>
        <div :class="['grid gap-3', muestraCorreo && 'sm:grid-cols-[1fr_auto]']">
          <a
            v-if="muestraCorreo"
            :href="correo"
            :class="[
              'ip-boton inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 font-semibold whitespace-nowrap no-underline transition-colors',
              muestraTarjeta
                ? 'bg-white text-slate-800 ring-1 ring-slate-200 ring-inset hover:bg-blue-50'
                : 'bg-blue-600 text-white hover:bg-blue-700',
            ]"
          >
            <Mail class="size-5" />
            {{ motivo === 'sinPago' ? 'Enviar comprobante' : 'Contactar soporte' }}
          </a>
          <UiButton variant="outline" size="lg" @click="$emit('salir')">
            <LogOut class="size-5" />
            Cerrar sesión
          </UiButton>
        </div>
      </div>
    </div>

    <ModalTarjeta v-if="pagandoConTarjeta" @cerrar="pagandoConTarjeta = false" @listo="pagandoConTarjeta = false" />
  </div>
</template>
