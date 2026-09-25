<script setup lang="ts">
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