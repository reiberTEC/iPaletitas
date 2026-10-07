<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { MessageCircle, Send, X } from '@lucide/vue'
import PaletaIcon from './icons/PaletaIcon.vue'

const emit = defineEmits(['irRegistro'])

type Mensaje = { id: number; autor: 'bot' | 'usuario'; texto: string }

let siguienteId = 1
let avisoTimer: ReturnType<typeof setTimeout> | undefined

const abierto = ref(false)
const mostrarAviso = ref(false)
const escribiendo = ref(false)
const texto = ref('')
const lista = ref<HTMLElement | null>(null)
const mensajes = ref<Mensaje[]>([
  {
    id: siguienteId++,
    autor: 'bot',
    texto: '¡Hola! Soy el asistente de iPaletitas. ¿En qué te puedo ayudar hoy?',
  },
])

const sugerencias = ['¿Qué incluye?', 'Planes y sucursales', '¿Funciona en celular?', 'Crear cuenta']

const respuestas: { claves: string[]; texto: string }[] = [
  {
    claves: ['incluye', 'hace', 'funcion', 'módulo', 'modulo'],
    texto:
      'Administras productos, registras compras o entradas, cobras con ticket, consultas el historial de ventas y controlas usuarios y accesos.',
  },
  {
    claves: ['plan', 'precio', 'sucursal', 'negocio'],
    texto:
      'Puedes manejar uno o varios negocios o sucursales, según el plan que contrates. Muy pronto verás los planes aquí mismo.',
  },
  {
    claves: ['celular', 'teléfono', 'telefono', 'tablet', 'móvil', 'movil', 'computadora'],
    texto:
      'Sí. Es una plataforma web: entras desde computadora, tablet o teléfono, con tus datos en la nube y opción de trabajar en local.',
  },
  {
    claves: ['ticket', 'venta', 'comprobante'],
    texto: 'Al cerrar una venta se genera el ticket o comprobante al momento, y queda guardado en tu historial.',
  },
  {
    claves: ['banco', 'contabilidad', 'marketing', 'cliente', 'migra'],
    texto:
      'Eso queda fuera del alcance: no nos integramos con bancos, no llevamos contabilidad completa ni administramos clientes o campañas de marketing.',
  },
]

function responder(pregunta: string) {
  const p = pregunta.toLowerCase()
  const encontrada = respuestas.find((r) => r.claves.some((clave) => p.includes(clave)))
  return (
    encontrada?.texto ??
    'Buena pregunta. Por ahora soy un asistente de demostración; pronto podrás hablar directamente con el equipo de iPaletitas.'
  )
}

async function bajar() {
  await nextTick()
  lista.value?.scrollTo({ top: lista.value.scrollHeight, behavior: 'smooth' })
}

function enviar(contenido = texto.value) {
  const limpio = contenido.trim()
  if (!limpio || escribiendo.value) return

  if (limpio === 'Crear cuenta') {
    emit('irRegistro')
    return
  }

  mensajes.value.push({ id: siguienteId++, autor: 'usuario', texto: limpio })
  texto.value = ''
  escribiendo.value = true
  bajar()

  setTimeout(() => {
    mensajes.value.push({ id: siguienteId++, autor: 'bot', texto: responder(limpio) })
    escribiendo.value = false
    bajar()
  }, 800)
}

function alternar() {
  abierto.value = !abierto.value
  mostrarAviso.value = false
  if (abierto.value) bajar()
}

onMounted(() => {
  avisoTimer = setTimeout(() => {
    if (!abierto.value) mostrarAviso.value = true
  }, 2500)
})

onBeforeUnmount(() => clearTimeout(avisoTimer))
</script>

<template>
  <div class="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3 sm:right-8 sm:bottom-8">
    <Transition name="chat">
      <section
        v-if="abierto"
        class="flex w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-blue-900/20"
        aria-label="Asistente iPaletitas"
      >
        <header class="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 text-white">
          <span class="grid size-10 place-items-center rounded-2xl bg-white/15">
            <PaletaIcon variant="white" :size="26" />
          </span>
          <div class="flex-1">
            <p class="font-bold leading-tight">Asistente iPaletitas</p>
            <p class="flex items-center gap-1.5 text-xs text-blue-100">
              <span class="size-1.5 rounded-full bg-emerald-300" />
              En línea
            </p>
          </div>
          <button type="button" class="chat-icon-btn" aria-label="Cerrar chat" @click="alternar">
            <X class="size-5" />
          </button>
        </header>

        <div ref="lista" class="flex h-80 flex-col gap-3 overflow-y-auto bg-slate-50 px-4 py-5">
          <div
            v-for="m in mensajes"
            :key="m.id"
            :class="['flex items-end gap-2', m.autor === 'usuario' ? 'justify-end' : 'justify-start']"
          >
            <PaletaIcon v-if="m.autor === 'bot'" variant="blue" :size="22" class="shrink-0" />
            <p
              :class="[
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-6',
                m.autor === 'usuario'
                  ? 'rounded-br-md bg-blue-600 text-white'
                  : 'rounded-bl-md bg-white text-slate-700 ring-1 ring-slate-200',
              ]"
            >
              {{ m.texto }}
            </p>
          </div>

          <div v-if="escribiendo" class="flex items-end gap-2">
            <PaletaIcon variant="blue" :size="22" class="shrink-0" />
            <span class="typing flex gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 ring-1 ring-slate-200">
              <i /><i /><i />
            </span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 border-t border-slate-100 bg-white px-4 pt-3">
          <button v-for="s in sugerencias" :key="s" type="button" class="chat-chip" @click="enviar(s)">
            {{ s }}
          </button>
        </div>

        <form class="flex items-center gap-2 bg-white p-4" @submit.prevent="enviar()">
          <input
            v-model="texto"
            class="chat-input"
            type="text"
            placeholder="Escribe tu pregunta..."
            aria-label="Mensaje"
          />
          <button type="submit" class="chat-send" aria-label="Enviar" :disabled="!texto.trim()">
            <Send class="size-4" />
          </button>
        </form>
      </section>
    </Transition>

    <Transition name="chat">
      <button v-if="mostrarAviso && !abierto" type="button" class="chat-teaser" @click="alternar">
        <PaletaIcon variant="gold" :size="20" />
        ¿Te ayudo a conocer iPaletitas?
      </button>
    </Transition>

    <button
      type="button"
      class="chat-launcher"
      :aria-label="abierto ? 'Cerrar chat' : 'Abrir chat'"
      @click="alternar"
    >
      <X v-if="abierto" class="size-6" />
      <MessageCircle v-else class="size-6" />
      <span v-if="!abierto" class="launcher-dot" />
    </button>
  </div>
</template>

<style scoped>
button,
input {
  font: inherit;
}

.chat-icon-btn {
  display: grid;
  place-items: center;
  padding: 6px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.chat-icon-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.chat-chip {
  padding: 6px 12px;
  border: 1px solid #dbeafe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.chat-chip:hover {
  background: #dbeafe;
}

.chat-input {
  flex: 1;
  min-width: 0;
  width: auto;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
  font-size: 0.9rem;
}

.chat-send {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.chat-send:disabled {
  opacity: 0.45;
  cursor: default;
}

.chat-teaser {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 12px 30px -10px rgba(30, 64, 175, 0.35);
  color: #334155;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.chat-launcher {
  position: relative;
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 14px 30px -8px rgba(37, 99, 235, 0.6);
  color: #fff;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.chat-launcher:hover {
  transform: scale(1.06);
}

.launcher-dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 14px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #fcd34d;
  animation: latido 1.8s ease-in-out infinite;
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

.chat-enter-active,
.chat-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.chat-enter-from,
.chat-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

@keyframes latido {
  50% {
    transform: scale(1.2);
  }
}

@keyframes rebote {
  50% {
    transform: translateY(-4px);
    opacity: 0.6;
  }
}

@media (prefers-reduced-motion: reduce) {
  .launcher-dot,
  .typing i {
    animation: none;
  }
}
</style>
