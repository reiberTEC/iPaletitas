<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { MessageCircle, X } from '@lucide/vue'
import PaletaIcon from './icons/PaletaIcon.vue'
import Conversacion from './asistente/Conversacion.vue'
import type { Accion } from '@/lib/asistente'

const emit = defineEmits(['irRegistro'])

let avisoTimer: ReturnType<typeof setTimeout> | undefined
let ocultarAvisoTimer: ReturnType<typeof setTimeout> | undefined

const abierto = ref(false)
const mostrarAviso = ref(false)
const lanzador = ref<HTMLButtonElement | null>(null)

async function alternar() {
  abierto.value = !abierto.value
  mostrarAviso.value = false
  if (!abierto.value) {
    await nextTick()
    lanzador.value?.focus()
  }
}

function alAccion(accion: Accion) {
  if (accion === 'registro') {
    emit('irRegistro')
    return
  }
  if (accion === 'planes') {
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    document.getElementById('planes')?.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth' })
    // En teléfono la ventana taparía los planes.
    if (window.matchMedia('(max-width: 639px)').matches) abierto.value = false
  }
}

function alPresionarTecla(evento: KeyboardEvent) {
  if (evento.key === 'Escape' && abierto.value) alternar()
}

// El aviso sale una sola vez, cuando ya dejaste atrás la portada, y se va solo.
function alBajar() {
  if (window.scrollY < window.innerHeight * 0.8) return
  window.removeEventListener('scroll', alBajar)
  avisoTimer = setTimeout(() => {
    if (abierto.value) return
    mostrarAviso.value = true
    ocultarAvisoTimer = setTimeout(() => (mostrarAviso.value = false), 9000)
  }, 1200)
}

onMounted(() => {
  window.addEventListener('scroll', alBajar, { passive: true })
  window.addEventListener('keydown', alPresionarTecla)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', alBajar)
  window.removeEventListener('keydown', alPresionarTecla)
  clearTimeout(avisoTimer)
  clearTimeout(ocultarAvisoTimer)
})
</script>

<template>
  <div class="chat-dock">
    <Transition name="chat">
      <section v-if="abierto" class="chat-ventana" role="dialog" aria-label="Asistente iPaletitas">
        <header class="chat-cabeza">
          <PaletaIcon variant="white" :size="28" />
          <div class="min-w-0 flex-1">
            <p class="font-display text-base leading-tight font-bold">Asistente iPaletitas</p>
            <p class="text-sm text-blue-100">Responde al momento</p>
          </div>
          <button type="button" class="chat-cerrar ip-boton" aria-label="Cerrar chat" @click="alternar">
            <X class="size-5" />
          </button>
        </header>

        <Conversacion contexto="publico" enfocar @accion="alAccion" />
      </section>
    </Transition>

    <Transition name="aviso">
      <button v-if="mostrarAviso && !abierto" type="button" class="chat-teaser ip-boton" @click="alternar">
        <PaletaIcon variant="blue" :size="20" />
        ¿Te ayudo a conocer iPaletitas?
      </button>
    </Transition>

    <button
      ref="lanzador"
      type="button"
      class="chat-launcher ip-boton"
      :aria-label="abierto ? 'Cerrar chat' : 'Abrir chat'"
      :aria-expanded="abierto"
      @click="alternar"
    >
      <X v-if="abierto" class="size-6" />
      <MessageCircle v-else class="size-6" />
    </button>
  </div>
</template>

<style scoped>
button {
  font: inherit;
}

.chat-dock {
  position: fixed;
  right: max(1.25rem, env(safe-area-inset-right));
  bottom: max(1.25rem, env(safe-area-inset-bottom));
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .chat-dock {
    right: max(2rem, env(safe-area-inset-right));
    bottom: max(2rem, env(safe-area-inset-bottom));
  }
}

/* La ventana flota sobre la página: es la única pieza con sombra. */
.chat-ventana {
  display: flex;
  flex-direction: column;
  width: min(24rem, calc(100vw - 2.5rem));
  overflow: hidden;
  border-radius: 1.25rem;
  background: #fff;
  box-shadow: 0 24px 48px -16px rgb(15 23 42 / 0.35); /* taste-skill-ignore: ventana flotante */
  transform-origin: bottom right;
}

.chat-cabeza {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1rem 1rem 1.25rem;
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

/* En teléfono el globo taparía el contenido; ahí basta el botón redondo. */
.chat-teaser {
  display: none;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.625rem 1rem;
  border: 2px solid var(--marca-600);
  border-radius: 0.75rem;
  background: #fff;
  color: #0f172a;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
}

@media (min-width: 640px) {
  .chat-teaser {
    display: flex;
  }
}

/* Sin sombra: el anillo claro lo separa de cualquier sección, incluso de las azules. */
.chat-launcher {
  display: grid;
  place-items: center;
  width: 3.75rem;
  height: 3.75rem;
  border: 0;
  border-radius: 999px;
  outline: 3px solid #fff;
  background: var(--marca-600);
  color: #fff;
  cursor: pointer;
}

.chat-cerrar:focus-visible,
.chat-teaser:focus-visible {
  outline: 3px solid var(--marca-400);
  outline-offset: 2px;
}

.chat-launcher:focus-visible {
  outline-color: var(--marca-300);
  outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
  .chat-cerrar:hover {
    background: rgb(255 255 255 / 0.15);
  }

  .chat-launcher:hover {
    background: var(--marca-700);
  }

  .chat-teaser:hover {
    background: var(--marca-50);
  }
}

.chat-enter-active {
  transition:
    opacity 200ms var(--ease-out),
    transform 200ms var(--ease-out);
}

.chat-leave-active {
  transition:
    opacity 150ms var(--ease-out),
    transform 150ms var(--ease-out);
}

.chat-enter-from,
.chat-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

.aviso-enter-active,
.aviso-leave-active {
  transition:
    opacity 200ms var(--ease-out),
    transform 200ms var(--ease-out);
}

.aviso-enter-from,
.aviso-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (prefers-reduced-motion: reduce) {
  .chat-enter-from,
  .chat-leave-to,
  .aviso-enter-from,
  .aviso-leave-to {
    transform: none;
  }
}
</style>
