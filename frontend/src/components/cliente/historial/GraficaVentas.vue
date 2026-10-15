<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import type { Barra } from './periodos'
import { dinero, plural, precio } from '@/lib/formato'
import { rampaActual } from '@/lib/marca'
import { tema } from '@/lib/tema'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip)

const props = defineProps<{ barras: Barra[] }>()

/* El periodo en curso va en el color del negocio; los anteriores, en un tono más tenue de la misma línea. */
const datos = computed<ChartData<'bar'>>(() => {
  const rampa = rampaActual.value
  const oscuro = tema.value === 'oscuro'
  const actual = oscuro ? rampa[400] : rampa[600]
  const pasado = oscuro ? rampa[800] : rampa[200]
  return {
    labels: props.barras.map((b) => b.etiqueta),
    datasets: [
      {
        label: 'Ventas',
        data: props.barras.map((b) => b.total),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 42,
        backgroundColor: props.barras.map((b) => (b.actual ? actual : pasado)),
        hoverBackgroundColor: oscuro ? rampa[300] : rampa[500],
      },
    ],
  }
})

const opciones = computed<ChartOptions<'bar'>>(() => {
  const oscuro = tema.value === 'oscuro'
  const texto = oscuro ? '#8a97ab' : '#64748b'
  const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: sinMovimiento ? false : { duration: 300, easing: 'easeOutQuart' },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        padding: 10,
        callbacks: {
          title: (items) => props.barras[items[0]?.dataIndex ?? 0]?.detalle ?? '',
          label: (item) => {
            const barra = props.barras[item.dataIndex]
            return [dinero(Number(item.raw)), plural(barra?.tickets ?? 0, 'ticket', 'tickets')]
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: texto, font: { weight: 600 }, autoSkip: true, maxRotation: 0 },
      },
      y: {
        beginAtZero: true,
        grace: '10%',
        border: { display: false },
        grid: { color: oscuro ? '#131b2b' : '#f1f5f9' },
        ticks: { color: texto, maxTicksLimit: 5, callback: (valor) => precio(Number(valor)) },
      },
    },
  }
})
</script>

<template>
  <div class="relative h-72 w-full">
    <Bar :data="datos" :options="opciones" aria-label="Gráfica de ventas del periodo" />
  </div>
</template>
