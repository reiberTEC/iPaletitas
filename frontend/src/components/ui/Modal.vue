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
      class="ip-velo fixed inset-0 z-[60] flex items-center justify-center overscroll-contain bg-slate-950/45 p-4 font-sans"
      @click.self="emit('cerrar')"
    >
      <div
        :class="['ip-modal max-h-[90dvh] w-full overflow-y-auto overscroll-contain rounded-2xl bg-white', ancho ?? 'max-w-lg']"
        role="dialog"
        aria-modal="true"
        :aria-label="titulo"
      >
        <header class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 class="font-display text-lg font-semibold text-slate-900">{{ titulo }}</h2>
          <button
            type="button"
            class="ip-boton grid size-9 cursor-pointer place-items-center rounded-xl border-0 bg-transparent text-slate-500 hover:bg-slate-100"
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

<style scoped>
.ip-velo {
  transition: opacity 250ms var(--ease-out);

  @starting-style {
    opacity: 0;
  }
}

.ip-modal {
  box-shadow:
    0 24px 48px -12px rgb(15 23 42 / 0.28),
    0 2px 6px rgb(15 23 42 / 0.08);
  transition:
    opacity 250ms var(--ease-out),
    transform 250ms var(--ease-out);

  @starting-style {
    opacity: 0;
    transform: scale(0.96);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ip-modal {
    transition: opacity 200ms ease;

    @starting-style {
      transform: none;
    }
  }
}
</style>
