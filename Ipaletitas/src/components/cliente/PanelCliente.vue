<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import {
  Banknote,
  CreditCard,
  Info,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PackagePlus,
  ReceiptText,
  ShoppingCart,
  Store,
  Users,
  X,
} from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import UiButton from '../ui/Button.vue'
import TemaToggle from '../ui/TemaToggle.vue'
import TransicionBillete from './TransicionBillete.vue'
import Inicio from './Inicio.vue'
import PuntoVenta from './PuntoVenta.vue'
import Productos from './Productos.vue'
import Entradas from './Entradas.vue'
import Historial from './Historial.vue'
import Usuarios from './Usuarios.vue'
import Sucursales from './Sucursales.vue'
import MiLicencia from './MiLicencia.vue'
import Suscripciones from './Suscripciones.vue'
import Nosotros from './Nosotros.vue'
import type { Seccion } from './secciones'
import {
  DIAS_PRUEBA,
  cambiarSucursal,
  diasRestantes,
  enPrueba,
  estado,
  planActual,
  sucursalActiva,
} from '@/stores/negocio'
import { iniciales } from '@/lib/formato'

const emit = defineEmits(['salir'])

interface Pestana {
  id: Seccion
  etiqueta: string
  icono: Component
  vista: Component
}

const grupos: { titulo: string; pestanas: Pestana[] }[] = [
  {
    titulo: 'Operación',
    pestanas: [
      { id: 'inicio', etiqueta: 'Inicio', icono: LayoutDashboard, vista: Inicio },
      { id: 'venta', etiqueta: 'Punto de venta', icono: ShoppingCart, vista: PuntoVenta },
      { id: 'productos', etiqueta: 'Productos', icono: Package, vista: Productos },
      { id: 'entradas', etiqueta: 'Entradas', icono: PackagePlus, vista: Entradas },
      { id: 'historial', etiqueta: 'Historial de ventas', icono: ReceiptText, vista: Historial },
    ],
  },
  {
    titulo: 'Administración',
    pestanas: [
      { id: 'usuarios', etiqueta: 'Usuarios', icono: Users, vista: Usuarios },
      { id: 'sucursales', etiqueta: 'Sucursales', icono: Store, vista: Sucursales },
      { id: 'suscripciones', etiqueta: 'Suscripciones', icono: CreditCard, vista: Suscripciones },
      { id: 'licencia', etiqueta: 'Mi licencia', icono: KeyRound, vista: MiLicencia },
    ],
  },
  {
    titulo: 'iPaletitas',
    pestanas: [{ id: 'nosotros', etiqueta: 'Nosotros', icono: Info, vista: Nosotros }],
  },
]

const activa = ref<Seccion>('inicio')
const menuAbierto = ref(false)

const actual = computed(
  () => grupos.flatMap((g) => g.pestanas).find((p) => p.id === activa.value) ?? grupos[0]!.pestanas[0]!,
)

function ir(seccion: Seccion) {
  activa.value = seccion
  menuAbierto.value = false
  window.scrollTo({ top: 0, behavior: 'instant' })
}

const transicion = ref<InstanceType<typeof TransicionBillete> | null>(null)
let vendiendo = false

async function irAVender() {
  if (vendiendo) return
  menuAbierto.value = false

  const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (sinAnimacion || !transicion.value || activa.value === 'venta') {
    ir('venta')
    return
  }

  vendiendo = true
  try {
    await transicion.value.cubrir()
    ir('venta')
    await new Promise((resolve) => setTimeout(resolve, 150))
    await transicion.value.descubrir()
  } finally {
    vendiendo = false
  }
}

function alCambiarSucursal(evento: Event) {
  cambiarSucursal((evento.target as HTMLSelectElement).value)
}

function alPresionarTecla(evento: KeyboardEvent) {
  if (evento.key === 'Escape') menuAbierto.value = false
}

onMounted(() => window.addEventListener('keydown', alPresionarTecla))
onBeforeUnmount(() => window.removeEventListener('keydown', alPresionarTecla))
</script>

<template>
  <div class="min-h-screen w-full bg-slate-50 font-sans text-slate-900">
    <Transition name="velo">
      <div v-if="menuAbierto" class="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm" @click="menuAbierto = false" />
    </Transition>

    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300',
        menuAbierto ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
      ]"
      :aria-hidden="!menuAbierto"
      :inert="!menuAbierto"
    >
      <div class="flex h-[4.5rem] shrink-0 items-center justify-between px-6">
        <div class="flex items-center gap-2.5">
          <PaletaIcon variant="blue" :size="30" />
          <span class="text-xl font-extrabold tracking-tight">
            <span class="text-blue-600">i</span>Paletitas
          </span>
        </div>
        <button
          type="button"
          class="grid size-9 cursor-pointer place-items-center rounded-xl border-0 bg-transparent text-slate-500 hover:bg-slate-100"
          aria-label="Cerrar menú"
          @click="menuAbierto = false"
        >
          <X class="size-5" />
        </button>
      </div>

      <div class="mx-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
        <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-300 text-sm font-extrabold text-slate-900">
          {{ iniciales(estado.licencia?.negocio ?? 'N') }}
        </span>
        <div class="min-w-0">
          <p class="truncate text-sm font-bold">{{ estado.licencia?.negocio }}</p>
          <p class="truncate text-xs text-slate-500">{{ estado.licencia?.giro }}</p>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto px-4 pb-4" aria-label="Secciones del sistema">
        <button
          type="button"
          :class="['btn-vender mt-5', { activo: activa === 'venta' }]"
          @click="irAVender"
        >
          <Banknote class="btn-vender-icono size-8" aria-hidden="true" />
          Vender
        </button>

        <div v-for="grupo in grupos" :key="grupo.titulo">
          <p class="px-3 pt-6 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">{{ grupo.titulo }}</p>
          <button
            v-for="pestana in grupo.pestanas"
            :key="pestana.id"
            type="button"
            :class="[
              'mb-1 flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3 py-2.5 text-sm font-semibold transition',
              activa === pestana.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            ]"
            :aria-current="activa === pestana.id ? 'page' : undefined"
            @click="ir(pestana.id)"
          >
            <component :is="pestana.icono" class="size-5" />
            {{ pestana.etiqueta }}
          </button>
        </div>
      </nav>

      <div class="relative m-4 overflow-hidden rounded-2xl bg-slate-950 p-5 text-white">
        <div class="absolute -top-10 -right-10 size-32 rounded-full bg-blue-600/40 blur-2xl" />
        <div class="relative flex items-center justify-between">
          <div>
            <p class="text-xs text-slate-400">Licencia</p>
            <p class="font-bold">Plan {{ planActual?.nombre }}</p>
          </div>
          <PaletaIcon variant="gold" :size="28" />
        </div>
        <p class="relative mt-3 text-xs text-slate-400">
          {{ enPrueba ? 'Prueba gratis' : 'Suscripción activa' }} · {{ diasRestantes }} días
          {{ enPrueba ? 'restantes' : 'para renovar' }}
        </p>
        <div v-if="enPrueba" class="relative mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            class="h-full rounded-full bg-amber-300"
            :style="{ width: `${Math.min(100, (diasRestantes / DIAS_PRUEBA) * 100)}%` }"
          />
        </div>
        <UiButton variant="secondary" size="sm" class="relative mt-4 w-full" @click="ir('suscripciones')">
          Mejorar plan
        </UiButton>
      </div>
    </aside>

    <div>
      <header
        class="sticky top-0 z-30 flex h-[4.5rem] items-center gap-3 border-b sm:gap-4 border-slate-200 bg-white/80 px-5 backdrop-blur-xl sm:px-8"
      >
        <button
          type="button"
          class="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border-0 bg-transparent text-slate-600 hover:bg-slate-100"
          aria-label="Abrir menú"
          :aria-expanded="menuAbierto"
          @click="menuAbierto = true"
        >
          <Menu class="size-5" />
        </button>

        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-semibold text-slate-400">{{ estado.licencia?.negocio }}</p>
          <h2 class="truncate text-lg font-extrabold">{{ actual.etiqueta }}</h2>
        </div>

        <button
          v-if="activa !== 'venta'"
          type="button"
          class="btn-vender btn-vender-chico"
          aria-label="Vender"
          @click="irAVender"
        >
          <Banknote class="btn-vender-icono size-5" aria-hidden="true" />
          <span class="hidden sm:inline">Vender</span>
        </button>

        <label class="relative hidden w-56 lg:block">
          <span class="sr-only">Sucursal activa</span>
          <Store class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <select class="ip-input ip-input-icono cursor-pointer" :value="sucursalActiva?.id" @change="alCambiarSucursal">
            <option v-for="sucursal in estado.sucursales" :key="sucursal.id" :value="sucursal.id">
              {{ sucursal.nombre }}
            </option>
          </select>
        </label>

        <div class="flex items-center gap-3">
          <TemaToggle />
          <span class="hidden size-10 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white sm:grid">
            {{ iniciales(estado.sesion?.nombre ?? 'A') }}
          </span>
          <div class="hidden leading-tight md:block">
            <p class="text-sm font-bold">{{ estado.sesion?.nombre }}</p>
            <p class="text-xs text-slate-400">Titular de la cuenta</p>
          </div>
          <UiButton variant="ghost" size="sm" @click="emit('salir')">
            <LogOut class="size-4" />
            <span class="hidden sm:inline">Salir</span>
          </UiButton>
        </div>
      </header>

      <main class="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <Transition name="seccion" mode="out-in">
          <component :is="actual.vista" :key="actual.id" @ir="ir" @cambiarPlan="ir('suscripciones')" />
        </Transition>
      </main>
    </div>

    <TransicionBillete ref="transicion" />
  </div>
</template>

<style scoped>
.velo-enter-active,
.velo-leave-active {
  transition: opacity 0.2s ease;
}

.velo-enter-from,
.velo-leave-to {
  opacity: 0;
}

.seccion-enter-active,
.seccion-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.seccion-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.seccion-leave-to {
  opacity: 0;
}

.btn-vender {
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  overflow: hidden;
  border: 3px solid #fef08a;
  border-radius: 18px;
  background: linear-gradient(135deg, #fde047, #f59e0b 55%, #f97316);
  color: #3b1d03;
  font-family: inherit;
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: 3px;
  text-transform: uppercase;
  text-shadow: 0 2px 0 rgba(255, 255, 255, 0.5);
  cursor: pointer;
  animation: vender-pulso 2.4s ease-in-out infinite;
  transition:
    transform 0.2s,
    box-shadow 0.2s,
    text-shadow 0.2s;
}

/* Destello que cruza el botón al pasar el cursor */
.btn-vender::after {
  content: '';
  position: absolute;
  top: -20%;
  left: 0;
  width: 45%;
  height: 140%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
  transform: translateX(-160%) skewX(-20deg);
  pointer-events: none;
}

.btn-vender:hover,
.btn-vender:focus-visible {
  transform: translateY(-2px) scale(1.03);
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.4),
    0 0 28px 6px rgba(253, 224, 71, 0.85),
    0 10px 24px rgba(0, 0, 0, 0.25);
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.95),
    0 0 22px rgba(254, 240, 138, 0.9);
  animation: none;
  outline: none;
}

.btn-vender:hover::after,
.btn-vender:focus-visible::after {
  animation: vender-destello 0.9s ease-out;
}

.btn-vender:active {
  transform: scale(0.97);
}

.btn-vender.activo {
  border-color: white;
}

.btn-vender-chico {
  width: auto;
  flex-shrink: 0;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-width: 2px;
  border-radius: 14px;
  font-size: 0.95rem;
  letter-spacing: 1.5px;
}

.btn-vender-icono {
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.25));
}

.btn-vender:hover .btn-vender-icono {
  animation: vender-billete 0.6s ease-in-out;
}

html.oscuro .btn-vender {
  border-color: #93c5fd;
  background: linear-gradient(135deg, #60a5fa, #2563eb 55%, #1e40af);
  color: #fff;
  text-shadow: 0 2px 0 rgba(15, 23, 42, 0.4);
  animation-name: vender-pulso-oscuro;
}

html.oscuro .btn-vender:hover,
html.oscuro .btn-vender:focus-visible {
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.25),
    0 0 28px 6px rgba(96, 165, 250, 0.7),
    0 10px 24px rgba(0, 0, 0, 0.4);
  text-shadow: 0 0 12px rgba(191, 219, 254, 0.9);
  animation: none;
}

@keyframes vender-pulso {
  0%,
  100% {
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.2),
      0 0 0 0 rgba(253, 224, 71, 0.6);
  }
  50% {
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.2),
      0 0 18px 4px rgba(253, 224, 71, 0.55);
  }
}

@keyframes vender-pulso-oscuro {
  0%,
  100% {
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.4),
      0 0 0 0 rgba(96, 165, 250, 0.5);
  }
  50% {
    box-shadow:
      0 6px 16px rgba(0, 0, 0, 0.4),
      0 0 18px 4px rgba(96, 165, 250, 0.45);
  }
}

@keyframes vender-destello {
  to {
    transform: translateX(320%) skewX(-20deg);
  }
}

@keyframes vender-billete {
  0%,
  100% {
    transform: rotate(0);
  }
  25% {
    transform: rotate(-15deg);
  }
  75% {
    transform: rotate(15deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .btn-vender,
  html.oscuro .btn-vender,
  .btn-vender:hover::after,
  .btn-vender:hover .btn-vender-icono {
    animation: none;
  }
}
</style>
