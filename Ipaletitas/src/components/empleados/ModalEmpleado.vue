<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import ModalBase from '../ModalBase.vue'
import {
  ACCIONES,
  MODULOS,
  ROLES,
  clavePermiso,
  obtenerRol,
  ordenarPermisos,
  useEmpleados,
  type AccionId,
  type Empleado,
  type EmpleadoNuevo,
  type ModuloId,
  type RolId,
} from '../../composables/useEmpleados'

type Pestana = 'datos' | 'permisos'
type CampoValidado = 'nombre' | 'correo' | 'telefono' | 'puesto'

const props = withDefaults(
  defineProps<{ abierto: boolean; empleado?: Empleado | null; pestanaInicial?: Pestana }>(),
  { empleado: null, pestanaInicial: 'datos' },
)

const emit = defineEmits<{ cerrar: []; guardar: [datos: EmpleadoNuevo] }>()

const { correoEnUso } = useEmpleados()

const formularioVacio = (): EmpleadoNuevo => ({
  nombre: '',
  correo: '',
  telefono: '',
  puesto: '',
  fechaIngreso: new Date().toLocaleDateString('en-CA'),
  activo: true,
  rolId: 'cajero',
  permisos: [...obtenerRol('cajero').permisos],
})

const desdeEmpleado = (empleado: Empleado): EmpleadoNuevo => ({
  nombre: empleado.nombre,
  correo: empleado.correo,
  telefono: empleado.telefono,
  puesto: empleado.puesto,
  fechaIngreso: empleado.fechaIngreso,
  activo: empleado.activo,
  rolId: empleado.rolId,
  permisos: [...empleado.permisos],
})

const formulario = reactive<EmpleadoNuevo>(formularioVacio())
const errores = reactive<Partial<Record<CampoValidado, string>>>({})
const pestana = ref<Pestana>('datos')

const limpiarErrores = () => {
  for (const campo of Object.keys(errores) as CampoValidado[]) delete errores[campo]
}

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return
    Object.assign(formulario, props.empleado ? desdeEmpleado(props.empleado) : formularioVacio())
    limpiarErrores()
    pestana.value = props.pestanaInicial
  },
  { immediate: true },
)

const titulo = computed(() => (props.empleado ? `Editar a ${props.empleado.nombre}` : 'Nuevo empleado'))

/* Rol y permisos */
const seleccionarRol = (rolId: RolId) => {
  formulario.rolId = rolId
  formulario.permisos = [...obtenerRol(rolId).permisos]
}

const permisosPersonalizados = computed(() => {
  const delRol = obtenerRol(formulario.rolId).permisos
  return (
    delRol.length !== formulario.permisos.length ||
    delRol.some((permiso) => !formulario.permisos.includes(permiso))
  )
})

const tienePermiso = (modulo: ModuloId, accion: AccionId) =>
  formulario.permisos.includes(clavePermiso(modulo, accion))

const alternarPermiso = (modulo: ModuloId, accion: AccionId) => {
  const permisos = new Set(formulario.permisos)
  const clave = clavePermiso(modulo, accion)

  if (permisos.has(clave)) {
    permisos.delete(clave)
    // Sin "ver" no tiene sentido conservar el resto de acciones del módulo
    if (accion === 'ver') ACCIONES.forEach((a) => permisos.delete(clavePermiso(modulo, a.id)))
  } else {
    permisos.add(clave)
    if (accion !== 'ver') permisos.add(clavePermiso(modulo, 'ver'))
  }

  formulario.permisos = ordenarPermisos([...permisos])
}

const moduloCompleto = (modulo: ModuloId) => ACCIONES.every((accion) => tienePermiso(modulo, accion.id))

const alternarModulo = (modulo: ModuloId) => {
  const completo = moduloCompleto(modulo)
  const permisos = new Set(formulario.permisos)
  ACCIONES.forEach((accion) => {
    const clave = clavePermiso(modulo, accion.id)
    if (completo) permisos.delete(clave)
    else permisos.add(clave)
  })
  formulario.permisos = ordenarPermisos([...permisos])
}

/* Validación y guardado */
const validar = () => {
  limpiarErrores()
  const correo = formulario.correo.trim().toLowerCase()
  const telefono = formulario.telefono.replace(/\D/g, '')

  if (!formulario.nombre.trim()) errores.nombre = 'El nombre es obligatorio.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errores.correo = 'Ingresa un correo válido.'
  else if (correoEnUso(correo, props.empleado?.id)) errores.correo = 'Ya existe un empleado con este correo.'
  if (telefono && telefono.length !== 10) errores.telefono = 'El teléfono debe tener 10 dígitos.'
  if (!formulario.puesto.trim()) errores.puesto = 'El puesto es obligatorio.'

  return Object.keys(errores).length === 0
}

const guardar = () => {
  if (!validar()) {
    pestana.value = 'datos'
    return
  }

  emit('guardar', {
    ...formulario,
    nombre: formulario.nombre.trim(),
    correo: formulario.correo.trim().toLowerCase(),
    telefono: formulario.telefono.replace(/\D/g, ''),
    puesto: formulario.puesto.trim(),
    permisos: [...formulario.permisos],
  })
}
</script>

<template>
  <ModalBase :abierto="abierto" :titulo="titulo" ancho="780px" @cerrar="emit('cerrar')">
    <div class="pestanas" role="tablist">
      <button
        type="button"
        role="tab"
        :aria-selected="pestana === 'datos'"
        :class="['pestana', { activa: pestana === 'datos' }]"
        @click="pestana = 'datos'"
      >
        👤 Datos generales
        <span v-if="Object.keys(errores).length" class="pestana-alerta">!</span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="pestana === 'permisos'"
        :class="['pestana', { activa: pestana === 'permisos' }]"
        @click="pestana = 'permisos'"
      >
        🛡️ Rol y permisos
      </button>
    </div>

    <form id="form-empleado" novalidate @submit.prevent="guardar">
      <!-- Datos generales -->
      <div v-show="pestana === 'datos'" class="campos">
        <label class="campo campo-ancho">
          <span>Nombre completo *</span>
          <input v-model="formulario.nombre" type="text" placeholder="Ej. Ana Sofía Torres" :class="{ invalido: errores.nombre }" />
          <small v-if="errores.nombre" class="error">{{ errores.nombre }}</small>
        </label>

        <label class="campo">
          <span>Correo electrónico *</span>
          <input v-model="formulario.correo" type="email" placeholder="nombre@correo.com" :class="{ invalido: errores.correo }" />
          <small v-if="errores.correo" class="error">{{ errores.correo }}</small>
        </label>

        <label class="campo">
          <span>Teléfono</span>
          <input v-model="formulario.telefono" type="tel" inputmode="numeric" placeholder="10 dígitos" :class="{ invalido: errores.telefono }" />
          <small v-if="errores.telefono" class="error">{{ errores.telefono }}</small>
        </label>

        <label class="campo">
          <span>Puesto *</span>
          <input v-model="formulario.puesto" type="text" placeholder="Ej. Cajera, Maestro paletero" :class="{ invalido: errores.puesto }" />
          <small v-if="errores.puesto" class="error">{{ errores.puesto }}</small>
        </label>

        <label class="campo">
          <span>Fecha de ingreso</span>
          <input v-model="formulario.fechaIngreso" type="date" />
        </label>

        <div class="campo campo-ancho">
          <span>Estado</span>
          <label class="interruptor">
            <input v-model="formulario.activo" type="checkbox" />
            <span class="interruptor-pista"></span>
            {{ formulario.activo ? 'Activo: puede acceder a la plataforma' : 'Inactivo: sin acceso a la plataforma' }}
          </label>
        </div>
      </div>

      <!-- Rol y permisos -->
      <div v-show="pestana === 'permisos'">
        <h3 class="seccion-titulo">Rol</h3>
        <div class="roles">
          <label
            v-for="rol in ROLES"
            :key="rol.id"
            :class="['rol', { seleccionado: formulario.rolId === rol.id }]"
            :style="{ '--color-rol': rol.color, '--fondo-rol': rol.fondo }"
          >
            <input
              type="radio"
              name="rol"
              :value="rol.id"
              :checked="formulario.rolId === rol.id"
              @change="seleccionarRol(rol.id)"
            />
            <strong>{{ rol.nombre }}</strong>
            <small>{{ rol.descripcion }}</small>
          </label>
        </div>

        <div class="permisos-cabecera">
          <h3 class="seccion-titulo">Permisos</h3>
          <span v-if="permisosPersonalizados" class="etiqueta-personalizado">Personalizados</span>
          <button
            v-if="permisosPersonalizados"
            type="button"
            class="btn-enlace"
            @click="seleccionarRol(formulario.rolId)"
          >
            Restablecer los del rol
          </button>
        </div>

        <div class="tabla-permisos-contenedor">
          <table class="tabla-permisos">
            <thead>
              <tr>
                <th>Módulo</th>
                <th v-for="accion in ACCIONES" :key="accion.id">{{ accion.nombre }}</th>
                <th>Todos</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="modulo in MODULOS" :key="modulo.id">
                <td class="modulo">{{ modulo.nombre }}</td>
                <td v-for="accion in ACCIONES" :key="accion.id">
                  <input
                    type="checkbox"
                    :checked="tienePermiso(modulo.id, accion.id)"
                    :aria-label="`${accion.nombre} ${modulo.nombre}`"
                    @change="alternarPermiso(modulo.id, accion.id)"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    :checked="moduloCompleto(modulo.id)"
                    :aria-label="`Todos los permisos de ${modulo.nombre}`"
                    @change="alternarModulo(modulo.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="nota">Al marcar Crear, Editar o Eliminar se activa también Ver en ese módulo.</p>
      </div>
    </form>

    <template #pie>
      <button type="button" class="btn btn-secundario" @click="emit('cerrar')">Cancelar</button>
      <button type="submit" form="form-empleado" class="btn btn-primario">
        {{ empleado ? 'Guardar cambios' : 'Crear empleado' }}
      </button>
    </template>
  </ModalBase>
</template>

<style scoped>
.pestanas {
  display: flex;
  gap: 0.4rem;
  padding: 0.3rem;
  margin-bottom: 1.5rem;
  border-radius: 14px;
  background: #f1f5f9;
}

.pestana {
  flex: 1;
  position: relative;
  padding: 0.7rem 1rem;
  border: none;
  border-radius: 11px;
  background: transparent;
  color: #64748b;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.pestana.activa {
  background: white;
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.pestana-alerta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: 0.3rem;
  border-radius: 50%;
  background: #dc2626;
  color: white;
  font-size: 0.75rem;
}

/* Campos */
.campos {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.1rem 1.2rem;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
}

.campo-ancho {
  grid-column: 1 / -1;
}

.campo input[type='text'],
.campo input[type='email'],
.campo input[type='tel'],
.campo input[type='date'] {
  padding: 0.7rem 0.9rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 400;
  color: #0f172a;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.campo input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.campo input.invalido {
  border-color: #f87171;
}

.error {
  color: #dc2626;
  font-weight: 500;
}

.interruptor {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
}

.interruptor input {
  position: absolute;
  opacity: 0;
}

.interruptor-pista {
  position: relative;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 12px;
  background: #cbd5e1;
  transition: background 0.2s;
}

.interruptor-pista::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
}

.interruptor input:checked + .interruptor-pista {
  background: #10b981;
}

.interruptor input:checked + .interruptor-pista::after {
  transform: translateX(20px);
}

.interruptor input:focus-visible + .interruptor-pista {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Roles */
.seccion-titulo {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.8rem;
}

.roles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1.6rem;
}

.rol {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.9rem;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}

.rol input {
  position: absolute;
  opacity: 0;
}

.rol strong {
  color: var(--color-rol);
}

.rol small {
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.4;
}

.rol:hover {
  border-color: var(--color-rol);
}

.rol.seleccionado {
  border-color: var(--color-rol);
  background: var(--fondo-rol);
}

.rol:has(input:focus-visible) {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Permisos */
.permisos-cabecera {
  display: flex;
  align-items: baseline;
  gap: 0.8rem;
}

.etiqueta-personalizado {
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  background: #fef3c7;
  color: #b45309;
  font-size: 0.75rem;
  font-weight: 700;
}

.btn-enlace {
  margin-left: auto;
  border: none;
  background: none;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
}

.tabla-permisos-contenedor {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
}

.tabla-permisos {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.tabla-permisos th,
.tabla-permisos td {
  padding: 0.65rem 0.8rem;
  text-align: center;
  border-bottom: 1px solid #f1f5f9;
}

.tabla-permisos th {
  background: #f8fafc;
  color: #64748b;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tabla-permisos th:first-child,
.tabla-permisos .modulo {
  text-align: left;
}

.tabla-permisos .modulo {
  font-weight: 600;
  color: #0f172a;
}

.tabla-permisos tbody tr:last-child td {
  border-bottom: none;
}

.tabla-permisos input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
  cursor: pointer;
}

.nota {
  margin-top: 0.7rem;
  font-size: 0.8rem;
  color: #64748b;
}

/* Botones del pie */
.btn {
  padding: 0.7rem 1.4rem;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, background 0.2s;
}

.btn-primario {
  background: linear-gradient(to bottom, #3b82f6, #2563eb);
  color: white;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

.btn-primario:hover {
  transform: translateY(-1px);
}

.btn-secundario {
  background: white;
  color: #334155;
  border: 1.5px solid #e2e8f0;
}

.btn-secundario:hover {
  background: #f1f5f9;
}

@media (max-width: 600px) {
  .campos {
    grid-template-columns: 1fr;
  }
}
</style>
