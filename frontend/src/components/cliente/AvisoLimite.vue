<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue'
import UiButton from '../ui/Button.vue'
import { limiteDe, puede, puedeAgregar, type Limite } from '@/stores/negocio'

defineProps<{ limite: Limite }>()
defineEmits(['cambiarPlan'])
</script>

<template>
  <div
    v-if="!puedeAgregar(limite)"
    class="mb-6 flex flex-col gap-3 rounded-2xl bg-orange-50 p-4 text-orange-900 ring-1 ring-orange-200 sm:flex-row sm:items-center sm:justify-between"
  >
    <p class="flex items-center gap-2 text-sm font-medium">
      <TriangleAlert class="size-4 shrink-0" />
      Llegaste al límite de {{ limiteDe(limite) }} {{ limite }} de tu licencia.
    </p>
    <UiButton v-if="puede('licencia.editar')" size="sm" class="shrink-0" @click="$emit('cambiarPlan')">
      Mejorar licencia
    </UiButton>
  </div>
</template>
