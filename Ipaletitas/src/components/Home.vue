<script setup lang="ts">
import PaletaIcon from './icons/PaletaIcon.vue'
import ChatBot from './ChatBot.vue'
import UiButton from './ui/Button.vue'
import TemaToggle from './ui/TemaToggle.vue'
import UiBadge from './ui/Badge.vue'
import UiCard from './ui/Card.vue'
import {
  ArrowRight,
  ChevronDown,
  Cloud,
  Clock,
  MonitorSmartphone,
  Package,
  Receipt,
  Store,
  Ticket,
  Users,
} from '@lucide/vue'

defineEmits(['irLogin', 'irRegistro', 'irPlanes'])

const menu = [
  {
    etiqueta: 'Soluciones',
    opciones: [
      { titulo: 'Punto de venta', texto: 'Cobra rápido y entrega el ticket al momento.', href: '#modulos' },
      { titulo: 'Inventario y entradas', texto: 'Productos, existencias y compras al día.', href: '#modulos' },
      { titulo: 'Historial de ventas', texto: 'Consulta lo vendido cuando lo necesites.', href: '#modulos' },
      { titulo: 'Multi-sucursal', texto: 'Varios negocios o locales según tu plan.', href: '#modulos' },
    ],
  },
  {
    etiqueta: 'Recursos',
    opciones: [
      { titulo: 'Cómo empezar', texto: 'Tres pasos para arrancar tu negocio.', href: '#pasos' },
      { titulo: 'Centro de ayuda', texto: 'Guías y respuestas rápidas.', href: '#' },
      { titulo: 'Preguntas frecuentes', texto: 'Lo que más nos preguntan.', href: '#' },
      { titulo: 'Novedades', texto: 'Lo nuevo en iPaletitas.', href: '#' },
    ],
  },
]

const enlaces = ['Comunidad', 'Empresas', 'Precios', 'Seguridad']

const redes = [
  {
    nombre: 'Facebook',
    url: 'https://www.facebook.com/',
    color: '#1877F2',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    nombre: 'Instagram',
    url: 'https://www.instagram.com/',
    color: '#E4405F',
    path: '',
  },
  {
    nombre: 'WhatsApp',
    url: 'https://wa.me/',
    color: '#25D366',
    path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
  },
  {
    nombre: 'TikTok',
    url: 'https://www.tiktok.com/',
    color: '#111827',
    path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  },
  {
    nombre: 'X',
    url: 'https://x.com/',
    color: '#000000',
    path: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  },
]

const marquee = [
  'Productos',
  'Entradas',
  'Tickets',
  'Historial',
  'Usuarios',
  'Sucursales',
  'Nube + local',
  'Multiplataforma',
]

const módulos = [
  {
    título: 'Productos',
    texto: 'Altas, precios y existencias en un catálogo que se entiende al primer vistazo.',
    variant: 'blue' as const,
    icon: Package,
  },
  {
    título: 'Compras y entradas',
    texto: 'Registra mercadería que entra y mantén el inventario al día, sin hojas sueltas.',
    variant: 'gold' as const,
    icon: Store,
  },
  {
    título: 'Ventas y tickets',
    texto: 'Cobra en el mostrador y entrega el comprobante en el momento.',
    variant: 'green' as const,
    icon: Ticket,
  },
  {
    título: 'Historial',
    texto: 'Consulta ventas pasadas cuando necesites un dato, no un laberinto.',
    variant: 'blue' as const,
    icon: Clock,
  },
  {
    título: 'Usuarios y acceso',
    texto: 'Quién entra, con qué rol y desde cualquier dispositivo.',
    variant: 'gold' as const,
    icon: Users,
  },
  {
    título: 'Sucursales',
    texto: 'Varios negocios o locales, según el plan que contrates.',
    variant: 'green' as const,
    icon: Cloud,
  },
]

const pasos = [
  { n: '01', t: 'Crea la cuenta', d: 'Registro rápido para tu negocio. El acceso real llega en la siguiente etapa.' },
  { n: '02', t: 'Arma el catálogo', d: 'Productos, entradas y sucursales: la base para vender sin improvisar.' },
  { n: '03', t: 'Cobra con ticket', d: 'Cierra la venta, imprime o comparte el comprobante y revisa el historial.' },
]
</script>

<template>
  <div class="relative w-full min-h-screen overflow-x-hidden bg-[#f6f8ff] font-sans text-slate-900">
    <div class="pointer-events-none absolute inset-0 home-mesh" />
    <div class="pointer-events-none absolute inset-0 home-grid opacity-40" />

    <header
      class="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl"
    >
      <div class="page-shell flex h-[4.5rem] items-center justify-between">
        <button type="button" class="flex items-center gap-2.5 border-0 bg-transparent p-0" aria-label="iPaletitas">
          <PaletaIcon variant="blue" :size="32" />
          <span class="text-lg font-extrabold tracking-tight">iPaletitas</span>
        </button>

        <nav class="hidden items-center gap-1 xl:flex" aria-label="Principal">
          <div v-for="grupo in menu" :key="grupo.etiqueta" class="group relative">
            <button type="button" class="nav-link" aria-haspopup="true">
              {{ grupo.etiqueta }}
              <ChevronDown
                class="size-4 transition-transform duration-200 group-focus-within:rotate-180 group-hover:rotate-180"
              />
            </button>
            <div
              class="invisible absolute top-full left-1/2 w-72 -translate-x-1/2 pt-3 opacity-0 transition duration-200 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100"
            >
              <div class="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-blue-900/10">
                <a
                  v-for="opcion in grupo.opciones"
                  :key="opcion.titulo"
                  :href="opcion.href"
                  class="block rounded-xl px-3 py-2.5 transition hover:bg-blue-50"
                  @click="opcion.href === '#' && $event.preventDefault()"
                >
                  <p class="text-sm font-semibold text-slate-800">{{ opcion.titulo }}</p>
                  <p class="text-xs text-slate-500">{{ opcion.texto }}</p>
                </a>
              </div>
            </div>
          </div>
          <a
            v-for="enlace in enlaces"
            :key="enlace"
            href="#"
            class="nav-link"
            @click.prevent="enlace === 'Precios' && $emit('irPlanes')"
          >
            {{ enlace }}
          </a>
        </nav>

        <nav class="flex items-center gap-2" aria-label="Acceso">
          <TemaToggle />
          <UiButton variant="ghost" @click="$emit('irLogin')">Iniciar sesión</UiButton>
          <UiButton @click="$emit('irRegistro')">Crear cuenta</UiButton>
        </nav>
      </div>
    </header>

    <main>
      <section class="flex min-h-[calc(100svh-4.5rem)] w-full items-center justify-center py-16">
        <div class="page-shell grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <UiBadge variant="blue" class="mb-6">
            <PaletaIcon variant="gold" :size="14" />
            SaaS web · computadora, tablet y teléfono
          </UiBadge>
          <h1 class="text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.25rem]">
            El punto de venta que
            <span class="bg-gradient-to-r from-blue-600 via-blue-500 to-amber-400 bg-clip-text text-transparent">
              se siente nuevo
            </span>
            cada vez que abres.
          </h1>
          <p class="mt-6 text-lg leading-8 text-slate-500">
            iPaletitas reúne productos, entradas, tickets y sucursales en una sola plataforma.
            Rápido de usar, listo para mostrador — sin bancos, sin CRM de clientes y sin
            armarte una web a medida.
          </p>
          <div class="mt-10 flex flex-wrap items-center gap-4">
            <UiButton size="lg" class="px-8" @click="$emit('irRegistro')">
              Empezar ahora
              <ArrowRight class="size-4" />
            </UiButton>
            <UiButton variant="outline" size="lg" class="px-8" @click="$emit('irLogin')">
              Ya tengo cuenta
            </UiButton>
          </div>
          <div class="mt-10">
            <p class="text-sm font-semibold uppercase tracking-wider text-slate-400">Síguenos en redes</p>
            <div class="mt-4 flex flex-wrap items-center gap-2">
              <a
                v-for="red in redes"
                :key="red.nombre"
                :href="red.url"
                target="_blank"
                rel="noopener noreferrer"
                class="social-btn"
                :style="{ '--brand': red.color }"
                :aria-label="`iPaletitas en ${red.nombre}`"
              >
                <svg
                  v-if="red.nombre === 'Instagram'"
                  viewBox="0 0 24 24"
                  class="size-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
                  <circle cx="12" cy="12" r="4.25" />
                  <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
                </svg>
                <svg v-else viewBox="0 0 24 24" class="size-5" fill="currentColor" aria-hidden="true">
                  <path :d="red.path" />
                </svg>
                <span>{{ red.nombre }}</span>
              </a>
            </div>
          </div>
        </div>

        <div class="flex w-full flex-col gap-6">
        <div class="marquee-box relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/70 py-3.5 backdrop-blur">
          <div class="marquee flex w-max gap-10 pr-10 text-sm font-semibold tracking-wide text-slate-500">
            <span v-for="(item, i) in [...marquee, ...marquee]" :key="i" class="flex items-center gap-2">
              <PaletaIcon :variant="i % 2 ? 'gold' : 'blue'" :size="16" />
              {{ item }}
            </span>
          </div>
        </div>

        <div class="relative w-full">
          <div
            class="absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-blue-500/20 via-amber-200/30 to-emerald-300/20 blur-2xl"
            aria-hidden="true"
          />
          <UiCard class="relative w-full overflow-hidden p-7 shadow-2xl shadow-blue-600/15 sm:p-8">
            <div class="mb-6 flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3.5 text-white">
              <div class="flex items-center gap-2 font-semibold">
                <PaletaIcon variant="white" :size="26" />
                Panel de hoy
              </div>
              <UiBadge variant="outline" class="gap-1.5">
                <span class="size-1.5 animate-pulse rounded-full bg-emerald-300" />
                En vivo
              </UiBadge>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <article class="rounded-xl bg-slate-50 p-4">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ventas</p>
                <p class="mt-1 text-xl font-extrabold">$12,480</p>
                <div class="mt-3 flex h-9 items-end gap-1">
                  <span class="w-full rounded-sm bg-blue-200" style="height: 40%" />
                  <span class="w-full rounded-sm bg-blue-300" style="height: 70%" />
                  <span class="w-full rounded-sm bg-blue-400" style="height: 55%" />
                  <span class="w-full rounded-sm bg-blue-600" style="height: 90%" />
                </div>
              </article>
              <article class="rounded-xl bg-slate-50 p-4">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tickets</p>
                <p class="mt-1 text-xl font-extrabold">86</p>
                <p class="mt-3 text-xs font-medium text-emerald-600">+12 vs ayer</p>
              </article>
              <article class="rounded-xl bg-slate-50 p-4">
                <p class="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Entradas</p>
                <p class="mt-1 text-xl font-extrabold">14</p>
                <p class="mt-3 text-xs text-slate-400">Cajas recibidas</p>
              </article>
            </div>
            <div class="mt-5 divide-y divide-slate-100">
              <div class="flex items-center gap-3 py-4">
                <PaletaIcon variant="gold" :size="22" />
                <div class="min-w-0 flex-1">
                  <p class="font-semibold">Paleta de mango</p>
                  <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div class="h-full w-2/3 rounded-full bg-amber-400" />
                  </div>
                </div>
                <span class="text-xs font-semibold text-slate-400">12 uds</span>
              </div>
              <div class="flex items-center gap-3 py-4">
                <PaletaIcon variant="blue" :size="22" />
                <div class="flex-1">
                  <p class="font-semibold">Paleta de chocolate</p>
                  <p class="text-xs text-slate-400">Ticket #1042 · hace 2 min</p>
                </div>
                <UiBadge variant="blue">Cobrado</UiBadge>
              </div>
            </div>

            <div class="flex flex-wrap gap-2 border-t border-slate-100 pt-5 text-sm text-slate-500">
              <span class="rounded-full bg-slate-50 px-3.5 py-1.5 ring-1 ring-slate-200">Inventario</span>
              <span class="rounded-full bg-slate-50 px-3.5 py-1.5 ring-1 ring-slate-200">Tickets</span>
              <span class="rounded-full bg-slate-50 px-3.5 py-1.5 ring-1 ring-slate-200">Historial</span>
              <span class="rounded-full bg-slate-50 px-3.5 py-1.5 ring-1 ring-slate-200">Multi-sucursal</span>
            </div>
          </UiCard>
          <PaletaIcon class="absolute -right-3 -top-4 z-10" variant="gold" :size="46" />
          <PaletaIcon class="absolute -bottom-3 left-6 z-10" variant="blue" :size="38" />
          <PaletaIcon class="absolute -bottom-2 right-10 z-10" variant="green" :size="34" />
        </div>
        </div>
        </div>
      </section>

      <section id="modulos" class="w-full scroll-mt-24 py-24 lg:py-28">
        <div class="page-shell">
        <div class="mx-auto mb-14 max-w-3xl text-center">
          <UiBadge variant="gold" class="mb-4">Módulos del sistema</UiBadge>
          <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">No es una landing vacía: es el mapa de lo que vas a operar</h2>
          <p class="mt-4 text-lg leading-7 text-slate-500">Diseño tipo producto, pensado para que se sienta SaaS desde el primer scroll.</p>
        </div>

        <div class="grid gap-6 md:grid-cols-6">
          <UiCard class="group relative overflow-hidden p-8 md:col-span-4 md:row-span-2">
            <div class="absolute -right-8 -top-8 size-40 rounded-full bg-blue-500/10 blur-2xl transition group-hover:bg-blue-500/20" />
            <div class="relative">
              <div class="mb-4 flex items-center gap-3">
                <span class="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                  <Package class="size-5" />
                </span>
                <PaletaIcon variant="blue" :size="28" />
              </div>
              <h3 class="text-2xl font-extrabold leading-snug">Administra productos como un tablero, no como una lista</h3>
              <p class="mt-3 max-w-lg leading-7 text-slate-500">Existencias, precios y entradas en la misma vista. El mock de la derecha es solo demo; el flujo real se conecta después.</p>
              <div class="mt-8 grid gap-4 sm:grid-cols-2">
                <div class="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p class="text-xs text-slate-400">SKU · paleta</p>
                  <p class="font-semibold">Mango · $18</p>
                </div>
                <div class="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p class="text-xs text-slate-400">SKU · paleta</p>
                  <p class="font-semibold">Chocolate · $20</p>
                </div>
              </div>
            </div>
          </UiCard>

          <UiCard class="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white md:col-span-2">
            <Receipt class="mb-5 size-8 opacity-90" />
            <h3 class="text-xl font-extrabold">Ticket al instante</h3>
            <p class="mt-3 text-sm leading-6 text-blue-100">Comprobante de venta listo al cerrar el cobro. Sin contabilidad completa: solo lo que el mostrador necesita.</p>
            <PaletaIcon class="mt-8" variant="gold" :size="36" />
          </UiCard>

          <UiCard class="p-8 md:col-span-2">
            <MonitorSmartphone class="mb-5 size-7 text-blue-600" />
            <h3 class="text-lg font-extrabold">Una web, tres pantallas</h3>
            <p class="mt-3 text-sm leading-6 text-slate-500">Mostrador, tablet en piso o celular. El mismo sistema, datos en la nube y opción de trabajar en local.</p>
          </UiCard>
        </div>

        <div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <UiCard v-for="item in módulos" :key="item.título" class="group p-7 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-600/10">
            <div class="mb-4 flex items-center justify-between">
              <component :is="item.icon" class="size-5 text-blue-600" />
              <PaletaIcon :variant="item.variant" :size="26" />
            </div>
            <h3 class="font-extrabold">{{ item.título }}</h3>
            <p class="mt-2 text-sm leading-6 text-slate-500">{{ item.texto }}</p>
          </UiCard>
        </div>
        </div>
      </section>

      <section id="pasos" class="w-full scroll-mt-24 py-8">
        <div class="page-shell grid gap-6 lg:grid-cols-3 lg:gap-8">
          <article
            v-for="paso in pasos"
            :key="paso.n"
            class="relative rounded-3xl border border-slate-200/80 bg-white/70 p-8 backdrop-blur"
          >
            <p class="font-mono text-sm font-bold text-blue-600">{{ paso.n }}</p>
            <h3 class="mt-3 text-xl font-extrabold">{{ paso.t }}</h3>
            <p class="mt-3 text-sm leading-6 text-slate-500">{{ paso.d }}</p>
          </article>
        </div>
      </section>

      <section class="w-full py-20 lg:py-24">
        <div class="page-shell">
        <div class="relative overflow-hidden rounded-[2rem] bg-slate-950 px-8 py-14 text-white sm:px-14 sm:py-16">
          <div class="home-cta-glow pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-blue-500/40 blur-3xl" />
          <div class="home-cta-glow pointer-events-none absolute -bottom-24 left-10 size-64 rounded-full bg-amber-400/20 blur-3xl" />
          <div class="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div class="max-w-xl">
              <div class="mb-4 flex items-center gap-3">
                <PaletaIcon variant="gold" :size="40" />
                <PaletaIcon variant="white" :size="28" />
              </div>
              <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Llega, cobra, sigue. El home ya no se siente de plantilla.
              </h2>
              <p class="mt-3 text-slate-300">
                Crea la cuenta y entra al flujo. El panel interno con datos reales viene después;
                el diseño ya habla el idioma del producto.
              </p>
            </div>
            <UiButton size="lg" class="shrink-0 from-white to-slate-100 text-slate-900 shadow-none hover:from-amber-200 hover:to-amber-100" @click="$emit('irRegistro')">
              Crear cuenta
              <ArrowRight class="size-4" />
            </UiButton>
          </div>
        </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-slate-200 bg-white/70">
      <div class="page-shell flex flex-col items-center justify-between gap-4 py-8 text-sm text-slate-500 sm:flex-row">
        <div class="flex items-center gap-2 font-bold text-slate-800">
          <PaletaIcon variant="blue" :size="22" />
          iPaletitas
        </div>
        <p>Gestión para tu negocio · front de demostración</p>
      </div>
    </footer>

    <ChatBot @irRegistro="$emit('irRegistro')" />
  </div>
</template>

<style scoped>
.page-shell {
  box-sizing: border-box;
  width: min(1120px, calc(100% - 4rem));
  margin-left: auto;
  margin-right: auto;
}

@media (min-width: 1280px) {
  .page-shell {
    width: min(1200px, calc(100% - 8rem));
  }
}

@media (max-width: 640px) {
  .page-shell {
    width: min(1120px, calc(100% - 2rem));
  }
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border: 0;
  border-radius: 0.625rem;
  background: transparent;
  color: #334155;
  font: inherit;
  font-size: 0.925rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.nav-link:hover {
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.06);
}

.marquee-box {
  mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
}

.social-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.75rem;
  padding: 0 0.8rem;
  border-radius: 0.875rem;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: inset 0 0 0 1px #e2e8f0;
  color: #475569;
  font-size: 0.9rem;
  font-weight: 600;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.social-btn:hover {
  background: var(--brand);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -8px var(--brand);
}

.home-mesh {
  background:
    radial-gradient(900px 420px at 12% -10%, rgba(37, 99, 235, 0.18), transparent 60%),
    radial-gradient(700px 380px at 90% 8%, rgba(252, 211, 77, 0.28), transparent 55%),
    radial-gradient(600px 400px at 70% 90%, rgba(16, 185, 129, 0.1), transparent 50%);
}

.home-grid {
  background-image:
    linear-gradient(rgba(37, 99, 235, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37, 99, 235, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at 50% 0%, black 30%, transparent 75%);
}

.marquee {
  animation: marquee 28s linear infinite;
}

@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.home-cta-glow {
  animation: pulse-glow 6s ease-in-out infinite;
}

@keyframes pulse-glow {
  50% {
    opacity: 0.65;
    transform: scale(1.08);
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee,
  .home-cta-glow {
    animation: none;
  }
}
</style>
