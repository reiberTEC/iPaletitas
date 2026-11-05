<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { CircleCheck, PackageMinus, TriangleAlert, Wallet } from '@lucide/vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Encabezado from '../ui/Encabezado.vue'
import {
  caducados,
  diasParaCaducar,
  estado,
  estadoCaducidad,
  perdidasSucursal,
  porCaducar,
  puede,
  registrarPerdida,
  stock,
  sucursalActiva,
  type MotivoPerdida,
  type Producto,
} from '@/stores/negocio'
import { dinero, fechaDia, fechaYHora, plural } from '@/lib/formato'

const MOTIVOS: MotivoPerdida[] = ['Caducidad', 'Daño', 'Merma', 'Otro']

const form = reactive({
  productoId: '',
  cantidad: 1,
  motivo: 'Caducidad' as MotivoPerdida,
  nota: '',
})
const exito = ref('')

const conExistencia = computed(() =>
  estado.productos.filter((p) => stock(p) > 0).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
)

const seleccionado = computed(() => estado.productos.find((p) => p.id === form.productoId))

watch(
  conExistencia,
  (lista) => {
    if (!lista.some((p) => p.id === form.productoId)) {
      const preferido = caducados.value[0] ?? porCaducar.value[0] ?? lista[0]
      form.productoId = preferido?.id ?? ''
    }
  },
  { immediate: true },
)

watch(seleccionado, (producto) => {
  if (!producto) return
  form.cantidad = Math.min(form.cantidad || 1, stock(producto)) || 1
  if (estadoCaducidad(producto) === 'caducado') form.motivo = 'Caducidad'
})

const delMes = computed(() => {
  const ahora = new Date()
  return perdidasSucursal.value.filter((p) => {
    const f = new Date(p.fecha)
    return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear()
  })
})
const unidadesMes = computed(() => delMes.value.reduce((suma, p) => suma + p.cantidad, 0))
const perdidaMes = computed(() => delMes.value.reduce((suma, p) => suma + p.cantidad * p.costoUnitario, 0))
const enRiesgo = computed(() => caducados.value.length + porCaducar.value.length)

function etiquetaCaducidad(producto: Producto) {
  const dias = diasParaCaducar(producto)
  if (dias === null) return 'Sin fecha de caducidad'
  if (dias < 0) return `Caducó hace ${plural(Math.abs(dias), 'día', 'días')} · ${fechaDia(producto.caducidad!)}`
  if (dias === 0) return `Caduca hoy · ${fechaDia(producto.caducidad!)}`
  return `Caduca en ${plural(dias, 'día', 'días')} · ${fechaDia(producto.caducidad!)}`
}

function elegir(producto: Producto) {
  form.productoId = producto.id
  form.cantidad = stock(producto)
  form.motivo = estadoCaducidad(producto) === 'caducado' ? 'Caducidad' : form.motivo
}

async function registrar() {
  const perdida = await registrarPerdida({ ...form })
  if (!perdida) return
  exito.value = `Pasaste ${plural(perdida.cantidad, 'pieza', 'piezas')} de ${perdida.producto} a pérdida (${dinero(perdida.cantidad * perdida.costoUnitario)}).`
  form.cantidad = 1
  form.nota = ''
  window.setTimeout(() => (exito.value = ''), 3500)
}
</script>

<template>
  <div>
    <Encabezado
      titulo="Caducados"
      :descripcion="
        puede('perdidas.crear')
          ? `Lo que ya no se puede vender en ${sucursalActiva?.nombre} se baja del inventario y queda como pérdida.`
          : `Consulta las bajas por caducidad y merma de ${sucursalActiva?.nombre}.`
      "
    />

    <div class="ip-tira mb-6 sm:grid-cols-3">
      <div class="flex items-center gap-4 p-5">
        <span class="ip-picto size-10"><TriangleAlert class="size-5" /></span>
        <div class="min-w-0">
          <p class="text-sm text-slate-500">En riesgo ahora</p>
          <p class="ip-cifra text-2xl text-slate-900">{{ enRiesgo.toLocaleString('es-MX') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-4 p-5">
        <span class="ip-picto size-10"><PackageMinus class="size-5" /></span>
        <div class="min-w-0">
          <p class="text-sm text-slate-500">Piezas a pérdida este mes</p>
          <p class="ip-cifra text-2xl text-slate-900">{{ unidadesMes.toLocaleString('es-MX') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-4 p-5">
        <span class="ip-picto size-10"><Wallet class="size-5" /></span>
        <div class="min-w-0">
          <p class="text-sm text-slate-500">Costo perdido del mes</p>
          <p class="ip-cifra text-2xl text-slate-900">{{ dinero(perdidaMes) }}</p>
        </div>
      </div>
    </div>

    <div
      v-if="caducados.length || porCaducar.length"
      :class="['mb-6 grid gap-4', caducados.length && porCaducar.length ? 'lg:grid-cols-2' : '']"
    >
      <section v-if="caducados.length" class="rounded-2xl bg-rose-50 p-5 ring-1 ring-rose-200">
        <h3 class="font-display font-semibold text-rose-700">
          {{ caducados.length === 1 ? '1 producto caducado' : `${caducados.length} productos caducados` }}
        </h3>
        <p class="text-sm text-slate-600">Ya no se deben vender. Pásalos a pérdida para cuadrar el inventario.</p>
        <ul class="mt-4 max-h-56 list-none space-y-2 overflow-y-auto p-0">
          <li
            v-for="producto in caducados"
            :key="producto.id"
            class="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-900" :title="producto.nombre">{{ producto.nombre }}</p>
              <p class="text-xs font-semibold text-rose-700">{{ etiquetaCaducidad(producto) }} · {{ stock(producto) }} pzas</p>
            </div>
            <UiButton v-if="puede('perdidas.crear')" size="sm" @click="elegir(producto)">A pérdida</UiButton>
          </li>
        </ul>
      </section>

      <section v-if="porCaducar.length" class="rounded-2xl bg-orange-50 p-5 ring-1 ring-orange-200">
        <h3 class="font-display font-semibold text-orange-800">
          {{ porCaducar.length === 1 ? '1 producto por caducar' : `${porCaducar.length} productos por caducar` }}
        </h3>
        <p class="text-sm text-slate-600">Vencen en 7 días o menos. Véndelos primero o prepáralos para baja.</p>
        <ul class="mt-4 max-h-56 list-none space-y-2 overflow-y-auto p-0">
          <li
            v-for="producto in porCaducar"
            :key="producto.id"
            class="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-900" :title="producto.nombre">{{ producto.nombre }}</p>
              <p class="text-xs font-semibold text-orange-700">{{ etiquetaCaducidad(producto) }} · {{ stock(producto) }} pzas</p>
            </div>
            <UiButton v-if="puede('perdidas.crear')" variant="outline" size="sm" @click="elegir(producto)">
              Preparar baja
            </UiButton>
          </li>
        </ul>
      </section>
    </div>

    <p
      v-else
      class="mb-6 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200"
    >
      <CircleCheck class="size-4 shrink-0" />
      Ningún producto con existencia está caducado o por caducar en {{ sucursalActiva?.nombre }}.
    </p>

    <div :class="['grid gap-6', puede('perdidas.crear') && 'lg:grid-cols-[380px_1fr]']">
      <UiCard v-if="puede('perdidas.crear')" class="h-fit bg-white p-6">
        <h3 class="font-display text-lg font-semibold">Pasar a pérdida</h3>
        <p class="mb-5 text-sm text-slate-500">Baja piezas del inventario y registra el costo como pérdida.</p>

        <form class="space-y-4" @submit.prevent="registrar">
          <div>
            <label class="ip-label" for="c-producto">Producto</label>
            <select id="c-producto" v-model="form.productoId" class="ip-input cursor-pointer" required>
              <option v-for="p in conExistencia" :key="p.id" :value="p.id">
                {{ p.nombre }} · {{ stock(p) }} pzas
              </option>
            </select>
            <p v-if="seleccionado" class="mt-1.5 text-xs text-slate-500">{{ etiquetaCaducidad(seleccionado) }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="ip-label" for="c-cantidad">Cantidad</label>
              <input
                id="c-cantidad"
                v-model.number="form.cantidad"
                type="number"
                min="1"
                :max="seleccionado ? stock(seleccionado) : undefined"
                class="ip-input"
                required
              />
            </div>
            <div>
              <label class="ip-label" for="c-motivo">Motivo</label>
              <select id="c-motivo" v-model="form.motivo" class="ip-input cursor-pointer" required>
                <option v-for="m in MOTIVOS" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
          </div>
          <div>
            <label class="ip-label" for="c-nota">Nota (opcional)</label>
            <input id="c-nota" v-model.trim="form.nota" class="ip-input" placeholder="Lote, observación…" />
          </div>
          <p class="flex justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <span class="text-slate-500">Costo de la pérdida</span>
            <strong class="tabular-nums text-rose-700">
              {{ dinero((form.cantidad || 0) * (seleccionado?.costo || 0)) }}
            </strong>
          </p>
          <UiButton type="submit" class="w-full" :disabled="!conExistencia.length">Registrar pérdida</UiButton>
          <Transition name="aviso">
            <p v-if="exito" role="status" class="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CircleCheck class="size-4 shrink-0" /> {{ exito }}
            </p>
          </Transition>
        </form>
      </UiCard>

      <UiCard class="overflow-hidden bg-white">
        <div class="p-6 pb-4">
          <h3 class="font-display text-lg font-semibold">Historial de pérdidas</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="ip-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Motivo</th>
                <th class="text-right">Cantidad</th>
                <th class="text-right">Costo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in perdidasSucursal" :key="item.id">
                <td class="font-bold text-slate-900">P-{{ String(item.folio).padStart(4, '0') }}</td>
                <td class="whitespace-nowrap">{{ fechaYHora(item.fecha) }}</td>
                <td>
                  <p class="max-w-56 font-semibold [overflow-wrap:anywhere] text-slate-900">{{ item.producto }}</p>
                  <p v-if="item.nota" class="max-w-56 truncate text-xs text-slate-500" :title="item.nota">{{ item.nota }}</p>
                </td>
                <td>{{ item.motivo }}</td>
                <td class="text-right font-semibold text-rose-700 tabular-nums">−{{ item.cantidad.toLocaleString('es-MX') }}</td>
                <td class="text-right whitespace-nowrap tabular-nums text-rose-700">
                  {{ dinero(item.cantidad * item.costoUnitario) }}
                </td>
              </tr>
              <tr v-if="!perdidasSucursal.length">
                <td colspan="6" class="py-14 text-center text-slate-500">
                  Todavía no registras pérdidas en esta sucursal.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UiCard>
    </div>
  </div>
</template>
