<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Check,
  Clock,
  Cloud,
  MonitorSmartphone,
  Package,
  Receipt,
  ShieldCheck,
  Store,
  Users,
  X,
} from '@lucide/vue'
import FlujoEncabezado from './FlujoEncabezado.vue'
import PaletaIcon from './icons/PaletaIcon.vue'
import UiBadge from './ui/Badge.vue'
import UiButton from './ui/Button.vue'
import { DIAS_PRUEBA, PLANES, elegirPlan, estado, precioPlan, type CicloPago, type Plan } from '@/stores/negocio'
import { precio } from '@/lib/formato'

const emit = defineEmits(['elegido', 'volver'])

const ciclos: { id: CicloPago; etiqueta: string }[] = [
  { id: 'mensual', etiqueta: 'Mensual' },
  { id: 'anual', etiqueta: 'Anual' },
]

const ciclo = ref<CicloPago>(estado.planElegido?.ciclo ?? estado.licencia?.ciclo ?? 'mensual')
const cambiando = computed(() => Boolean(estado.sesion && estado.licencia))
const variantes = { emprendedor: 'gold', negocio: 'blue', empresarial: 'green' } as const

function limitesDe(plan: Plan) {
  const l = plan.limites
  return [
    {
      icono: Store,
      texto:
        l.sucursales === Infinity
          ? 'Sucursales ilimitadas'
          : `${l.sucursales} ${l.sucursales === 1 ? 'sucursal' : 'sucursales'}`,
    },
    { icono: Users, texto: l.usuarios === Infinity ? 'Usuarios ilimitados' : `${l.usuarios} usuarios` },
    {
      icono: Package,
      texto: l.productos === Infinity ? 'Productos ilimitados' : `${l.productos.toLocaleString('es-MX')} productos`,
    },
    {
      icono: Clock,
      texto: l.historialMeses === Infinity ? 'Historial sin límite' : `${l.historialMeses} meses de historial`,
    },
  ]
}

function elegir(plan: Plan) {
  elegirPlan(plan.id, ciclo.value)
  emit('elegido')
}

const comparativa: { etiqueta: string; valores: (string | boolean)[] }[] = [
  { etiqueta: 'Sucursales', valores: ['1', 'Hasta 3', 'Ilimitadas'] },
  { etiqueta: 'Usuarios', valores: ['2', 'Hasta 8', 'Ilimitados'] },
  { etiqueta: 'Productos', valores: ['300', '3,000', 'Ilimitados'] },
  { etiqueta: 'Historial de ventas', valores: ['3 meses', '12 meses', 'Sin límite'] },
  { etiqueta: 'Punto de venta y tickets', valores: [true, true, true] },
  { etiqueta: 'Datos en la nube y en local', valores: [true, true, true] },
  { etiqueta: 'Roles y permisos', valores: [false, true, true] },
  { etiqueta: 'Capacitación para tu equipo', valores: [false, false, true] },
  { etiqueta: 'Soporte', valores: ['Correo', 'Chat', 'Prioritario'] },
]

const incluidas = [
  { icono: MonitorSmartphone, texto: 'Web en computadora, tablet y teléfono' },
  { icono: Cloud, texto: 'Tus datos en la nube y en local' },
  { icono: Receipt, texto: 'Tickets de venta al instante' },
  { icono: ShieldCheck, texto: 'Acceso con usuario y contraseña' },
]

const preguntas = [
  {
    p: '¿Puedo cambiar de licencia después?',
    r: 'Sí. Desde "Mi licencia", dentro del sistema, subes o bajas de plan cuando lo necesites.',
  },
  {
    p: '¿Qué pasa al terminar la prueba?',
    r: `Tienes ${DIAS_PRUEBA} días para usar todo sin costo. Antes de que termine, un asesor te contacta para formalizar tu licencia.`,
  },
  {
    p: '¿Se conecta con mi banco o mi contabilidad?',
    r: 'No. iPaletitas se enfoca en productos, entradas, ventas y tickets; no se integra con bancos ni lleva contabilidad completa.',
  },
]
</script>

<template>
  <div class="ip-fondo min-h-screen w-full font-sans text-slate-900">
    <FlujoEncabezado :paso="2" @volver="$emit('volver')" />

    <main class="mx-auto w-full max-w-6xl px-6 py-14 lg:py-20">
      <section class="mx-auto max-w-2xl text-center">
        <UiBadge variant="blue" class="mb-5">
          <PaletaIcon variant="gold" :size="14" />
          {{ cambiando ? 'Cambia tu licencia' : 'Paso 2 de 3 · Tu licencia' }}
        </UiBadge>
        <h1 class="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          <span v-if="estado.sesion && !cambiando" class="block text-blue-600">
            ¡Bienvenido, {{ estado.sesion.nombre }}!
          </span>
          Elige la licencia para tu negocio
        </h1>
        <p class="mt-5 text-lg leading-8 text-slate-500">
          Todas incluyen {{ DIAS_PRUEBA }} días de prueba sin costo y acceso desde computadora, tablet y
          teléfono.
        </p>

        <div class="mt-8 inline-flex items-center gap-1 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
          <button
            v-for="op in ciclos"
            :key="op.id"
            type="button"
            :class="[
              'flex cursor-pointer items-center gap-2 rounded-xl border-0 px-5 py-2 text-sm font-semibold transition',
              ciclo === op.id ? 'bg-blue-600 text-white shadow' : 'bg-transparent text-slate-600 hover:text-blue-700',
            ]"
            @click="ciclo = op.id"
          >
            {{ op.etiqueta }}
            <span
              v-if="op.id === 'anual'"
              :class="[
                'rounded-full px-2 py-0.5 text-[11px]',
                ciclo === 'anual' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700',
              ]"
            >
              2 meses gratis
            </span>
          </button>
        </div>
      </section>

      <section class="mt-16 grid items-stretch gap-6 lg:grid-cols-3 lg:gap-8">
        <article
          v-for="plan in PLANES"
          :key="plan.id"
          :class="[
            'relative flex flex-col rounded-3xl p-8 transition duration-200',
            plan.destacado
              ? 'bg-slate-950 text-white shadow-2xl shadow-blue-600/25 lg:-my-4 lg:py-12'
              : 'bg-white/90 ring-1 ring-slate-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-600/10',
          ]"
        >
          <UiBadge
            v-if="cambiando && estado.licencia?.planId === plan.id"
            variant="blue"
            class="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white"
          >
            Tu plan actual
          </UiBadge>
          <UiBadge v-else-if="plan.destacado" variant="gold" class="absolute -top-3 left-1/2 -translate-x-1/2">
            Más elegido
          </UiBadge>

          <div class="flex items-center justify-between">
            <h2 class="text-xl font-extrabold">{{ plan.nombre }}</h2>
            <PaletaIcon :variant="variantes[plan.id]" :size="34" />
          </div>
          <p :class="['mt-2 text-sm', plan.destacado ? 'text-slate-300' : 'text-slate-500']">{{ plan.lema }}</p>

          <p class="mt-6 flex items-end gap-1.5">
            <span class="text-4xl font-extrabold tracking-tight">{{ precio(precioPlan(plan, ciclo)) }}</span>
            <span :class="['pb-1 text-sm', plan.destacado ? 'text-slate-400' : 'text-slate-500']">
              MXN / {{ ciclo === 'mensual' ? 'mes' : 'año' }}
            </span>
          </p>
          <p v-if="ciclo === 'anual'" class="mt-1 text-xs font-semibold text-emerald-500">
            Ahorras {{ precio(plan.precioMensual * 2) }} al año
          </p>

          <ul class="mt-6 grid list-none grid-cols-2 gap-3 p-0">
            <li
              v-for="limite in limitesDe(plan)"
              :key="limite.texto"
              :class="[
                'flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold',
                plan.destacado ? 'bg-white/10 text-slate-100' : 'bg-slate-50 text-slate-600',
              ]"
            >
              <component :is="limite.icono" :class="['size-4 shrink-0', plan.destacado ? 'text-amber-300' : 'text-blue-600']" />
              {{ limite.texto }}
            </li>
          </ul>

          <ul
            :class="[
              'mt-6 flex-1 list-none space-y-3 border-t p-0 pt-6',
              plan.destacado ? 'border-white/10' : 'border-slate-100',
            ]"
          >
            <li v-for="item in plan.incluye" :key="item" class="flex items-start gap-2.5 text-sm">
              <span
                :class="[
                  'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full',
                  plan.destacado ? 'bg-amber-300 text-slate-900' : 'bg-blue-600/10 text-blue-600',
                ]"
              >
                <Check class="size-3.5" />
              </span>
              <span :class="plan.destacado ? 'text-slate-200' : 'text-slate-600'">{{ item }}</span>
            </li>
          </ul>

          <UiButton
            size="lg"
            :variant="plan.destacado ? 'secondary' : 'default'"
            class="mt-8 w-full"
            @click="elegir(plan)"
          >
            {{ cambiando && estado.licencia?.planId === plan.id ? 'Renovar' : 'Elegir' }} {{ plan.nombre }}
          </UiButton>
          <p :class="['mt-3 text-center text-xs', plan.destacado ? 'text-slate-400' : 'text-slate-400']">
            {{ DIAS_PRUEBA }} días gratis · sin tarjeta
          </p>
        </article>
      </section>

      <section class="mt-16 grid gap-4 rounded-3xl bg-white/80 p-6 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="item in incluidas" :key="item.texto" class="flex items-center gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600/10 text-blue-600">
            <component :is="item.icono" class="size-5" />
          </span>
          <p class="text-sm font-semibold text-slate-700">{{ item.texto }}</p>
        </div>
      </section>

      <section class="mt-20">
        <h2 class="text-center text-3xl font-extrabold tracking-tight">Compara las licencias</h2>
        <div class="mt-8 overflow-x-auto rounded-3xl bg-white ring-1 ring-slate-200">
          <table class="ip-table">
            <thead>
              <tr>
                <th>Característica</th>
                <th v-for="plan in PLANES" :key="plan.id" class="text-center">{{ plan.nombre }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="fila in comparativa" :key="fila.etiqueta">
                <td class="font-semibold text-slate-700">{{ fila.etiqueta }}</td>
                <td v-for="(valor, i) in fila.valores" :key="i" class="text-center">
                  <Check v-if="valor === true" class="mx-auto size-5 text-emerald-500" />
                  <X v-else-if="valor === false" class="mx-auto size-5 text-slate-300" />
                  <span v-else class="font-medium">{{ valor }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="mt-20 grid gap-6 lg:grid-cols-3">
        <article v-for="item in preguntas" :key="item.p" class="rounded-3xl bg-white/80 p-7 ring-1 ring-slate-200">
          <h3 class="font-extrabold">{{ item.p }}</h3>
          <p class="mt-3 text-sm leading-6 text-slate-500">{{ item.r }}</p>
        </article>
      </section>
    </main>
  </div>
</template>
