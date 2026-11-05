<script setup lang="ts">
import { computed } from 'vue'
import ModalBase from '../ModalBase.vue'
import {
  ACCIONES,
  MODULOS,
  clavePermiso,
  formatearFecha,
  iniciales,
  obtenerRol,
  type AccionId,
  type Empleado,
  type ModuloId,
} from '../../composables/useEmpleados'

const props = defineProps<{ abierto: boolean; empleado: Empleado | null }>()

const emit = defineEmits<{ cerrar: []; editar: [empleado: Empleado]; permisos: [empleado: Empleado] }>()

const rol = computed(() => (props.empleado ? obtenerRol(props.empleado.rolId) : null))

const tienePermiso = (modulo: ModuloId, accion: AccionId) =>
  props.empleado?.permisos.includes(clavePermiso(modulo, accion)) ?? false
</script>

<template>
  <ModalBase :abierto="abierto" titulo="Detalle del empleado" ancho="680px" @cerrar="emit('cerrar')">
    <template v-if="empleado && rol">
      <div class="perfil">
        <span class="avatar" :style="{ background: rol.color }">{{ iniciales(empleado.nombre) }}</span>
        <div>
          <h3 class="nombre">{{ empleado.nombre }}</h3>
          <p class="puesto">{{ empleado.puesto }}</p>
          <div class="etiquetas">
            <span class="etiqueta" :style="{ color: rol.color, background: rol.fondo }">{{ rol.nombre }}</span>
            <span :class="['etiqueta', empleado.activo ? 'activo' : 'inactivo']">
              {{ empleado.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
        </div>
      </div>

      <dl class="datos">
        <div>
          <dt>Correo</dt>
          <dd>{{ empleado.correo }}</dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd>{{ empleado.telefono || 'Sin registrar' }}</dd>
        </div>
        <div>
          <dt>Fecha de ingreso</dt>
          <dd>{{ formatearFecha(empleado.fechaIngreso) }}</dd>
        </div>
        <div>
          <dt>Permisos asignados</dt>
          <dd>{{ empleado.permisos.length }}</dd>
        </div>
      </dl>

      <h4 class="seccion-titulo">Permisos por módulo</h4>
      <div class="tabla-contenedor">
        <table class="tabla-permisos">
          <thead>
            <tr>
              <th>Módulo</th>
              <th v-for="accion in ACCIONES" :key="accion.id">{{ accion.nombre }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="modulo in MODULOS" :key="modulo.id">
              <td class="modulo">{{ modulo.nombre }}</td>
              <td v-for="accion in ACCIONES" :key="accion.id">
                <span v-if="tienePermiso(modulo.id, accion.id)" class="si" aria-label="Sí">✓</span>
                <span v-else class="no" aria-label="No">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template #pie>
      <button type="button" class="btn btn-secundario" @click="emit('cerrar')">Cerrar</button>
      <button v-if="empleado" type="button" class="btn btn-secundario" @click="emit('permisos', empleado)">
        🛡️ Rol y permisos
      </button>
      <button v-if="empleado" type="button" class="btn btn-primario" @click="emit('editar', empleado)">
        ✏️ Editar
      </button>
    </template>
  </ModalBase>
</template>

<style scoped>
.perfil {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 1.5rem;
}

.avatar {
  width: 68px;
  height: 68px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  color: white;
  font-size: 1.5rem;
  font-weight: 800;
}

.nombre {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
}

.puesto {
  color: #64748b;
  margin: 0.2rem 0 0.5rem;
}

.etiquetas {
  display: flex;
  gap: 0.5rem;
}

.etiqueta {
  padding: 0.25rem 0.7rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
}

.etiqueta.activo {
  background: #d1fae5;
  color: #047857;
}

.etiqueta.inactivo {
  background: #f1f5f9;
  color: #64748b;
}

.datos {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 1.1rem;
  margin-bottom: 1.5rem;
  border-radius: 14px;
  background: #f8fafc;
}

.datos dt {
  font-size: 0.8rem;
  color: #64748b;
  margin-bottom: 0.2rem;
}

.datos dd {
  margin: 0;
  font-weight: 600;
  color: #0f172a;
  word-break: break-all;
}

.seccion-titulo {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.8rem;
}

.tabla-contenedor {
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
  padding: 0.6rem 0.8rem;
  text-align: center;
  border-bottom: 1px solid #f1f5f9;
}

.tabla-permisos th {
  background: #f8fafc;
  color: #64748b;
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

.si {
  color: #059669;
  font-weight: 800;
}

.no {
  color: #cbd5e1;
}

.btn {
  padding: 0.7rem 1.3rem;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
}

.btn-primario {
  background: linear-gradient(to bottom, #3b82f6, #2563eb);
  color: white;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
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
  .datos {
    grid-template-columns: 1fr;
  }
}
</style>
