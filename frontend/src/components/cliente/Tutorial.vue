<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowLeft, ArrowRight, Banknote, X } from '@lucide/vue'
import UiButton from '../ui/Button.vue'
import type { PasoTutorial } from './tutorial'

const props = defineProps<{ pasos: PasoTutorial[] }>()
const emit = defineEmits<{ cambio: [paso: PasoTutorial]; cerrar: []; vender: [] }>()

const MARGEN = 6
const SEPARACION = 16
const ORILLA = 16

const indice = ref(0)
const paso = computed(() => props.pasos[indice.value]!)
const hueco = ref<{ top: number; left: number; width: number; height: number } | null>(null)
const tarjeta = ref<HTMLElement | null>(null)
const flotante = ref<{ top: number; left: number } | null>(null)
const deslizar = ref(false)
const hojaArriba = ref(false)

const consultaCelular = window.matchMedia('(max-width: 639px)')
const consultaEscritorio = window.matchMedia('(min-width: 1024px)')

const modo = computed(() => {
  if (!hueco.value) return 'centro'
  if (flotante.value) return 'flotante'
  return hojaArriba.value ? 'hoja-arriba' : 'hoja-abajo'
})

const elemento = () =>
  paso.value.objetivo ? document.querySelector<HTMLElement>(`[data-tour="${paso.value.objetivo}"]`) : null

function medir() {
  const el = elemento()
  const caja = el?.getBoundingClientRect()
  if (!caja || (!caja.width && !caja.height)) {
    hueco.value = null
    flotante.value = null
    return
  }
  const top = Math.max(caja.top - MARGEN, 4)
  const bottom = Math.min(caja.bottom + MARGEN, window.innerHeight - 4)
  hueco.value = { top, left: caja.left - MARGEN, width: caja.width + MARGEN * 2, height: bottom - top }
  colocar()
}

/** Junto al elemento si cabe; si no, como hoja arriba o abajo, del lado contrario al elemento. */
function colocar() {
  const h = hueco.value
  const t = tarjeta.value
  if (!h || !t) return
  hojaArriba.value = h.top + h.height / 2 > window.innerHeight / 2
  if (consultaCelular.matches) {
    flotante.value = null
    return
  }
  const ancho = t.offsetWidth
  const alto = t.offsetHeight
  const vw = window.innerWidth
  const vh = window.innerHeight
  let left: number
  let top: number
  if (h.left + h.width + SEPARACION + ancho <= vw - ORILLA) {
    left = h.left + h.width + SEPARACION
    top = h.top + h.height / 2 - alto / 2
  } else if (h.top + h.height + SEPARACION + alto <= vh - ORILLA) {
    top = h.top + h.height + SEPARACION
    left = h.left + h.width / 2 - ancho / 2
  } else if (h.top - SEPARACION - alto >= ORILLA) {
    top = h.top - SEPARACION - alto
    left = h.left + h.width / 2 - ancho / 2
  } else {
    flotante.value = null
    return
  }
  flotante.value = {
    left: Math.min(Math.max(left, ORILLA), vw - ancho - ORILLA),
    top: Math.min(Math.max(top, ORILLA), vh - alto - ORILLA),
  }
}

let turno = 0

async function mostrar(nuevo: number) {
  const mio = ++turno
  indice.value = nuevo
  emit('cambio', paso.value)
  await nextTick()
  // Espera a que el cajón del menú termine de abrir o cerrar antes de medir.
  await new Promise((listo) => setTimeout(listo, consultaEscritorio.matches ? 40 : 320))
  if (mio !== turno) return
  elemento()?.scrollIntoView({ block: 'nearest' })
  deslizar.value = Boolean(flotante.value)
  medir()
  await nextTick()
  colocar()
  tarjeta.value?.focus({ preventScroll: true })
}

const siguiente = () => indice.value < props.pasos.length - 1 && mostrar(indice.value + 1)
const anterior = () => indice.value > 0 && mostrar(indice.value - 1)

function alTeclear(evento: KeyboardEvent) {
  if (evento.key === 'Escape') {
    evento.preventDefault()
    emit('cerrar')
  } else if (evento.key === 'ArrowRight' && !paso.value.final) {
    siguiente()
  } else if (evento.key === 'ArrowLeft') {
    anterior()
  } else if (evento.key === 'Tab' && tarjeta.value) {
    // El foco no sale de la ventana mientras dura el recorrido.
    const enfocables = [...tarjeta.value.querySelectorAll<HTMLElement>('button:not([disabled])')]
    if (!enfocables.length) return
    const primero = enfocables[0]!
    const ultimo = enfocables[enfocables.length - 1]!
    if (evento.shiftKey && (document.activeElement === primero || document.activeElement === tarjeta.value)) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault()
      primero.focus()
    }
  }
}

let cuadro = 0
const alMoverse = () => {
  cancelAnimationFrame(cuadro)
  cuadro = requestAnimationFrame(medir)
}

const focoPrevio = document.activeElement as HTMLElement | null

onMounted(() => {
  window.addEventListener('resize', alMoverse)
  window.addEventListener('scroll', alMoverse, { passive: true, capture: true })
  mostrar(0)
})

onBeforeUnmount(() => {
  turno++
  window.removeEventListener('resize', alMoverse)
  window.removeEventListener('scroll', alMoverse, { capture: true })
  cancelAnimationFrame(cuadro)
  focoPrevio?.focus?.({ preventScroll: true })
})
</script>

<template>
  <Teleport to="body">
    <div class="tutorial font-sans">
      <div :class="['tutorial-bloqueo', { oscuro: !hueco }]" aria-hidden="true" />
      <div
        v-if="hueco"
        class="tutorial-hueco"
        :style="{
          transform: `translate(${hueco.left}px, ${hueco.top}px)`,
          width: `${hueco.width}px`,
          height: `${hueco.height}px`,
        }"
        aria-hidden="true"
      >
        <span :key="paso.id" class="tutorial-pulso" />
      </div>

      <section
        ref="tarjeta"
        :class="['tutorial-tarjeta bg-white text-slate-900', modo, { deslizar }]"
        :style="flotante ? { transform: `translate(${flotante.left}px, ${flotante.top}px)` } : undefined"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-titulo"
        aria-describedby="tutorial-texto"
        tabindex="-1"
        @keydown="alTeclear"
      >
        <button type="button" class="tutorial-cerrar ip-boton" aria-label="Cerrar el recorrido" @click="emit('cerrar')">
          <X class="size-4" />
        </button>

        <img v-if="paso.mascota" :src="paso.mascota" alt="" class="tutorial-mascota" />
        <p class="m-0 text-xs font-semibold text-slate-500 tabular-nums">Paso {{ indice + 1 }} de {{ pasos.length }}</p>
        <h2 id="tutorial-titulo" class="font-display mt-1 mb-0 pr-8 text-xl leading-tight font-bold text-balance">
          {{ paso.titulo }}
        </h2>
        <p id="tutorial-texto" class="mt-2 mb-0 text-[0.9375rem] leading-relaxed text-slate-600">{{ paso.texto }}</p>

        <div class="tutorial-puntos" aria-hidden="true">
          <span v-for="(p, i) in pasos" :key="p.id" :class="{ hecho: i < indice, actual: i === indice }" />
        </div>

        <div class="tutorial-acciones">
          <button v-if="!paso.final" type="button" class="tutorial-saltar" @click="emit('cerrar')">Saltar recorrido</button>
          <span class="flex-1" />
          <UiButton v-if="indice > 0" variant="outline" size="sm" class="h-10" @click="anterior">
            <ArrowLeft class="size-4" aria-hidden="true" />
            <span class="sr-only sm:not-sr-only">Anterior</span>
          </UiButton>
          <UiButton v-if="!paso.final" size="sm" class="h-10 px-4" @click="siguiente">
            {{ indice === 0 ? 'Empezar' : 'Siguiente' }}
            <ArrowRight class="size-4" aria-hidden="true" />
          </UiButton>
          <template v-else>
            <UiButton variant="outline" size="sm" class="h-10" @click="emit('cerrar')">Explorar solo</UiButton>
            <UiButton size="sm" class="h-10 px-4" @click="emit('vender')">
              <Banknote class="size-4" aria-hidden="true" />
              Primera venta
            </UiButton>
          </template>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.tutorial {
  position: fixed;
  inset: 0;
  z-index: 80;
  transition: opacity 220ms var(--ease-out);

  @starting-style {
    opacity: 0;
  }
}

/* Atrapa los clics para que nada de atrás se active a media explicación. */
.tutorial-bloqueo {
  position: absolute;
  inset: 0;
  background: transparent;
  transition: background-color 220ms var(--ease-out);
}

.tutorial-bloqueo.oscuro {
  background: rgb(8 12 24 / 0.6);
}

.tutorial-hueco {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 0.875rem;
  box-shadow: 0 0 0 200vmax rgb(8 12 24 / 0.6);
  outline: 2px solid var(--marca-400);
  pointer-events: none;
  transition:
    transform 320ms var(--ease-in-out),
    width 320ms var(--ease-in-out),
    height 320ms var(--ease-in-out);
}

.tutorial-pulso {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  animation: tutorial-pulso 1400ms var(--ease-out) 320ms 2 both;
}

@keyframes tutorial-pulso {
  from {
    box-shadow: 0 0 0 0 color-mix(in oklab, var(--marca-400) 70%, transparent);
  }
  to {
    box-shadow: 0 0 0 14px transparent;
  }
}

/* ---------- La ventana ---------- */

.tutorial-tarjeta {
  position: absolute;
  width: min(22rem, calc(100vw - 2rem));
  padding: 1.25rem 1.25rem 1rem;
  border-radius: 1rem;
  box-shadow:
    0 24px 48px -12px rgb(8 12 24 / 0.4),
    0 2px 6px rgb(8 12 24 / 0.12);
  outline: none;
}

.tutorial-tarjeta.flotante {
  top: 0;
  left: 0;
}

.tutorial-tarjeta.flotante.deslizar {
  transition: transform 320ms var(--ease-in-out);
}

.tutorial-tarjeta.flotante:not(.deslizar),
.tutorial-tarjeta.hoja-abajo,
.tutorial-tarjeta.hoja-arriba {
  animation: tutorial-entra 220ms var(--ease-out) both;
}

.tutorial-tarjeta.centro {
  top: 50%;
  left: 50%;
  width: min(26rem, calc(100vw - 2rem));
  translate: -50% -50%;
  text-align: center;
  animation: tutorial-entra 260ms var(--ease-out) both;
}

.tutorial-tarjeta.hoja-abajo,
.tutorial-tarjeta.hoja-arriba {
  left: 50%;
  translate: -50% 0;
  width: min(26rem, calc(100vw - 1.5rem));
}

.tutorial-tarjeta.hoja-abajo {
  bottom: max(0.75rem, env(safe-area-inset-bottom));
}

.tutorial-tarjeta.hoja-arriba {
  top: max(0.75rem, env(safe-area-inset-top));
}

@keyframes tutorial-entra {
  from {
    opacity: 0;
    scale: 0.96;
  }
}

.tutorial-mascota {
  display: block;
  height: 6.5rem;
  width: auto;
  margin: -0.25rem auto 0.75rem;
}

.tutorial-cerrar {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  display: grid;
  width: 2.25rem;
  height: 2.25rem;
  place-items: center;
  border: 0;
  border-radius: 0.625rem;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .tutorial-cerrar:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
}

.tutorial-puntos {
  display: flex;
  gap: 0.3rem;
  margin-top: 1rem;
}

.centro .tutorial-puntos {
  justify-content: center;
}

.tutorial-puntos span {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 999px;
  background: #cbd5e1;
  transition:
    width 240ms var(--ease-out),
    background-color 240ms ease;
}

.tutorial-puntos .hecho {
  background: var(--marca-300);
}

.tutorial-puntos .actual {
  width: 1.25rem;
  background: var(--marca-600);
}

.tutorial-acciones {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.tutorial-saltar {
  min-height: 2.5rem;
  padding: 0 0.25rem;
  border: 0;
  background: none;
  color: #64748b;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .tutorial-saltar:hover {
    color: #0f172a;
    text-decoration: underline;
  }
}

/* ---------- Modo oscuro ---------- */

html.oscuro .tutorial-cerrar,
html.oscuro .tutorial-saltar {
  color: #94a3b8;
}

@media (hover: hover) and (pointer: fine) {
  html.oscuro .tutorial-cerrar:hover {
    background: rgb(255 255 255 / 0.08);
    color: #f1f5f9;
  }

  html.oscuro .tutorial-saltar:hover {
    color: #f1f5f9;
  }
}

html.oscuro .tutorial-puntos span {
  background: #334155;
}

html.oscuro .tutorial-puntos .hecho {
  background: var(--marca-700);
}

html.oscuro .tutorial-puntos .actual {
  background: var(--marca-400);
}

html.oscuro .tutorial-tarjeta {
  box-shadow:
    0 24px 48px -12px rgb(0 0 0 / 0.6),
    0 0 0 1px rgb(255 255 255 / 0.08);
}

@media (prefers-reduced-motion: reduce) {
  .tutorial-hueco,
  .tutorial-tarjeta.flotante,
  .tutorial-puntos span {
    transition: none;
  }

  .tutorial-pulso,
  .tutorial-tarjeta {
    animation: none !important;
  }
}
</style>
