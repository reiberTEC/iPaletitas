<script setup lang="ts">
import { ref } from 'vue';
import { Line, Doughnut } from 'vue-chartjs';
// Importamos ArcElement que es necesario para la gráfica de dona
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler, ArcElement);

// Datos del gráfico de líneas
const lineData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  datasets: [
    { borderColor: '#1d4ed8', data: [0, 12, 38, 30, 32, 40, 40], tension: 0.3 },
    { borderColor: '#93c5fd', data: [12, 4, 20, 15, 40, 32, 40], tension: 0.3 },
    { borderColor: '#cbd5e1', data: [18, 30, 25, 40, 32, 25, 30], tension: 0.3 }
  ]
});

const lineOptions = ref({
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { min: 0, max: 40, ticks: { stepSize: 10 } } }
});

// Datos de la dona (Q1-Q4)
const donutData = ref({
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  datasets: [{
    data: [13.1, 28.6, 28, 30.3],
    backgroundColor: ['#bfdbfe', '#60a5fa', '#3b82f6', '#1d4ed8'],
    borderWidth: 0
  }]
});

const donutOptions = ref({
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  cutout: '70%' // Grosor de la dona
});
</script>

<template>
  <div class="sales-view">
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

    <!-- Tarjetas KPI -->
    <div class="kpi-grid">
      <!-- Tarjeta destacada Azul -->
      <div class="kpi-card blue-card">
        <div class="card-icon">💰</div>
        <p class="subtitle">Venta Total</p>
        <h3 class="value">$24,580</h3>
        <p class="trend">+12% desde el último mes</p>
      </div>

      <div class="kpi-card">
        <div class="card-icon black-icon">👤</div>
        <p class="subtitle">Usuarios Registrados</p>
        <h3 class="value">4,500</h3>
        <p class="trend">+8%</p>
      </div>

      <div class="kpi-card">
        <div class="card-icon blue-icon">↗</div>
        <p class="subtitle">Inicios de sesión totales</p>
        <h3 class="value">320</h3>
        <p class="trend">+5% esta semana</p>
      </div>

      <div class="kpi-card">
        <div class="card-icon black-icon">⏱</div>
        <p class="subtitle">Conversion Rate</p>
        <h3 class="value">4.8%</h3>
        <p class="trend">+12%</p>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="charts-grid">
      <!-- Gráfico de Líneas -->
      <div class="chart-box">
         <div class="line-wrapper">
           <Line :data="lineData" :options="lineOptions" />
         </div>
      </div>
      
      <!-- Gráfico de Dona y Detalles -->
      <div class="chart-box donut-box">
         <div class="donut-info">
           <h4 class="donut-title">Análisis Histórico</h4>
           <h2 class="donut-value">$150,495</h2>
           <button class="btn-detalles">Detalles</button>
         </div>
         <div class="donut-wrapper">
           <Doughnut :data="donutData" :options="donutOptions" />
         </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
.business-name { font-size: 3.5rem; font-weight: 900; color: #0f172a; letter-spacing: -1px; margin-bottom: 0.5rem; }
.business-slogan { font-size: 1.1rem; color: #334155; font-weight: 300; }
.business-slogan .optional { color: #64748b; }

.filters { display: flex; gap: 1rem; padding-top: 1rem; }
.pill-select, .pill-btn { padding: 0.7rem 1.8rem; border-radius: 30px; font-weight: 500; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.pill-select { background: white; color: #4b5563; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.pill-btn.blue { background: #2563eb; color: white; border: none; box-shadow: 0 4px 10px rgba(37,99,235,0.3); }

/* Grid de KPIs calcado de la imagen */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
.kpi-card { background: white; padding: 1.8rem 1.5rem; border-radius: 20px; position: relative; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
.kpi-card.blue-card { background: #2563eb; color: white; box-shadow: 0 10px 20px rgba(37,99,235,0.2); }

.card-icon { position: absolute; top: 1.5rem; right: 1.5rem; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; background: white; color: #2563eb;}
.black-icon { background: #0f172a; color: white; }
.blue-icon { background: #3b82f6; color: white; }

.subtitle { font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: 300; }
.blue-card .subtitle { color: #dbeafe; }
.kpi-card:not(.blue-card) .subtitle { color: #64748b; }

.value { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.5rem; }
.blue-card .value { color: white; }
.kpi-card:not(.blue-card) .value { color: #0f172a; }

.trend { font-size: 0.75rem; font-weight: 300; }
.blue-card .trend { color: #bfdbfe; }
.kpi-card:not(.blue-card) .trend { color: #64748b; }

/* Grid de Gráficos (2/3 Líneas, 1/3 Dona) */
.charts-grid { display: grid; grid-template-columns: 2fr 1.2fr; gap: 1.5rem; }
.chart-box { background: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
.line-wrapper { height: 280px; }

.donut-box { display: flex; align-items: center; justify-content: space-between; padding: 2rem; }
.donut-info { display: flex; flex-direction: column; gap: 0.5rem; }
.donut-title { font-size: 1rem; color: #64748b; font-weight: 400; }
.donut-value { font-size: 2.2rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem; }
.btn-detalles { background: #3b82f6; color: white; border: none; padding: 0.6rem 1.5rem; border-radius: 20px; font-weight: 500; cursor: pointer; width: fit-content; }
.donut-wrapper { height: 160px; width: 160px; position: relative; }
</style>