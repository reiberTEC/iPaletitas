<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect, type Component } from 'vue'
import {
  Banknote,
  CircleQuestionMark,
  CreditCard,
  Info,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  CalendarClock,
  Package,
  PackagePlus,
  Palette,
  ReceiptText,
  Store,
  TrendingUp,
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
import Caducados from './Caducados.vue'
import Historial from './Historial.vue'
import Ganancias from './Ganancias.vue'
import Usuarios from './Usuarios.vue'
import Sucursales from './Sucursales.vue'
import MiMarca from './MiMarca.vue'
import MiLicencia from './MiLicencia.vue'
import Suscripciones from './Suscripciones.vue'
import Nosotros from './Nosotros.vue'
import AvisoCobro from './AvisoCobro.vue'
import Tutorial from './Tutorial.vue'
import Ayuda from './Ayuda.vue'
import { puedeVer, type Seccion } from './secciones'
import type { Accion, DatosPanel } from '@/lib/asistente'
import { pasosTutorial, type PasoTutorial } from './tutorial'
import {
  DIAS_PRUEBA,
  semanaGratis,
  accesoRevocado,
  agotados,
  caducados,
  cambiarSucursal,
  diasRestantes,
  enPrueba,
  estado,
  plazoDeCobro,
  planActual,
  porAcabarse,
  porCaducar,
  puede,
  sesionEsTitular,
  sucursalActiva,
  sucursalFija,
  terminarTutorial,
  usuarioActual,
} from '@/stores/negocio'
import { iniciales, plural } from '@/lib/formato'
import { aplicarAmbiente, aplicarMarca, logoEsClaro } from '@/lib/marca'

const emit = defineEmits(['salir'])

interface Pestana {
  id: Seccion
  etiqueta: string
  icono: Component
  vista: Component
}

const puntoDeVenta: Pestana = { id: 'venta', etiqueta: 'Punto de venta', icono: Banknote, vista: PuntoVenta }

const grupos: { titulo: string; pestanas: Pestana[] }[] = [
  {
    titulo: 'Operación',
    pestanas: [
      { id: 'inicio', etiqueta: 'Inicio', icono: LayoutDashboard, vista: Inicio },
      { id: 'productos', etiqueta: 'Productos', icono: Package, vista: Productos },
      { id: 'entradas', etiqueta: 'Entradas', icono: PackagePlus, vista: Entradas },
      { id: 'caducados', etiqueta: 'Caducados', icono: CalendarClock, vista: Caducados },
      { id: 'historial', etiqueta: 'Historial de ventas', icono: ReceiptText, vista: Historial },
      { id: 'ganancias', etiqueta: 'Ganancias', icono: TrendingUp, vista: Ganancias },
    ],
  },
  {
    titulo: 'Administración',
    pestanas: [
      { id: 'usuarios', etiqueta: 'Usuarios', icono: Users, vista: Usuarios },
      { id: 'sucursales', etiqueta: 'Sucursales', icono: Store, vista: Sucursales },
      { id: 'marca', etiqueta: 'Mi marca', icono: Palette, vista: MiMarca },
      { id: 'suscripciones', etiqueta: 'Suscripciones', icono: CreditCard, vista: Suscripciones },
      { id: 'licencia', etiqueta: 'Mi licencia', icono: KeyRound, vista: MiLicencia },
    ],
  },
  {
    titulo: 'iPaletitas',
    pestanas: [{ id: 'nosotros', etiqueta: 'Nosotros', icono: Info, vista: Nosotros }],
  },
]

const gruposVisibles = computed(() =>
  grupos
    .map((g) => ({ ...g, pestanas: g.pestanas.filter((p) => puedeVer(p.id)) }))
    .filter((g) => g.pestanas.length),
)

const puedeVender = computed(() => puedeVer('venta'))
const alertasStock = computed(() =>
  puedeVer('productos') ? agotados.value.length + porAcabarse.value.length : 0,
)
const alertasCaducidad = computed(() =>
  puedeVer('caducados') ? caducados.value.length + porCaducar.value.length : 0,
)
const descripcionSesion = computed(() =>
  sesionEsTitular.value
    ? 'Titular de la cuenta'
    : `${usuarioActual.value?.puesto ?? ''} · ${usuarioActual.value?.rol ?? ''}`,
)

const activa = ref<Seccion>('inicio')
const menuAbierto = ref(false)

/* En pantallas grandes el menú queda fijo; en celular y tableta es un cajón. */
const consultaFija = window.matchMedia('(min-width: 1024px)')
const menuFijo = ref(consultaFija.matches)
const alCambiarAncho = (e: MediaQueryListEvent) => {
  menuFijo.value = e.matches
  if (e.matches) menuAbierto.value = false
}
const menuVisible = computed(() => menuFijo.value || menuAbierto.value)

const actual = computed(
  () =>
    [puntoDeVenta, ...grupos.flatMap((g) => g.pestanas)].find((p) => p.id === activa.value) ??
    grupos[0]!.pestanas[0]!,
)

// Si le quitan permisos a la sesión mientras está en una sección, regresa a Inicio.
watch(
  () => puedeVer(activa.value),
  (permitida) => {
    if (!permitida) activa.value = 'inicio'
  },
)

watchEffect(() => {
  if (accesoRevocado.value) emit('salir')
})

// El color y el ambiente del negocio pintan toda la página (panel, modales y ticket).
watch(() => estado.marca?.color, (color) => aplicarMarca(color), { immediate: true })
watch(() => estado.marca?.ambiente, (ambiente) => aplicarAmbiente(ambiente), { immediate: true })

function ir(seccion: Seccion) {
  if (!puedeVer(seccion)) return
  activa.value = seccion
  menuAbierto.value = false
  window.scrollTo({ top: 0, behavior: 'instant' })
}

/* ---------- Estación activa: la marca se desliza por la línea hasta la sección elegida ---------- */
const linea = ref<HTMLElement | null>(null)
const estaciones = new Map<Seccion, HTMLElement>()
const marcador = ref<{ y: number; visible: boolean }>({ y: 0, visible: false })
const marcadorListo = ref(false)

function registrarEstacion(id: Seccion, el: unknown) {
  if (el instanceof HTMLElement) estaciones.set(id, el)
  else estaciones.delete(id)
}

function medirMarcador() {
  const boton = estaciones.get(activa.value)
  if (!boton || !linea.value) {
    marcador.value = { ...marcador.value, visible: false }
    return
  }
  const parada = boton.querySelector<HTMLElement>('[data-parada]')
  const caja = linea.value.getBoundingClientRect()
  const destino = (parada ?? boton).getBoundingClientRect()
  marcador.value = { y: destino.top - caja.top + linea.value.scrollTop, visible: true }
}

watch([activa, gruposVisibles, menuVisible], async () => {
  await nextTick()
  medirMarcador()
})

let observador: ResizeObserver | null = null

const transicion = ref<InstanceType<typeof TransicionBillete> | null>(null)
let vendiendo = false

async function irAVender() {
  if (vendiendo || !puedeVender.value) return
  menuAbierto.value = false

  // Si ya estás en caja, no repite la animación; si prefieres menos movimiento, salta al POS.
  const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (sinAnimacion || !transicion.value || activa.value === 'venta') {
    ir('venta')
    return
  }

  vendiendo = true
  try {
    await transicion.value.cubrir()
    ir('venta')
    await new Promise((resolve) => setTimeout(resolve, 60))
    await transicion.value.descubrir()
  } finally {
    vendiendo = false
  }
}

/* ---------- Recorrido guiado ---------- */
const pasosRecorrido = ref<PasoTutorial[] | null>(null)

function abrirTutorial() {
  ayudaAbierta.value = false
  pasosRecorrido.value = pasosTutorial()
}

function alCambiarPaso(paso: PasoTutorial) {
  if (paso.seccion && puedeVer(paso.seccion)) activa.value = paso.seccion
  menuAbierto.value = Boolean(paso.enMenu) && !menuFijo.value
}

function cerrarTutorial() {
  pasosRecorrido.value = null
  menuAbierto.value = false
  void terminarTutorial()
}

function venderDesdeTutorial() {
  cerrarTutorial()
  irAVender()
}

/* ---------- Ayuda: asistente y acceso al recorrido ---------- */
const ayudaAbierta = ref(false)
const botonAyuda = ref<HTMLButtonElement | null>(null)

async function cerrarAyuda() {
  if (!ayudaAbierta.value) return
  ayudaAbierta.value = false
  await nextTick()
  if (!pasosRecorrido.value) botonAyuda.value?.focus()
}

function alAccionAyuda(accion: Accion) {
  if (accion === 'recorrido') return abrirTutorial()
  // En escritorio la ayuda se queda abierta junto a la sección; en pantallas chicas la taparía.
  if (!menuFijo.value) ayudaAbierta.value = false
  if (accion === 'vender') irAVender()
  else if (accion.startsWith('ir:')) ir(accion.slice(3) as Seccion)
}

function datosAyuda(): DatosPanel {
  const licencia = estado.licencia
  return {
    negocio: licencia?.negocio ?? '',
    seccion: actual.value.etiqueta,
    plan: planActual.value?.nombre ?? '',
    estadoLicencia: plazoDeCobro.value
      ? 'pago pendiente'
      : semanaGratis.value
        ? 'semana gratis'
        : enPrueba.value
          ? 'prueba gratis'
          : 'suscripción activa',
    rol: sesionEsTitular.value ? 'titular de la cuenta' : (usuarioActual.value?.rol ?? 'empleado'),
    secciones: [puntoDeVenta, ...grupos.flatMap((g) => g.pestanas)].filter((p) => puedeVer(p.id)).map((p) => p.etiqueta),
    productos: estado.productos.length,
    avisosInventario: alertasStock.value,
  }
}

function alCambiarSucursal(evento: Event) {
  void cambiarSucursal((evento.target as HTMLSelectElement).value)
}

const botonMenu = ref<HTMLButtonElement | null>(null)
const botonCerrar = ref<HTMLButtonElement | null>(null)

// Con el cajón abierto la página de atrás no se desplaza, y el foco entra y regresa con él.
watch(
  () => menuAbierto.value && !menuFijo.value,
  async (cajon, antes) => {
    document.documentElement.style.setProperty('overflow', cajon ? 'hidden' : '')
    await nextTick()
    if (cajon) botonCerrar.value?.focus()
    else if (antes) botonMenu.value?.focus()
  },
)

function alPresionarTecla(evento: KeyboardEvent) {
  if (evento.key === 'Escape') menuAbierto.value = false
}

onMounted(async () => {
  window.addEventListener('keydown', alPresionarTecla)
  consultaFija.addEventListener('change', alCambiarAncho)
  await nextTick()
  medirMarcador()
  if (linea.value) {
    observador = new ResizeObserver(medirMarcador)
    observador.observe(linea.value)
  }
  await document.fonts?.ready
  medirMarcador()
  requestAnimationFrame(() => (marcadorListo.value = true))
  if (estado.tutorialPendiente && sesionEsTitular.value) abrirTutorial()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', alPresionarTecla)
  consultaFija.removeEventListener('change', alCambiarAncho)
  observador?.disconnect()
  document.documentElement.style.removeProperty('overflow')
  aplicarMarca(null)
  aplicarAmbiente('clasico')
})
</script>

<template>
  <div class="panel min-h-dvh w-full font-sans text-slate-900">
    <Transition name="velo">
      <div v-if="menuAbierto && !menuFijo" class="fixed inset-0 z-40 bg-slate-950/45" @click="menuAbierto = false" />
    </Transition>

    <aside
      :class="['riel fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r', { abierto: menuVisible }]"
      :aria-hidden="!menuVisible"
      :inert="!menuVisible"
    >
      <div class="flex items-center gap-3 px-5 pt-5 pb-3">
        <span class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-600 text-sm font-bold text-white">
          <img
            v-if="estado.marca?.logo"
            :src="estado.marca.logo"
            alt=""
            :class="['size-full object-contain p-1', !logoEsClaro(estado.marca.logo) && 'bg-[#fff] ring-1 ring-slate-200 ring-inset']"
          />
          <template v-else>{{ iniciales(estado.licencia?.negocio ?? 'N') }}</template>
        </span>
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 leading-tight font-bold [overflow-wrap:anywhere]" :title="estado.licencia?.negocio">
            {{ estado.licencia?.negocio }}
          </p>
          <p class="truncate text-xs text-slate-500">{{ estado.licencia?.giro }}</p>
        </div>
        <button
          v-if="!menuFijo"
          ref="botonCerrar"
          type="button"
          class="ip-boton grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl border-0 bg-transparent text-slate-500 hover:bg-slate-100"
          aria-label="Cerrar menú"
          @click="menuAbierto = false"
        >
          <X class="size-5" />
        </button>
      </div>

      <label class="relative mx-4 mb-3 block" data-tour="sucursal">
        <span class="sr-only">Sucursal activa</span>
        <Store class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <select
          class="ip-input ip-input-icono min-h-10 cursor-pointer py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          :value="sucursalActiva?.id"
          :disabled="sucursalFija"
          :title="sucursalFija ? 'Solo un administrador puede cambiar de sucursal' : undefined"
          @change="alCambiarSucursal"
        >
          <option v-for="sucursal in estado.sucursales" :key="sucursal.id" :value="sucursal.id">
            {{ sucursal.nombre }}
          </option>
        </select>
      </label>

      <div v-if="puedeVender" class="px-4">
        <button
          type="button"
          :class="['btn-vender ip-boton', { activo: activa === 'venta' }]"
          :aria-current="activa === 'venta' ? 'page' : undefined"
          data-tour="vender"
          @click="irAVender"
        >
          <Banknote class="size-5" aria-hidden="true" />
          Punto de venta
        </button>
      </div>

      <nav
        ref="linea"
        class="linea relative flex-1 overflow-y-auto overscroll-contain px-4 pt-2 pb-4"
        aria-label="Secciones del sistema"
        data-tour="menu"
      >
        <span
          :class="['marcador', { listo: marcadorListo, visible: marcador.visible }]"
          :style="{ transform: `translateY(${marcador.y}px)` }"
          aria-hidden="true"
        />
        <div v-for="grupo in gruposVisibles" :key="grupo.titulo" class="tramo">
          <p class="pt-5 pb-1.5 pl-12 text-xs font-semibold text-slate-500">{{ grupo.titulo }}</p>
          <button
            v-for="pestana in grupo.pestanas"
            :key="pestana.id"
            :ref="(el) => registrarEstacion(pestana.id, el)"
            type="button"
            :class="['estacion ip-boton', { activa: activa === pestana.id }]"
            :aria-current="activa === pestana.id ? 'page' : undefined"
            :data-tour="`estacion-${pestana.id}`"
            @click="ir(pestana.id)"
          >
            <span class="parada" data-parada>
              <component :is="pestana.icono" class="size-4" />
            </span>
            <span class="truncate">{{ pestana.etiqueta }}</span>
            <span
              v-if="pestana.id === 'productos' && alertasStock"
              :class="[
                'ml-auto grid min-w-5 shrink-0 place-items-center rounded-md px-1.5 text-[11px] leading-5 font-bold tabular-nums text-white',
                agotados.length ? 'bg-rose-600' : 'bg-orange-700',
              ]"
              :title="`${agotados.length} agotados · ${porAcabarse.length} por acabarse`"
            >
              {{ alertasStock }}
            </span>
            <span
              v-else-if="pestana.id === 'caducados' && alertasCaducidad"
              :class="[
                'ml-auto grid min-w-5 shrink-0 place-items-center rounded-md px-1.5 text-[11px] leading-5 font-bold tabular-nums text-white',
                caducados.length ? 'bg-rose-600' : 'bg-orange-700',
              ]"
              :title="`${caducados.length} caducados · ${porCaducar.length} por caducar`"
            >
              {{ alertasCaducidad }}
            </span>
          </button>
        </div>
      </nav>

      <div class="border-t border-slate-100 px-5 py-4">
        <div class="flex items-center justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-bold">Plan {{ planActual?.nombre }}</p>
            <template v-if="plazoDeCobro">
              <p class="text-xs font-semibold text-orange-700">Pago pendiente</p>
              <p class="text-xs text-orange-700 tabular-nums">{{ plural(plazoDeCobro.dias, 'día', 'días') }} para pagar</p>
            </template>
            <template v-else>
              <p class="text-xs text-slate-500 tabular-nums">{{ enPrueba ? 'Prueba gratis' : semanaGratis ? 'Semana gratis' : 'Suscripción activa' }}</p>
              <p class="text-xs text-slate-500 tabular-nums">
                {{ plural(diasRestantes, 'día', 'días') }}
                {{ enPrueba ? (diasRestantes === 1 ? 'restante' : 'restantes') : 'para renovar' }}
              </p>
            </template>
          </div>
          <UiButton v-if="puede('licencia.editar')" variant="outline" size="sm" @click="ir('suscripciones')">
            Mejorar
          </UiButton>
        </div>
        <div v-if="enPrueba && !plazoDeCobro" class="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full bg-blue-600"
            :style="{ width: `${Math.min(100, (diasRestantes / DIAS_PRUEBA) * 100)}%` }"
          />
        </div>
        <p class="mt-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <PaletaIcon variant="blue" :size="16" />
          Con la tecnología de iPaletitas
        </p>
      </div>
    </aside>

    <div class="lg:pl-72">
      <header class="encabezado sticky top-0 z-30 border-b border-slate-200/80">
        <div class="flex h-16 items-center gap-3 px-4 sm:gap-4 sm:px-8">
          <button
            v-if="!menuFijo"
            type="button"
            class="ip-boton relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border-0 bg-transparent text-slate-600 hover:bg-slate-100"
            :aria-label="alertasStock ? `Abrir menú (${alertasStock} avisos de inventario)` : 'Abrir menú'"
            ref="botonMenu"
            :aria-expanded="menuAbierto"
            @click="menuAbierto = true"
          >
            <Menu class="size-5" />
            <span
              v-if="alertasStock"
              :class="[
                'absolute top-1.5 right-1.5 size-2.5 rounded-full ring-2 ring-white',
                agotados.length ? 'bg-rose-500' : 'bg-orange-500',
              ]"
              aria-hidden="true"
            />
          </button>

          <span class="hidden shrink-0 sm:block" aria-hidden="true">
            <span class="ip-picto size-9">
              <component :is="actual.icono" class="size-[1.15rem]" />
            </span>
          </span>
          <h2 class="font-display min-w-0 flex-1 truncate text-base font-semibold sm:text-lg">{{ actual.etiqueta }}</h2>

          <button
            v-if="puedeVender && activa !== 'venta' && !menuFijo"
            type="button"
            class="btn-vender btn-vender-chico ip-boton"
            aria-label="Punto de venta"
            @click="irAVender"
          >
            <Banknote class="size-5" aria-hidden="true" />
            <span class="hidden md:inline">Punto de venta</span>
          </button>

          <div class="flex items-center gap-2 sm:gap-3">
            <button
              ref="botonAyuda"
              type="button"
              :class="[
                'ip-boton grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border-0 text-slate-600 hover:bg-slate-100',
                ayudaAbierta ? 'bg-slate-100' : 'bg-transparent',
              ]"
              aria-label="Ayuda"
              title="Ayuda"
              :aria-expanded="ayudaAbierta"
              data-tour="ayuda"
              data-ayuda-boton
              @click="ayudaAbierta ? cerrarAyuda() : (ayudaAbierta = true)"
            >
              <CircleQuestionMark class="size-5" />
            </button>
            <TemaToggle />
            <span class="hidden size-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white sm:grid">
              {{ iniciales(estado.sesion?.nombre ?? 'A') }}
            </span>
            <div class="hidden leading-tight md:block">
              <p class="text-sm font-bold">{{ estado.sesion?.nombre }}</p>
              <p class="text-xs text-slate-500">{{ descripcionSesion }}</p>
            </div>
            <UiButton variant="ghost" size="sm" @click="emit('salir')">
              <LogOut class="size-4" />
              <span class="hidden sm:inline">Salir</span>
            </UiButton>
          </div>
        </div>
      </header>

      <main class="contenido mx-auto w-full max-w-7xl px-4 py-7 sm:px-8 lg:py-10">
        <AvisoCobro />
        <Transition name="seccion" mode="out-in">
          <component :is="actual.vista" :key="actual.id" @ir="ir" @cambiarPlan="ir('suscripciones')" />
        </Transition>
      </main>
    </div>

    <TransicionBillete ref="transicion" />
    <Transition name="ayuda">
      <Ayuda v-if="ayudaAbierta" :datos-panel="datosAyuda" @cerrar="cerrarAyuda" @accion="alAccionAyuda" />
    </Transition>
    <Tutorial
      v-if="pasosRecorrido"
      :pasos="pasosRecorrido"
      @cambio="alCambiarPaso"
      @cerrar="cerrarTutorial"
      @vender="venderDesdeTutorial"
    />
  </div>
</template>

<style scoped>
.panel {
  background-color: var(--panel-fondo, #f8fafc);
  transition: background-color 420ms var(--ease-out);
}

:global(html[data-ambiente='vivo']) .panel {
  background-image:
    radial-gradient(
      920px 440px at 100% -8%,
      color-mix(in oklab, var(--marca-200) 58%, transparent),
      transparent 72%
    ),
    radial-gradient(
      720px 400px at -8% 28%,
      color-mix(in oklab, var(--marca-100) 75%, transparent),
      transparent 68%
    );
}

/* ---------- Cajón (celular y tableta) y riel fijo (escritorio) ---------- */
.riel {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  transform: translateX(-100%);
  background: var(--riel-fondo, #fff);
  border-color: var(--riel-borde, #e2e8f0);
  transition:
    transform 280ms var(--ease-drawer),
    background-color 420ms var(--ease-out),
    border-color 420ms var(--ease-out);
}

.riel.abierto {
  transform: translateX(0);
  box-shadow: 0 24px 48px -12px rgb(15 23 42 / 0.25);
}

@media (min-width: 1024px) {
  .riel,
  .riel.abierto {
    transform: none;
    box-shadow: none;
    transition: none;
  }
}

.velo-enter-active,
.velo-leave-active {
  transition: opacity 280ms var(--ease-out);
}

.velo-enter-from,
.velo-leave-to {
  opacity: 0;
}

.encabezado {
  padding-top: env(safe-area-inset-top);
  background: color-mix(in oklab, var(--encabezado-fondo, #fff) 88%, transparent);
  backdrop-filter: blur(10px);
  transition: background-color 420ms var(--ease-out);
}

.contenido {
  padding-bottom: max(1.75rem, env(safe-area-inset-bottom));
}

/* ---------- Cambio de sección ---------- */
.seccion-enter-active {
  transition:
    opacity 180ms var(--ease-out),
    transform 180ms var(--ease-out);
}

.seccion-leave-active {
  transition: opacity 100ms ease;
}

.seccion-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.seccion-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .seccion-enter-from {
    transform: none;
  }
}

/* ---------- Ayuda ---------- */
.ayuda-enter-active {
  transition:
    opacity 200ms var(--ease-out),
    transform 200ms var(--ease-out);
}

.ayuda-leave-active {
  transition:
    opacity 150ms var(--ease-out),
    transform 150ms var(--ease-out);
}

.ayuda-enter-from,
.ayuda-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

@media (max-width: 639px) {
  .ayuda-enter-from,
  .ayuda-leave-to {
    transform: translateY(12px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ayuda-enter-from,
  .ayuda-leave-to {
    transform: none;
  }
}

/* ---------- Línea de metro: cada sección es una estación ---------- */
.linea {
  --parada: 2rem;
  --eje: calc(1rem + var(--parada) / 2);
}

.tramo {
  position: relative;
}

/* El trazo de la línea corre detrás de las estaciones de cada tramo */
.tramo::before {
  content: '';
  position: absolute;
  top: calc(2.6rem + var(--parada) / 2);
  bottom: calc(0.25rem + var(--parada) / 2);
  left: calc(var(--parada) / 2 - 1.5px);
  width: 3px;
  border-radius: 2px;
  background: var(--marca-200);
}

.estacion {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.85rem;
  padding: 0.3rem 0.5rem 0.3rem 0;
  border: 0;
  border-radius: 0.75rem;
  background: transparent;
  color: #475569;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.parada {
  position: relative;
  z-index: 2;
  display: grid;
  width: var(--parada);
  height: var(--parada);
  flex-shrink: 0;
  place-items: center;
  border-radius: 0.6rem;
  background: #fff;
  box-shadow: inset 0 0 0 2px var(--marca-300);
  color: var(--marca-700);
  transition:
    background-color 200ms ease,
    box-shadow 200ms ease,
    color 200ms ease;
}

.estacion.activa {
  color: #0f172a;
}

.estacion.activa .parada {
  background: transparent;
  box-shadow: none;
  color: #fff;
}

@media (hover: hover) and (pointer: fine) {
  .estacion:not(.activa):hover {
    color: #0f172a;
  }

  .estacion:not(.activa):hover .parada {
    box-shadow: inset 0 0 0 2px var(--marca-600);
  }
}

/* La estación llena que viaja por la línea */
.marcador {
  position: absolute;
  top: 0;
  left: 1rem;
  z-index: 1;
  width: var(--parada);
  height: var(--parada);
  border-radius: 0.6rem;
  background: var(--marca-600);
  opacity: 0;
  pointer-events: none;
}

.marcador.visible {
  opacity: 1;
}

.marcador.listo {
  transition:
    transform 200ms var(--ease-in-out),
    opacity 150ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .marcador.listo {
    transition: opacity 150ms ease;
  }

  .riel {
    transition: none;
  }
}

/* ---------- Punto de venta: la terminal, en el color del negocio ---------- */
.btn-vender {
  display: flex;
  width: 100%;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.7rem 1rem;
  border: 0;
  border-radius: 0.875rem;
  background: var(--marca-600);
  color: #fff;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

@media (hover: hover) and (pointer: fine) {
  .btn-vender:hover {
    background: var(--marca-700);
  }
}

.btn-vender.activo {
  background: var(--marca-800);
  box-shadow: inset 0 0 0 2px var(--marca-400);
}

.btn-vender-chico {
  width: auto;
  min-height: 2.5rem;
  flex-shrink: 0;
  padding: 0.5rem 0.85rem;
  font-size: 0.85rem;
}

/* ---------- Modo oscuro ---------- */
html.oscuro .tramo::before {
  background: color-mix(in oklab, var(--marca-700) 70%, #131a26);
}

html.oscuro .estacion {
  color: #a3b1c6;
}

html.oscuro .estacion.activa,
html.oscuro .estacion:not(.activa):hover {
  color: #f1f5f9;
}

html.oscuro .parada {
  background: #131a26;
  box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--marca-500) 70%, #131a26);
  color: var(--marca-300);
}

html.oscuro .estacion.activa .parada {
  background: transparent;
  box-shadow: none;
  color: #fff;
}

html.oscuro .marcador {
  background: var(--marca-500);
}
</style>
