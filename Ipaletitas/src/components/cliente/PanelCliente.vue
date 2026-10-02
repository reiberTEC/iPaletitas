<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import {
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
import Inicio from './Inicio.vue'
import PuntoVenta from './PuntoVenta.vue'
import Productos from './Productos.vue'
import Entradas from './Entradas.vue'
import Historial from './Historial.vue'
import Usuarios from './Usuarios.vue'
import Sucursales from './Sucursales.vue'
import MiLicencia from './MiLicencia.vue'
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

const emit = defineEmits(['salir', 'cambiarPlan'])

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
      { id: 'licencia', etiqueta: 'Mi licencia', icono: KeyRound, vista: MiLicencia },
    ],
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
        <UiButton variant="secondary" size="sm" class="relative mt-4 w-full" @click="emit('cambiarPlan')">
          Mejorar licencia
        </UiButton>
      </div>
    </aside>

    <div>
      <header
        class="sticky top-0 z-30 flex h-[4.5rem] items-center gap-4 border-b border-slate-200 bg-white/80 px-5 backdrop-blur-xl sm:px-8"
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

        <label class="relative hidden w-56 sm:block">
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
          <span class="grid size-10 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">
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
          <component :is="actual.vista" :key="actual.id" @ir="ir" @cambiarPlan="emit('cambiarPlan')" />
        </Transition>
      </main>
    </div>
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
</style>
