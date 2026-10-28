<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { CircleCheck, PackagePlus, PackageX, Pencil, Plus, Search, Trash, TriangleAlert } from '@lucide/vue'
import IconoProducto from '../icons/IconoProducto.vue'
import UiBadge from '../ui/Badge.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import UiModal from '../ui/Modal.vue'
import AvisoLimite from './AvisoLimite.vue'
import SurtirProducto from './SurtirProducto.vue'
import Encabezado from '../ui/Encabezado.vue'
import { ICONOS_PRODUCTO, iconoPorCategoria, type IconoProductoId } from '@/lib/iconosProducto'
import {
  actualizarProducto,
  agotados,
  crearProducto,
  eliminarProducto,
  estado,
  estadoStock,
  porAcabarse,
  puede,
  puedeAgregar,
  resumenUso,
  stock,
  sucursalActiva,
  type EstadoStock,
  type Producto,
} from '@/stores/negocio'
import { ErrorApi } from '@/lib/api'
import { dinero, plural } from '@/lib/formato'

defineEmits(['cambiarPlan'])

/** Costo y margen: admin (ganancias) o quien edita catálogo (almacén). */
const verCostos = computed(() => puede('ganancias.ver') || puede('productos.editar'))

const busqueda = ref('')
const filtro = ref<'todos' | Exclude<EstadoStock, 'ok'>>('todos')
const modalAbierto = ref(false)
const editando = ref<Producto | null>(null)
const surtiendo = ref<Producto | null>(null)
const confirmacion = ref('')
const errorForm = ref('')
const guardando = ref(false)
let temporizador = 0
const form = reactive({
  sku: '',
  nombre: '',
  categoria: '',
  precio: 0,
  costo: 0,
  stockMinimo: 10,
  caducidad: '',
  existenciaInicial: 0,
  icono: 'paleta' as IconoProductoId,
})

/** Siguiente SKU libre tipo PAL-001 (evita chocar con los de ejemplo). */
function siguienteSku() {
  const usados = new Set(estado.productos.map((p) => p.sku.toUpperCase()))
  for (let i = 1; i <= usados.size + 50; i++) {
    const candidato = `PAL-${String(i).padStart(3, '0')}`
    if (!usados.has(candidato)) return candidato
  }
  return `PAL-${Date.now().toString().slice(-6)}`
}

const categorias = computed(() => [...new Set(estado.productos.map((p) => p.categoria))])

const filtros = computed(() => [
  { id: 'todos' as const, etiqueta: 'Todos', total: estado.productos.length },
  { id: 'agotado' as const, etiqueta: 'Agotados', total: agotados.value.length },
  { id: 'bajo' as const, etiqueta: 'Por acabarse', total: porAcabarse.value.length },
])

const lista = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return estado.productos.filter(
    (p) =>
      (filtro.value === 'todos' || estadoStock(p) === filtro.value) &&
      `${p.nombre} ${p.sku} ${p.categoria}`.toLowerCase().includes(texto),
  )
})

function alSurtir(cantidad: number) {
  confirmacion.value = `Agregaste ${plural(cantidad, 'pieza', 'piezas')} de ${surtiendo.value?.nombre}.`
  surtiendo.value = null
  clearTimeout(temporizador)
  temporizador = window.setTimeout(() => (confirmacion.value = ''), 3500)
}

onBeforeUnmount(() => clearTimeout(temporizador))

const valorInventario = computed(() => estado.productos.reduce((suma, p) => suma + p.costo * stock(p), 0))

const margen = (producto: Producto) =>
  producto.precio ? Math.round(((producto.precio - producto.costo) / producto.precio) * 100) : 0

function abrirNuevo() {
  editando.value = null
  errorForm.value = ''
  const categoria = categorias.value[0] ?? 'Comida'
  Object.assign(form, {
    sku: siguienteSku(),
    nombre: '',
    categoria,
    precio: 0,
    costo: 0,
    stockMinimo: 10,
    caducidad: '',
    existenciaInicial: 0,
    icono: iconoPorCategoria(categoria),
  })
  modalAbierto.value = true
}

function abrirEditar(producto: Producto) {
  editando.value = producto
  errorForm.value = ''
  const { sku, nombre, categoria, precio, costo, stockMinimo, caducidad, icono } = producto
  Object.assign(form, {
    sku,
    nombre,
    categoria,
    precio,
    costo,
    stockMinimo,
    caducidad: caducidad ?? '',
    existenciaInicial: 0,
    icono: (icono as IconoProductoId) || iconoPorCategoria(categoria),
  })
  modalAbierto.value = true
}

async function guardar() {
  errorForm.value = ''
  const sku = form.sku.trim()
  if (!editando.value && estado.productos.some((p) => p.sku.toUpperCase() === sku.toUpperCase())) {
    errorForm.value = `Ya existe un producto con el SKU ${sku}. Usa otro (por ejemplo ${siguienteSku()}).`
    return
  }
  guardando.value = true
  try {
    const { existenciaInicial, ...datos } = form
    if (editando.value) await actualizarProducto(editando.value.id, { ...datos, sku })
    else await crearProducto({ ...datos, sku, existenciaInicial })
    modalAbierto.value = false
    confirmacion.value = editando.value ? `Se actualizó ${form.nombre}.` : `Se agregó ${form.nombre}.`
    clearTimeout(temporizador)
    temporizador = window.setTimeout(() => (confirmacion.value = ''), 3500)
  } catch (e) {
    errorForm.value = e instanceof ErrorApi ? e.message : 'No se pudo guardar el producto. ¿Está corriendo la API?'
  } finally {
    guardando.value = false
  }
}

async function eliminar(producto: Producto) {
  if (confirm(`¿Eliminar "${producto.nombre}" del catálogo?`)) await eliminarProducto(producto.id)
}
</script>

<template>
  <div>
    <Encabezado titulo="Productos" :descripcion="`${resumenUso('productos')} · existencias de ${sucursalActiva?.nombre}`">
      <UiButton v-if="puede('productos.crear')" :disabled="!puedeAgregar('productos')" @click="abrirNuevo">
        <Plus class="size-4" />
        Nuevo producto
      </UiButton>
    </Encabezado>

    <AvisoLimite limite="productos" @cambiarPlan="$emit('cambiarPlan')" />

    <div
      v-if="agotados.length || porAcabarse.length"
      :class="['mb-6 grid gap-4', agotados.length && porAcabarse.length ? 'lg:grid-cols-2' : '']"
    >
      <section v-if="agotados.length" class="rounded-2xl bg-rose-50 p-5 ring-1 ring-rose-200">
        <div class="flex items-start gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-600 text-white">
            <PackageX class="size-5" />
          </span>
          <div>
            <h3 class="font-display font-semibold text-rose-700">
              {{ agotados.length === 1 ? 'Te quedaste sin 1 producto' : `Te quedaste sin ${agotados.length} productos` }}
            </h3>
            <p class="text-sm text-slate-600">No se pueden vender hasta que los surtas.</p>
          </div>
        </div>
        <ul class="mt-4 max-h-56 list-none space-y-2 overflow-y-auto p-0">
          <li
            v-for="producto in agotados"
            :key="producto.id"
            class="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200"
          >
            <IconoProducto :icono="producto.icono" :categoria="producto.categoria" :size="22" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-900" :title="producto.nombre">{{ producto.nombre }}</p>
              <p class="text-xs font-semibold text-rose-700">0 piezas</p>
            </div>
            <UiButton v-if="puede('entradas.crear')" size="sm" @click="surtiendo = producto">
              <PackagePlus class="size-4" />
              Surtir
            </UiButton>
          </li>
        </ul>
      </section>

      <section v-if="porAcabarse.length" class="rounded-2xl bg-orange-50 p-5 ring-1 ring-orange-200">
        <div class="flex items-start gap-3">
          <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-600 text-white">
            <TriangleAlert class="size-5" />
          </span>
          <div>
            <h3 class="font-display font-semibold text-orange-800">
              {{ porAcabarse.length === 1 ? '1 producto se está acabando' : `${porAcabarse.length} productos se están acabando` }}
            </h3>
            <p class="text-sm text-slate-600">Llegaron a su stock mínimo o están por debajo.</p>
          </div>
        </div>
        <ul class="mt-4 max-h-56 list-none space-y-2 overflow-y-auto p-0">
          <li
            v-for="producto in porAcabarse"
            :key="producto.id"
            class="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-slate-200"
          >
            <IconoProducto :icono="producto.icono" :categoria="producto.categoria" :size="22" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-900" :title="producto.nombre">{{ producto.nombre }}</p>
              <div class="mt-1 flex items-center gap-2">
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div
                    class="h-full rounded-full bg-orange-500"
                    :style="{ width: `${Math.min(100, (stock(producto) / Math.max(1, producto.stockMinimo)) * 100)}%` }"
                  />
                </div>
                <span class="shrink-0 text-xs font-semibold text-orange-700 tabular-nums">
                  Quedan {{ stock(producto) }} · mín. {{ producto.stockMinimo }}
                </span>
              </div>
            </div>
            <UiButton v-if="puede('entradas.crear')" variant="outline" size="sm" @click="surtiendo = producto">
              <PackagePlus class="size-4" />
              Surtir
            </UiButton>
          </li>
        </ul>
      </section>
    </div>

    <p
      v-else-if="estado.productos.length"
      class="mb-6 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200"
    >
      <CircleCheck class="size-4 shrink-0" />
      Todo tu inventario de {{ sucursalActiva?.nombre }} está surtido.
    </p>

    <div :class="['ip-tira mb-6', verCostos ? 'sm:grid-cols-3' : 'sm:grid-cols-2']">
      <div class="p-5">
        <p class="text-sm text-slate-500">Productos en catálogo</p>
        <p class="ip-cifra mt-2 text-2xl text-slate-900">{{ estado.productos.length.toLocaleString('es-MX') }}</p>
      </div>
      <div class="p-5">
        <p class="text-sm text-slate-500">Categorías</p>
        <p class="ip-cifra mt-2 text-2xl text-slate-900">{{ categorias.length.toLocaleString('es-MX') }}</p>
      </div>
      <div v-if="verCostos" class="p-5">
        <p class="text-sm text-slate-500">Valor del inventario (costo)</p>
        <p class="ip-cifra mt-2 text-2xl text-slate-900">{{ dinero(valorInventario) }}</p>
      </div>
    </div>

    <UiCard class="overflow-hidden bg-white">
      <div class="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center md:justify-between">
        <label class="relative block w-full max-w-sm">
          <span class="sr-only">Buscar</span>
          <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
          <input v-model="busqueda" class="ip-input ip-input-icono" placeholder="Buscar producto, SKU o categoría" />
        </label>
        <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar por existencia">
          <button
            v-for="opcion in filtros"
            :key="opcion.id"
            type="button"
            :class="[
              'inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border-0 px-4 py-2 text-sm font-semibold transition-colors',
              filtro === opcion.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-blue-300',
            ]"
            :aria-pressed="filtro === opcion.id"
            @click="filtro = opcion.id"
          >
            {{ opcion.etiqueta }}
            <span
              :class="[
                'grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] leading-5 font-bold tabular-nums',
                opcion.id === 'agotado' && opcion.total
                  ? 'bg-rose-600 text-white'
                  : opcion.id === 'bajo' && opcion.total
                    ? 'bg-orange-700 text-white'
                    : 'bg-slate-100 text-slate-600',
              ]"
            >
              {{ opcion.total }}
            </span>
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="ip-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th class="text-right">Precio</th>
              <th v-if="verCostos" class="text-right">Costo</th>
              <th v-if="verCostos" class="text-right">Margen</th>
              <th class="text-center">Existencia</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="producto in lista" :key="producto.id">
              <td>
                <div class="flex items-center gap-3">
                  <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-50">
                    <IconoProducto :icono="producto.icono" :categoria="producto.categoria" :size="24" />
                  </span>
                  <div class="min-w-0 max-w-64">
                    <p class="font-semibold [overflow-wrap:anywhere] text-slate-900">{{ producto.nombre }}</p>
                    <p class="truncate text-xs text-slate-500">{{ producto.categoria }}</p>
                  </div>
                </div>
              </td>
              <td class="font-mono text-xs whitespace-nowrap">{{ producto.sku }}</td>
              <td class="text-right font-semibold whitespace-nowrap text-slate-900 tabular-nums">{{ dinero(producto.precio) }}</td>
              <td v-if="verCostos" class="text-right whitespace-nowrap tabular-nums">{{ dinero(producto.costo) }}</td>
              <td v-if="verCostos" class="text-right tabular-nums">
                <span :class="margen(producto) >= 40 ? 'text-emerald-700' : 'text-orange-700'">{{ margen(producto) }}%</span>
              </td>
              <td class="text-center">
                <UiBadge v-if="stock(producto) === 0" variant="peligro">Agotado</UiBadge>
                <UiBadge v-else-if="stock(producto) <= producto.stockMinimo" variant="aviso" class="tabular-nums">
                  {{ stock(producto).toLocaleString('es-MX') }} · por acabarse
                </UiBadge>
                <UiBadge v-else variant="ok" class="tabular-nums">{{ stock(producto).toLocaleString('es-MX') }}</UiBadge>
              </td>
              <td>
                <div class="flex justify-end gap-1">
                  <UiButton
                    v-if="puede('entradas.crear')"
                    :variant="estadoStock(producto) === 'ok' ? 'ghost' : 'outline'"
                    size="sm"
                    aria-label="Agregar existencias"
                    title="Agregar existencias"
                    @click="surtiendo = producto"
                  >
                    <PackagePlus class="size-4" />
                    <span v-if="estadoStock(producto) !== 'ok'">Surtir</span>
                  </UiButton>
                  <UiButton
                    v-if="puede('productos.editar')"
                    variant="ghost"
                    size="sm"
                    aria-label="Editar"
                    @click="abrirEditar(producto)"
                  >
                    <Pencil class="size-4" />
                  </UiButton>
                  <UiButton
                    v-if="puede('productos.eliminar')"
                    variant="ghost"
                    size="sm"
                    class="hover:text-rose-600"
                    aria-label="Eliminar"
                    @click="eliminar(producto)"
                  >
                    <Trash class="size-4" />
                  </UiButton>
                </div>
              </td>
            </tr>
            <tr v-if="!lista.length">
              <td colspan="7" class="py-12 text-center text-slate-500">
                {{
                  filtro === 'agotado'
                    ? 'No tienes productos agotados.'
                    : filtro === 'bajo'
                      ? 'Ningún producto se está acabando.'
                      : 'No hay productos que coincidan.'
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <UiModal v-if="modalAbierto" :titulo="editando ? 'Editar producto' : 'Nuevo producto'" @cerrar="modalAbierto = false">
      <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="guardar">
        <div class="sm:col-span-2">
          <label class="ip-label" for="p-nombre">Nombre</label>
          <input id="p-nombre" v-model.trim="form.nombre" class="ip-input" required placeholder="Paleta de guayaba" />
        </div>
        <div>
          <label class="ip-label" for="p-sku">SKU</label>
          <input id="p-sku" v-model.trim="form.sku" class="ip-input" required />
        </div>
        <div>
          <label class="ip-label" for="p-categoria">Categoría</label>
          <input id="p-categoria" v-model.trim="form.categoria" class="ip-input" list="lista-categorias" required />
          <datalist id="lista-categorias">
            <option v-for="c in categorias" :key="c" :value="c" />
          </datalist>
        </div>
        <div class="sm:col-span-2">
          <p class="ip-label" id="p-icono-label">Icono del producto</p>
          <div class="iconos-grid" role="radiogroup" aria-labelledby="p-icono-label">
            <button
              v-for="opcion in ICONOS_PRODUCTO"
              :key="opcion.id"
              type="button"
              role="radio"
              :aria-checked="form.icono === opcion.id"
              :title="opcion.etiqueta"
              :class="['icono-opcion', form.icono === opcion.id && 'icono-opcion--activa']"
              @click="form.icono = opcion.id"
            >
              <IconoProducto :forzar="opcion.id" :size="26" />
              <span>{{ opcion.etiqueta }}</span>
            </button>
          </div>
        </div>
        <div>
          <label class="ip-label" for="p-precio">Precio de venta</label>
          <input id="p-precio" v-model.number="form.precio" type="number" min="0" step="0.5" class="ip-input" required />
        </div>
        <div v-if="verCostos">
          <label class="ip-label" for="p-costo">Costo</label>
          <input id="p-costo" v-model.number="form.costo" type="number" min="0" step="0.5" class="ip-input" required />
        </div>
        <div>
          <label class="ip-label" for="p-minimo">Stock mínimo</label>
          <input id="p-minimo" v-model.number="form.stockMinimo" type="number" min="0" class="ip-input" required />
        </div>
        <div>
          <label class="ip-label" for="p-caducidad">Caducidad (opcional)</label>
          <input id="p-caducidad" v-model="form.caducidad" type="date" class="ip-input" />
        </div>
        <div v-if="!editando">
          <label class="ip-label" for="p-inicial">Existencia inicial</label>
          <input id="p-inicial" v-model.number="form.existenciaInicial" type="number" min="0" class="ip-input" />
        </div>
        <p v-if="errorForm" class="sm:col-span-2 m-0 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          {{ errorForm }}
        </p>
        <div class="mt-2 flex justify-end gap-3 sm:col-span-2">
          <UiButton type="button" variant="outline" :disabled="guardando" @click="modalAbierto = false">Cancelar</UiButton>
          <UiButton type="submit" :disabled="guardando">
            {{ guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Agregar producto' }}
          </UiButton>
        </div>
      </form>
    </UiModal>

    <SurtirProducto v-if="surtiendo" :producto="surtiendo" @cerrar="surtiendo = null" @surtido="alSurtir" />

    <Transition name="aviso">
      <p v-if="confirmacion" role="status" class="ip-aviso flex items-center gap-2">
        <CircleCheck class="size-4 shrink-0 text-emerald-400" />
        {{ confirmacion }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.iconos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
  gap: 0.5rem;
  max-height: 14rem;
  overflow: auto;
  padding: 0.25rem;
}

.icono-opcion {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  min-height: 4.25rem;
  padding: 0.5rem 0.25rem;
  border: 0;
  border-radius: 0.75rem;
  background: #f8fafc;
  box-shadow: inset 0 0 0 1px #e2e8f0;
  color: #334155;
  font: inherit;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.15;
  text-align: center;
  cursor: pointer;
}

.icono-opcion--activa {
  background: var(--marca-50, #eff6ff);
  box-shadow: inset 0 0 0 2px var(--marca-600, #2563eb);
  color: var(--marca-800, #1e40af);
}

html.oscuro .icono-opcion {
  background: rgb(255 255 255 / 0.04);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
  color: #e2e8f0;
}

html.oscuro .icono-opcion--activa {
  background: rgb(96 165 250 / 0.12);
  box-shadow: inset 0 0 0 2px var(--marca-400, #60a5fa);
  color: #fff;
}
</style>
