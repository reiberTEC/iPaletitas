<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { X } from '@lucide/vue'

defineProps<{ titulo: string; ancho?: string }>()
const emit = defineEmits(['cerrar'])

const alTeclear = (evento: KeyboardEvent) => {
  if (evento.key === 'Escape') emit('cerrar')
}

onMounted(() => window.addEventListener('keydown', alTeclear))
onBeforeUnmount(() => window.removeEventListener('keydown', alTeclear))
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4 font-sans backdrop-blur-sm"
      @click.self="emit('cerrar')"
    >
      <div
        :class="['max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white shadow-2xl', ancho ?? 'max-w-lg']"
        role="dialog"
        aria-modal="true"
        :aria-label="titulo"
      >
        <header class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 class="text-lg font-extrabold text-slate-900">{{ titulo }}</h2>
          <button
            type="button"
            class="grid size-9 cursor-pointer place-items-center rounded-xl border-0 bg-transparent text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar"
            @click="emit('cerrar')"
          >
            <X class="size-5" />
          </button>
        </header>
        <div class="p-6">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
