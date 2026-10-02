<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import ModalBase from './ModalBase.vue'
import ModalEmpleado from './empleados/ModalEmpleado.vue'
import ModalDetalleEmpleado from './empleados/ModalDetalleEmpleado.vue'
import {
  ROLES,
  formatearFecha,
  iniciales,
  obtenerRol,
  todosLosPermisos,
  useEmpleados,
  type Empleado,
  type EmpleadoNuevo,
  type RolId,
} from '../composables/useEmpleados'

type Pestana = 'datos' | 'permisos'

const { empleados, crear, actualizar, eliminar } = useEmpleados()
const totalPermisos = todosLosPermisos().length

/* Filtros */
const busqueda = ref('')
const filtroRol = ref<RolId | ''>('')
const filtroEstado = ref<'' | 'activo' | 'inactivo'>('')

const empleadosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return empleados.value.filter((empleado) => {
    const coincideTexto =
      !texto ||
      empleado.nombre.toLowerCase().includes(texto) ||
      empleado.correo.includes(texto) ||
      empleado.puesto.toLowerCase().includes(texto)
    const coincideRol = !filtroRol.value || empleado.rolId === filtroRol.value
    const coincideEstado = !filtroEstado.value || (filtroEstado.value === 'activo') === empleado.activo
    return coincideTexto && coincideRol && coincideEstado
  })
})

const hayFiltros = computed(() => !!(busqueda.value || filtroRol.value || filtroEstado.value))

const limpiarFiltros = () => {
  busqueda.value = ''
  filtroRol.value = ''
  filtroEstado.value = ''
}

/* Indicadores */
const kpis = computed(() => {
  const total = empleados.value.length
  const activos = empleados.value.filter((empleado) => empleado.activo).length
  const administradores = empleados.value.filter((empleado) => empleado.rolId === 'administrador').length
  return [
    { titulo: 'Plantilla total', valor: total, detalle: 'Empleados registrados', icono: '👥', destacado: true },
    { titulo: 'Activos', valor: activos, detalle: `${total ? Math.round((activos / total) * 100) : 0}% de la plantilla`, icono: '✅' },
    { titulo: 'Inactivos', valor: total - activos, detalle: 'Sin acceso a la plataforma', icono: '⏸️' },
    { titulo: 'Administradores', valor: administradores, detalle: 'Con acceso total', icono: '🛡️' },
  ]
})

/* Aviso temporal */
const aviso = ref('')
let temporizadorAviso: ReturnType<typeof setTimeout> | undefined

const notificar = (mensaje: string) => {
  aviso.value = mensaje
  clearTimeout(temporizadorAviso)
  temporizadorAviso = setTimeout(() => (aviso.value = ''), 3000)
}

onUnmounted(() => clearTimeout(temporizadorAviso))

/* Crear y editar */
const modalFormulario = ref(false)
const empleadoEditando = ref<Empleado | null>(null)
const pestanaInicial = ref<Pestana>('datos')

const abrirNuevo = () => {
  empleadoEditando.value = null
  pestanaInicial.value = 'datos'
  modalFormulario.value = true
}

const abrirEdicion = (empleado: Empleado, pestana: Pestana = 'datos') => {
  modalDetalle.value = false
  empleadoEditando.value = empleado
  pestanaInicial.value = pestana
  modalFormulario.value = true
}

const guardarEmpleado = (datos: EmpleadoNuevo) => {
  if (empleadoEditando.value) {
    actualizar(empleadoEditando.value.id, datos)
    notificar(`Se actualizó a ${datos.nombre}.`)
  } else {
    crear(datos)
    notificar(`${datos.nombre} se agregó al equipo.`)
  }
  modalFormulario.value = false
}

/* Detalle */
const modalDetalle = ref(false)
const empleadoDetalle = ref<Empleado | null>(null)

const abrirDetalle = (empleado: Empleado) => {
  empleadoDetalle.value = empleado
  modalDetalle.value = true
}

/* Eliminar */
const modalEliminar = ref(false)
const empleadoEliminar = ref<Empleado | null>(null)

const pedirEliminacion = (empleado: Empleado) => {
  empleadoEliminar.value = empleado
  modalEliminar.value = true
}

const confirmarEliminacion = () => {
  if (!empleadoEliminar.value) return
  eliminar(empleadoEliminar.value.id)
  notificar(`Se eliminó a ${empleadoEliminar.value.nombre}.`)
  modalEliminar.value = false
}
import { ref } from 'vue';
import { Line, Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, BarElement, CategoryScale, LinearScale, PointElement } from 'chart.js';


ChartJS.register(Title, Tooltip, Legend, LineElement, BarElement, CategoryScale, LinearScale, PointElement);

// Gráfico de Línea: Contrataciones y Despidos
const lineData = ref({
  labels: ['Enero', 'Febrero', 'Marzo', 'Abril'],
  datasets: [{
    borderColor: '#2563eb',
    backgroundColor: 'transparent',
    data: [7, 5, 3, 6],
    tension: 0.4 // Hace que la línea sea curva
  }]
});

const lineOptions = ref({
  responsive: true, 
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { min: 0, max: 7, ticks: { stepSize: 1 } } }
});

// Gráfico de Barras: Departamentos
const barData = ref({
  labels: ['Ventas', 'Marketing', 'RH', 'Operaciones'],
  datasets: [{
    backgroundColor: '#bfdbfe', // Azul clarito
    data: [7, 5, 3, 6],
    borderRadius: 4
  }]
});

const barOptions = ref({
  responsive: true, 
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { min: 0, max: 7, ticks: { stepSize: 1 } } }
});
</script>

<template>
  <div class="employees-view">
    <div class="view-header">
      <div>
        <h1 class="titulo">Empleados</h1>
        <p class="subtitulo">Administra a tu equipo, sus roles y lo que puede hacer en la plataforma.</p>
      </div>
      <button type="button" class="btn btn-primario" @click="abrirNuevo">＋ Nuevo empleado</button>
    </div>

    <div class="kpi-grid">
      <div v-for="kpi in kpis" :key="kpi.titulo" :class="['kpi-card', { 'blue-card': kpi.destacado }]">
        <div class="card-icon">{{ kpi.icono }}</div>
        <p class="kpi-titulo">{{ kpi.titulo }}</p>
        <h3 class="kpi-valor">{{ kpi.valor }}</h3>
        <p class="kpi-detalle">{{ kpi.detalle }}</p>
      </div>
    </div>

    <section class="panel-tabla">
      <div class="barra-filtros">
        <input v-model="busqueda" type="search" class="buscador" placeholder="🔍 Buscar por nombre, correo o puesto" />
        <select v-model="filtroRol" class="selector" aria-label="Filtrar por rol">
          <option value="">Todos los roles</option>
          <option v-for="rol in ROLES" :key="rol.id" :value="rol.id">{{ rol.nombre }}</option>
        </select>
        <select v-model="filtroEstado" class="selector" aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <button v-if="hayFiltros" type="button" class="btn-enlace" @click="limpiarFiltros">Limpiar filtros</button>
      </div>

      <div class="tabla-contenedor">
        <table class="tabla">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Puesto</th>
              <th>Rol</th>
              <th>Permisos</th>
              <th>Estado</th>
              <th>Ingreso</th>
              <th class="col-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="empleado in empleadosFiltrados" :key="empleado.id">
              <td>
                <div class="celda-empleado">
                  <span class="avatar" :style="{ background: obtenerRol(empleado.rolId).color }">
                    {{ iniciales(empleado.nombre) }}
                  </span>
                  <div>
                    <strong>{{ empleado.nombre }}</strong>
                    <small>{{ empleado.correo }}</small>
                  </div>
                </div>
              </td>
              <td>{{ empleado.puesto }}</td>
              <td>
                <span
                  class="etiqueta"
                  :style="{ color: obtenerRol(empleado.rolId).color, background: obtenerRol(empleado.rolId).fondo }"
                >
                  {{ obtenerRol(empleado.rolId).nombre }}
                </span>
              </td>
              <td>
                <div class="permisos-barra" :title="`${empleado.permisos.length} de ${totalPermisos} permisos`">
                  <div class="permisos-relleno" :style="{ width: `${(empleado.permisos.length / totalPermisos) * 100}%` }"></div>
                </div>
                <small class="permisos-texto">{{ empleado.permisos.length }}/{{ totalPermisos }}</small>
              </td>
              <td>
                <span :class="['etiqueta', empleado.activo ? 'activo' : 'inactivo']">
                  {{ empleado.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="fecha">{{ formatearFecha(empleado.fechaIngreso) }}</td>
              <td class="col-acciones">
                <div class="acciones">
                  <button type="button" class="btn-icono" title="Ver detalle" :aria-label="`Ver a ${empleado.nombre}`" @click="abrirDetalle(empleado)">👁️</button>
                  <button type="button" class="btn-icono" title="Editar" :aria-label="`Editar a ${empleado.nombre}`" @click="abrirEdicion(empleado)">✏️</button>
                  <button type="button" class="btn-icono" title="Rol y permisos" :aria-label="`Rol y permisos de ${empleado.nombre}`" @click="abrirEdicion(empleado, 'permisos')">🛡️</button>
                  <button type="button" class="btn-icono peligro" title="Eliminar" :aria-label="`Eliminar a ${empleado.nombre}`" @click="pedirEliminacion(empleado)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!empleadosFiltrados.length" class="vacio">
          <p v-if="hayFiltros">Ningún empleado coincide con los filtros.</p>
          <p v-else>Aún no hay empleados registrados.</p>
          <button v-if="hayFiltros" type="button" class="btn-enlace" @click="limpiarFiltros">Limpiar filtros</button>
          <button v-else type="button" class="btn btn-primario" @click="abrirNuevo">＋ Agregar el primero</button>
        </div>
      </div>
    </section>

    <ModalEmpleado
      :abierto="modalFormulario"
      :empleado="empleadoEditando"
      :pestana-inicial="pestanaInicial"
      @cerrar="modalFormulario = false"
      @guardar="guardarEmpleado"
    />

    <ModalDetalleEmpleado
      :abierto="modalDetalle"
      :empleado="empleadoDetalle"
      @cerrar="modalDetalle = false"
      @editar="abrirEdicion($event)"
      @permisos="abrirEdicion($event, 'permisos')"
    />

    <ModalBase :abierto="modalEliminar" titulo="Eliminar empleado" ancho="440px" @cerrar="modalEliminar = false">
      <p class="confirmacion">
        ¿Seguro que quieres eliminar a <strong>{{ empleadoEliminar?.nombre }}</strong>?
        Perderá el acceso a la plataforma y esta acción no se puede deshacer.
      </p>
      <template #pie>
        <button type="button" class="btn btn-secundario" @click="modalEliminar = false">Cancelar</button>
        <button type="button" class="btn btn-peligro" @click="confirmarEliminacion">Eliminar</button>
      </template>
    </ModalBase>

    <Transition name="aviso">
      <div v-if="aviso" class="aviso" role="status">✓ {{ aviso }}</div>
    </Transition>
    <!-- Cabecera y Filtros -->
    <div class="view-header">
      <div class="hero-section">
        <h1 class="business-name">[Inserte nombre del Negocio]</h1>
        <p class="business-slogan">[Inserte Eslogan del Negocio] <span class="optional">[Opcional]</span></p>
      </div>
      
      <div class="filters">
        <div class="pill-select">
          <span>Este Trimestre</span> <span class="arrow">v</span>
        </div>
        <button class="pill-btn blue">
          <span class="icon">Y</span> Filtrar
        </button>
      </div>
    </div>

    <!-- Grid de KPIs (Página Empleados) -->
    <div class="kpi-grid">
      <div class="kpi-card blue-card">
        <div class="card-icon">👥</div>
        <p class="subtitle">Plantilla Total</p>
        <h3 class="value">115</h3>
        <p class="trend">+5% desde el último mes</p>
      </div>

      <div class="kpi-card">
        <div class="card-icon black-icon">🔄</div>
        <p class="subtitle">Tasa de Rotación</p>
        <h3 class="value">3.2%</h3>
        <p class="trend">-0.6 este mes</p>
      </div>

      <div class="kpi-card">
        <div class="card-icon black-icon">👤</div>
        <p class="subtitle">Promedio Ausencia</p>
        <h3 class="value">2.2 días</h3>
        <p class="trend">+0.1% esta semana</p>
      </div>

      <div class="kpi-card">
        <div class="card-icon black-icon">🎯</div>
        <p class="subtitle">Productividad Individual</p>
        <h3 class="value">4.8%</h3>
        <p class="trend">+14% este mes</p>
      </div>
    </div>

    <!-- Grid de Gráficos -->
    <div class="charts-grid">
      
      <!-- Gráfico de Contrataciones -->
      <div class="chart-box">
         <h4 class="chart-title">Contrataciones y Despidos (2026)</h4>
         <div class="line-wrapper">
           <Line :data="lineData" :options="lineOptions" />
         </div>
      </div>
      
      <!-- Panel RH (Texto + Gráfico de Barras) -->
      <div class="chart-box rh-panel">
         <h4 class="chart-title-left">Desglose por Departamento</h4>
         
         <div class="rh-content">
           <div class="rh-text-stats">
             <h3 class="rh-subtitle">Indicadores en RH</h3>
             <ul class="stats-list">
               <li>Asistencia <span>---> %</span></li>
               <li>Horas Extra Promedio <span>---> %</span></li>
               <li>Desempeño General <span>---> x/10</span></li>
             </ul>
             <button class="btn-detalles">Ver Informes</button>
           </div>
           
           <div class="bar-wrapper">
             <Bar :data="barData" :options="barOptions" />
           </div>
         </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.employees-view {
  max-width: 1400px;
  margin: 0 auto;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.titulo {
  font-size: clamp(2rem, 3.4vw, 3rem);
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -1px;
  margin-bottom: 0.4rem;
}

.subtitulo {
  color: #475569;
}

/* Tarjetas KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.kpi-card {
  position: relative;
  padding: 1.6rem 1.5rem;
  border-radius: 20px;
  background: white;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.kpi-card.blue-card {
  background: #2563eb;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.2);
}

.card-icon {
  position: absolute;
  top: 1.4rem;
  right: 1.4rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eff6ff;
  font-size: 1.1rem;
}

.blue-card .card-icon {
  background: white;
}

.kpi-titulo {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 0.5rem;
}

.kpi-valor {
  font-size: 2.2rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.4rem;
}

.kpi-detalle {
  font-size: 0.78rem;
  color: #64748b;
}

.blue-card .kpi-titulo { color: #dbeafe; }
.blue-card .kpi-valor { color: white; }
.blue-card .kpi-detalle { color: #bfdbfe; }

/* Tabla */
.panel-tabla {
  padding: 1.5rem;
  border-radius: 20px;
  background: white;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.barra-filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
}

.buscador,
.selector {
  padding: 0.7rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  font-size: 0.95rem;
  color: #0f172a;
  outline: none;
}

.buscador {
  flex: 1;
  min-width: 240px;
}

.buscador:focus,
.selector:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.tabla-contenedor {
  overflow-x: auto;
}

.tabla {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
}

.tabla th {
  padding: 0.8rem 1rem;
  text-align: left;
  font-size: 0.78rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #f1f5f9;
}

.tabla td {
  padding: 0.9rem 1rem;
  font-size: 0.92rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}

.tabla tbody tr {
  transition: background 0.15s;
}

.tabla tbody tr:hover {
  background: #f8fafc;
}

.celda-empleado {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.celda-empleado strong {
  display: block;
  color: #0f172a;
}

.celda-empleado small {
  color: #64748b;
  font-size: 0.8rem;
}

.avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: white;
  font-weight: 800;
  font-size: 0.9rem;
}

.etiqueta {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
}

.etiqueta.activo {
  background: #d1fae5;
  color: #047857;
}

.etiqueta.inactivo {
  background: #f1f5f9;
  color: #64748b;
}

.permisos-barra {
  width: 90px;
  height: 6px;
  border-radius: 3px;
  background: #e2e8f0;
  overflow: hidden;
}

.permisos-relleno {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, #3b82f6, #10b981);
}

.permisos-texto {
  font-size: 0.75rem;
  color: #64748b;
}

.fecha {
  white-space: nowrap;
}

.col-acciones {
  text-align: right;
}

.tabla th.col-acciones {
  text-align: right;
}

.acciones {
  display: inline-flex;
  gap: 0.3rem;
}

.btn-icono {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}

.btn-icono:hover {
  background: #dbeafe;
  transform: translateY(-1px);
}

.btn-icono.peligro:hover {
  background: #fee2e2;
}

.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  padding: 3rem 1rem;
  color: #64748b;
}

/* Botones */
.btn {
  padding: 0.75rem 1.4rem;
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

.btn-peligro {
  background: #dc2626;
  color: white;
  box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
}

.btn-peligro:hover {
  background: #b91c1c;
}

.btn-enlace {
  border: none;
  background: none;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
}

.confirmacion {
  color: #334155;
  line-height: 1.6;
}

/* Aviso */
.aviso {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 1100;
  padding: 0.9rem 1.3rem;
  border-radius: 14px;
  background: #0f172a;
  color: white;
  font-weight: 600;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.3);
}

.aviso-enter-active,
.aviso-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.aviso-enter-from,
.aviso-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
/* Estilos base reutilizados del diseño anterior */
.view-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
.business-name { font-size: 3.5rem; font-weight: 900; color: #0f172a; letter-spacing: -1px; margin-bottom: 0.5rem; }
.business-slogan { font-size: 1.1rem; color: #334155; font-weight: 300; }
.business-slogan .optional { color: #64748b; }

.filters { display: flex; gap: 1rem; padding-top: 1rem; }
.pill-select, .pill-btn { padding: 0.7rem 1.8rem; border-radius: 30px; font-weight: 500; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.pill-select { background: white; color: #4b5563; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.pill-btn.blue { background: #2563eb; color: white; border: none; box-shadow: 0 4px 10px rgba(37,99,235,0.3); }

/* Tarjetas KPI */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
.kpi-card { background: white; padding: 1.8rem 1.5rem; border-radius: 20px; position: relative; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
.kpi-card.blue-card { background: #2563eb; color: white; box-shadow: 0 10px 20px rgba(37,99,235,0.2); }

.card-icon { position: absolute; top: 1.5rem; right: 1.5rem; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; background: white; color: #2563eb;}
.black-icon { background: #0f172a; color: white; }

.subtitle { font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: 300; }
.blue-card .subtitle { color: #dbeafe; }
.kpi-card:not(.blue-card) .subtitle { color: #64748b; }

.value { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.5rem; }
.blue-card .value { color: white; }
.kpi-card:not(.blue-card) .value { color: #0f172a; }

.trend { font-size: 0.75rem; font-weight: 300; }
.blue-card .trend { color: #bfdbfe; }
.kpi-card:not(.blue-card) .trend { color: #64748b; }

/* Contenedores de Gráficos */
.charts-grid { display: grid; grid-template-columns: 2fr 1.3fr; gap: 1.5rem; }
.chart-box { background: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }

.chart-title { text-align: center; color: #64748b; font-weight: 400; margin-bottom: 1rem; font-size: 1rem; }
.line-wrapper { height: 260px; }

/* Panel específico de Recursos Humanos (derecha) */
.rh-panel { display: flex; flex-direction: column; }
.chart-title-left { color: #64748b; font-weight: 400; font-size: 0.9rem; margin-bottom: 1rem; }

.rh-content { display: flex; justify-content: space-between; gap: 1rem; height: 100%; }
.rh-text-stats { display: flex; flex-direction: column; justify-content: space-between; flex: 1; }
.rh-subtitle { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem; }

.stats-list { list-style: none; padding: 0; margin-bottom: 1.5rem; }
.stats-list li { font-size: 0.85rem; color: #64748b; margin-bottom: 0.5rem; }
.stats-list li span { color: #94a3b8; }

.btn-detalles { background: #3b82f6; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 20px; font-weight: 500; cursor: pointer; width: fit-content; }
.bar-wrapper { width: 50%; height: 220px; }
</style>
