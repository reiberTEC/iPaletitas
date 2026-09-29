<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ShieldCheck, ShoppingCart, Truck, UserPlus } from '@lucide/vue'
import UiBadge from '../ui/Badge.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import UiModal from '../ui/Modal.vue'
import AvisoLimite from './AvisoLimite.vue'
import Encabezado from '../ui/Encabezado.vue'
import {
  ROLES,
  alternarUsuario,
  crearUsuario,
  estado,
  nombreSucursal,
  puedeAgregar,
  resumenUso,
  sucursalActiva,
  type Rol,
} from '@/stores/negocio'
import { iniciales } from '@/lib/formato'

defineEmits(['cambiarPlan'])

const iconoRol = { Administrador: ShieldCheck, Cajero: ShoppingCart, Almacén: Truck }
const colorRol = { Administrador: 'blue', Cajero: 'gold', Almacén: 'default' } as const

const modalAbierto = ref(false)
const form = reactive({ nombre: '', correo: '', rol: 'Cajero' as Rol, sucursalId: '' })

function abrir() {
  Object.assign(form, { nombre: '', correo: '', rol: 'Cajero', sucursalId: sucursalActiva.value?.id ?? '' })
  modalAbierto.value = true
}

function guardar() {
  crearUsuario({ ...form })
  modalAbierto.value = false
}

const esTitular = (correo: string) => correo === estado.sesion?.correo
</script>

<template>
  <div>
    <Encabezado titulo="Usuarios y accesos" :descripcion="`${resumenUso('usuarios')} · controla quién entra y qué puede hacer.`">
      <UiButton :disabled="!puedeAgregar('usuarios')" @click="abrir">
        <UserPlus class="size-4" />
        Nuevo usuario
      </UiButton>
    </Encabezado>

    <AvisoLimite limite="usuarios" @cambiarPlan="$emit('cambiarPlan')" />

    <div class="mb-6 grid gap-5 md:grid-cols-3">
      <UiCard v-for="r in ROLES" :key="r.rol" class="p-5">
        <div class="flex items-center gap-3">
          <span class="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <component :is="iconoRol[r.rol]" class="size-5" />
          </span>
          <div>
            <p class="font-bold">{{ r.rol }}</p>
            <p class="text-xs text-slate-400">
              {{ estado.usuarios.filter((u) => u.rol === r.rol).length }} usuarios
            </p>
          </div>
        </div>
        <p class="mt-3 text-sm text-slate-500">{{ r.descripcion }}</p>
      </UiCard>
    </div>

    <UiCard class="overflow-hidden bg-white">
      <div class="overflow-x-auto">
        <table class="ip-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Sucursal</th>
              <th class="text-right">Acceso</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in estado.usuarios" :key="usuario.id" :class="{ 'opacity-60': !usuario.activo }">
              <td>
                <div class="flex items-center gap-3">
                  <span class="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white">
                    {{ iniciales(usuario.nombre) }}
                  </span>
                  <div>
                    <p class="font-semibold text-slate-900">
                      {{ usuario.nombre }}
                      <span v-if="esTitular(usuario.correo)" class="ml-1 text-xs font-medium text-blue-600">(tú)</span>
                    </p>
                    <p class="text-xs text-slate-400">{{ usuario.correo }}</p>
                  </div>
                </div>
              </td>
              <td><UiBadge :variant="colorRol[usuario.rol]">{{ usuario.rol }}</UiBadge></td>
              <td>{{ nombreSucursal(usuario.sucursalId) }}</td>
              <td>
                <div class="flex items-center justify-end gap-3">
                  <span class="text-xs font-semibold text-slate-500">{{ usuario.activo ? 'Activo' : 'Suspendido' }}</span>
                  <button
                    type="button"
                    role="switch"
                    :aria-checked="usuario.activo"
                    :aria-label="`Acceso de ${usuario.nombre}`"
                    :disabled="esTitular(usuario.correo)"
                    :class="[
                      'relative h-6 w-11 cursor-pointer rounded-full border-0 p-0 transition disabled:cursor-not-allowed disabled:opacity-60',
                      usuario.activo ? 'bg-emerald-500' : 'bg-slate-300',
                    ]"
                    @click="alternarUsuario(usuario.id)"
                  >
                    <span
                      :class="[
                        'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform',
                        usuario.activo ? 'translate-x-5' : 'translate-x-0',
                      ]"
                    />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <UiModal v-if="modalAbierto" titulo="Nuevo usuario" @cerrar="modalAbierto = false">
      <form class="space-y-4" @submit.prevent="guardar">
        <div>
          <label class="ip-label" for="u-nombre">Nombre completo</label>
          <input id="u-nombre" v-model.trim="form.nombre" class="ip-input" required placeholder="María López" />
        </div>
        <div>
          <label class="ip-label" for="u-correo">Correo</label>
          <input id="u-correo" v-model.trim="form.correo" type="email" class="ip-input" required placeholder="maria@minegocio.com" />
        </div>
        <div>
          <p class="ip-label">Rol</p>
          <div class="grid gap-2">
            <label
              v-for="r in ROLES"
              :key="r.rol"
              :class="[
                'flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 transition',
                form.rol === r.rol ? 'bg-blue-50 ring-blue-500' : 'ring-slate-200 hover:ring-blue-300',
              ]"
            >
              <input v-model="form.rol" type="radio" name="rol" :value="r.rol" class="ip-check mt-0.5" />
              <span>
                <span class="block text-sm font-bold">{{ r.rol }}</span>
                <span class="block text-xs text-slate-500">{{ r.descripcion }}</span>
              </span>
            </label>
          </div>
        </div>
        <div>
          <label class="ip-label" for="u-sucursal">Sucursal</label>
          <select id="u-sucursal" v-model="form.sucursalId" class="ip-input cursor-pointer">
            <option v-for="s in estado.sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </select>
        </div>
        <p class="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Le enviaremos un correo con su acceso. (Demostración: no se envía nada todavía.)
        </p>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="modalAbierto = false">Cancelar</UiButton>
          <UiButton type="submit">Crear usuario</UiButton>
        </div>
      </form>
    </UiModal>
  </div>
</template>
