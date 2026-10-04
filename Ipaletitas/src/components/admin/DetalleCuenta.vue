<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Ban, CalendarPlus, CircleCheck, CirclePlay, Mail, MapPin, Phone, RefreshCw } from '@lucide/vue'
import UiButton from '../ui/Button.vue'
import UiModal from '../ui/Modal.vue'
import EstadoBadge from './EstadoBadge.vue'
import { PLANES, PLAN_RECOMENDADO, planPorId, type CicloPago, type Limite, type PlanId } from '@/stores/catalogo'
import {
  activarSuscripcion,
  buscarCuenta,
  cambiarPlanCuenta,
  diasPara,
  estadoDe,
  extenderPrueba,
  mensualidad,
  pagosDe,
  reactivarCuenta,
  regenerarClave,
  suspenderCuenta,
} from '@/stores/admin'
import { dinero, fecha, fechaYHora, iniciales } from '@/lib/formato'

const props = defineProps<{ id: string }>()
defineEmits(['cerrar'])

const cuenta = computed(() => buscarCuenta(props.id))
const estadoCuenta = computed(() => (cuenta.value ? estadoDe(cuenta.value) : 'Activa'))
const plan = computed(() => planPorId(cuenta.value?.planId ?? 'basica'))
const pagos = computed(() => pagosDe(props.id))

const planNuevo = ref<PlanId>(cuenta.value?.planId ?? PLAN_RECOMENDADO)
const cicloNuevo = ref<CicloPago>(cuenta.value?.ciclo ?? 'mensual')
const aviso = ref('')

watch(
  () => [cuenta.value?.planId, cuenta.value?.ciclo],
  () => {
    if (!cuenta.value) return
    planNuevo.value = cuenta.value.planId
    cicloNuevo.value = cuenta.value.ciclo
  },
)

const cambioPendiente = computed(
  () => cuenta.value && (planNuevo.value !== cuenta.value.planId || cicloNuevo.value !== cuenta.value.ciclo),
)

const usos = computed(() =>
  (['sucursales', 'usuarios', 'productos'] as Limite[]).map((limite) => {
    const maximo = plan.value.limites[limite]
    const usados = cuenta.value?.uso[limite] ?? 0
    return {
      limite,
      texto: maximo === Infinity ? `${usados} · sin límite` : `${usados} de ${maximo.toLocaleString('es-MX')}`,
      porcentaje: maximo === Infinity ? 6 : Math.min(100, (usados / maximo) * 100),
    }
  }),
)

function hecho(mensaje: string, accion: () => void) {
  accion()
  aviso.value = mensaje
  setTimeout(() => (aviso.value = ''), 2500)
}

function suspender() {
  if (cuenta.value && confirm(`¿Suspender a ${cuenta.value.negocio}? No podrá entrar a su punto de venta.`)) {
    hecho('Cuenta suspendida', () => suspenderCuenta(props.id))
  }
}
</script>

<template>
  <UiModal v-if="cuenta" :titulo="cuenta.negocio" ancho="max-w-4xl" @cerrar="$emit('cerrar')">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <span class="grid size-14 shrink-0 place-items-center rounded-2xl bg-amber-300 text-lg font-extrabold text-slate-900">
        {{ iniciales(cuenta.negocio) }}
      </span>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <EstadoBadge :estado="estadoCuenta" />
          <span v-if="cuenta.local" class="rounded-md bg-blue-600 px-2 py-0.5 text-[11px] font-bold text-white">
            Cuenta demo de este navegador
          </span>
        </div>
        <p class="mt-1 text-sm text-slate-500">
          {{ cuenta.giro }} · Cliente desde {{ fecha(cuenta.alta) }} · Último acceso {{ fechaYHora(cuenta.ultimoAcceso) }}
        </p>
      </div>
      <Transition name="aviso">
        <p v-if="aviso" class="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
          <CircleCheck class="size-4" /> {{ aviso }}
        </p>
      </Transition>
    </div>

    <div class="mt-6 grid gap-5 md:grid-cols-2">
      <section class="rounded-2xl bg-slate-50 p-5">
        <h3 class="text-sm font-bold tracking-wider text-slate-400 uppercase">Titular</h3>
        <p class="mt-3 font-bold">{{ cuenta.titular }}</p>
        <ul class="mt-3 list-none space-y-2 p-0 text-sm text-slate-600">
          <li class="flex items-center gap-2"><Mail class="size-4 text-slate-400" /> {{ cuenta.correo || 'Sin correo' }}</li>
          <li class="flex items-center gap-2"><Phone class="size-4 text-slate-400" /> {{ cuenta.telefono || 'Sin teléfono' }}</li>
          <li class="flex items-center gap-2"><MapPin class="size-4 text-slate-400" /> {{ cuenta.ciudad }}</li>
        </ul>
        <p class="mt-4 text-sm text-slate-500">
          Actividad: <strong class="text-slate-800">{{ cuenta.ventasMes.toLocaleString('es-MX') }}</strong> tickets en los últimos 30 días
        </p>
      </section>

      <section class="rounded-2xl bg-slate-950 p-5 text-white">
        <h3 class="text-sm font-bold tracking-wider text-slate-400 uppercase">Licencia</h3>
        <p class="mt-3 text-2xl font-extrabold">Plan {{ plan.nombre }}</p>
        <p class="text-sm text-slate-400">
          <span class="capitalize">{{ cuenta.ciclo }}</span> · {{ dinero(mensualidad(cuenta)) }} al mes
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10">
          <code class="flex-1 font-mono text-sm tracking-widest whitespace-nowrap text-amber-300">{{ cuenta.clave }}</code>
          <UiButton variant="ghost" size="sm" class="text-slate-300 hover:bg-white/10 hover:text-white" @click="hecho('Clave regenerada', () => regenerarClave(id))">
            <RefreshCw class="size-3.5" />
            Regenerar
          </UiButton>
        </div>
        <p class="mt-4 text-sm text-slate-300">
          {{ cuenta.enPrueba ? 'La prueba termina' : 'Renueva' }} el <strong class="text-white">{{ fecha(cuenta.vence) }}</strong>{{ ' ' }}
          <span class="text-slate-400">({{ diasPara(cuenta.vence) >= 0 ? `faltan ${diasPara(cuenta.vence)} días` : `venció hace ${-diasPara(cuenta.vence)} días` }})</span>
        </p>
      </section>
    </div>

    <section class="mt-5 rounded-2xl p-5 ring-1 ring-slate-200">
      <h3 class="text-sm font-bold tracking-wider text-slate-400 uppercase">Uso contra límites del plan</h3>
      <div class="mt-4 grid gap-5 sm:grid-cols-3">
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
    </section>

    <section class="mt-5 rounded-2xl p-5 ring-1 ring-slate-200">
      <h3 class="text-sm font-bold tracking-wider text-slate-400 uppercase">Acciones</h3>
      <div class="mt-4 flex flex-wrap gap-3">
        <UiButton
          v-if="estadoCuenta === 'Prueba' || estadoCuenta === 'Vencida'"
          @click="hecho('Suscripción activada y cargo emitido', () => activarSuscripcion(id))"
        >
          <CirclePlay class="size-4" />
          Activar suscripción de pago
        </UiButton>
        <UiButton
          v-if="cuenta.enPrueba"
          variant="outline"
          @click="hecho('Prueba extendida 7 días', () => extenderPrueba(id, 7))"
        >
          <CalendarPlus class="size-4" />
          Extender prueba 7 días
        </UiButton>
        <UiButton
          v-if="estadoCuenta === 'Suspendida'"
          variant="secondary"
          @click="hecho('Cuenta reactivada', () => reactivarCuenta(id))"
        >
          <CircleCheck class="size-4" />
          Reactivar cuenta
        </UiButton>
        <UiButton v-else variant="outline" class="text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700" @click="suspender">
          <Ban class="size-4" />
          Suspender cuenta
        </UiButton>
      </div>

      <div class="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label class="ip-label" for="d-plan">Cambiar plan</label>
          <select id="d-plan" v-model="planNuevo" class="ip-input cursor-pointer">
            <option v-for="p in PLANES" :key="p.id" :value="p.id">{{ p.nombre }} · {{ dinero(p.precioMensual) }}/mes</option>
          </select>
        </div>
        <div>
          <label class="ip-label" for="d-ciclo">Facturación</label>
          <select id="d-ciclo" v-model="cicloNuevo" class="ip-input cursor-pointer">
            <option value="mensual">Mensual</option>
            <option value="anual">Anual</option>
          </select>
        </div>
        <UiButton
          class="h-[2.9rem]"
          :disabled="!cambioPendiente"
          @click="hecho('Plan actualizado', () => cambiarPlanCuenta(id, planNuevo, cicloNuevo))"
        >
          Guardar plan
        </UiButton>
      </div>
    </section>

    <section class="mt-5">
      <h3 class="mb-3 text-sm font-bold tracking-wider text-slate-400 uppercase">Historial de cobros</h3>
      <div class="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
        <table class="ip-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Concepto</th>
              <th>Emitido</th>
              <th>Estado</th>
              <th class="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pago in pagos" :key="pago.id">
              <td class="font-bold text-slate-900">F-{{ pago.folio }}</td>
              <td>{{ pago.concepto }}</td>
              <td class="whitespace-nowrap">{{ fecha(pago.emitido) }}</td>
              <td><EstadoBadge :estado="pago.estado" /></td>
              <td class="text-right font-semibold">{{ dinero(pago.monto) }}</td>
            </tr>
            <tr v-if="!pagos.length">
              <td colspan="5" class="py-8 text-center text-slate-400">
                {{ cuenta.enPrueba ? 'Aún está en prueba gratis: no tiene cobros.' : 'Sin cobros registrados.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </UiModal>
</template>

<style scoped>
.aviso-enter-active,
.aviso-leave-active {
  transition: opacity 0.25s ease;
}

.aviso-enter-from,
.aviso-leave-to {
  opacity: 0;
}
</style>
