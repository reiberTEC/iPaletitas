<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Route, X } from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import Conversacion from '../asistente/Conversacion.vue'
import type { Accion, DatosPanel } from '@/lib/asistente'

defineProps<{ datosPanel: () => DatosPanel }>()

const emit = defineEmits<{ cerrar: []; accion: [accion: Accion] }>()

const ventana = ref<HTMLElement | null>(null)

function alPresionarTecla(evento: KeyboardEvent) {
  if (evento.key === 'Escape') emit('cerrar')
}

// Un toque fuera la cierra, salvo en el botón que la abre (ese ya la alterna).
function alTocarFuera(evento: PointerEvent) {
  const objetivo = evento.target as Element | null
  if (!objetivo || ventana.value?.contains(objetivo) || objetivo.closest('[data-ayuda-boton]')) return
  emit('cerrar')
}

onMounted(() => {
  window.addEventListener('keydown', alPresionarTecla)
  document.addEventListener('pointerdown', alTocarFuera)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', alPresionarTecla)
  document.removeEventListener('pointerdown', alTocarFuera)
})
</script>

<template>
  <section ref="ventana" class="ayuda chat-ventana" role="dialog" aria-label="Ayuda de iPaletitas">
    <header class="chat-cabeza">
      <PaletaIcon variant="white" :size="28" />
      <div class="min-w-0 flex-1">
        <p class="font-display text-base leading-tight font-bold">Ayuda</p>
        <p class="text-sm text-blue-100">Pregúntame cómo hacer algo</p>
      </div>
      <button type="button" class="chat-cerrar ip-boton" aria-label="Cerrar ayuda" @click="emit('cerrar')">
        <X class="size-5" />
      </button>
    </header>

    <button type="button" class="ayuda-recorrido ip-boton" @click="emit('accion', 'recorrido')">
      <span class="ip-picto size-9 shrink-0"><Route class="size-[1.1rem]" /></span>
      <span class="min-w-0 flex-1 text-left">
        <span class="block text-sm font-bold">Ver el recorrido guiado</span>
        <span class="block text-xs text-slate-500">Un minuto, paso a paso por cada sección</span>
      </span>
    </button>

    <Conversacion contexto="panel" enfocar :datos-panel="datosPanel" @accion="emit('accion', $event)" />
  </section>
</template>

<style scoped>
.ayuda {
  position: fixed;
  top: calc(4rem + env(safe-area-inset-top) + 0.5rem);
  right: max(1rem, env(safe-area-inset-right));
  z-index: 45;
  display: flex;
  flex-direction: column;
  width: min(24rem, calc(100vw - 2rem));
  overflow: hidden;
  border-radius: 1.25rem;
  background: #fff;
  box-shadow:
    0 24px 48px -16px rgb(15 23 42 / 0.35),
    0 0 0 1px rgb(15 23 42 / 0.06);
  transform-origin: top right;
}

/* En teléfono sube desde abajo, a todo lo ancho, donde el pulgar alcanza. */
@media (max-width: 639px) {
  .ayuda {
    top: auto;
    right: 0.5rem;
    bottom: max(0.5rem, env(safe-area-inset-bottom));
    left: 0.5rem;
    width: auto;
    transform-origin: bottom center;
  }
}

.chat-cabeza {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 0.875rem 0.875rem 1.25rem;
  background: var(--marca-600);
  color: #fff;
}

.chat-cerrar {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: 0.75rem;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.ayuda-recorrido {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 0;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  color: #0f172a;
  font: inherit;
  cursor: pointer;
  transition: background-color 150ms var(--ease-out);
}

.chat-cerrar:focus-visible,
.ayuda-recorrido:focus-visible {
  outline: 3px solid var(--marca-400);
  outline-offset: -3px;
}

@media (hover: hover) and (pointer: fine) {
  .chat-cerrar:hover {
    background: rgb(255 255 255 / 0.15);
  }

  .ayuda-recorrido:hover {
    background: var(--marca-50);
  }
}

html.oscuro .ayuda {
  box-shadow:
    0 24px 48px -16px rgb(0 0 0 / 0.7),
    0 0 0 1px rgb(255 255 255 / 0.08);
}

html.oscuro .ayuda-recorrido {
  border-bottom-color: #263042;
  background: #131a26;
  color: #f1f5f9;
}

html.oscuro .ayuda-recorrido .text-slate-500 {
  color: #94a3b8;
}

@media (hover: hover) and (pointer: fine) {
  html.oscuro .ayuda-recorrido:hover {
    background: #182132;
  }
}
</style>
