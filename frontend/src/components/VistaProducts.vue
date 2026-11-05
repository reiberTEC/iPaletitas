<script setup lang="ts">
import { ref } from 'vue';
import { Pie, Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale } from 'chart.js';

// Registramos los elementos de Chart.js necesarios
ChartJS.register(Title, Tooltip, Legend, BarElement, ArcElement, CategoryScale, LinearScale);

// Datos de la Tabla de Productos
const productos = ref([
  { id: 'P001', nombre: 'Paleta de Fresa', categoria: 'Fruta', stock: 2500, estado: 'Normal', pasillo: 'Pasillo 3', fecha: '15/07', costo: 1.20, pvp: 2.50, ventas: 680 },
  { id: 'P002', nombre: 'Paleta de Fresa', categoria: 'Fruta', stock: 2500, estado: 'Bajo', pasillo: 'Pasillo 3', fecha: '15/07', costo: 1.20, pvp: 2.50, ventas: 680 },
  { id: 'P003', nombre: 'Paleta de Crema', categoria: 'Especiales', stock: 1500, estado: 'Bajo', pasillo: 'Pasillo 3', fecha: '15/07', costo: 1.20, pvp: 2.50, ventas: 620 },
  { id: 'P004', nombre: 'Paleta de Crema', categoria: 'Fruta', stock: 1200, estado: 'Bajo', pasillo: 'Pasillo 3', fecha: '15/07', costo: 1.20, pvp: 2.50, ventas: 490 },
  { id: 'P005', nombre: 'Paleta de Tamarindo', categoria: 'Fruta', stock: 800, estado: 'Normal', pasillo: 'Pasillo 3', fecha: '15/07', costo: 1.20, pvp: 2.50, ventas: 430 },
  { id: 'P006', nombre: 'Paleta de Crema', categoria: 'Fruta', stock: 300, estado: 'Normal', pasillo: 'Pasillo 3', fecha: '15/07', costo: 1.20, pvp: 2.50, ventas: 280 },
  { id: 'P007', nombre: 'Paleta de Coco', categoria: 'Fruta', stock: 300, estado: 'Normal', pasillo: 'Pasillo 3', fecha: '15/07', costo: 1.20, pvp: 2.50, ventas: 680 }
]);

// Gráfico de Pastel (Pie)
const pieData = ref({
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [{
    data: [13.1, 28.6, 28, 30.3],
    backgroundColor: ['#dbeafe', '#e9d5ff', '#fbcfe8', '#f472b6'], // Azul, Morado claro, Rosa claro, Rosa oscuro
    borderWidth: 0
  }]
});

const pieOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } }
});

// Gráfico de Barras
const barData = ref({
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [{
    backgroundColor: '#bfdbfe',
    data: [45000, 98000, 95000, 105000],
    borderRadius: 4
  }]
});

const barOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { display: true, ticks: { maxTicksLimit: 5 } } }
});
</script>

<template>
  <div class="products-view">
    <!-- Cabecera y Filtros -->
    <div class="view-header">
      <div class="hero-section">
        <h1 class="business-name">[Inserte nombre del Negocio]</h1>
        <p class="business-slogan">[Inserte Eslogan del Negocio] <span class="optional">[Opcional]</span></p>
      </div>
      
      <div class="filters">
        <div class="pill-select">
          <span>Este Mes</span> <span class="arrow">v</span>
        </div>
        <button class="pill-btn blue">
          <span class="icon">Y</span> Filtrar
        </button>
      </div>
    </div>

    <!-- Grid de KPIs (Página Productos) -->
    <div class="kpi-grid">
      <div class="kpi-card blue-card">
        <div class="card-icon circle white-circle"></div>
        <p class="subtitle">Recetario: Fórmulas Activas</p>
        <h3 class="value">40</h3>
        <p class="trend">+3 fórmulas añadidas este mes</p>
      </div>

      <div class="kpi-card">
        <div class="card-icon circle black-circle"></div>
        <p class="subtitle">Productos en Seguimiento</p>
        <h3 class="value">14</h3>
        <p class="trend">-1 este mes</p>
      </div>

      <div class="kpi-card">
        <div class="card-icon circle blue-circle"></div>
        <p class="subtitle">Pedidos de Insumos Pendientes</p>
        <h3 class="value">6</h3>
        <p class="trend">+2 este mes</p>
      </div>

      <div class="kpi-card">
        <div class="card-icon circle black-circle"></div>
        <p class="subtitle">Conversion Rate</p>
        <h3 class="value">4.8%</h3>
        <p class="trend">+12%</p>
      </div>
    </div>

    <!-- Sección Principal: Tabla y Gráficos -->
    <div class="content-grid">
      
      <!-- Tabla de Productos -->
      <div class="panel-box table-panel">
        <h3 class="panel-title">Stock y Recetario Detallado</h3>
        
        <div class="table-responsive">
          <table class="styled-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del<br>Producto</th>
                <th>Categoría</th>
                <th>Stock Actual<br>(Uds)</th>
                <th>Estado de<br>Stock</th>
                <th>Ubicación<br>Bodega</th>
                <th>Última<br>Compra</th>
                <th>Coste de<br>Producción</th>
                <th>PVP<br>Sugerido</th>
                <th>Ventas Mes<br>(Uds)</th>
                <th>Recetario<br>Relacionado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in productos" :key="item.id">
                <td class="font-bold">{{ item.id }}</td>
                <td>{{ item.nombre }}</td>
                <td>{{ item.categoria }}</td>
                <td>{{ item.stock }}</td>
                <td>
                  <div class="stock-status">
                    <span>{{ item.estado }}</span>
                    <div :class="['status-line', item.estado.toLowerCase()]"></div>
                  </div>
                </td>
                <td>{{ item.pasillo }}</td>
                <td>{{ item.fecha }}</td>
                <td>${{ item.costo.toFixed(2) }}</td>
                <td>${{ item.pvp.toFixed(2) }}</td>
                <td>{{ item.ventas }}</td>
                <td><a href="#" class="link-receta">Ver Receta</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Panel de Gráficos -->
      <div class="panel-box charts-panel">
        <h3 class="panel-title text-center">Stock Detallado y Acceso a Recetas</h3>
        
        <div class="charts-flex">
          <!-- Columna del Pastel -->
          <div class="chart-col">
            <div class="pie-container">
              <Pie :data="pieData" :options="pieOptions" />
            </div>
            <button class="btn-inventario">Ver Inventario</button>
          </div>
          
          <!-- Columna de Barras -->
          <div class="chart-col">
            <div class="bar-container">
              <Bar :data="barData" :options="barOptions" />
            </div>
            <p class="chart-caption">Productos con menor<br>Rotación (Mes)</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Cabecera y Filtros */
.view-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
.business-name { font-size: 3.5rem; font-weight: 900; color: #0f172a; letter-spacing: -1px; margin-bottom: 0.5rem; }
.business-slogan { font-size: 1.1rem; color: #334155; font-weight: 300; }
.business-slogan .optional { color: #64748b; }
.filters { display: flex; gap: 1rem; padding-top: 1rem; }
.pill-select, .pill-btn { padding: 0.7rem 1.8rem; border-radius: 30px; font-weight: 500; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.pill-select { background: white; color: #4b5563; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.pill-btn.blue { background: #2563eb; color: white; border: none; box-shadow: 0 4px 10px rgba(37,99,235,0.3); }

/* Tarjetas KPI con iconos circulares */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
.kpi-card { background: white; padding: 1.5rem; border-radius: 20px; position: relative; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
.kpi-card.blue-card { background: #2563eb; color: white; box-shadow: 0 10px 20px rgba(37,99,235,0.2); }

.card-icon.circle { position: absolute; top: 1.5rem; right: 1.5rem; width: 35px; height: 35px; border-radius: 50%; }
.white-circle { background: white; }
.black-circle { background: #0f172a; }
.blue-circle { background: #2563eb; }

.subtitle { font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: 300; padding-right: 2rem; }
.blue-card .subtitle { color: #dbeafe; }
.kpi-card:not(.blue-card) .subtitle { color: #64748b; }

.value { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.5rem; }
.blue-card .value { color: white; }
.kpi-card:not(.blue-card) .value { color: #0f172a; }

.trend { font-size: 0.75rem; font-weight: 300; }
.blue-card .trend { color: #bfdbfe; }
.kpi-card:not(.blue-card) .trend { color: #64748b; }

/* Grid Inferior (Tabla + Gráficos) */
.content-grid { display: grid; grid-template-columns: 1.8fr 1fr; gap: 1.5rem; }
.panel-box { background: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
.panel-title { font-size: 1.1rem; color: #0f172a; font-weight: 700; margin-bottom: 1.5rem; }
.text-center { text-align: center; }

/* Tabla Estilizada */
.table-responsive { overflow-x: auto; }
.styled-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
.styled-table th { color: #64748b; font-weight: 600; text-align: center; padding: 0.5rem; border-bottom: 1px solid #e2e8f0; vertical-align: bottom; }
.styled-table td { padding: 0.75rem 0.5rem; text-align: center; color: #334155; border-bottom: 1px solid #f1f5f9; }
.styled-table .font-bold { font-weight: 700; color: #0f172a; }

/* Indicador de Estado */
.stock-status { display: flex; flex-direction: column; align-items: center; gap: 2px; font-weight: 600; }
.status-line { width: 30px; height: 4px; border-radius: 2px; }
.status-line.normal { background: #22c55e; }
.status-line.bajo { background: #ef4444; }

.link-receta { color: #2563eb; text-decoration: underline; font-weight: 600; cursor: pointer; }

/* Panel de Gráficos a la Derecha */
.charts-flex { display: flex; justify-content: space-around; align-items: flex-end; gap: 1rem; margin-top: 1rem; }
.chart-col { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; width: 45%; }

.pie-container { width: 140px; height: 140px; }
.btn-inventario { background: #3b82f6; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 20px; font-weight: 500; cursor: pointer; font-size: 0.85rem; }

.bar-container { width: 100%; height: 160px; }
.chart-caption { font-size: 0.85rem; font-weight: 700; color: #0f172a; text-align: center; line-height: 1.2; }
</style>