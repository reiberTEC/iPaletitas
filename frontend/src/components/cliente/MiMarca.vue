<script setup lang="ts">
import { computed, ref } from 'vue'
import { Banknote, Check, ImageUp, LayoutDashboard, Package, ReceiptText, RotateCcw, Trash2 } from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Encabezado from '../ui/Encabezado.vue'
import { estado, guardarMarca, quitarMarca } from '@/stores/negocio'
import {
  COLOR_IPALETITAS,
  PASOS,
  coloresDelLogo,
  contraste,
  leerArchivo,
  logoEsClaro,
  logoReducido,
  rampaDe,
} from '@/lib/marca'
import { iniciales } from '@/lib/formato'

const MAX_MB = 5

const logo = ref<string | null>(estado.marca.logo)
const color = ref<string>(estado.marca.color ?? COLOR_IPALETITAS)
const sugeridos = ref<string[]>([])
const leyendo = ref(false)
const error = ref('')
const arrastrando = ref(false)
const guardado = ref(false)

const rampa = computed(() => rampaDe(color.value))
const cambios = computed(() => logo.value !== estado.marca.logo || color.value !== (estado.marca.color ?? COLOR_IPALETITAS))
const esPredeterminada = computed(() => !estado.marca.logo && !estado.marca.color)
const legibilidad = computed(() => contraste(rampa.value[600], '#ffffff'))

/* La vista previa recibe su propia escala: lo que ves aquí todavía no cambia el resto del panel. */
const estiloVista = computed(() =>
  Object.fromEntries(PASOS.flatMap((p) => [[`--marca-${p}`, rampa.value[p]], [`--color-blue-${p}`, rampa.value[p]]])),
)

async function cargar(archivo: File | undefined) {
  error.value = ''
  if (!archivo) return
  if (!archivo.type.startsWith('image/')) {
    error.value = 'Ese archivo no es una imagen. Sube tu logo en PNG, JPG, WEBP o SVG.'
    return
  }
  if (archivo.size > MAX_MB * 1024 * 1024) {
    error.value = `Tu logo pesa más de ${MAX_MB} MB. Prueba con una versión más ligera.`
    return
  }
  leyendo.value = true
  try {
    const reducido = await logoReducido(await leerArchivo(archivo))
    const colores = await coloresDelLogo(reducido)
    logo.value = reducido
    sugeridos.value = colores
    color.value = colores[0] ?? color.value
  } catch {
    error.value = 'No pudimos leer esa imagen. Intenta con otro archivo de tu logo.'
  } finally {
    leyendo.value = false
  }
}

function alElegirArchivo(evento: Event) {
  const entrada = evento.target as HTMLInputElement
  cargar(entrada.files?.[0])
  entrada.value = ''
}

function alSoltar(evento: DragEvent) {
  arrastrando.value = false
  cargar(evento.dataTransfer?.files?.[0])
}

function quitarLogo() {
  logo.value = null
  sugeridos.value = []
}

async function guardar() {
  await guardarMarca({ logo: logo.value, color: color.value === COLOR_IPALETITAS ? null : color.value })
  guardado.value = true
  setTimeout(() => (guardado.value = false), 2200)
}

async function restablecer() {
  await quitarMarca()
  logo.value = null
  color.value = COLOR_IPALETITAS
  sugeridos.value = []
}
</script>

<template>
  <div>
    <Encabezado
      titulo="Mi marca"
      descripcion="Sube el logo de tu negocio y el panel completo se pinta con sus colores: botones, menú, gráficas y tickets."
    >
      <UiButton v-if="!esPredeterminada" variant="ghost" @click="restablecer">
        <RotateCcw class="size-4" />
        Usar colores de iPaletitas
      </UiButton>
    </Encabezado>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <UiCard class="p-6">
        <h2 class="font-display text-lg font-semibold">Tu logo</h2>

        <label
          :class="[
            'zona mt-4 flex cursor-pointer items-center gap-5 rounded-xl border-2 border-dashed p-5',
            arrastrando ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300',
          ]"
          @dragover.prevent="arrastrando = true"
          @dragleave="arrastrando = false"
          @drop.prevent="alSoltar"
        >
          <input type="file" accept="image/*" class="sr-only" @change="alElegirArchivo" />
          <span
            :class="[
              'grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl',
              logoEsClaro(logo) ? 'bg-slate-800' : 'bg-slate-100',
            ]"
          >
            <img v-if="logo" :src="logo" alt="Logo de tu negocio" class="size-full object-contain p-1.5" />
            <ImageUp v-else class="size-8 text-slate-500" />
          </span>
          <span class="min-w-0">
            <span class="block font-semibold text-slate-900">
              {{ leyendo ? 'Leyendo los colores de tu logo…' : logo ? 'Cambiar logo' : 'Sube tu logo' }}
            </span>
            <span class="mt-1 block text-sm text-slate-500">
              Arrástralo aquí o elige el archivo. PNG, JPG, WEBP o SVG de hasta {{ MAX_MB }} MB.
            </span>
          </span>
        </label>
        <button
          v-if="logo"
          type="button"
          class="ip-boton mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-transparent px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-rose-600"
          @click="quitarLogo"
        >
          <Trash2 class="size-4" />
          Quitar logo
        </button>
        <p v-if="error" class="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700" role="alert">
          {{ error }}
        </p>

        <h2 class="font-display mt-8 text-lg font-semibold">Color de tu negocio</h2>
        <p class="mt-1 text-sm text-slate-500">
          {{ sugeridos.length ? 'Estos colores salen de tu logo. Elige el que más te represente.' : 'Elige el color con el que te reconocen tus clientes.' }}
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-3" role="radiogroup" aria-label="Color de tu negocio">
          <button
            v-for="opcion in sugeridos"
            :key="opcion"
            type="button"
            role="radio"
            :aria-checked="color === opcion"
            :aria-label="`Usar ${opcion}`"
            class="muestra ip-boton grid size-12 cursor-pointer place-items-center rounded-xl border-0"
            :style="{ backgroundColor: opcion }"
            @click="color = opcion"
          >
            <Check
              v-if="color === opcion"
              class="size-5"
              :style="{ color: contraste(opcion, '#ffffff') >= 3 ? '#ffffff' : '#0f172a' }"
            />
          </button>
          <label class="flex h-12 cursor-pointer items-center gap-2 rounded-xl px-3 ring-1 ring-slate-200 ring-inset hover:ring-blue-300">
            <input v-model="color" type="color" class="selector size-7 cursor-pointer" aria-label="Elegir otro color" />
            <span class="text-sm font-semibold text-slate-700">Otro color</span>
            <span class="font-mono text-sm text-slate-500">{{ color.toUpperCase() }}</span>
          </label>
        </div>

        <div class="mt-6">
          <p class="text-sm font-semibold text-slate-700">Tu línea de color</p>
          <div class="mt-2 flex h-9 overflow-hidden rounded-lg" aria-hidden="true">
            <span v-for="paso in PASOS" :key="paso" class="flex-1" :style="{ backgroundColor: rampa[paso] }" />
          </div>
          <p class="mt-2 text-sm text-slate-500">
            Ajustamos los tonos para que el texto siempre se lea: blanco sobre tu color mide
            <strong class="tabular-nums text-slate-700">{{ legibilidad.toFixed(1) }}:1</strong>
            {{ legibilidad >= 4.5 ? '(cumple con la norma de lectura).' : '(un poco bajo; prueba un tono más oscuro).' }}
          </p>
        </div>

        <div class="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
          <UiButton :disabled="!cambios || leyendo" @click="guardar">Aplicar a mi panel</UiButton>
          <span v-if="guardado" class="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700" role="status">
            <Check class="size-4" />
            Listo, tu panel ya tiene tus colores
          </span>
          <span v-else-if="cambios" class="text-sm text-slate-500">Tienes cambios sin aplicar.</span>
        </div>
      </UiCard>

      <section aria-label="Vista previa" class="vista" :style="estiloVista">
        <p class="mb-3 text-sm font-semibold text-slate-500">Así se verá tu panel</p>
        <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div class="flex items-center gap-3 border-b border-slate-100 p-4">
            <span class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-600 text-sm font-bold text-white">
              <img
                v-if="logo"
                :src="logo"
                alt=""
                :class="['size-full object-contain p-1', !logoEsClaro(logo) && 'bg-[#fff] ring-1 ring-slate-200 ring-inset']"
              />
              <template v-else>{{ iniciales(estado.licencia?.negocio ?? 'N') }}</template>
            </span>
            <div class="min-w-0">
              <p class="line-clamp-2 leading-tight font-bold [overflow-wrap:anywhere]">{{ estado.licencia?.negocio ?? 'Tu negocio' }}</p>
              <p class="truncate text-xs text-slate-500">{{ estado.licencia?.giro }}</p>
            </div>
          </div>

          <div class="p-4">
            <span class="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-display text-sm font-semibold text-white">
              <Banknote class="size-5" />
              Punto de venta
            </span>

            <ol class="linea relative mt-4 grid gap-1">
              <li
                v-for="(estacion, i) in [
                  { nombre: 'Inicio', icono: LayoutDashboard },
                  { nombre: 'Productos', icono: Package },
                  { nombre: 'Historial de ventas', icono: ReceiptText },
                ]"
                :key="estacion.nombre"
                class="relative flex items-center gap-3 py-1.5 text-sm font-semibold"
              >
                <span
                  :class="[
                    'relative z-10 grid size-8 place-items-center rounded-lg',
                    i === 0 ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 ring-2 ring-blue-600 ring-inset',
                  ]"
                >
                  <component :is="estacion.icono" class="size-4" />
                </span>
                <span :class="i === 0 ? 'text-slate-900' : 'text-slate-600'">{{ estacion.nombre }}</span>
              </li>
            </ol>

            <div class="mt-4 rounded-xl bg-blue-50 p-4">
              <p class="text-sm text-blue-900">Ventas de hoy</p>
              <p class="font-display mt-1 text-2xl font-semibold tabular-nums text-blue-700">$2,480.00</p>
            </div>
          </div>
        </div>
        <p class="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <PaletaIcon variant="blue" :size="16" />
          Tu panel sigue funcionando con iPaletitas.
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.zona {
  transition:
    border-color 150ms ease,
    background-color 150ms ease;
}

.muestra[aria-checked='true'] {
  box-shadow:
    0 0 0 2px #fff,
    0 0 0 4px #0f172a;
}

.selector {
  padding: 0;
  border: 0;
  background: none;
}

.selector::-webkit-color-swatch-wrapper {
  padding: 0;
}

.selector::-webkit-color-swatch {
  border: 0;
  border-radius: 0.4rem;
}

/* La línea del metro que une las estaciones */
.linea::before {
  content: '';
  position: absolute;
  top: 1.25rem;
  bottom: 1.25rem;
  left: calc(1rem - 1.5px);
  width: 3px;
  border-radius: 2px;
  background: var(--marca-600);
}

.vista :is(.bg-blue-600, .bg-blue-50, .ring-blue-600, .text-blue-700, .text-blue-900) {
  transition:
    background-color 200ms ease,
    color 200ms ease,
    box-shadow 200ms ease;
}

html.oscuro .muestra[aria-checked='true'] {
  box-shadow:
    0 0 0 2px #131a26,
    0 0 0 4px #e2e8f0;
}
</style>
