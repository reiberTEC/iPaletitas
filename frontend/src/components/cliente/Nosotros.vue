<script setup lang="ts">
import { Check, Rocket, Sparkles, Star, Target, Telescope, Trophy } from '@lucide/vue'
import paliSaludando from '@/assets/Img/pali-saludando.webp'
import UiCard from '../ui/Card.vue'

const pilares = [
  {
    icono: Target,
    titulo: 'Misión',
    texto:
      'Impulsar el crecimiento de las paleterías y neverías con herramientas digitales sencillas, accesibles y pensadas para su operación diaria.',
  },
  {
    icono: Telescope,
    titulo: 'Visión',
    texto: 'Ser la plataforma de referencia en Latinoamérica para la administración de negocios de paletas y helados artesanales.',
  },
  {
    icono: Rocket,
    titulo: 'Objetivo',
    texto:
      'Reducir el tiempo que nuestros clientes dedican a tareas administrativas para que se enfoquen en lo que mejor saben hacer: crear sabores que enamoran.',
  },
]

const diferenciadores = [
  {
    icono: Trophy,
    titulo: 'Nuestra diferencia competitiva',
    texto:
      'A diferencia de los sistemas de punto de venta genéricos, iPaletitas está diseñada para el giro: manejamos recetarios, insumos perecederos, producción por lotes y temporadas de alta demanda.',
  },
  {
    icono: Star,
    titulo: 'Nuestro distintivo en el mercado',
    texto:
      'Somos una plataforma hecha por y para paleteros: unimos la tradición artesanal con la tecnología, con una interfaz amigable y soporte cercano en español.',
  },
]

const plus = [
  'Dashboards de ventas, productos y empleados con gráficas en tiempo real.',
  'Recetario digital vinculado al inventario de insumos.',
  'Alertas de stock bajo para no quedarte sin tus sabores estrella.',
  'Control de plantilla, rotación y productividad del personal.',
  'Acceso desde cualquier dispositivo, sin instalaciones.',
]

// TODO: reemplazar por las URLs reales de las cuentas de iPaletitas
const redes = [
  {
    nombre: 'Facebook',
    url: 'https://www.facebook.com/ipaletitas',
    fondo: 'bg-[#1877f2]',
    path: 'M14 8h3V4h-3c-2.76 0-5 2.24-5 5v2H7v4h2v7h4v-7h3l1-4h-4V9c0-.55.45-1 1-1z',
  },
  {
    nombre: 'Instagram',
    url: 'https://www.instagram.com/ipaletitas',
    fondo: 'bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af]',
    path: '',
  },
  {
    nombre: 'TikTok',
    url: 'https://www.tiktok.com/@ipaletitas',
    fondo: 'bg-[#111827] ring-1 ring-white/20',
    path: 'M16 3c.3 2.4 1.8 4 4 4.3v3.2c-1.5 0-2.8-.4-4-1.2V15a6 6 0 1 1-6-6c.3 0 .7 0 1 .1v3.3a2.8 2.8 0 1 0 2 2.6V3h3z',
  },
  {
    nombre: 'WhatsApp',
    url: 'https://wa.me/520000000000',
    fondo: 'bg-[#22c55e]',
    path: '',
  },
]
</script>

<template>
  <div class="mx-auto flex max-w-6xl flex-col gap-7">
    <section
      class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-500 p-8 text-white shadow-xl shadow-blue-600/25 sm:p-12"
    >
      <img
        :src="paliSaludando"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute right-6 -bottom-2 hidden h-44 w-auto md:block"
      />
      <p class="text-sm font-semibold tracking-[0.2em] text-blue-100 uppercase">Quiénes somos</p>
      <h1 class="mt-2 text-4xl font-black tracking-tight sm:text-5xl">iPaletitas</h1>
      <p class="mt-4 max-w-2xl text-lg leading-8 text-blue-50">
        Somos una plataforma de gestión creada para paleterías y neverías. Nacimos para que los pequeños y medianos
        negocios de paletas y helados controlen sus productos, ventas y personal desde un solo lugar, sin complicaciones.
      </p>
    </section>

    <section class="grid gap-6 md:grid-cols-3">
      <UiCard v-for="pilar in pilares" :key="pilar.titulo" class="p-7">
        <span class="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <component :is="pilar.icono" class="size-6" />
        </span>
        <h2 class="mt-4 text-xl font-extrabold">{{ pilar.titulo }}</h2>
        <p class="mt-2 leading-7 text-slate-500">{{ pilar.texto }}</p>
      </UiCard>
    </section>

    <section class="grid gap-6 lg:grid-cols-2">
      <UiCard v-for="item in diferenciadores" :key="item.titulo" class="p-7">
        <span class="grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <component :is="item.icono" class="size-6" />
        </span>
        <h2 class="mt-4 text-xl font-extrabold">{{ item.titulo }}</h2>
        <p class="mt-2 leading-7 text-slate-500">{{ item.texto }}</p>
      </UiCard>
    </section>

    <UiCard class="p-7">
      <span class="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
        <Sparkles class="size-6" />
      </span>
      <h2 class="mt-4 text-xl font-extrabold">El plus que ofrece nuestra plataforma</h2>
      <ul class="mt-4 grid list-none gap-x-8 gap-y-3 p-0 md:grid-cols-2">
        <li v-for="beneficio in plus" :key="beneficio" class="flex items-start gap-3 leading-7 text-slate-600">
          <Check class="mt-1.5 size-4 shrink-0 text-blue-600" />
          {{ beneficio }}
        </li>
      </ul>
    </UiCard>

    <UiCard class="p-8 text-center sm:p-10">
      <h2 class="text-2xl font-extrabold">Síguenos en nuestras redes</h2>
      <p class="mt-1 text-slate-500">Entérate de novedades, consejos y promociones.</p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <a
          v-for="red in redes"
          :key="red.nombre"
          :href="red.url"
          target="_blank"
          rel="noopener noreferrer"
          :class="[
            'inline-flex items-center gap-2.5 rounded-full px-6 py-3 font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:shadow-lg',
            red.fondo,
          ]"
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
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          <svg
            v-else-if="red.nombre === 'WhatsApp'"
            viewBox="0 0 24 24"
            class="size-5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" />
            <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 1c-1.2-.5-2.5-1.8-3-3l1-1-1-2L9 8.5z" fill="currentColor" stroke="none" />
          </svg>
          <svg v-else viewBox="0 0 24 24" class="size-5" fill="currentColor" aria-hidden="true">
            <path :d="red.path" />
          </svg>
          {{ red.nombre }}
        </a>
      </div>
    </UiCard>
  </div>
</template>
