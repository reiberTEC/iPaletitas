<script setup lang="ts">
import { computed, ref } from 'vue'
import { Briefcase, CalendarDays, Check, Clock, Copy, CreditCard, Mail, Phone, ShieldCheck } from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import LogoTarjeta from '../pago/LogoTarjeta.vue'
import ModalTarjeta from '../pago/ModalTarjeta.vue'
import UiBadge from '../ui/Badge.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import UiModal from '../ui/Modal.vue'
import Encabezado from '../ui/Encabezado.vue'
import {
  CORREO_PAGOS,
  DIAS_COBRO,
  DIAS_PRUEBA,
  diasRestantes,
  enPrueba,
  estado,
  limiteDe,
  planActual,
  plazoDeCobro,
  precioPlan,
  puede,
  semanaGratis,
  uso,
  type Limite,
} from '@/stores/negocio'
import { cargoDevolvible, devolverSemanaGratis } from '@/stores/admin'
import { dinero, fecha, precio } from '@/lib/formato'
import { textoTarjeta } from '@/lib/tarjeta'
import { copiarTexto } from '@/lib/utils'

defineEmits(['cambiarPlan'])

const cambiandoTarjeta = ref(false)
const confirmandoDevolucion = ref(false)
const aviso = ref('')
const devolvible = computed(() => (confirmandoDevolucion.value ? cargoDevolvible() : null))

function pedirDevolucion() {
  devolverSemanaGratis()
  confirmandoDevolucion.value = false
}

const copiado = ref(false)
const administra = computed(() => puede('licencia.editar'))
const clave = computed(() => {
  const real = estado.licencia?.clave ?? ''
  return administra.value ? real : real.replace(/[A-Z0-9](?=.{4})/gi, '•')
})

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
    {
      etiqueta: plazoDeCobro.value
        ? enPrueba.value ? 'Terminó la prueba' : 'Venció'
        : enPrueba.value ? 'Fin de la prueba' : 'Próxima renovación',
      valor: fecha(licencia.vence),
    },
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
      <UiButton v-if="administra" @click="$emit('cambiarPlan')">Cambiar de plan</UiButton>
    </Encabezado>

    <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div class="space-y-6">
        <section class="rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <UiBadge variant="outline">
                <template v-if="plazoDeCobro"><Clock class="size-3.5" /> Pago pendiente</template>
                <template v-else>
                  <ShieldCheck class="size-3.5" />
                  {{ enPrueba ? 'Prueba gratis activa' : semanaGratis ? 'Semana gratis' : 'Suscripción activa' }}
                </template>
              </UiBadge>
              <h2 class="mt-4 font-display text-4xl font-semibold tracking-tight">Plan {{ planActual?.nombre }}</h2>
              <p class="mt-1 text-slate-300">{{ planActual?.lema }}</p>
            </div>
            <PaletaIcon variant="gold" :size="64" class="shrink-0" />
          </div>

          <div class="mt-8">
            <p class="text-sm font-semibold text-slate-300">Clave de licencia</p>
            <div class="mt-2 flex flex-wrap items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
              <code class="min-w-0 flex-1 font-mono text-lg tracking-widest break-all text-blue-200">{{ clave }}</code>
              <UiButton
                v-if="administra"
                variant="outline"
                size="sm"
                class="bg-white/10 text-white ring-white/20 hover:bg-white/15 hover:ring-white/30"
                @click="copiar"
              >
                <component :is="copiado ? Check : Copy" class="size-4" />
                {{ copiado ? 'Copiada' : 'Copiar' }}
              </UiButton>
            </div>
          </div>

          <div v-if="plazoDeCobro" class="mt-6">
            <div class="flex justify-between gap-3 text-sm">
              <span class="text-slate-300">Días para pagar antes de la suspensión</span>
              <strong class="tabular-nums">{{ plazoDeCobro.dias }} de {{ DIAS_COBRO }}</strong>
            </div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div class="h-full rounded-full bg-orange-400" :style="{ width: `${(plazoDeCobro.dias / DIAS_COBRO) * 100}%` }" />
            </div>
          </div>
          <div v-else-if="enPrueba" class="mt-6">
            <div class="flex justify-between gap-3 text-sm">
              <span class="text-slate-300">Días de prueba restantes</span>
              <strong class="tabular-nums">{{ diasRestantes }} de {{ DIAS_PRUEBA }}</strong>
            </div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div class="h-full rounded-full bg-blue-400" :style="{ width: `${(diasRestantes / DIAS_PRUEBA) * 100}%` }" />
            </div>
          </div>

          <dl class="mt-8 grid grid-cols-2 gap-4">
            <div v-for="d in detalles" :key="d.etiqueta">
              <dt class="text-xs text-slate-300">{{ d.etiqueta }}</dt>
              <dd class="m-0 mt-1 font-semibold tabular-nums">{{ d.valor }}</dd>
            </div>
          </dl>
        </section>

        <UiCard class="bg-white p-6">
          <h3 class="font-display text-lg font-semibold">Uso de tu licencia</h3>
          <div class="mt-5 space-y-5">
            <div v-for="u in usos" :key="u.limite">
              <div class="flex justify-between text-sm">
                <span class="font-semibold capitalize">{{ u.limite }}</span>
                <span class="text-slate-500 tabular-nums">{{ u.texto }}</span>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  :class="['h-full rounded-full', u.porcentaje >= 100 ? 'bg-rose-600' : u.porcentaje >= 80 ? 'bg-orange-500' : 'bg-blue-600']"
                  :style="{ width: `${u.porcentaje}%` }"
                />
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <div class="space-y-6">
        <UiCard class="bg-white p-6">
          <h3 class="font-display text-lg font-semibold">Datos del negocio</h3>
          <ul class="mt-5 list-none space-y-4 p-0 text-sm">
            <li class="flex items-center gap-3">
              <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><Briefcase class="size-4" /></span>
              <div class="min-w-0">
                <p class="font-semibold [overflow-wrap:anywhere]">{{ estado.licencia?.negocio }}</p>
                <p class="text-xs text-slate-500">{{ estado.licencia?.giro }}</p>
              </div>
            </li>
            <li class="flex items-center gap-3">
              <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><Mail class="size-4" /></span>
              <div class="min-w-0">
                <p class="font-semibold [overflow-wrap:anywhere]">{{ estado.sesion?.correo }}</p>
                <p class="text-xs text-slate-500">Titular de la cuenta</p>
              </div>
            </li>
            <li class="flex items-center gap-3">
              <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><Phone class="size-4" /></span>
              <div class="min-w-0">
                <p class="font-semibold [overflow-wrap:anywhere]">{{ estado.licencia?.telefono || 'Sin teléfono' }}</p>
                <p class="text-xs text-slate-500">Contacto</p>
              </div>
            </li>
            <li class="flex items-center gap-3">
              <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><CalendarDays class="size-4" /></span>
              <div class="min-w-0">
                <p class="font-semibold [overflow-wrap:anywhere]">{{ estado.licencia ? fecha(estado.licencia.inicio) : '' }}</p>
                <p class="text-xs text-slate-500">Cliente desde</p>
              </div>
            </li>
          </ul>
        </UiCard>

        <UiCard class="bg-white p-6">
          <h3 class="font-display text-lg font-semibold">Tu plan incluye</h3>
          <ul class="mt-4 list-none space-y-3 p-0">
            <li v-for="item in planActual?.incluye" :key="item" class="flex items-start gap-3 text-sm text-slate-600">
              <span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                <Check class="size-3.5" />
              </span>
              {{ item }}
            </li>
          </ul>
        </UiCard>

        <UiCard class="bg-white p-6">
          <h3 class="font-display text-lg font-semibold">Forma de pago</h3>
          <div class="mt-4 flex items-center gap-3">
            <LogoTarjeta
              v-if="estado.licencia?.tarjeta && estado.licencia.tarjeta.marca !== 'Tarjeta'"
              :marca="estado.licencia.tarjeta.marca"
              :ancho="42"
              aria-hidden="true"
            />
            <span v-else class="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
              <CreditCard class="size-4" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-semibold">
                {{ estado.licencia?.tarjeta ? textoTarjeta(estado.licencia.tarjeta) : 'Sin tarjeta registrada' }}
              </p>
              <p v-if="estado.licencia?.tarjeta?.vence" class="text-xs text-slate-500">Vence {{ estado.licencia.tarjeta.vence }}</p>
              <p v-else-if="estado.licencia?.tarjeta" class="text-xs text-slate-500">Las renovaciones se cobran ahí solas</p>
            </div>
            <UiButton v-if="administra" variant="outline" size="sm" @click="cambiandoTarjeta = true">
              {{ plazoDeCobro ? 'Pagar con tarjeta' : estado.licencia?.tarjeta ? 'Cambiar' : 'Agregar' }}
            </UiButton>
          </div>
          <p class="mt-4 mb-0 text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
            <template v-if="estado.licencia?.tarjeta">
              Cada renovación se cobra sola a esta tarjeta. Si no se puede cobrar, tienes {{ DIAS_COBRO }} días para pagar
              con otra tarjeta o por transferencia (comprobante a {{ CORREO_PAGOS }}).
            </template>
            <template v-else>
              Agrega una tarjeta para que tus renovaciones se cobren solas, o paga por transferencia y manda tu comprobante a
              {{ CORREO_PAGOS }}.
            </template>
          </p>
          <p v-if="aviso" class="mt-4 mb-0 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800" role="status">{{ aviso }}</p>
        </UiCard>

        <UiCard v-if="semanaGratis && administra" class="garantia p-6">
          <h3 class="flex items-center gap-2 font-display text-lg font-semibold">
            <ShieldCheck class="size-5" aria-hidden="true" />
            Semana gratis
          </h3>
          <p class="mt-3 mb-0 text-sm leading-6">
            Si el servicio no te convence, hasta el <strong>{{ fecha(semanaGratis.hasta) }}</strong>
            ({{ semanaGratis.dias === 1 ? 'queda 1 día' : `quedan ${semanaGratis.dias} días` }}) te devolvemos tu pago
            completo. Solo se puede usar una vez por cuenta.
          </p>
          <UiButton variant="outline" class="mt-4 w-full" @click="confirmandoDevolucion = true">Pedir devolución</UiButton>
        </UiCard>
      </div>
    </div>

    <ModalTarjeta
      v-if="cambiandoTarjeta"
      @cerrar="cambiandoTarjeta = false"
      @listo="(mensaje) => ((aviso = mensaje), (cambiandoTarjeta = false))"
    />

    <UiModal v-if="confirmandoDevolucion" titulo="Pedir devolución" @cerrar="confirmandoDevolucion = false">
      <p class="m-0 text-base leading-7 text-slate-600">
        Te devolvemos <strong class="text-slate-900">{{ devolvible ? dinero(devolvible.monto) : '' }}</strong>
        a tu {{ devolvible?.referencia ?? 'tarjeta' }} y tu suscripción termina hoy. Tus productos, ventas y sucursales
        se quedan guardados por si vuelves, pero ya no tendrás otra semana gratis.
      </p>
      <div class="mt-6 flex justify-end gap-3">
        <UiButton variant="outline" @click="confirmandoDevolucion = false">Seguir con mi plan</UiButton>
        <UiButton class="bg-rose-600 hover:bg-rose-700" @click="pedirDevolucion">Sí, devolver mi pago</UiButton>
      </div>
    </UiModal>
  </div>
</template>

<style scoped>
.garantia {
  background: #ecfdf5;
  color: #065f46;
}

html.oscuro .garantia {
  background: rgb(16 185 129 / 0.12);
  color: #a7f3d0;
}
</style>
