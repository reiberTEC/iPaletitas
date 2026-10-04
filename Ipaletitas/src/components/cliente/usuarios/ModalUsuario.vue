<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ShieldCheck, UserRound } from '@lucide/vue'
import UiButton from '../../ui/Button.vue'
import UiModal from '../../ui/Modal.vue'
import { estiloRol } from './estilosRol'
import {
  ACCIONES,
  MODULOS,
  ROLES,
  clavePermiso,
  correoEnUso,
  esTitular,
  estado,
  ordenarPermisos,
  permisosDeRol,
  sucursalActiva,
  type AccionId,
  type DatosUsuario,
  type ModuloId,
  type Rol,
  type Usuario,
} from '@/stores/negocio'

export type PestanaUsuario = 'datos' | 'permisos'
type Campo = 'nombre' | 'correo' | 'telefono' | 'puesto'

const props = withDefaults(defineProps<{ usuario?: Usuario | null; pestanaInicial?: PestanaUsuario }>(), {
  usuario: null,
  pestanaInicial: 'datos',
})

const emit = defineEmits<{ cerrar: []; guardar: [datos: DatosUsuario] }>()

const titular = computed(() => !!props.usuario && esTitular(props.usuario))

const form = reactive<DatosUsuario>(
  props.usuario
    ? { ...props.usuario, permisos: [...props.usuario.permisos] }
    : {
        nombre: '',
        correo: '',
        telefono: '',
        puesto: '',
        fechaIngreso: new Date().toLocaleDateString('en-CA'),
        rol: 'Cajero',
        sucursalId: sucursalActiva.value?.id ?? estado.sucursales[0]?.id ?? '',
        activo: true,
        permisos: permisosDeRol('Cajero'),
      },
)

const errores = reactive<Partial<Record<Campo, string>>>({})
const pestana = ref<PestanaUsuario>(props.pestanaInicial)
const hayErrores = computed(() => Object.keys(errores).length > 0)

function elegirRol(rol: Rol) {
  if (titular.value) return
  form.rol = rol
  form.permisos = permisosDeRol(rol)
}

const personalizados = computed(() => {
  const delRol = permisosDeRol(form.rol)
  return delRol.length !== form.permisos.length || delRol.some((p) => !form.permisos.includes(p))
})

const tiene = (modulo: ModuloId, accion: AccionId) => form.permisos.includes(clavePermiso(modulo, accion))
const moduloCompleto = (modulo: ModuloId) => ACCIONES.every((a) => tiene(modulo, a.id))

function alternarPermiso(modulo: ModuloId, accion: AccionId) {
  const permisos = new Set(form.permisos)
  const clave = clavePermiso(modulo, accion)
  if (permisos.has(clave)) {
    permisos.delete(clave)
    // Sin "ver" no tiene sentido conservar el resto de acciones del módulo.
    if (accion === 'ver') ACCIONES.forEach((a) => permisos.delete(clavePermiso(modulo, a.id)))
  } else {
    permisos.add(clave)
    if (accion !== 'ver') permisos.add(clavePermiso(modulo, 'ver'))
  }
  form.permisos = ordenarPermisos([...permisos])
}

function alternarModulo(modulo: ModuloId) {
  const completo = moduloCompleto(modulo)
  const permisos = new Set(form.permisos)
  ACCIONES.forEach((a) => (completo ? permisos.delete(clavePermiso(modulo, a.id)) : permisos.add(clavePermiso(modulo, a.id))))
  form.permisos = ordenarPermisos([...permisos])
}

function validar() {
  for (const campo of Object.keys(errores) as Campo[]) delete errores[campo]
  const correo = form.correo.trim().toLowerCase()
  const telefono = form.telefono.replace(/\D/g, '')

  if (!form.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errores.correo = 'Ingresa un correo válido.'
  else if (correoEnUso(correo, props.usuario?.id)) errores.correo = 'Ya hay un usuario con este correo.'
  if (telefono && telefono.length !== 10) errores.telefono = 'El teléfono debe tener 10 dígitos.'
  if (!form.puesto.trim()) errores.puesto = 'El puesto es obligatorio.'
  return !hayErrores.value
}

function guardar() {
  if (!validar()) {
    pestana.value = 'datos'
    return
  }
  emit('guardar', {
    ...form,
    nombre: form.nombre.trim(),
    correo: form.correo.trim().toLowerCase(),
    telefono: form.telefono.replace(/\D/g, ''),
    puesto: form.puesto.trim(),
    permisos: [...form.permisos],
  })
}

const pestanas = [
  { id: 'datos', etiqueta: 'Datos generales', icono: UserRound },
  { id: 'permisos', etiqueta: 'Rol y permisos', icono: ShieldCheck },
] as const
</script>

<template>
  <UiModal :titulo="usuario ? `Editar a ${usuario.nombre}` : 'Nuevo usuario'" ancho="max-w-3xl" @cerrar="emit('cerrar')">
    <div class="mb-6 flex gap-1 rounded-2xl bg-slate-100 p-1" role="tablist">
      <button
        v-for="p in pestanas"
        :key="p.id"
        type="button"
        role="tab"
        :aria-selected="pestana === p.id"
        :class="[
          'relative flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border-0 px-3 py-2.5 text-sm font-semibold transition',
          pestana === p.id ? 'ip-pestana-activa bg-white text-blue-700 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-900',
        ]"
        @click="pestana = p.id"
      >
        <component :is="p.icono" class="size-4" />
        {{ p.etiqueta }}
        <span
          v-if="p.id === 'datos' && hayErrores"
          class="grid size-4 place-items-center rounded-full bg-rose-600 text-[10px] font-bold text-white"
        >!</span>
      </button>
    </div>

    <form novalidate @submit.prevent="guardar">
      <div v-show="pestana === 'datos'" class="grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2">
          <label class="ip-label" for="u-nombre">Nombre completo *</label>
          <input id="u-nombre" v-model="form.nombre" class="ip-input" placeholder="Ej. Ana Sofía Torres" />
          <p v-if="errores.nombre" class="mt-1 text-xs font-medium text-rose-600">{{ errores.nombre }}</p>
        </div>
        <div>
          <label class="ip-label" for="u-correo">Correo electrónico *</label>
          <input
            id="u-correo"
            v-model="form.correo"
            type="email"
            class="ip-input"
            placeholder="nombre@minegocio.com"
            :disabled="titular"
          />
          <p v-if="errores.correo" class="mt-1 text-xs font-medium text-rose-600">{{ errores.correo }}</p>
        </div>
        <div>
          <label class="ip-label" for="u-telefono">Teléfono</label>
          <input id="u-telefono" v-model="form.telefono" type="tel" inputmode="numeric" class="ip-input" placeholder="10 dígitos" />
          <p v-if="errores.telefono" class="mt-1 text-xs font-medium text-rose-600">{{ errores.telefono }}</p>
        </div>
        <div>
          <label class="ip-label" for="u-puesto">Puesto *</label>
          <input id="u-puesto" v-model="form.puesto" class="ip-input" placeholder="Ej. Cajera, Maestro paletero" />
          <p v-if="errores.puesto" class="mt-1 text-xs font-medium text-rose-600">{{ errores.puesto }}</p>
        </div>
        <div>
          <label class="ip-label" for="u-ingreso">Fecha de ingreso</label>
          <input id="u-ingreso" v-model="form.fechaIngreso" type="date" class="ip-input" />
        </div>
        <div class="sm:col-span-2">
          <label class="ip-label" for="u-sucursal">Sucursal</label>
          <select id="u-sucursal" v-model="form.sucursalId" class="ip-input cursor-pointer">
            <option v-for="s in estado.sucursales" :key="s.id" :value="s.id">{{ s.nombre }}</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <p class="ip-label">Estado</p>
          <button
            type="button"
            role="switch"
            :aria-checked="form.activo"
            :disabled="titular"
            class="flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-left text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
            @click="form.activo = !form.activo"
          >
            <span :class="['relative h-6 w-11 shrink-0 rounded-full transition', form.activo ? 'bg-emerald-500' : 'bg-slate-300']">
              <span
                :class="[
                  'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform',
                  form.activo ? 'translate-x-5' : 'translate-x-0',
                ]"
              />
            </span>
            {{ form.activo ? 'Activo: puede entrar a la plataforma' : 'Inactivo: sin acceso a la plataforma' }}
          </button>
        </div>
      </div>

      <div v-show="pestana === 'permisos'">
        <p
          v-if="titular"
          class="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700"
        >
          Eres el titular de la cuenta: tu rol siempre es Administrador con todos los permisos.
        </p>

        <h3 class="mb-3 text-sm font-extrabold text-slate-900">Rol</h3>
        <div class="mb-6 grid gap-3 sm:grid-cols-2">
          <label
            v-for="r in ROLES"
            :key="r.rol"
            :class="[
              'flex items-start gap-3 rounded-2xl p-3.5 ring-1 transition',
              titular && form.rol !== r.rol ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              form.rol === r.rol ? `ring-2 ${estiloRol[r.rol].tarjeta}` : 'ring-slate-200 hover:ring-blue-300',
            ]"
          >
            <input
              type="radio"
              name="rol"
              class="ip-check mt-0.5"
              :value="r.rol"
              :checked="form.rol === r.rol"
              :disabled="titular && form.rol !== r.rol"
              @change="elegirRol(r.rol)"
            />
            <span>
              <span class="flex items-center gap-1.5 text-sm font-bold">
                <component :is="estiloRol[r.rol].icono" class="size-4" />
                {{ r.rol }}
              </span>
              <span class="mt-0.5 block text-xs text-slate-500">{{ r.descripcion }}</span>
            </span>
          </label>
        </div>

        <div class="mb-3 flex flex-wrap items-center gap-2">
          <h3 class="text-sm font-extrabold text-slate-900">Permisos</h3>
          <span v-if="personalizados" class="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
            Personalizados
          </span>
          <button
            v-if="personalizados"
            type="button"
            class="ml-auto cursor-pointer border-0 bg-transparent text-xs font-semibold text-blue-600 hover:text-blue-700"
            @click="form.permisos = permisosDeRol(form.rol)"
          >
            Restablecer los del rol
          </button>
        </div>

        <div class="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
          <table class="ip-table">
            <thead>
              <tr>
                <th>Módulo</th>
                <th v-for="a in ACCIONES" :key="a.id" class="!text-center">{{ a.nombre }}</th>
                <th class="!text-center">Todos</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in MODULOS" :key="m.id">
                <td class="font-semibold whitespace-nowrap text-slate-900">{{ m.nombre }}</td>
                <td v-for="a in ACCIONES" :key="a.id" class="text-center">
                  <input
                    type="checkbox"
                    class="ip-check mx-auto cursor-pointer"
                    :checked="tiene(m.id, a.id)"
                    :disabled="titular"
                    :aria-label="`${a.nombre} ${m.nombre}`"
                    @change="alternarPermiso(m.id, a.id)"
                  />
                </td>
                <td class="text-center">
                  <input
                    type="checkbox"
                    class="ip-check mx-auto cursor-pointer"
                    :checked="moduloCompleto(m.id)"
                    :disabled="titular"
                    :aria-label="`Todos los permisos de ${m.nombre}`"
                    @change="alternarModulo(m.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-xs text-slate-500">Al marcar Crear, Editar o Eliminar se activa también Ver en ese módulo.</p>
      </div>

      <div class="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
        <UiButton variant="outline" @click="emit('cerrar')">Cancelar</UiButton>
        <UiButton type="submit">{{ usuario ? 'Guardar cambios' : 'Crear usuario' }}</UiButton>
      </div>
    </form>
  </UiModal>
</template>
