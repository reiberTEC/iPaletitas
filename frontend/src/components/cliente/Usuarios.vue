<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { CircleCheck, CirclePause, Eye, Pencil, Search, ShieldCheck, Trash, UserPlus, Users } from '@lucide/vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import UiModal from '../ui/Modal.vue'
import Encabezado from '../ui/Encabezado.vue'
import AvisoLimite from './AvisoLimite.vue'
import ModalUsuario, { type PestanaUsuario } from './usuarios/ModalUsuario.vue'
import DetalleUsuario from './usuarios/DetalleUsuario.vue'
import { estiloRol } from './usuarios/estilosRol'
import {
  ROLES,
  TODOS_LOS_PERMISOS,
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  esSesionActual,
  esTitular,
  estado,
  nombreSucursal,
  puede,
  puedeAgregar,
  sesionEsTitular,
  resumenUso,
  type DatosUsuario,
  type Rol,
  type Usuario,
} from '@/stores/negocio'
import { fechaDia, iniciales } from '@/lib/formato'

defineEmits(['cambiarPlan'])

const totalPermisos = TODOS_LOS_PERMISOS.length

const busqueda = ref('')
const filtroRol = ref<Rol | ''>('')
const filtroEstado = ref<'' | 'activo' | 'inactivo'>('')

const filtrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return estado.usuarios.filter((u) => {
    const coincideTexto =
      !texto ||
      u.nombre.toLowerCase().includes(texto) ||
      u.correo.toLowerCase().includes(texto) ||
      u.puesto.toLowerCase().includes(texto)
    const coincideRol = !filtroRol.value || u.rol === filtroRol.value
    const coincideEstado = !filtroEstado.value || (filtroEstado.value === 'activo') === u.activo
    return coincideTexto && coincideRol && coincideEstado
  })
})

const hayFiltros = computed(() => !!(busqueda.value || filtroRol.value || filtroEstado.value))

function limpiarFiltros() {
  busqueda.value = ''
  filtroRol.value = ''
  filtroEstado.value = ''
}

const indicadores = computed(() => {
  const total = estado.usuarios.length
  const activos = estado.usuarios.filter((u) => u.activo).length
  return [
    { titulo: 'Equipo total', valor: total, detalle: resumenUso('usuarios'), icono: Users },
    { titulo: 'Activos', valor: activos, detalle: `${total ? Math.round((activos / total) * 100) : 0}% del equipo`, icono: CircleCheck },
    { titulo: 'Inactivos', valor: total - activos, detalle: 'Sin acceso a la plataforma', icono: CirclePause },
    {
      titulo: 'Administradores',
      valor: estado.usuarios.filter((u) => u.rol === 'Administrador').length,
      detalle: 'Con acceso total',
      icono: ShieldCheck,
    },
  ]
})

const aviso = ref('')
let temporizador: ReturnType<typeof setTimeout> | undefined

function notificar(mensaje: string) {
  aviso.value = mensaje
  clearTimeout(temporizador)
  temporizador = setTimeout(() => (aviso.value = ''), 3000)
}

onBeforeUnmount(() => clearTimeout(temporizador))

const formulario = ref<{ usuario: Usuario | null; pestana: PestanaUsuario } | null>(null)
const detalle = ref<Usuario | null>(null)
const porEliminar = ref<Usuario | null>(null)

function abrirNuevo() {
  formulario.value = { usuario: null, pestana: 'datos' }
}

function abrirEdicion(usuario: Usuario, pestana: PestanaUsuario = 'datos') {
  detalle.value = null
  formulario.value = { usuario, pestana }
}

function guardar(datos: DatosUsuario) {
  const editando = formulario.value?.usuario
  if (editando) {
    actualizarUsuario(editando.id, datos)
    notificar(`Se actualizó a ${datos.nombre}.`)
  } else {
    crearUsuario(datos)
    notificar(`${datos.nombre} se agregó al equipo.`)
  }
  formulario.value = null
}

function confirmarEliminacion() {
  if (!porEliminar.value) return
  eliminarUsuario(porEliminar.value.id)
  notificar(`Se eliminó a ${porEliminar.value.nombre}.`)
  porEliminar.value = null
}

const puedeEditar = (usuario: Usuario) => puede('usuarios.editar') && (!esTitular(usuario) || sesionEsTitular.value)

function motivoNoEliminar(usuario: Usuario) {
  if (esTitular(usuario)) return 'No se puede eliminar al titular de la cuenta'
  if (esSesionActual(usuario)) return 'No puedes eliminar tu propio usuario'
  return ''
}

const botonIcono =
  'ip-boton grid size-9 cursor-pointer place-items-center rounded-xl border-0 bg-slate-100 text-slate-600 transition-colors disabled:cursor-not-allowed disabled:opacity-40'
</script>

<template>
  <div>
    <Encabezado titulo="Usuarios y accesos" descripcion="Administra a tu equipo, sus roles y lo que puede hacer en la plataforma.">
      <UiButton v-if="puede('usuarios.crear')" :disabled="!puedeAgregar('usuarios')" @click="abrirNuevo">
        <UserPlus class="size-4" />
        Nuevo usuario
      </UiButton>
    </Encabezado>

    <AvisoLimite limite="usuarios" @cambiarPlan="$emit('cambiarPlan')" />

    <div class="ip-tira mb-6 sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="kpi in indicadores" :key="kpi.titulo" class="p-5">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm text-slate-500">{{ kpi.titulo }}</p>
          <span class="ip-picto size-8"><component :is="kpi.icono" class="size-4" /></span>
        </div>
        <p class="ip-cifra mt-2 text-3xl text-slate-900">{{ kpi.valor.toLocaleString('es-MX') }}</p>
        <p class="mt-1 text-xs text-slate-500">{{ kpi.detalle }}</p>
      </div>
    </div>

    <UiCard class="overflow-hidden bg-white">
      <div class="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
        <label class="relative min-w-0 flex-1 basis-60">
          <span class="sr-only">Buscar</span>
          <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
          <input v-model="busqueda" type="search" class="ip-input ip-input-icono" placeholder="Buscar por nombre, correo o puesto" />
        </label>
        <select v-model="filtroRol" class="ip-input w-auto! cursor-pointer" aria-label="Filtrar por rol">
          <option value="">Todos los roles</option>
          <option v-for="r in ROLES" :key="r.rol" :value="r.rol">{{ r.rol }}</option>
        </select>
        <select v-model="filtroEstado" class="ip-input w-auto! cursor-pointer" aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <button
          v-if="hayFiltros"
          type="button"
          class="cursor-pointer border-0 bg-transparent text-sm font-semibold text-blue-600 hover:text-blue-700"
          @click="limpiarFiltros"
        >
          Limpiar filtros
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="ip-table min-w-[960px]">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Puesto</th>
              <th>Rol</th>
              <th>Sucursal</th>
              <th>Permisos</th>
              <th>Estado</th>
              <th>Ingreso</th>
              <th class="!text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usuario in filtrados" :key="usuario.id">
              <td>
                <div class="flex items-center gap-3">
                  <span
                    :class="[
                      'grid size-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white',
                      estiloRol[usuario.rol].avatar,
                    ]"
                  >
                    {{ iniciales(usuario.nombre) }}
                  </span>
                  <div class="min-w-0 max-w-64">
                    <p class="font-semibold [overflow-wrap:anywhere] text-slate-900">
                      {{ usuario.nombre }}
                      <span v-if="esSesionActual(usuario)" class="ml-1 text-xs font-medium text-blue-700">(tú)</span>
                      <span
                        v-if="esTitular(usuario)"
                        class="ml-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-blue-800"
                      >
                        Titular
                      </span>
                    </p>
                    <p class="truncate text-xs text-slate-500" :title="usuario.correo">{{ usuario.correo }}</p>
                  </div>
                </div>
              </td>
              <td>{{ usuario.puesto }}</td>
              <td>
                <span :class="['rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap', estiloRol[usuario.rol].etiqueta]">
                  {{ usuario.rol }}
                </span>
              </td>
              <td class="whitespace-nowrap">{{ nombreSucursal(usuario.sucursalId) }}</td>
              <td>
                <div class="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200" :title="`${usuario.permisos.length} de ${totalPermisos} permisos`">
                  <div
                    class="h-full rounded-full bg-blue-600"
                    :style="{ width: `${(usuario.permisos.length / totalPermisos) * 100}%` }"
                  />
                </div>
                <p class="mt-1 text-xs text-slate-500 tabular-nums">{{ usuario.permisos.length }}/{{ totalPermisos }}</p>
              </td>
              <td>
                <span
                  :class="[
                    'rounded-full px-2.5 py-1 text-xs font-bold',
                    usuario.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                  ]"
                >
                  {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="whitespace-nowrap">{{ fechaDia(usuario.fechaIngreso) }}</td>
              <td>
                <div class="flex justify-end gap-1.5">
                  <button type="button" :class="[botonIcono, 'hover:bg-blue-100 hover:text-blue-700']" title="Ver detalle" :aria-label="`Ver a ${usuario.nombre}`" @click="detalle = usuario">
                    <Eye class="size-4" />
                  </button>
                  <button
                    v-if="puedeEditar(usuario)"
                    type="button"
                    :class="[botonIcono, 'hover:bg-blue-100 hover:text-blue-700']"
                    title="Editar"
                    :aria-label="`Editar a ${usuario.nombre}`"
                    @click="abrirEdicion(usuario)"
                  >
                    <Pencil class="size-4" />
                  </button>
                  <button
                    v-if="puedeEditar(usuario)"
                    type="button"
                    :class="[botonIcono, 'hover:bg-blue-100 hover:text-blue-700']"
                    title="Rol y permisos"
                    :aria-label="`Rol y permisos de ${usuario.nombre}`"
                    @click="abrirEdicion(usuario, 'permisos')"
                  >
                    <ShieldCheck class="size-4" />
                  </button>
                  <button
                    v-if="puede('usuarios.eliminar')"
                    type="button"
                    :class="[botonIcono, 'hover:bg-rose-50 hover:text-rose-600']"
                    :title="motivoNoEliminar(usuario) || 'Eliminar'"
                    :aria-label="`Eliminar a ${usuario.nombre}`"
                    :disabled="!!motivoNoEliminar(usuario)"
                    @click="porEliminar = usuario"
                  >
                    <Trash class="size-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!filtrados.length" class="flex flex-col items-center gap-3 px-4 py-12 text-sm text-slate-500">
          <p>{{ hayFiltros ? 'Ningún usuario coincide con los filtros.' : 'Aún no hay usuarios registrados.' }}</p>
          <UiButton v-if="hayFiltros" variant="outline" size="sm" @click="limpiarFiltros">Limpiar filtros</UiButton>
          <UiButton v-else-if="puede('usuarios.crear') && puedeAgregar('usuarios')" size="sm" @click="abrirNuevo">
            <UserPlus class="size-4" />
            Agregar el primero
          </UiButton>
        </div>
      </div>
    </UiCard>

    <ModalUsuario
      v-if="formulario"
      :usuario="formulario.usuario"
      :pestana-inicial="formulario.pestana"
      @cerrar="formulario = null"
      @guardar="guardar"
    />

    <DetalleUsuario
      v-if="detalle"
      :usuario="detalle"
      :editable="puedeEditar(detalle)"
      @cerrar="detalle = null"
      @editar="abrirEdicion(detalle!)"
      @permisos="abrirEdicion(detalle!, 'permisos')"
    />

    <UiModal v-if="porEliminar" titulo="Eliminar usuario" ancho="max-w-md" @cerrar="porEliminar = null">
      <p class="text-sm leading-6 text-slate-600">
        ¿Seguro que quieres eliminar a <strong class="text-slate-900">{{ porEliminar.nombre }}</strong>? Perderá el acceso a la
        plataforma y esta acción no se puede deshacer.
      </p>
      <div class="mt-6 flex justify-end gap-3">
        <UiButton variant="outline" @click="porEliminar = null">Cancelar</UiButton>
        <UiButton class="bg-rose-600 hover:bg-rose-700" @click="confirmarEliminacion">
          <Trash class="size-4" />
          Eliminar
        </UiButton>
      </div>
    </UiModal>

    <Transition name="aviso">
      <div v-if="aviso" class="ip-aviso flex items-center gap-2" role="status">
        <CircleCheck class="size-4 shrink-0 text-emerald-400" />
        {{ aviso }}
      </div>
    </Transition>
  </div>
</template>
