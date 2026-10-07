<script setup lang="ts">
import { Check, Minus, Pencil, ShieldCheck } from '@lucide/vue'
import UiButton from '../../ui/Button.vue'
import UiModal from '../../ui/Modal.vue'
import { estiloRol } from './estilosRol'
import {
  ACCIONES,
  MODULOS,
  clavePermiso,
  esTitular,
  nombreSucursal,
  type AccionId,
  type ModuloId,
  type Usuario,
} from '@/stores/negocio'
import { fechaDia, iniciales } from '@/lib/formato'

const props = defineProps<{ usuario: Usuario }>()
const emit = defineEmits<{ cerrar: []; editar: []; permisos: [] }>()

const tiene = (modulo: ModuloId, accion: AccionId) => props.usuario.permisos.includes(clavePermiso(modulo, accion))
</script>

<template>
  <UiModal titulo="Detalle del usuario" ancho="max-w-2xl" @cerrar="emit('cerrar')">
    <div class="mb-6 flex items-center gap-4">
      <span
        :class="[
          'grid size-16 shrink-0 place-items-center rounded-2xl text-xl font-extrabold text-white',
          estiloRol[usuario.rol].avatar,
        ]"
      >
        {{ iniciales(usuario.nombre) }}
      </span>
      <div class="min-w-0">
        <h3 class="truncate text-xl font-extrabold text-slate-900">
          {{ usuario.nombre }}
          <span v-if="esTitular(usuario)" class="text-sm font-semibold text-blue-600">(tú)</span>
        </h3>
        <p class="text-sm text-slate-500">{{ usuario.puesto }}</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <span :class="['rounded-full px-2.5 py-0.5 text-xs font-bold', estiloRol[usuario.rol].etiqueta]">{{ usuario.rol }}</span>
          <span
            :class="[
              'rounded-full px-2.5 py-0.5 text-xs font-bold',
              usuario.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
            ]"
          >
            {{ usuario.activo ? 'Activo' : 'Inactivo' }}
          </span>
        </div>
      </div>
    </div>

    <dl class="mb-6 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
      <div>
        <dt class="text-xs text-slate-500">Correo</dt>
        <dd class="font-semibold break-all text-slate-900">{{ usuario.correo }}</dd>
      </div>
      <div>
        <dt class="text-xs text-slate-500">Teléfono</dt>
        <dd class="font-semibold text-slate-900">{{ usuario.telefono || 'Sin registrar' }}</dd>
      </div>
      <div>
        <dt class="text-xs text-slate-500">Sucursal</dt>
        <dd class="font-semibold text-slate-900">{{ nombreSucursal(usuario.sucursalId) }}</dd>
      </div>
      <div>
        <dt class="text-xs text-slate-500">Fecha de ingreso</dt>
        <dd class="font-semibold text-slate-900">{{ fechaDia(usuario.fechaIngreso) }}</dd>
      </div>
    </dl>

    <h4 class="mb-3 text-sm font-extrabold text-slate-900">Permisos por módulo</h4>
    <div class="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
      <table class="ip-table">
        <thead>
          <tr>
            <th>Módulo</th>
            <th v-for="a in ACCIONES" :key="a.id" class="!text-center">{{ a.nombre }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in MODULOS" :key="m.id">
            <td class="font-semibold whitespace-nowrap text-slate-900">{{ m.nombre }}</td>
            <td v-for="a in ACCIONES" :key="a.id" class="text-center">
              <Check v-if="tiene(m.id, a.id)" class="mx-auto size-4 text-emerald-600" aria-label="Sí" />
              <Minus v-else class="mx-auto size-4 text-slate-300" aria-label="No" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
      <UiButton variant="outline" @click="emit('cerrar')">Cerrar</UiButton>
      <UiButton variant="outline" @click="emit('permisos')">
        <ShieldCheck class="size-4" />
        Rol y permisos
      </UiButton>
      <UiButton @click="emit('editar')">
        <Pencil class="size-4" />
        Editar
      </UiButton>
    </div>
  </UiModal>
</template>
