<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { CircleCheck, PackagePlus, Truck, Wallet } from '@lucide/vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Encabezado from './Encabezado.vue'
import { estado, registrarEntrada, stock, sucursalActiva } from '@/stores/negocio'
import { dinero, fechaYHora } from '@/lib/formato'

const form = reactive({
  productoId: estado.productos[0]?.id ?? '',
  cantidad: 1,
  costoUnitario: estado.productos[0]?.costo ?? 0,
  proveedor: '',
  nota: '',
})
const exito = ref(false)

const seleccionado = computed(() => estado.productos.find((p) => p.id === form.productoId))

watch(
  () => form.productoId,
  () => {
    if (seleccionado.value) form.costoUnitario = seleccionado.value.costo
  },
)

const entradas = computed(() => estado.entradas.filter((e) => e.sucursalId === sucursalActiva.value?.id))
const delMes = computed(() => {
  const hoy = new Date()
  return entradas.value.filter((e) => {
    const f = new Date(e.fecha)
    return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
  })
})
const unidades = computed(() => delMes.value.reduce((suma, e) => suma + e.cantidad, 0))
const inversion = computed(() => delMes.value.reduce((suma, e) => suma + e.cantidad * e.costoUnitario, 0))
const proveedores = computed(() => [...new Set(estado.entradas.map((e) => e.proveedor).filter(Boolean))])

function registrar() {
  registrarEntrada({ ...form })
  exito.value = true
  form.cantidad = 1
  form.nota = ''
  setTimeout(() => (exito.value = false), 2500)
}
</script>

<template>
  <div>
    <Encabezado titulo="Entradas de productos" :descripcion="`Registra la mercancía que llega a ${sucursalActiva?.nombre}.`" />

    <div class="mb-6 grid gap-5 sm:grid-cols-3">
      <UiCard class="flex items-center gap-4 p-5">
        <span class="grid size-11 place-items-center rounded-xl bg-blue-600/10 text-blue-600"><PackagePlus class="size-5" /></span>
        <div>
          <p class="text-sm text-slate-500">Entradas este mes</p>
          <p class="text-2xl font-extrabold">{{ delMes.length }}</p>
        </div>
      </UiCard>
      <UiCard class="flex items-center gap-4 p-5">
        <span class="grid size-11 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600"><Truck class="size-5" /></span>
        <div>
          <p class="text-sm text-slate-500">Piezas recibidas</p>
          <p class="text-2xl font-extrabold">{{ unidades }}</p>
        </div>
      </UiCard>
      <UiCard class="flex items-center gap-4 p-5">
        <span class="grid size-11 place-items-center rounded-xl bg-amber-300/30 text-amber-700"><Wallet class="size-5" /></span>
        <div>
          <p class="text-sm text-slate-500">Inversión del mes</p>
          <p class="text-2xl font-extrabold">{{ dinero(inversion) }}</p>
        </div>
      </UiCard>
    </div>

    <div class="grid gap-6 lg:grid-cols-[380px_1fr]">
      <UiCard class="h-fit bg-white p-6">
        <h3 class="text-lg font-bold">Nueva entrada</h3>
        <p class="mb-5 text-sm text-slate-500">Suma piezas al inventario de esta sucursal.</p>

        <form class="space-y-4" @submit.prevent="registrar">
          <div>
            <label class="ip-label" for="e-producto">Producto</label>
            <select id="e-producto" v-model="form.productoId" class="ip-input cursor-pointer" required>
              <option v-for="p in estado.productos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
            </select>
            <p v-if="seleccionado" class="mt-1.5 text-xs text-slate-500">
              Hoy tienes <strong>{{ stock(seleccionado) }}</strong> · quedarán
              <strong class="text-emerald-600">{{ stock(seleccionado) + (form.cantidad || 0) }}</strong>
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="ip-label" for="e-cantidad">Cantidad</label>
              <input id="e-cantidad" v-model.number="form.cantidad" type="number" min="1" class="ip-input" required />
            </div>
            <div>
              <label class="ip-label" for="e-costo">Costo unitario</label>
              <input id="e-costo" v-model.number="form.costoUnitario" type="number" min="0" step="0.5" class="ip-input" required />
            </div>
          </div>
          <div>
            <label class="ip-label" for="e-proveedor">Proveedor</label>
            <input id="e-proveedor" v-model.trim="form.proveedor" class="ip-input" list="lista-proveedores" placeholder="Nombre del proveedor" required />
            <datalist id="lista-proveedores">
              <option v-for="p in proveedores" :key="p" :value="p" />
            </datalist>
          </div>
          <div>
            <label class="ip-label" for="e-nota">Nota (opcional)</label>
            <input id="e-nota" v-model.trim="form.nota" class="ip-input" placeholder="Factura, lote, observaciones…" />
          </div>
          <p class="flex justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <span class="text-slate-500">Total de la compra</span>
            <strong>{{ dinero((form.cantidad || 0) * (form.costoUnitario || 0)) }}</strong>
          </p>
          <UiButton type="submit" class="w-full" :disabled="!estado.productos.length">Registrar entrada</UiButton>
          <Transition name="aviso">
            <p v-if="exito" class="flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <CircleCheck class="size-4" /> Entrada registrada y stock actualizado.
            </p>
          </Transition>
        </form>
      </UiCard>

      <UiCard class="overflow-hidden bg-white">
        <div class="p-6 pb-4">
          <h3 class="text-lg font-bold">Historial de entradas</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="ip-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Proveedor</th>
                <th class="text-right">Cantidad</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entrada in entradas" :key="entrada.id">
                <td class="font-bold text-slate-900">E-{{ String(entrada.folio).padStart(4, '0') }}</td>
                <td class="whitespace-nowrap">{{ fechaYHora(entrada.fecha) }}</td>
                <td>
                  <p class="font-semibold text-slate-900">{{ entrada.producto }}</p>
                  <p v-if="entrada.nota" class="text-xs text-slate-400">{{ entrada.nota }}</p>
                </td>
                <td>{{ entrada.proveedor }}</td>
                <td class="text-right font-semibold text-emerald-600">+{{ entrada.cantidad }}</td>
                <td class="text-right">{{ dinero(entrada.cantidad * entrada.costoUnitario) }}</td>
              </tr>
              <tr v-if="!entradas.length">
                <td colspan="6" class="py-14 text-center text-slate-400">
                  Todavía no registras entradas en esta sucursal.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiCard>
    </div>
  </div>
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
