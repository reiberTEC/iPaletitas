<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type ScriptableContext,
} from 'chart.js'
import paliSenalando from '../assets/Img/pali-senalando.webp'
import paliPulgar from '../assets/Img/pali-pulgar.webp'
import paliPensando from '../assets/Img/pali-pensando.webp'
import paliSaludando from '../assets/Img/pali-saludando.webp'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip)

const ventasSemana = [12, 18, 15, 24, 22, 30, 38]
const ultimo = ventasSemana.length - 1

const degradadoHorizontal = (contexto: ScriptableContext<'line'>, inicio: string, fin: string) => {
  const { ctx, chartArea } = contexto.chart
  if (!chartArea) return inicio
  const degradado = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0)
  degradado.addColorStop(0, inicio)
  degradado.addColorStop(1, fin)
  return degradado
}

const datosVentas: ChartData<'line'> = {
  labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  datasets: [
    {
      label: 'Ventas',
      data: ventasSemana,
      fill: true,
      tension: 0.45,
      borderWidth: 4,
      borderColor: (contexto) => degradadoHorizontal(contexto, '#6366f1', '#10b981'),
      backgroundColor: (contexto) =>
        degradadoHorizontal(contexto, 'rgba(99, 102, 241, 0.18)', 'rgba(16, 185, 129, 0.35)'),
      pointStyle: 'triangle',
      pointRotation: 45,
      pointRadius: ventasSemana.map((_, i) => (i === ultimo ? 9 : 0)),
      pointHoverRadius: ventasSemana.map((_, i) => (i === ultimo ? 10 : 4)),
      pointBackgroundColor: '#10b981',
      pointBorderColor: '#10b981',
    },
  ],
}

const opcionesVentas: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { display: false },
    y: { display: false, beginAtZero: true, grace: '10%' },
  },
}

const alertas = [
  { tipo: 'peligro', titulo: 'Bajo stock en Fresa', detalle: 'Quedan 35 unidades, ¡haz un pedido!' },
  { tipo: 'aviso', titulo: 'Encuesta de clientes positiva', detalle: 'El 92% recomendaría tu paletería.' },
  { tipo: 'info', titulo: 'Oportunidad de temporada', detalle: 'Se acerca el calor: prepara más paletas de agua.' },
]

const decoraciones = [
  { emoji: '❄️', top: '3%', left: '78%', size: '2rem' },
  { emoji: '🍊', top: '9%', left: '95%', size: '3.2rem' },
  { emoji: '🍉', top: '13%', left: '86%', size: '2.4rem' },
  { emoji: '🧊', top: '20%', left: '80%', size: '1.8rem' },
  { emoji: '❄️', top: '33%', left: '98%', size: '1.6rem' },
  { emoji: '🍓', top: '72%', left: '0.5%', size: '2rem' },
  { emoji: '❄️', top: '82%', left: '3%', size: '1.5rem' },
  { emoji: '🍋', top: '88%', left: '40%', size: '1.6rem' },
  { emoji: '🧊', top: '86%', left: '62%', size: '2rem' },
  { emoji: '❄️', top: '90%', left: '12%', size: '1.3rem' },
]

const anioActual = new Date().getFullYear()
</script>

<template>
  <div class="inicio-view">
    <div class="decoraciones" aria-hidden="true">
      <span
        v-for="(deco, i) in decoraciones"
        :key="i"
        class="deco"
        :style="{ top: deco.top, left: deco.left, fontSize: deco.size }"
      >{{ deco.emoji }}</span>
    </div>

    <header class="encabezado">
      <h1 class="bienvenida">¡Bienvenido, [Negocio]! Tu Panel de Éxito</h1>
      <p class="eslogan">[Inserte Eslogan del Negocio] <span class="opcional">[Opcional]</span></p>
    </header>

    <section class="tarjeta-crecimiento">
      <h2 class="tarjeta-titulo">Crecimiento de Tu Negocio</h2>

      <div class="columnas">
        <article class="columna">
          <h3 class="columna-titulo">Resumen de Ventas</h3>
          <p class="columna-subtitulo">¡Ventas Diarias +28%! (¡Pali está orgulloso!)</p>

          <div class="ventas-contenido">
            <img :src="paliSenalando" alt="Pali señalando la gráfica de ventas" class="pali pali-senalando" />
            <div class="grafica-ventas">
              <div class="grafica-lienzo">
                <Line :data="datosVentas" :options="opcionesVentas" />
              </div>
              <p class="grafica-pie">¡Ventas Diarias +28%! (¡Pali está orgulloso!)</p>
            </div>
          </div>

          <RouterLink :to="{ name: 'reportes' }" class="btn-accion">Ver Reportes Detallados</RouterLink>
        </article>

        <article class="columna">
          <h3 class="columna-titulo centrado">Paleta del Día: Más Vendida</h3>
          <img :src="paliPulgar" alt="Pali con la paleta de mango con chile" class="pali pali-pulgar" />
          <p class="paleta-dia">Paleta Mango-Chile - 120 Unidades</p>
          <RouterLink :to="{ name: 'productos' }" class="btn-accion">Analizar Productos</RouterLink>
        </article>

        <article class="columna">
          <h3 class="columna-titulo">Alertas y Oportunidades</h3>

          <div class="alertas-contenido">
            <ul class="alertas">
              <li v-for="alerta in alertas" :key="alerta.titulo" :class="['alerta', alerta.tipo]">
                <strong>{{ alerta.titulo }}</strong>
                <span>{{ alerta.detalle }}</span>
              </li>
            </ul>
            <img :src="paliPensando" alt="Pali pensando" class="pali pali-pensando" />
          </div>

          <RouterLink :to="{ name: 'inventario' }" class="btn-accion">Tomar Acción</RouterLink>
        </article>
      </div>
    </section>

    <footer class="pie">© {{ anioActual }} iPaletitas</footer>

    <img :src="paliSaludando" alt="" aria-hidden="true" class="pali-saludando" />
  </div>
</template>

<style scoped>
.inicio-view {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.decoraciones {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.deco {
  position: absolute;
  opacity: 0.45;
  filter: saturate(0.8);
  user-select: none;
}

.encabezado,
.tarjeta-crecimiento,
.pie {
  position: relative;
  z-index: 1;
}

.encabezado {
  margin-bottom: 2rem;
}

.bienvenida {
  font-size: clamp(2rem, 3.4vw, 3.2rem);
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -1px;
  margin-bottom: 0.5rem;
}

.eslogan {
  font-size: 1rem;
  color: #334155;
  font-weight: 300;
}

.eslogan .opcional {
  color: #64748b;
}

/* Tarjeta principal */
.tarjeta-crecimiento {
  background: white;
  border-radius: 24px;
  padding: 2rem 2.2rem 2.2rem;
  margin-bottom: 2.5rem;
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
}

.tarjeta-titulo {
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 1.5rem;
}

.columnas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.columna {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.columna-titulo {
  align-self: stretch;
  font-size: 1.45rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.3rem;
}

.columna-titulo.centrado {
  text-align: center;
}

.columna-subtitulo {
  align-self: stretch;
  color: #1e293b;
  font-size: 0.95rem;
}

.pali {
  display: block;
  object-fit: contain;
}

/* Columna de ventas */
.ventas-contenido {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  width: 100%;
  flex: 1;
  margin: 1rem 0 1.2rem;
}

.pali-senalando {
  width: 34%;
  max-width: 140px;
}

.grafica-ventas {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.grafica-lienzo {
  position: relative;
  width: 100%;
  height: 150px;
  border-bottom: 1px solid #e2e8f0;
  background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 37px, #f1f5f9 37px, #f1f5f9 38px);
}

.grafica-pie {
  margin-top: 0.6rem;
  font-size: 0.85rem;
  color: #1e293b;
  text-align: center;
}

/* Columna paleta del día */
.pali-pulgar {
  width: 100%;
  max-width: 320px;
  max-height: 220px;
  margin: 0.5rem 0 0.8rem;
}

.paleta-dia {
  font-size: 0.95rem;
  color: #1e293b;
  margin-bottom: 1.2rem;
}

/* Columna alertas */
.alertas-contenido {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  width: 100%;
  flex: 1;
  margin: 1rem 0 1.2rem;
}

.alertas {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0;
  list-style: none;
}

.alerta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  border-left: 4px solid;
  font-size: 0.85rem;
  color: #334155;
}

.alerta strong {
  font-size: 0.95rem;
  color: #0f172a;
}

.alerta.peligro { background: #fde8e8; border-color: #f87171; }
.alerta.aviso { background: #fef3c7; border-color: #fbbf24; }
.alerta.info { background: #e0f2fe; border-color: #38bdf8; }

.pali-pensando {
  width: 30%;
  max-width: 120px;
}

/* Botones */
.btn-accion {
  margin-top: auto;
  padding: 0.75rem 1.8rem;
  border-radius: 30px;
  background: linear-gradient(to bottom, #3b82f6, #2563eb);
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-accion:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.4);
}

/* Pie de página y mascota */
.pie {
  margin-top: auto;
  padding: 1.2rem 0 0.5rem;
  border-top: 1px solid #dbe3ef;
  text-align: center;
  font-size: 0.9rem;
  color: #334155;
}

.pali-saludando {
  position: absolute;
  right: -1rem;
  bottom: -1rem;
  width: 90px;
  z-index: 2;
  pointer-events: none;
}

@media (max-width: 700px) {
  .tarjeta-crecimiento {
    padding: 1.5rem 1.2rem;
  }

  .pali-saludando {
    width: 64px;
  }
}
</style>
