<script setup lang="ts">
import { reactive, ref } from 'vue'
import { MapPin, Plus, Store } from '@lucide/vue'
import UiBadge from '../ui/Badge.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import UiModal from '../ui/Modal.vue'
import AvisoLimite from './AvisoLimite.vue'
import Encabezado from '../ui/Encabezado.vue'
import {
  cambiarSucursal,
  crearSucursal,
  estado,
  puedeAgregar,
  resumenUso,
  stock,
  sucursalActiva,
  type Sucursal,
} from '@/stores/negocio'
import { dinero, mismoDia } from '@/lib/formato'

defineEmits(['cambiarPlan'])

const modalAbierto = ref(false)
const form = reactive({ nombre: '', direccion: '' })

function resumen(sucursal: Sucursal) {
  const hoy = estado.ventas.filter((v) => v.sucursalId === sucursal.id && mismoDia(v.fecha))
  return [
    { etiqueta: 'Ventas hoy', valor: dinero(hoy.reduce((suma, v) => suma + v.total, 0)) },
    { etiqueta: 'Tickets', valor: hoy.length },
    { etiqueta: 'Usuarios', valor: estado.usuarios.filter((u) => u.sucursalId === sucursal.id).length },
    { etiqueta: 'Piezas', valor: estado.productos.reduce((suma, p) => suma + stock(p, sucursal.id), 0) },
  ]
}

function abrir() {
  Object.assign(form, { nombre: '', direccion: '' })
  modalAbierto.value = true
}

function guardar() {
  crearSucursal({ ...form })
  modalAbierto.value = false
}
</script>

<template>
  <div>
    <Encabezado titulo="Sucursales" :descripcion="`${resumenUso('sucursales')} · cada sucursal lleva su propio inventario.`">
      <UiButton :disabled="!puedeAgregar('sucursales')" @click="abrir">
        <Plus class="size-4" />
        Nueva sucursal
      </UiButton>
    </Encabezado>

    <AvisoLimite limite="sucursales" @cambiarPlan="$emit('cambiarPlan')" />

    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <UiCard
        v-for="sucursal in estado.sucursales"
        :key="sucursal.id"
        :class="['flex flex-col bg-white p-6', sucursal.id === sucursalActiva?.id && 'ring-2 ring-blue-500']"
      >
        <div class="flex items-start justify-between gap-3">
          <span class="grid size-12 place-items-center rounded-2xl bg-blue-600/10 text-blue-600">
            <Store class="size-6" />
          </span>
          <UiBadge v-if="sucursal.id === sucursalActiva?.id" variant="blue">Trabajando aquí</UiBadge>
        </div>
        <h3 class="mt-4 text-lg font-bold">{{ sucursal.nombre }}</h3>
        <p class="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin class="size-4 shrink-0" /> {{ sucursal.direccion }}
        </p>

        <dl class="mt-5 grid grid-cols-2 gap-3">
          <div v-for="dato in resumen(sucursal)" :key="dato.etiqueta" class="rounded-xl bg-slate-50 p-3">
            <dt class="text-xs text-slate-400">{{ dato.etiqueta }}</dt>
            <dd class="m-0 mt-1 font-bold">{{ dato.valor }}</dd>
          </div>
        </dl>

        <UiButton
          v-if="sucursal.id !== sucursalActiva?.id"
          variant="outline"
          class="mt-5 w-full"
          @click="cambiarSucursal(sucursal.id)"
        >
          Trabajar en esta sucursal
        </UiButton>
      </UiCard>

      <button
        v-if="puedeAgregar('sucursales')"
        type="button"
        class="grid min-h-64 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-transparent p-6 text-slate-500 transition hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700"
        @click="abrir"
      >
        <span class="text-center">
          <Plus class="mx-auto size-8" />
          <span class="mt-2 block font-semibold">Agregar sucursal</span>
        </span>
      </button>
    </div>

    <UiModal v-if="modalAbierto" titulo="Nueva sucursal" @cerrar="modalAbierto = false">
      <form class="space-y-4" @submit.prevent="guardar">
        <div>
          <label class="ip-label" for="s-nombre">Nombre</label>
          <input id="s-nombre" v-model.trim="form.nombre" class="ip-input" required placeholder="Sucursal Centro" />
        </div>
        <div>
          <label class="ip-label" for="s-direccion">Dirección</label>
          <input id="s-direccion" v-model.trim="form.direccion" class="ip-input" required placeholder="Av. Juárez 120, Col. Centro" />
        </div>
        <p class="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          La nueva sucursal comparte tu catálogo de productos, pero empieza con existencias en cero.
        </p>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="modalAbierto = false">Cancelar</UiButton>
          <UiButton type="submit">Crear sucursal</UiButton>
        </div>
      </form>
    </UiModal>
  </div>
</template>
