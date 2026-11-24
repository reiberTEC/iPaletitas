<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Check, Clock, Package, Store, Users } from '@lucide/vue'
import { mascotaPlan } from '../planes/mascotas'
import UiBadge from '../ui/Badge.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Encabezado from '../ui/Encabezado.vue'
import { acentoPlan, guardarTopesPlan, precioPlan, type Plan, type PlanId } from '@/stores/catalogo'
import { cuentas, estadoDe, metricas } from '@/stores/admin'
import { dinero, precio } from '@/lib/formato'
import { tema } from '@/lib/tema'

const limite = (valor: number, unidad: string) => (valor === Infinity ? `${unidad} ilimitados` : `${valor.toLocaleString('es-MX')} ${unidad}`)

function detalle(plan: Plan) {
  const delPlan = cuentas.value.filter((c) => c.planId === plan.id)
  return {
    activas: delPlan.filter((c) => estadoDe(c) === 'Activa').length,
    prueba: delPlan.filter((c) => estadoDe(c) === 'En prueba').length,
    anuales: delPlan.filter((c) => c.ciclo === 'anual').length,
  }
}

const mrrTotal = computed(() => Math.max(1, metricas.value.mrr))

const editando = ref<PlanId | null>(null)
const aviso = ref('')
const form = reactive({ sucursales: 1, usuarios: 1, productos: 1, historialMeses: 1 })

function abrir(plan: Plan) {
  editando.value = plan.id
  form.sucursales = plan.limites.sucursales
  form.usuarios = plan.limites.usuarios
  form.productos = plan.limites.productos
  form.historialMeses = plan.limites.historialMeses
  aviso.value = ''
}

function guardar(plan: Plan) {
  const limites = {
    sucursales: Math.max(1, Math.floor(form.sucursales) || 1),
    usuarios: Math.max(1, Math.floor(form.usuarios) || 1),
    productos: Math.max(1, Math.floor(form.productos) || 1),
    historialMeses: Math.max(1, Math.floor(form.historialMeses) || 1),
  }
  guardarTopesPlan(plan.id, limites)
  aviso.value = `Topes de ${plan.nombre} guardados. Las tarjetas de precios ya usan estos cupos.`
  editando.value = null
}
</script>

<template>
  <div>
    <Encabezado titulo="Planes y precios" descripcion="Catálogo de licencias que ven los clientes al crear su cuenta, con su desempeño." />

    <div class="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
      <UiCard v-for="p in metricas.porPlan" :key="p.plan.id" class="flex flex-col bg-white p-6">
        <div class="flex items-start justify-between gap-3">
          <div>
            <UiBadge v-if="p.plan.destacado" variant="gold" class="mb-2">Destacado</UiBadge>
            <h3 class="text-xl font-extrabold" :style="{ color: acentoPlan(p.plan, tema === 'oscuro') }">{{ p.plan.nombre }}</h3>
            <p class="text-sm text-slate-500">{{ p.plan.lema }}</p>
          </div>
          <img :src="mascotaPlan[p.plan.id].src" :alt="mascotaPlan[p.plan.id].alt" class="h-16 w-auto shrink-0" />
        </div>

        <p class="mt-5 text-3xl font-extrabold">{{ precio(p.plan.precioMensual) }}<span class="text-sm font-medium text-slate-400"> /mes</span></p>
        <p class="text-sm text-slate-500">{{ precio(precioPlan(p.plan, 'anual')) }} al año</p>

        <div class="mt-5 grid grid-cols-3 gap-2 text-center">
          <div class="rounded-xl bg-emerald-50 p-3">
            <p class="text-xl font-extrabold text-emerald-700">{{ detalle(p.plan).activas }}</p>
            <p class="text-[11px] font-semibold text-emerald-700/70">De pago</p>
          </div>
          <div class="rounded-xl bg-blue-50 p-3">
            <p class="text-xl font-extrabold text-blue-700">{{ detalle(p.plan).prueba }}</p>
            <p class="text-[11px] font-semibold text-blue-700/70">En prueba</p>
          </div>
          <div class="rounded-xl bg-slate-50 p-3">
            <p class="text-xl font-extrabold">{{ detalle(p.plan).anuales }}</p>
            <p class="text-[11px] font-semibold text-slate-500">Anuales</p>
          </div>
        </div>

        <div class="mt-5">
          <div class="flex justify-between text-sm">
            <span class="text-slate-500">Aporta al ingreso mensual</span>
            <strong>{{ dinero(p.mrr) }}</strong>
          </div>
          <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div class="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400" :style="{ width: `${(p.mrr / mrrTotal) * 100}%` }" />
          </div>
        </div>

        <ul class="mt-5 grid list-none grid-cols-2 gap-2 p-0 text-xs font-semibold text-slate-600">
          <li class="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2"><Store class="size-3.5 text-blue-600" /> {{ limite(p.plan.limites.sucursales, 'sucursales') }}</li>
          <li class="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2"><Users class="size-3.5 text-blue-600" /> {{ limite(p.plan.limites.usuarios, 'usuarios') }}</li>
          <li class="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2"><Package class="size-3.5 text-blue-600" /> {{ limite(p.plan.limites.productos, 'productos') }}</li>
          <li class="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2"><Clock class="size-3.5 text-blue-600" /> {{ limite(p.plan.limites.historialMeses, 'meses') }}</li>
        </ul>

        <form v-if="editando === p.plan.id" class="mt-5 grid grid-cols-2 gap-3" @submit.prevent="guardar(p.plan)">
          <label class="text-xs font-semibold text-slate-600">
            Sucursales
            <input v-model.number="form.sucursales" type="number" min="1" class="ip-input mt-1" required />
          </label>
          <label class="text-xs font-semibold text-slate-600">
            Usuarios
            <input v-model.number="form.usuarios" type="number" min="1" class="ip-input mt-1" required />
          </label>
          <label class="text-xs font-semibold text-slate-600">
            Productos
            <input v-model.number="form.productos" type="number" min="1" class="ip-input mt-1" required />
          </label>
          <label class="text-xs font-semibold text-slate-600">
            Meses de historial
            <input v-model.number="form.historialMeses" type="number" min="1" class="ip-input mt-1" required />
          </label>
          <div class="col-span-2 flex gap-2">
            <UiButton type="submit" size="sm">Guardar topes</UiButton>
            <UiButton type="button" variant="ghost" size="sm" @click="editando = null">Cancelar</UiButton>
          </div>
        </form>
        <UiButton v-else class="mt-5" variant="outline" size="sm" @click="abrir(p.plan)">Cambiar topes</UiButton>

        <ul class="mt-5 flex-1 list-none space-y-2 border-t border-slate-100 p-0 pt-5 text-sm text-slate-600">
          <li v-for="item in p.plan.incluye" :key="item" class="flex items-start gap-2">
            <Check class="mt-0.5 size-4 shrink-0 text-emerald-500" />
            {{ item }}
          </li>
        </ul>
      </UiCard>
    </div>

    <p v-if="aviso" class="mt-6 text-sm font-semibold text-emerald-700" role="status">{{ aviso }}</p>
    <p class="mt-6 text-sm text-slate-500">
      Ningún plan queda ilimitado: un cupo cerrado evita que sucursales, usuarios, productos o historial crezcan sin tope en la base.
      «Cambiar topes» guarda los números en este navegador y actualiza las tarjetas de precios.
    </p>
  </div>
</template>
