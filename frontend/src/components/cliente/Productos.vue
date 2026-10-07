<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Pencil, Plus, Search, Trash } from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import UiBadge from '../ui/Badge.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import UiModal from '../ui/Modal.vue'
import AvisoLimite from './AvisoLimite.vue'
import Encabezado from '../ui/Encabezado.vue'
import { colorCategoria } from './secciones'
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  estado,
  puedeAgregar,
  resumenUso,
  stock,
  sucursalActiva,
  type Producto,
} from '@/stores/negocio'
import { dinero } from '@/lib/formato'

defineEmits(['cambiarPlan'])

const busqueda = ref('')
const modalAbierto = ref(false)
const editando = ref<Producto | null>(null)
const form = reactive({ sku: '', nombre: '', categoria: '', precio: 0, costo: 0, stockMinimo: 10, existenciaInicial: 0 })

const categorias = computed(() => [...new Set(estado.productos.map((p) => p.categoria))])

const lista = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return estado.productos.filter((p) => `${p.nombre} ${p.sku} ${p.categoria}`.toLowerCase().includes(texto))
})

const valorInventario = computed(() => estado.productos.reduce((suma, p) => suma + p.costo * stock(p), 0))

const margen = (producto: Producto) =>
  producto.precio ? Math.round(((producto.precio - producto.costo) / producto.precio) * 100) : 0

function abrirNuevo() {
  editando.value = null
  Object.assign(form, {
    sku: `PAL-${String(estado.productos.length + 1).padStart(3, '0')}`,
    nombre: '',
    categoria: categorias.value[0] ?? '',
    precio: 0,
    costo: 0,
    stockMinimo: 10,
    existenciaInicial: 0,
  })
  modalAbierto.value = true
}

function abrirEditar(producto: Producto) {
  editando.value = producto
  const { sku, nombre, categoria, precio, costo, stockMinimo } = producto
  Object.assign(form, { sku, nombre, categoria, precio, costo, stockMinimo, existenciaInicial: 0 })
  modalAbierto.value = true
}

function guardar() {
  const { existenciaInicial, ...datos } = form
  if (editando.value) actualizarProducto(editando.value.id, datos)
  else crearProducto({ ...datos, existenciaInicial })
  modalAbierto.value = false
}

function eliminar(producto: Producto) {
  if (confirm(`¿Eliminar "${producto.nombre}" del catálogo?`)) eliminarProducto(producto.id)
}
</script>

<template>
  <div>
    <Encabezado titulo="Productos" :descripcion="`${resumenUso('productos')} · existencias de ${sucursalActiva?.nombre}`">
      <UiButton :disabled="!puedeAgregar('productos')" @click="abrirNuevo">
        <Plus class="size-4" />
        Nuevo producto
      </UiButton>
    </Encabezado>

    <AvisoLimite limite="productos" @cambiarPlan="$emit('cambiarPlan')" />

    <div class="mb-6 grid gap-5 sm:grid-cols-3">
      <UiCard class="p-5">
        <p class="text-sm text-slate-500">Productos en catálogo</p>
        <p class="mt-2 text-2xl font-extrabold">{{ estado.productos.length }}</p>
      </UiCard>
      <UiCard class="p-5">
        <p class="text-sm text-slate-500">Categorías</p>
        <p class="mt-2 text-2xl font-extrabold">{{ categorias.length }}</p>
      </UiCard>
      <UiCard class="p-5">
        <p class="text-sm text-slate-500">Valor del inventario (costo)</p>
        <p class="mt-2 text-2xl font-extrabold">{{ dinero(valorInventario) }}</p>
      </UiCard>
    </div>

    <UiCard class="overflow-hidden bg-white">
      <div class="border-b border-slate-100 p-4">
        <label class="relative block max-w-sm">
          <span class="sr-only">Buscar</span>
          <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input v-model="busqueda" class="ip-input ip-input-icono" placeholder="Buscar producto, SKU o categoría" />
        </label>
      </div>
      <div class="overflow-x-auto">
        <table class="ip-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th class="text-right">Precio</th>
              <th class="text-right">Costo</th>
              <th class="text-right">Margen</th>
              <th class="text-center">Existencia</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="producto in lista" :key="producto.id">
              <td>
                <div class="flex items-center gap-3">
                  <span class="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-50">
                    <PaletaIcon :variant="colorCategoria(producto.categoria)" :size="24" />
                  </span>
                  <div>
                    <p class="font-semibold text-slate-900">{{ producto.nombre }}</p>
                    <p class="text-xs text-slate-400">{{ producto.categoria }}</p>
                  </div>
                </div>
              </td>
              <td class="font-mono text-xs">{{ producto.sku }}</td>
              <td class="text-right font-semibold text-slate-900">{{ dinero(producto.precio) }}</td>
              <td class="text-right">{{ dinero(producto.costo) }}</td>
              <td class="text-right">
                <span :class="margen(producto) >= 40 ? 'text-emerald-600' : 'text-amber-600'">{{ margen(producto) }}%</span>
              </td>
              <td class="text-center">
                <UiBadge v-if="stock(producto) === 0" class="bg-rose-50 text-rose-700">Agotado</UiBadge>
                <UiBadge v-else-if="stock(producto) <= producto.stockMinimo" variant="gold">{{ stock(producto) }} · bajo</UiBadge>
                <UiBadge v-else class="bg-emerald-50 text-emerald-700">{{ stock(producto) }}</UiBadge>
              </td>
              <td>
                <div class="flex justify-end gap-1">
                  <UiButton variant="ghost" size="sm" aria-label="Editar" @click="abrirEditar(producto)">
                    <Pencil class="size-4" />
                  </UiButton>
                  <UiButton variant="ghost" size="sm" class="hover:text-rose-600" aria-label="Eliminar" @click="eliminar(producto)">
                    <Trash class="size-4" />
                  </UiButton>
                </div>
              </td>
            </tr>
            <tr v-if="!lista.length">
              <td colspan="7" class="py-12 text-center text-slate-400">No hay productos que coincidan.</td>
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
        <div>
          <label class="ip-label" for="p-precio">Precio de venta</label>
          <input id="p-precio" v-model.number="form.precio" type="number" min="0" step="0.5" class="ip-input" required />
        </div>
        <div>
          <label class="ip-label" for="p-costo">Costo</label>
          <input id="p-costo" v-model.number="form.costo" type="number" min="0" step="0.5" class="ip-input" required />
        </div>
        <div>
          <label class="ip-label" for="p-minimo">Stock mínimo</label>
          <input id="p-minimo" v-model.number="form.stockMinimo" type="number" min="0" class="ip-input" required />
        </div>
        <div v-if="!editando">
          <label class="ip-label" for="p-inicial">Existencia inicial</label>
          <input id="p-inicial" v-model.number="form.existenciaInicial" type="number" min="0" class="ip-input" />
        </div>
        <div class="mt-2 flex justify-end gap-3 sm:col-span-2">
          <UiButton variant="outline" @click="modalAbierto = false">Cancelar</UiButton>
          <UiButton type="submit">{{ editando ? 'Guardar cambios' : 'Agregar producto' }}</UiButton>
        </div>
      </form>
    </UiModal>
  </div>
</template>
