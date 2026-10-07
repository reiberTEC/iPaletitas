<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Cloud, MonitorSmartphone, Receipt, ShieldCheck, X } from '@lucide/vue'
import FlujoEncabezado from './FlujoEncabezado.vue'
import PaletaIcon from './icons/PaletaIcon.vue'
import TarjetaPlan from './planes/TarjetaPlan.vue'
import SelectorCiclo from './planes/SelectorCiclo.vue'
import UiBadge from './ui/Badge.vue'
import { DIAS_PRUEBA, PLANES, acentoPlan, elegirPlan, estado, type CicloPago, type Plan } from '@/stores/negocio'
import { tema } from '@/lib/tema'

const emit = defineEmits(['elegido', 'volver'])

const ciclo = ref<CicloPago>(estado.planElegido?.ciclo ?? estado.licencia?.ciclo ?? 'mensual')
const cambiando = computed(() => Boolean(estado.sesion && estado.licencia))

function elegir(plan: Plan) {
  elegirPlan(plan.id, ciclo.value)
  emit('elegido')
}

const cantidad = (valor: number, singular: string, plural: string) =>
  valor === Infinity ? 'Ilimitados' : valor === 1 ? `1 ${singular}` : `${valor.toLocaleString('es-MX')} ${plural}`

const comparativa = computed<{ etiqueta: string; valores: (string | boolean)[] }[]>(() => [
  { etiqueta: 'Sucursales', valores: PLANES.map((p) => cantidad(p.limites.sucursales, 'sucursal', 'sucursales')) },
  { etiqueta: 'Usuarios', valores: PLANES.map((p) => cantidad(p.limites.usuarios, 'usuario', 'usuarios')) },
  { etiqueta: 'Productos', valores: PLANES.map((p) => cantidad(p.limites.productos, 'producto', 'productos')) },
  {
    etiqueta: 'Historial de ventas',
    valores: PLANES.map((p) => (p.limites.historialMeses === Infinity ? 'Sin límite' : `${p.limites.historialMeses} meses`)),
  },
  { etiqueta: 'Punto de venta y tickets', valores: [true, true, true, true] },
  { etiqueta: 'Alertas de stock bajo', valores: [false, true, true, true] },
  { etiqueta: 'Roles y permisos de empleados', valores: [false, false, true, true] },
  { etiqueta: 'Dashboards con gráficas', valores: [false, false, true, true] },
  { etiqueta: 'Facturación electrónica (CFDI)', valores: [false, false, false, true] },
  { etiqueta: 'Soporte', valores: ['Correo', 'Chat', 'Prioritario', '24/7'] },
])

const incluidas = [
  { icono: MonitorSmartphone, texto: 'Web en computadora, tablet y teléfono' },
  { icono: Cloud, texto: 'Tus datos en la nube y en local' },
  { icono: Receipt, texto: 'Tickets de venta al instante' },
  { icono: ShieldCheck, texto: 'Acceso con usuario y contraseña' },
]

const preguntas = [
  {
    p: '¿Puedo cambiar de plan después?',
    r: 'Sí. Desde "Suscripciones", dentro del sistema, subes o bajas de plan cuando lo necesites.',
  },
  {
    p: '¿Qué pasa al terminar la prueba?',
    r: `Tienes ${DIAS_PRUEBA} días para usar todo sin costo. Antes de que termine, un asesor te contacta para formalizar tu suscripción.`,
  },
  {
    p: '¿Hay plazos forzosos?',
    r: 'No. Los precios están en pesos mexicanos con IVA incluido y puedes cancelar cuando quieras.',
  },
]
</script>

<template>
  <div class="ip-fondo min-h-screen w-full font-sans text-slate-900">
    <FlujoEncabezado :paso="2" @volver="$emit('volver')" />

    <main class="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:py-20">
      <section class="mx-auto max-w-2xl text-center">
        <UiBadge variant="blue" class="mb-5">
          <PaletaIcon variant="gold" :size="14" />
          {{ cambiando ? 'Cambia tu suscripción' : 'Paso 2 de 3 · Tu suscripción' }}
        </UiBadge>
        <h1 class="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          <span v-if="estado.sesion && !cambiando" class="block text-blue-600">
            ¡Bienvenido, {{ estado.sesion.nombre }}!
          </span>
          Suscripciones
        </h1>
        <p class="mt-5 text-lg leading-8 text-slate-500">
          Elige el plan que mejor le queda a tu paletería. Todos incluyen {{ DIAS_PRUEBA }} días de prueba sin costo y
          puedes cambiarlo cuando quieras.
        </p>

        <SelectorCiclo v-model="ciclo" class="mt-8" />
      </section>

      <section class="grid grid-cols-1 gap-x-6 gap-y-[150px] pt-[150px] sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaPlan
          v-for="plan in PLANES"
          :key="plan.id"
          :plan="plan"
          :ciclo="ciclo"
          :actual="cambiando && estado.licencia?.planId === plan.id"
          :texto-boton="cambiando ? 'Cambiar a este plan' : 'Elegir plan'"
          @elegir="elegir"
        />
      </section>

      <p class="mt-8 text-center text-sm text-slate-500">
        Precios en pesos mexicanos con IVA incluido. {{ DIAS_PRUEBA }} días gratis, sin tarjeta y sin plazos forzosos.
      </p>

      <section class="mt-16 grid gap-4 rounded-3xl bg-white/80 p-6 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="item in incluidas" :key="item.texto" class="flex items-center gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600/10 text-blue-600">
            <component :is="item.icono" class="size-5" />
          </span>
          <p class="text-sm font-semibold text-slate-700">{{ item.texto }}</p>
        </div>
      </section>

      <section class="mt-20">
        <h2 class="text-center text-3xl font-extrabold tracking-tight">Compara los planes</h2>
        <div class="mt-8 overflow-x-auto rounded-3xl bg-white ring-1 ring-slate-200">
          <table class="ip-table min-w-[640px]">
            <thead>
              <tr>
                <th>Característica</th>
                <th v-for="plan in PLANES" :key="plan.id" class="text-center" :style="{ color: acentoPlan(plan, tema === 'oscuro') }">
                  {{ plan.nombre }}
                </th>
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
