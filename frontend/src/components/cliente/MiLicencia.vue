<script setup lang="ts">
import { computed, ref } from 'vue'
import { Briefcase, CalendarDays, Check, Copy, Mail, Phone, ShieldCheck } from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import UiBadge from '../ui/Badge.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Encabezado from '../ui/Encabezado.vue'
import {
  DIAS_PRUEBA,
  diasRestantes,
  enPrueba,
  estado,
  limiteDe,
  planActual,
  precioPlan,
  uso,
  type Limite,
} from '@/stores/negocio'
import { fecha, precio } from '@/lib/formato'
import { copiarTexto } from '@/lib/utils'

defineEmits(['cambiarPlan'])

const copiado = ref(false)

const usos = computed(() =>
  (['sucursales', 'usuarios', 'productos'] as Limite[]).map((limite) => {
    const maximo = limiteDe(limite)
    const usados = uso(limite)
    return {
      limite,
      usados,
      texto: maximo === Infinity ? 'Sin límite' : `${usados} de ${maximo.toLocaleString('es-MX')}`,
      porcentaje: maximo === Infinity ? 8 : Math.min(100, (usados / maximo) * 100),
    }
  }),
)

const detalles = computed(() => {
  const licencia = estado.licencia
  if (!licencia || !planActual.value) return []
  return [
    { etiqueta: 'Inicio', valor: fecha(licencia.inicio) },
    { etiqueta: enPrueba.value ? 'Fin de la prueba' : 'Próxima renovación', valor: fecha(licencia.vence) },
    { etiqueta: 'Facturación', valor: licencia.ciclo === 'anual' ? 'Anual' : 'Mensual' },
    {
      etiqueta: enPrueba.value ? 'Después de la prueba' : 'Precio',
      valor: `${precio(precioPlan(planActual.value, licencia.ciclo))} / ${licencia.ciclo === 'anual' ? 'año' : 'mes'}`,
    },
  ]
})

async function copiar() {
  if (!estado.licencia) return
  await copiarTexto(estado.licencia.clave)
  copiado.value = true
  setTimeout(() => (copiado.value = false), 2000)
}
</script>

<template>
  <div>
    <Encabezado titulo="Mi licencia" descripcion="Consulta tu plan, tu clave de activación y cuánto estás usando.">
      <UiButton @click="$emit('cambiarPlan')">Cambiar de plan</UiButton>
    </Encabezado>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div class="space-y-6">
        <section class="relative overflow-hidden rounded-3xl bg-slate-950 p-8 text-white">
          <div class="absolute -top-20 -right-16 size-72 rounded-full bg-blue-600/40 blur-3xl" />
          <div class="absolute -bottom-24 left-10 size-60 rounded-full bg-amber-300/20 blur-3xl" />
          <div class="relative flex items-start justify-between gap-4">
            <div>
              <UiBadge variant="outline">
                <ShieldCheck class="size-3.5" /> {{ enPrueba ? 'Prueba gratis activa' : 'Suscripción activa' }}
              </UiBadge>
              <h2 class="mt-4 text-4xl font-extrabold tracking-tight">Plan {{ planActual?.nombre }}</h2>
              <p class="mt-1 text-slate-400">{{ planActual?.lema }}</p>
            </div>
            <PaletaIcon variant="gold" :size="64" />
          </div>

          <div class="relative mt-8">
            <p class="text-xs font-semibold tracking-wider text-slate-400 uppercase">Clave de licencia</p>
            <div class="mt-2 flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
              <code class="flex-1 font-mono text-lg tracking-widest text-amber-300">{{ estado.licencia?.clave }}</code>
              <UiButton variant="secondary" size="sm" @click="copiar">
                <component :is="copiado ? Check : Copy" class="size-4" />
                {{ copiado ? 'Copiada' : 'Copiar' }}
              </UiButton>
            </div>
          </div>

          <div v-if="enPrueba" class="relative mt-6">
            <div class="flex justify-between text-sm">
              <span class="text-slate-400">Días de prueba restantes</span>
              <strong>{{ diasRestantes }} de {{ DIAS_PRUEBA }}</strong>
            </div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div class="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-400" :style="{ width: `${(diasRestantes / DIAS_PRUEBA) * 100}%` }" />
            </div>
          </div>

          <dl class="relative mt-8 grid grid-cols-2 gap-4">
            <div v-for="d in detalles" :key="d.etiqueta">
              <dt class="text-xs text-slate-400">{{ d.etiqueta }}</dt>
              <dd class="m-0 mt-1 font-semibold">{{ d.valor }}</dd>
            </div>
          </dl>
        </section>

        <UiCard class="bg-white p-6">
          <h3 class="text-lg font-bold">Uso de tu licencia</h3>
          <div class="mt-5 space-y-5">
            <div v-for="u in usos" :key="u.limite">
              <div class="flex justify-between text-sm">
                <span class="font-semibold capitalize">{{ u.limite }}</span>
                <span class="text-slate-500">{{ u.texto }}</span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  :class="['h-full rounded-full', u.porcentaje >= 100 ? 'bg-rose-500' : u.porcentaje >= 80 ? 'bg-amber-400' : 'bg-blue-600']"
                  :style="{ width: `${u.porcentaje}%` }"
                />
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <div class="space-y-6">
        <UiCard class="bg-white p-6">
          <h3 class="text-lg font-bold">Datos del negocio</h3>
          <ul class="mt-5 list-none space-y-4 p-0 text-sm">
            <li class="flex items-center gap-3">
              <span class="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600"><Briefcase class="size-4" /></span>
              <div>
                <p class="font-semibold">{{ estado.licencia?.negocio }}</p>
                <p class="text-xs text-slate-400">{{ estado.licencia?.giro }}</p>
              </div>
            </li>
            <li class="flex items-center gap-3">
              <span class="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600"><Mail class="size-4" /></span>
              <div>
                <p class="font-semibold">{{ estado.sesion?.correo }}</p>
                <p class="text-xs text-slate-400">Titular de la cuenta</p>
              </div>
            </li>
            <li class="flex items-center gap-3">
              <span class="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600"><Phone class="size-4" /></span>
              <div>
                <p class="font-semibold">{{ estado.licencia?.telefono || 'Sin teléfono' }}</p>
                <p class="text-xs text-slate-400">Contacto</p>
              </div>
            </li>
            <li class="flex items-center gap-3">
              <span class="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600"><CalendarDays class="size-4" /></span>
              <div>
                <p class="font-semibold">{{ estado.licencia ? fecha(estado.licencia.inicio) : '' }}</p>
                <p class="text-xs text-slate-400">Cliente desde</p>
              </div>
            </li>
          </ul>
        </UiCard>

        <UiCard class="bg-white p-6">
          <h3 class="text-lg font-bold">Tu plan incluye</h3>
          <ul class="mt-4 list-none space-y-3 p-0">
            <li v-for="item in planActual?.incluye" :key="item" class="flex items-start gap-3 text-sm text-slate-600">
              <span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                <Check class="size-3.5" />
              </span>
              {{ item }}
            </li>
          </ul>
          <div v-if="enPrueba" class="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
            Al terminar la prueba, un asesor te contactará para activar tu forma de pago. No necesitas tarjeta ahora.
          </div>
        </UiCard>
      </div>
    </div>
  </div>
</template>
