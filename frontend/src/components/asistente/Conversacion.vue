<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { ArrowRight, Send } from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import {
  etiquetaAccion,
  preguntar,
  saludo,
  sugerenciasIniciales,
  type Accion,
  type Contexto,
  type DatosPanel,
  type MensajeChat,
} from '@/lib/asistente'

const props = defineProps<{
  contexto: Contexto
  /** Datos de la sesión que se mandan a la IA en cada pregunta (solo en el panel). */
  datosPanel?: () => DatosPanel
  enfocar?: boolean
}>()

const emit = defineEmits<{ accion: [accion: Accion] }>()

const CLAVE = `ipaletitas:chat:${props.contexto}`
const MAXIMO_GUARDADO = 30

function cargar(): MensajeChat[] {
  try {
    const guardado = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null')
    if (Array.isArray(guardado) && guardado.length) return guardado
  } catch {
    /* conversación ilegible: se empieza de nuevo */
  }
  return [{ id: 1, autor: 'bot', texto: saludo(props.contexto) }]
}

const mensajes = ref<MensajeChat[]>(cargar())
const sugerencias = ref<string[]>(sugerenciasIniciales(props.contexto))
const escribiendo = ref(false)
const texto = ref('')
const lista = ref<HTMLElement | null>(null)
const campo = ref<HTMLInputElement | null>(null)

let siguienteId = Math.max(...mensajes.value.map((m) => m.id)) + 1

watch(mensajes, (lista) => sessionStorage.setItem(CLAVE, JSON.stringify(lista.slice(-MAXIMO_GUARDADO))), {
  deep: true,
})

async function bajar() {
  await nextTick()
  const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  lista.value?.scrollTo({ top: lista.value.scrollHeight, behavior: quieto ? 'auto' : 'smooth' })
}

const esperar = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function enviar(contenido = texto.value) {
  const limpio = contenido.trim().slice(0, 500)
  if (!limpio || escribiendo.value) return

  mensajes.value.push({ id: siguienteId++, autor: 'usuario', texto: limpio })
  texto.value = ''
  escribiendo.value = true
  bajar()

  const inicio = performance.now()
  const respuesta = await preguntar(mensajes.value, props.contexto, props.datosPanel?.())
  // La base local contesta al instante; una pausa breve, según el largo, hace que se lea como respuesta.
  if (respuesta.origen === 'local') {
    const pausa = Math.min(1200, 350 + respuesta.texto.length * 4)
    await esperar(Math.max(0, pausa - (performance.now() - inicio)))
  }

  mensajes.value.push({ id: siguienteId++, autor: 'bot', texto: respuesta.texto, acciones: respuesta.acciones })
  sugerencias.value = respuesta.sugerencias.filter((s) => s !== limpio).slice(0, 4)
  escribiendo.value = false
  bajar()
  // La sugerencia tocada se desactiva mientras responde y el foco se cae al documento: vuelve al campo.
  if (document.activeElement === document.body) enfocarCampo()
}

// En celular el teclado taparía la conversación: ahí se enfoca solo cuando la persona toca el campo.
function enfocarCampo() {
  if (props.enfocar && window.matchMedia('(pointer: fine)').matches) campo.value?.focus()
}

onMounted(() => {
  bajar()
  enfocarCampo()
})
</script>

<template>
  <div ref="lista" class="chat-lista" role="log" aria-live="polite" aria-label="Conversación">
    <div
      v-for="m in mensajes"
      :key="m.id"
      :class="['flex items-end gap-2', m.autor === 'usuario' ? 'justify-end' : 'justify-start']"
    >
      <PaletaIcon v-if="m.autor === 'bot'" variant="blue" :size="22" class="shrink-0" />
      <div :class="['chat-mensaje', m.autor === 'usuario' && 'items-end']">
        <p :class="['chat-burbuja', m.autor === 'usuario' ? 'chat-burbuja-tuya' : 'chat-burbuja-bot']">
          {{ m.texto }}
        </p>
        <div v-if="m.acciones?.length" class="chat-acciones">
          <button
            v-for="accion in m.acciones"
            :key="accion"
            type="button"
            class="chat-accion ip-boton"
            @click="emit('accion', accion)"
          >
            {{ etiquetaAccion(accion) }}
            <ArrowRight class="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="escribiendo" class="flex items-end gap-2">
      <PaletaIcon variant="blue" :size="22" class="shrink-0" />
      <span class="typing chat-burbuja chat-burbuja-bot" role="status" aria-label="El asistente está escribiendo">
        <i /><i /><i />
      </span>
    </div>
  </div>

  <div class="chat-sugerencias">
    <button
      v-for="s in sugerencias"
      :key="s"
      type="button"
      class="chat-chip ip-boton"
      :disabled="escribiendo"
      @click="enviar(s)"
    >
      {{ s }}
    </button>
  </div>

  <form class="chat-forma" @submit.prevent="enviar()">
    <input
      ref="campo"
      v-model="texto"
      class="chat-input"
      type="text"
      maxlength="500"
      enterkeyhint="send"
      placeholder="Escribe tu pregunta..."
      aria-label="Mensaje"
    />
    <button type="submit" class="chat-send ip-boton" aria-label="Enviar" :disabled="!texto.trim() || escribiendo">
      <Send class="size-5" />
    </button>
  </form>
</template>

<style scoped>
button,
input {
  font: inherit;
}

.chat-lista {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: min(20rem, 45svh);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.25rem 1rem;
  background: #f5f6f8;
}

.chat-mensaje {
  display: flex;
  max-width: 85%;
  flex-direction: column;
  gap: 0.5rem;
}

.chat-burbuja {
  padding: 0.625rem 0.875rem;
  border-radius: 1rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.chat-burbuja-tuya {
  border-bottom-right-radius: 0.375rem;
  background: var(--marca-600);
  color: #fff;
}

.chat-burbuja-bot {
  border-bottom-left-radius: 0.375rem;
  background: #fff;
  color: #334155;
}

.chat-acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.chat-accion {
  display: inline-flex;
  min-height: 2.25rem;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1.5px solid var(--marca-200);
  border-radius: 0.625rem;
  background: #fff;
  color: var(--marca-700);
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 150ms var(--ease-out),
    border-color 150ms var(--ease-out);
}

.chat-sugerencias {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 1rem 0;
  background: #fff;
}

.chat-sugerencias:empty {
  display: none;
}

.chat-chip {
  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--marca-50);
  color: var(--marca-800);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.chat-chip:disabled {
  opacity: 0.55;
  cursor: default;
}

.chat-forma {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #fff;
}

.chat-input {
  flex: 1;
  min-width: 0;
  min-height: 2.75rem;
  padding: 0.625rem 0.875rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  background: #f8fafc;
  color: #0f172a;
  font-size: 1rem;
  transition: border-color 150ms var(--ease-out);
}

.chat-input:focus {
  outline: none;
  border-color: var(--marca-500);
  background: #fff;
}

.chat-send {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  border: 0;
  border-radius: 0.75rem;
  background: var(--marca-600);
  color: #fff;
  cursor: pointer;
}

.chat-send:disabled {
  opacity: 0.45;
  cursor: default;
}

.chat-chip:focus-visible,
.chat-send:focus-visible,
.chat-accion:focus-visible {
  outline: 3px solid var(--marca-400);
  outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
  .chat-chip:not(:disabled):hover {
    background: var(--marca-100);
  }

  .chat-send:not(:disabled):hover {
    background: var(--marca-700);
  }

  .chat-accion:hover {
    border-color: var(--marca-400);
    background: var(--marca-50);
  }
}

.typing {
  display: flex;
  gap: 0.25rem;
  padding: 0.875rem 1rem;
}

.typing i {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #94a3b8;
  animation: rebote 1s ease-in-out infinite;
}

.typing i:nth-child(2) {
  animation-delay: 0.15s;
}

.typing i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes rebote {
  50% {
    transform: translateY(-4px);
    opacity: 0.6;
  }
}

@media (prefers-reduced-motion: reduce) {
  .typing i {
    animation: none;
  }
}
</style>
