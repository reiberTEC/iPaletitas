<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, X } from '@lucide/vue'
import FlujoEncabezado from './FlujoEncabezado.vue'
import TarjetaPlan from './planes/TarjetaPlan.vue'
import SelectorCiclo from './planes/SelectorCiclo.vue'
import { DIAS_COBRO, DIAS_GARANTIA, PLANES, acentoPlan, elegirPlan, estado, type CicloPago, type Plan } from '@/stores/negocio'
import { tema } from '@/lib/tema'

const emit = defineEmits(['elegido', 'volver'])

const ciclo = ref<CicloPago>(estado.planElegido?.ciclo ?? estado.licencia?.ciclo ?? 'mensual')
const cambiando = computed(() => Boolean(estado.sesion && estado.licencia && !estado.licencia.cancelada))
const conSemanaGratis = !estado.pruebaUsada

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

const preguntas = [
  {
    p: '¿Puedo cambiar de plan después?',
    r: 'Sí. Desde "Suscripciones", dentro del sistema, subes o bajas de plan cuando lo necesites.',
  },
  {
    p: '¿Cómo funciona la semana gratis?',
    r: `Pagas tu primer periodo con tarjeta al elegir tu plan. Si en los primeros ${DIAS_GARANTIA} días el servicio no te convence, pides tu devolución desde "Mi licencia" y te regresamos el pago completo. Es una sola vez por cuenta.`,
  },
  {
    p: '¿Cómo se pagan las renovaciones?',
    r: `Se cobran solas a la tarjeta que registraste. Si el cobro no pasa, tienes ${DIAS_COBRO} días para pagar con otra tarjeta o por transferencia antes de que se suspenda.`,
  },
  {
    p: '¿Hay plazos forzosos?',
    r: 'No. Los precios están en pesos mexicanos con IVA incluido y puedes cancelar cuando quieras.',
  },
]
</script>

<template>
  <div class="ip-fondo min-h-svh w-full font-sans text-slate-900">
    <FlujoEncabezado :paso="2" @volver="$emit('volver')" />

    <main class="mx-auto w-full max-w-7xl px-5 pt-12 pb-20 sm:px-6 lg:pt-16">
      <section class="max-w-3xl">
        <h1 class="font-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance">
          <template v-if="cambiando">Cambia de línea cuando quieras</template>
          <template v-else-if="estado.sesion">¡Hola, {{ estado.sesion.nombre }}! Elige tu línea.</template>
          <template v-else>Elige tu línea</template>
        </h1>
        <p class="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
          Elige el plan que mejor le queda a tu negocio y cámbialo cuando quieras.
          <template v-if="!cambiando && conSemanaGratis">
            Lo pagas con tarjeta en el siguiente paso y tienes una semana gratis: si no te convence en
            {{ DIAS_GARANTIA }} días, te devolvemos tu dinero.
          </template>
        </p>

        <SelectorCiclo v-model="ciclo" class="mt-8" />
      </section>

      <section class="lineas" aria-labelledby="titulo-lineas">
        <h2 id="titulo-lineas" class="sr-only">Planes</h2>
        <TarjetaPlan
          v-for="plan in PLANES"
          :key="plan.id"
          :plan="plan"
          :ciclo="ciclo"
          escalonado
          :actual="cambiando && estado.licencia?.planId === plan.id"
          :texto-boton="cambiando ? 'Cambiar a este plan' : 'Elegir plan'"
          @elegir="elegir"
        />
      </section>

      <p class="mt-8 max-w-3xl text-base leading-7 text-slate-600">
        Todos funcionan en computadora, tablet y teléfono, guardan tus datos en la nube y en local, y dan ticket al
        instante. Precios en pesos mexicanos con IVA incluido y sin plazos forzosos: pagas con tarjeta, las renovaciones
        se cobran solas y tu primera semana es gratis (si no te convence, te devolvemos tu pago).
      </p>

      <section class="mt-20">
        <h2 class="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight font-extrabold tracking-[-0.03em]">
          Compara los planes
        </h2>
        <div class="mt-8 overflow-x-auto rounded-2xl bg-white">
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
                  <Check v-if="valor === true" class="mx-auto size-5 text-emerald-600" aria-label="Incluido" />
                  <X v-else-if="valor === false" class="mx-auto size-5 text-slate-300" aria-label="No incluido" />
                  <span v-else class="font-medium">{{ valor }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="mt-20" aria-labelledby="titulo-dudas">
        <h2 id="titulo-dudas" class="font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-tight font-extrabold tracking-[-0.03em]">
          Antes de elegir
        </h2>
        <dl class="dudas">
          <div v-for="item in preguntas" :key="item.p" class="duda">
            <dt class="font-display text-lg font-bold">{{ item.p }}</dt>
            <dd class="text-base leading-7 text-slate-600">{{ item.r }}</dd>
          </div>
        </dl>
      </section>
    </main>
  </div>
</template>

<style scoped>
.lineas {
  display: grid;
  gap: 0.5rem;
  margin-top: 2.5rem;
}

@media (min-width: 640px) {
  .lineas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: end;
  }
}

@media (min-width: 1280px) {
  .lineas {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.dudas {
  margin: 2rem 0 0;
}

.duda {
  display: grid;
  gap: 0.5rem;
  padding: 1.5rem 0;
  border-top: 2px solid #dfe3ea;
}

.duda dd {
  margin: 0;
  max-width: 62ch;
}

@media (min-width: 900px) {
  .duda {
    grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    gap: 2rem;
  }
}
</style>
