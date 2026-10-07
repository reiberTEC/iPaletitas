<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ArrowRight, CalendarDays, CircleCheck, Copy, KeyRound, Package, Store, Users } from '@lucide/vue'
import FlujoEncabezado from './FlujoEncabezado.vue'
import { mascotaPlan } from './planes/mascotas'
import UiBadge from './ui/Badge.vue'
import UiButton from './ui/Button.vue'
import UiCard from './ui/Card.vue'
import { DIAS_PRUEBA, PLAN_RECOMENDADO, acentoPlan, activarLicencia, estado, planPorId, precioPlan } from '@/stores/negocio'
import { fecha, precio } from '@/lib/formato'
import { tema } from '@/lib/tema'
import { copiarTexto } from '@/lib/utils'

defineEmits(['listo', 'volver'])

const plan = computed(
  () => planPorId(estado.planElegido?.planId ?? estado.licencia?.planId ?? PLAN_RECOMENDADO),
)
const mascota = computed(() => mascotaPlan[plan.value.id])
const ciclo = computed(() => estado.planElegido?.ciclo ?? estado.licencia?.ciclo ?? 'mensual')
const primeraVez = !estado.sucursales.length

const giros = [
  'Paletería y nevería',
  'Abarrotes',
  'Cafetería',
  'Restaurante',
  'Panadería',
  'Tienda de ropa',
  'Papelería',
  'Otro',
]

const form = reactive({
  negocio: estado.licencia?.negocio ?? '',
  giro: estado.licencia?.giro ?? giros[0]!,
  telefono: estado.licencia?.telefono ?? '',
  sucursal: 'Matriz',
  acepto: false,
})

const activada = ref(false)
const copiado = ref(false)

const finPrueba = computed(() => {
  const dia = new Date()
  dia.setDate(dia.getDate() + DIAS_PRUEBA)
  return fecha(dia.toISOString())
})

const limites = computed(() => {
  const l = plan.value.limites
  const texto = (n: number, singular: string, plural: string, ilimitado: string) =>
    n === Infinity ? ilimitado : n === 1 ? `1 ${singular}` : `${n.toLocaleString('es-MX')} ${plural}`
  return [
    { icono: Store, texto: texto(l.sucursales, 'sucursal', 'sucursales', 'Sucursales ilimitadas') },
    { icono: Users, texto: texto(l.usuarios, 'usuario', 'usuarios', 'Usuarios ilimitados') },
    { icono: Package, texto: texto(l.productos, 'producto', 'productos', 'Productos ilimitados') },
  ]
})

function activar() {
  activarLicencia({
    negocio: form.negocio.trim(),
    giro: form.giro,
    telefono: form.telefono.trim(),
    sucursal: form.sucursal.trim(),
  })
  activada.value = true
  window.scrollTo({ top: 0, behavior: 'instant' })
}

async function copiar() {
  await copiarTexto(estado.licencia?.clave ?? '')
  copiado.value = true
  setTimeout(() => (copiado.value = false), 1800)
}
</script>

<template>
  <div class="ip-fondo min-h-screen w-full font-sans text-slate-900">
    <FlujoEncabezado :paso="3" :sin-volver="activada" @volver="$emit('volver')" />

    <main class="mx-auto w-full max-w-6xl px-6 py-14 lg:py-20">
      <section v-if="activada && estado.licencia" class="mx-auto max-w-xl text-center">
        <div class="relative mx-auto w-fit">
          <img :src="mascota.src" :alt="mascota.alt" class="mascota-exito mx-auto h-40 w-auto" />
          <span class="absolute right-0 bottom-2 grid size-11 place-items-center rounded-full bg-white shadow-lg">
            <CircleCheck class="size-7 text-emerald-500" />
          </span>
        </div>
        <h1 class="mt-6 text-4xl font-extrabold tracking-tight">¡Tu suscripción está activa!</h1>
        <p class="mt-4 text-lg leading-8 text-slate-500">
          Plan {{ plan.nombre }} para <strong class="text-slate-800">{{ estado.licencia.negocio }}</strong>. Tu prueba
          gratis dura hasta el {{ fecha(estado.licencia.vence) }}.
        </p>

        <UiCard class="mt-8 p-6 text-left">
          <p class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <KeyRound class="size-4" />
            Clave de licencia
          </p>
          <div class="mt-3 flex items-center justify-between gap-4 rounded-2xl bg-slate-950 px-5 py-4">
            <code class="font-mono text-lg font-bold tracking-widest text-amber-300">{{ estado.licencia.clave }}</code>
            <UiButton variant="outline" size="sm" @click="copiar">
              <Copy class="size-3.5" />
              {{ copiado ? 'Copiada' : 'Copiar' }}
            </UiButton>
          </div>
          <p class="mt-4 text-sm leading-6 text-slate-500">
            <template v-if="primeraVez">
              Creamos tu sucursal <strong class="text-slate-700">{{ form.sucursal || 'Matriz' }}</strong> con productos y
              ventas de ejemplo para que explores el sistema.
            </template>
            <template v-else>Tus datos, productos y ventas se conservan con la nueva licencia.</template>
          </p>
        </UiCard>

        <UiButton size="lg" class="mt-8 px-10" @click="$emit('listo')">
          Entrar a mi panel
          <ArrowRight class="size-4" />
        </UiButton>
      </section>

      <section v-else class="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <UiCard class="p-8 sm:p-10">
          <UiBadge variant="blue" class="mb-4">Paso 3 de 3</UiBadge>
          <h1 class="text-3xl font-extrabold tracking-tight sm:text-4xl">Activa tu licencia</h1>
          <p class="mt-3 leading-7 text-slate-500">
            Cuéntanos de tu negocio. Con estos datos generamos tu clave de licencia y preparamos tu panel.
          </p>

          <form class="mt-8 grid gap-5 sm:grid-cols-2" @submit.prevent="activar">
            <div class="sm:col-span-2">
              <label class="ip-label" for="negocio">Nombre del negocio</label>
              <input id="negocio" v-model="form.negocio" class="ip-input" required placeholder="Paletería La Michoacana" />
            </div>
            <div>
              <label class="ip-label" for="giro">Giro</label>
              <select id="giro" v-model="form.giro" class="ip-input">
                <option v-for="giro in giros" :key="giro">{{ giro }}</option>
              </select>
            </div>
            <div>
              <label class="ip-label" for="telefono">Teléfono de contacto</label>
              <input id="telefono" v-model="form.telefono" class="ip-input" type="tel" required placeholder="55 1234 5678" />
            </div>
            <div v-if="primeraVez" class="sm:col-span-2">
              <label class="ip-label" for="sucursal">Nombre de tu sucursal principal</label>
              <input id="sucursal" v-model="form.sucursal" class="ip-input" required placeholder="Matriz" />
            </div>

            <label class="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-600 sm:col-span-2">
              <input v-model="form.acepto" class="ip-check mt-1" type="checkbox" />
              Acepto los términos de la licencia de uso y el aviso de privacidad de iPaletitas.
            </label>

            <UiButton type="submit" size="lg" class="sm:col-span-2" :disabled="!form.acepto">
              Activar licencia
              <ArrowRight class="size-4" />
            </UiButton>
          </form>
        </UiCard>

        <UiCard class="relative overflow-hidden p-8 lg:sticky lg:top-28">
          <div class="absolute -top-16 -right-16 size-48 rounded-full bg-blue-500/10 blur-2xl" />
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Resumen de tu suscripción</p>
          <div class="mt-4 flex items-center justify-between gap-4">
            <h2 class="text-2xl font-extrabold" :style="{ color: acentoPlan(plan, tema === 'oscuro') }">Plan {{ plan.nombre }}</h2>
            <img :src="mascota.src" :alt="mascota.alt" class="h-20 w-auto shrink-0" />
          </div>
          <p class="mt-1 text-sm text-slate-500">{{ plan.lema }}</p>

          <ul class="mt-6 list-none space-y-3 p-0">
            <li v-for="item in limites" :key="item.texto" class="flex items-center gap-3 text-sm text-slate-600">
              <component :is="item.icono" class="size-4 text-blue-600" />
              {{ item.texto }}
            </li>
          </ul>

          <div class="mt-6 space-y-3 border-t border-slate-100 pt-6 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-500">Facturación</span>
              <span class="font-semibold capitalize">{{ ciclo }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Hoy pagas</span>
              <span class="font-extrabold text-emerald-600">{{ precio(0) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Después de la prueba</span>
              <span class="font-semibold">
                {{ precio(precioPlan(plan, ciclo)) }} / {{ ciclo === 'mensual' ? 'mes' : 'año' }}
              </span>
            </div>
          </div>

          <p class="mt-6 flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <CalendarDays class="mt-0.5 size-4 shrink-0" />
            Prueba gratis hasta el {{ finPrueba }}. Sin tarjeta: un asesor te contactará para formalizar tu licencia.
          </p>

          <UiButton variant="ghost" class="mt-4 w-full" @click="$emit('volver')">Cambiar de plan</UiButton>
        </UiCard>
      </section>
    </main>
  </div>
</template>

<style scoped>
.mascota-exito {
  animation: mascota-entra 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes mascota-entra {
  from {
    opacity: 0;
    transform: translateY(30%) scale(0.7) rotate(-8deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mascota-exito {
    animation: none;
  }
}
</style>
