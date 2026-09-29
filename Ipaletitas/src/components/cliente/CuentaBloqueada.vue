<script setup lang="ts">
import { computed } from 'vue'
import { Lock, LogOut, Mail } from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import UiButton from '../ui/Button.vue'
import { estado } from '@/stores/negocio'
import { fecha } from '@/lib/formato'

const props = defineProps<{ motivo: 'suspendida' | 'vencida' }>()
defineEmits(['salir', 'cambiarPlan'])

const textos = computed(() =>
  props.motivo === 'suspendida'
    ? {
        titulo: 'Tu cuenta está suspendida',
        detalle:
          'El acceso a tu punto de venta se pausó temporalmente. Tus productos, ventas y sucursales siguen guardados; en cuanto se regularice la cuenta vuelves a entrar como siempre.',
      }
    : {
        titulo: 'Tu licencia terminó',
        detalle: `Tu periodo terminó el ${estado.licencia ? fecha(estado.licencia.vence) : ''}. Elige una licencia para seguir vendiendo; tu información sigue guardada.`,
      },
)
</script>

<template>
  <div class="ip-fondo grid min-h-screen place-items-center px-6 py-16 font-sans text-slate-900">
    <div class="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200">
      <div class="relative mx-auto grid size-20 place-items-center rounded-3xl bg-slate-950 text-amber-300">
        <Lock class="size-9" />
        <PaletaIcon variant="gold" :size="28" class="absolute -top-3 -right-3" />
      </div>
      <h1 class="mt-6 text-3xl font-extrabold tracking-tight">{{ textos.titulo }}</h1>
      <p class="mt-3 leading-7 text-slate-500">{{ textos.detalle }}</p>
      <p class="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <strong>{{ estado.licencia?.negocio }}</strong> · Clave {{ estado.licencia?.clave }}
      </p>

      <div class="mt-8 grid gap-3 sm:grid-cols-2">
        <UiButton v-if="motivo === 'vencida'" size="lg" @click="$emit('cambiarPlan')">Ver licencias</UiButton>
        <a
          v-else
          href="mailto:soporte@ipaletitas.com"
          class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 font-semibold text-white shadow-lg shadow-blue-600/25"
        >
          <Mail class="size-5" />
          Contactar soporte
        </a>
        <UiButton variant="outline" size="lg" @click="$emit('salir')">
          <LogOut class="size-5" />
          Cerrar sesión
        </UiButton>
      </div>
    </div>
  </div>
</template>
