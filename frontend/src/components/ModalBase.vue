<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{ abierto: boolean; titulo: string; ancho?: string }>(), {
  ancho: '640px',
})

const emit = defineEmits<{ cerrar: [] }>()

const dialogo = ref<HTMLElement | null>(null)

const cerrarConEscape = (evento: KeyboardEvent) => {
  if (evento.key === 'Escape') emit('cerrar')
}

watch(
  () => props.abierto,
  async (abierto) => {
    if (abierto) {
      window.addEventListener('keydown', cerrarConEscape)
      await nextTick()
      dialogo.value?.focus()
    } else {
      window.removeEventListener('keydown', cerrarConEscape)
    }
  },
  { immediate: true },
)

onUnmounted(() => window.removeEventListener('keydown', cerrarConEscape))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="abierto" class="modal-fondo" @mousedown.self="emit('cerrar')">
        <div
          ref="dialogo"
          class="modal"
          role="dialog"
          aria-modal="true"
          :aria-label="titulo"
          tabindex="-1"
          :style="{ maxWidth: ancho }"
        >
          <header class="modal-cabecera">
            <h2 class="modal-titulo">{{ titulo }}</h2>
            <button type="button" class="modal-cerrar" aria-label="Cerrar" @click="emit('cerrar')">✕</button>
          </header>

          <div class="modal-cuerpo">
            <slot />
          </div>

          <footer v-if="$slots.pie" class="modal-pie">
            <slot name="pie" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fondo {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(3px);
  font-family: Arial, Helvetica, sans-serif;
}

.modal {
  width: 100%;
  max-height: calc(100vh - 3rem);
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 22px;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.3);
  outline: none;
  overflow: hidden;
}

.modal-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.3rem 1.6rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-titulo {
  font-size: 1.3rem;
  font-weight: 800;
  color: #0f172a;
}

.modal-cerrar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  color: #475569;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.modal-cerrar:hover {
  background: #fee2e2;
  color: #dc2626;
}

.modal-cuerpo {
  padding: 1.5rem 1.6rem;
  overflow-y: auto;
}

.modal-pie {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  padding: 1rem 1.6rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(20px) scale(0.97);
}
</style>
