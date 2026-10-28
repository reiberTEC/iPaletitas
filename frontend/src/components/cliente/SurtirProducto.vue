<script setup lang="ts">
import { computed, reactive } from 'vue'
import IconoProducto from '../icons/IconoProducto.vue'
import UiButton from '../ui/Button.vue'
import UiModal from '../ui/Modal.vue'
import { estado, registrarEntrada, stock, sucursalActiva, type Producto } from '@/stores/negocio'
import { dinero } from '@/lib/formato'

const props = defineProps<{ producto: Producto }>()
const emit = defineEmits<{ cerrar: []; surtido: [cantidad: number] }>()

const actual = stock(props.producto)
const sugerida = Math.max(1, props.producto.stockMinimo * 2 - actual)

const form = reactive({
  cantidad: sugerida,
  costoUnitario: props.producto.costo,
  proveedor: '',
})

const proveedores = computed(() => [...new Set(estado.entradas.map((e) => e.proveedor).filter(Boolean))])
const quedaran = computed(() => actual + (form.cantidad || 0))

async function guardar() {
  if (!form.cantidad || form.cantidad < 1) return
  await registrarEntrada({
    productoId: props.producto.id,
    cantidad: form.cantidad,
    costoUnitario: form.costoUnitario,
    proveedor: form.proveedor || 'Sin especificar',
    nota: 'Surtido desde Productos',
  })
  emit('surtido', form.cantidad)
}
</script>

<template>
  <UiModal titulo="Agregar existencias" @cerrar="emit('cerrar')">
    <form class="space-y-4" @submit.prevent="guardar">
      <div class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <span class="grid size-12 shrink-0 place-items-center rounded-xl bg-white">
          <IconoProducto :icono="producto.icono" :categoria="producto.categoria" :size="28" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate font-bold text-slate-900">{{ producto.nombre }}</p>
          <p class="text-xs text-slate-500">{{ producto.sku }} · Sucursal {{ sucursalActiva?.nombre }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-500">Tienes</p>
          <p
            :class="[
              'text-xl font-extrabold',
              actual === 0 ? 'text-rose-700' : actual <= producto.stockMinimo ? 'text-orange-700' : 'text-slate-900',
            ]"
          >
            {{ actual }}
          </p>
        </div>
      </div>

      <div>
        <label class="ip-label" for="s-cantidad">Piezas a agregar</label>
        <input id="s-cantidad" v-model.number="form.cantidad" type="number" min="1" class="ip-input" required />
        <div class="mt-2 grid grid-cols-4 gap-2">
          <button
            v-for="extra in [10, 25, 50, 100]"
            :key="extra"
            type="button"
            class="cursor-pointer rounded-lg border-0 bg-blue-50 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
            @click="form.cantidad = extra"
          >
            +{{ extra }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="ip-label" for="s-costo">Costo unitario</label>
          <input id="s-costo" v-model.number="form.costoUnitario" type="number" min="0" step="0.5" class="ip-input" required />
        </div>
        <div>
          <label class="ip-label" for="s-proveedor">Proveedor</label>
          <input
            id="s-proveedor"
            v-model.trim="form.proveedor"
            class="ip-input"
            list="s-lista-proveedores"
            placeholder="Opcional"
          />
          <datalist id="s-lista-proveedores">
            <option v-for="p in proveedores" :key="p" :value="p" />
          </datalist>
        </div>
      </div>

      <div class="space-y-1 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <p class="flex justify-between">
          <span>Quedarán</span><strong>{{ quedaran }} piezas</strong>
        </p>
        <p class="flex justify-between text-xs">
          <span>Mínimo configurado: {{ producto.stockMinimo }}</span>
          <span>Total de la compra {{ dinero((form.cantidad || 0) * (form.costoUnitario || 0)) }}</span>
        </p>
      </div>

      <div class="flex justify-end gap-3">
        <UiButton variant="outline" @click="emit('cerrar')">Cancelar</UiButton>
        <UiButton type="submit" :disabled="!form.cantidad || form.cantidad < 1">Agregar {{ form.cantidad || 0 }} piezas</UiButton>
      </div>
    </form>
  </UiModal>
</template>
