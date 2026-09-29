<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { Clock, KeyRound, LayoutDashboard, LogOut, Menu, ScrollText, Sparkles, Store, Wallet, X } from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import UiButton from '../ui/Button.vue'
import Resumen from './Resumen.vue'
import Cuentas from './Cuentas.vue'
import Licencias from './Licencias.vue'
import Cobranza from './Cobranza.vue'
import PlanesAdmin from './PlanesAdmin.vue'
import Bitacora from './Bitacora.vue'
import DetalleCuenta from './DetalleCuenta.vue'
import type { SeccionAdmin } from './secciones'
import { estado, metricas } from '@/stores/admin'
import { iniciales } from '@/lib/formato'

const emit = defineEmits(['salir'])

interface Pestana {
  id: SeccionAdmin
  etiqueta: string
  icono: Component
  vista: Component
  aviso?: () => number
}

const pestanas: Pestana[] = [
  { id: 'resumen', etiqueta: 'Resumen', icono: LayoutDashboard, vista: Resumen },
  { id: 'cuentas', etiqueta: 'Cuentas cliente', icono: Store, vista: Cuentas },
  { id: 'licencias', etiqueta: 'Licencias', icono: KeyRound, vista: Licencias, aviso: () => metricas.value.porVencer.length },
  { id: 'cobranza', etiqueta: 'Cobranza', icono: Wallet, vista: Cobranza, aviso: () => metricas.value.vencidos },
  { id: 'planes', etiqueta: 'Planes', icono: Sparkles, vista: PlanesAdmin },
  { id: 'bitacora', etiqueta: 'Bitácora', icono: ScrollText, vista: Bitacora },
]

const activa = ref<SeccionAdmin>('resumen')
const menuAbierto = ref(false)
const cuentaAbierta = ref<string | null>(null)

const actual = computed(() => pestanas.find((p) => p.id === activa.value) ?? pestanas[0]!)

const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
const ahora = hoy.charAt(0).toUpperCase() + hoy.slice(1)

function ir(seccion: SeccionAdmin) {
  activa.value = seccion
  menuAbierto.value = false
  window.scrollTo({ top: 0, behavior: 'instant' })
}
</script>

<template>
  <div class="min-h-screen w-full bg-slate-100 font-sans text-slate-900">
    <div v-if="menuAbierto" class="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" @click="menuAbierto = false" />

    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-slate-300 transition-transform duration-300 lg:translate-x-0',
        menuAbierto ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <div class="flex h-[4.5rem] shrink-0 items-center justify-between px-6">
        <div class="flex items-center gap-2.5">
          <PaletaIcon variant="gold" :size="30" />
          <div class="leading-tight">
            <p class="text-lg font-extrabold text-white"><span class="text-amber-300">i</span>Paletitas</p>
            <p class="text-[10px] font-bold tracking-[0.2em] text-amber-300/80 uppercase">Consola admin</p>
          </div>
        </div>
        <button
          type="button"
          class="grid size-9 cursor-pointer place-items-center rounded-xl border-0 bg-transparent text-slate-400 hover:bg-white/10 lg:hidden"
          aria-label="Cerrar menú"
          @click="menuAbierto = false"
        >
          <X class="size-5" />
        </button>
      </div>

      <nav class="mt-4 flex-1 overflow-y-auto px-4" aria-label="Secciones de administración">
        <p class="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">Plataforma</p>
        <button
          v-for="pestana in pestanas"
          :key="pestana.id"
          type="button"
          :class="[
            'mb-1 flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-3 py-2.5 text-sm font-semibold transition',
            activa === pestana.id ? 'bg-white text-slate-950' : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-white',
          ]"
          :aria-current="activa === pestana.id ? 'page' : undefined"
          @click="ir(pestana.id)"
        >
          <component :is="pestana.icono" class="size-5" />
          <span class="flex-1 text-left">{{ pestana.etiqueta }}</span>
          <span
            v-if="pestana.aviso && pestana.aviso() > 0"
            class="grid min-w-5 place-items-center rounded-full bg-amber-300 px-1.5 text-[11px] font-bold text-slate-950"
          >
            {{ pestana.aviso() }}
          </span>
        </button>
      </nav>

      <div class="m-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
        <p class="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Clock class="size-3.5" />
          <span>{{ ahora }}</span>
        </p>
        <p class="mt-2 text-sm text-slate-300">
          <strong class="text-white">{{ metricas.total }}</strong> cuentas ·
          <strong class="text-white">{{ metricas.porEstado.Prueba }}</strong> en prueba
        </p>
      </div>
    </aside>

    <div class="lg:pl-72">
      <header class="sticky top-0 z-30 flex h-[4.5rem] items-center gap-4 border-b border-slate-200 bg-white/85 px-5 backdrop-blur-xl sm:px-8">
        <button
          type="button"
          class="grid size-10 cursor-pointer place-items-center rounded-xl border-0 bg-transparent text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Abrir menú"
          @click="menuAbierto = true"
        >
          <Menu class="size-5" />
        </button>
        <div class="min-w-0 flex-1">
          <p class="text-xs font-semibold text-slate-400">Administración de iPaletitas</p>
          <h2 class="truncate text-lg font-extrabold">{{ actual.etiqueta }}</h2>
        </div>
        <div class="flex items-center gap-3">
          <span class="grid size-10 place-items-center rounded-full bg-amber-300 text-sm font-extrabold text-slate-950">
            {{ iniciales(estado.sesion?.nombre ?? 'A') }}
          </span>
          <div class="hidden leading-tight md:block">
            <p class="text-sm font-bold">{{ estado.sesion?.nombre }}</p>
            <p class="text-xs text-slate-400">Administrador de plataforma</p>
          </div>
          <UiButton variant="ghost" size="sm" @click="emit('salir')">
            <LogOut class="size-4" />
            <span class="hidden sm:inline">Salir</span>
          </UiButton>
        </div>
      </header>

      <main class="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <component :is="actual.vista" :key="actual.id" @ir="ir" @verCuenta="(id: string) => (cuentaAbierta = id)" />
      </main>
    </div>

    <DetalleCuenta v-if="cuentaAbierta" :id="cuentaAbierta" @cerrar="cuentaAbierta = null" />
  </div>
</template>
