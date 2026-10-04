<script setup lang="ts">
import { computed, ref } from 'vue'
import { Line } from 'vue-chartjs'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type ScriptableContext,
} from 'chart.js'
import { ArrowRight, Banknote, PackagePlus, Receipt, ShoppingCart, TrendingUp, TriangleAlert } from '@lucide/vue'
import pina from '@/assets/Img/Piña.jpg'
import paliSenalando from '@/assets/Img/pali-senalando.webp'
import paliPulgar from '@/assets/Img/pali-pulgar.webp'
import paliPensando from '@/assets/Img/pali-pensando.webp'
import paliSaludando from '@/assets/Img/pali-saludando.webp'
import UiBadge from '../ui/Badge.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Ticket from './Ticket.vue'
import type { Seccion } from './secciones'
import {
  diasRestantes,
  enPrueba,
  estado,
  limiteDe,
  stock,
  sucursalActiva,
  uso,
  ventasSucursal,
  type Limite,
  type Venta,
} from '@/stores/negocio'
import { dinero, hora, mismoDia } from '@/lib/formato'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip)

defineEmits<{ ir: [seccion: Seccion]; cambiarPlan: [] }>()

const ventaVista = ref<Venta | null>(null)

const saludo = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
})

const deHoy = computed(() => ventasSucursal.value.filter((v) => mismoDia(v.fecha)))
const totalHoy = computed(() => deHoy.value.reduce((suma, v) => suma + v.total, 0))
const promedio = computed(() => (deHoy.value.length ? totalHoy.value / deHoy.value.length : 0))

const bajoStock = computed(() =>
  estado.productos.filter((p) => stock(p) <= p.stockMinimo).sort((a, b) => stock(a) - stock(b)),
)

const semana = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const dia = new Date()
    dia.setDate(dia.getDate() - (6 - i))
    const total = ventasSucursal.value
      .filter((v) => mismoDia(v.fecha, dia))
      .reduce((suma, v) => suma + v.total, 0)
    return { etiqueta: dia.toLocaleDateString('es-MX', { weekday: 'short' }), total, esHoy: i === 6 }
  }),
)
const totalSemana = computed(() => semana.value.reduce((suma, d) => suma + d.total, 0))

const semanaPasada = computed(() => {
  const desde = new Date()
  desde.setHours(0, 0, 0, 0)
  desde.setDate(desde.getDate() - 13)
  const hasta = new Date(desde)
  hasta.setDate(hasta.getDate() + 7)
  return ventasSucursal.value
    .filter((v) => {
      const fecha = new Date(v.fecha)
      return fecha >= desde && fecha < hasta
    })
    .reduce((suma, v) => suma + v.total, 0)
})

const crecimiento = computed(() =>
  semanaPasada.value ? Math.round(((totalSemana.value - semanaPasada.value) / semanaPasada.value) * 100) : null,
)

const mensajeVentas = computed(() => {
  const c = crecimiento.value
  if (c === null) return `Llevas ${dinero(totalSemana.value)} esta semana. ¡Pali te echa porras!`
  if (c >= 0) return `¡Ventas de la semana +${c}%! (¡Pali está orgulloso!)`
  return `Ventas de la semana ${c}%. ¡Pali sabe que vas a remontar!`
})

function degradadoHorizontal(contexto: ScriptableContext<'line'>, inicio: string, fin: string) {
  const { ctx, chartArea } = contexto.chart
  if (!chartArea) return inicio
  const degradado = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0)
  degradado.addColorStop(0, inicio)
  degradado.addColorStop(1, fin)
  return degradado
}

const datosVentas = computed<ChartData<'line'>>(() => {
  const ultimo = semana.value.length - 1
  return {
    labels: semana.value.map((d) => (d.esHoy ? 'Hoy' : d.etiqueta)),
    datasets: [
      {
        label: 'Ventas',
        data: semana.value.map((d) => d.total),
        fill: true,
        tension: 0.45,
        borderWidth: 4,
        borderColor: (contexto) => degradadoHorizontal(contexto, '#6366f1', '#10b981'),
        backgroundColor: (contexto) =>
          degradadoHorizontal(contexto, 'rgba(99, 102, 241, 0.18)', 'rgba(16, 185, 129, 0.35)'),
        pointStyle: 'triangle',
        pointRotation: 45,
        pointRadius: semana.value.map((_, i) => (i === ultimo ? 9 : 0)),
        pointHoverRadius: semana.value.map((_, i) => (i === ultimo ? 10 : 5)),
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#10b981',
      },
    ],
  }
})

const opcionesVentas: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: { displayColors: false, callbacks: { label: (item) => dinero(Number(item.raw)) } },
  },
  scales: {
    x: { display: false },
    y: { display: false, beginAtZero: true, grace: '10%' },
  },
}

function masVendida(ventas: Venta[]) {
  const piezas = new Map<string, { nombre: string; cantidad: number }>()
  for (const venta of ventas) {
    for (const partida of venta.partidas) {
      const actual = piezas.get(partida.productoId) ?? { nombre: partida.nombre, cantidad: 0 }
      actual.cantidad += partida.cantidad
      piezas.set(partida.productoId, actual)
    }
  }
  return [...piezas.values()].sort((a, b) => b.cantidad - a.cantidad)[0] ?? null
}

const paletaDelDia = computed(() => {
  const hoy = masVendida(deHoy.value)
  if (hoy) return { ...hoy, periodo: 'hoy' }
  const desde = new Date()
  desde.setHours(0, 0, 0, 0)
  desde.setDate(desde.getDate() - 6)
  const semanal = masVendida(ventasSucursal.value.filter((v) => new Date(v.fecha) >= desde))
  return semanal ? { ...semanal, periodo: 'esta semana' } : null
})

interface Alerta {
  tipo: 'peligro' | 'aviso' | 'info'
  titulo: string
  detalle: string
}

const nombresLimite: Record<Limite, string> = { sucursales: 'sucursales', usuarios: 'usuarios', productos: 'productos' }

const alertas = computed<Alerta[]>(() => {
  const lista: Alerta[] = bajoStock.value.slice(0, 2).map((p) => ({
    tipo: 'peligro',
    titulo: `Bajo stock en ${p.nombre}`,
    detalle: `Quedan ${stock(p)} pzas, ¡haz un pedido!`,
  }))

  if (enPrueba.value) {
    lista.push({
      tipo: 'aviso',
      titulo: `Te quedan ${diasRestantes.value} días de prueba`,
      detalle: 'Elige tu suscripción para no perder el acceso.',
    })
  }

  for (const limite of Object.keys(nombresLimite) as Limite[]) {
    const maximo = limiteDe(limite)
    if (maximo !== Infinity && uso(limite) >= maximo * 0.8) {
      lista.push({
        tipo: 'aviso',
        titulo: `Casi llegas al límite de ${nombresLimite[limite]}`,
        detalle: `Usas ${uso(limite)} de ${maximo} en tu plan.`,
      })
    }
  }

  const mes = new Date().getMonth()
  lista.push(
    mes >= 2 && mes <= 8
      ? { tipo: 'info', titulo: 'Oportunidad de temporada', detalle: 'Hace calor: prepara más paletas de agua.' }
      : { tipo: 'info', titulo: 'Oportunidad de temporada', detalle: 'Llega el frío: impulsa paletas de leche y combos.' },
  )

  return lista.slice(0, 3)
})

const ultimas = computed(() => [...ventasSucursal.value].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6))

const kpis = computed(() => [
  { titulo: 'Ventas de hoy', valor: dinero(totalHoy.value), detalle: 'IVA incluido', icono: Banknote, color: 'bg-blue-600/10 text-blue-600' },
  { titulo: 'Tickets', valor: String(deHoy.value.length), detalle: 'emitidos hoy', icono: Receipt, color: 'bg-emerald-500/10 text-emerald-600' },
  { titulo: 'Ticket promedio', valor: dinero(promedio.value), detalle: 'por cliente', icono: TrendingUp, color: 'bg-amber-300/30 text-amber-700' },
  { titulo: 'Bajo stock', valor: String(bajoStock.value.length), detalle: 'productos por surtir', icono: TriangleAlert, color: 'bg-rose-500/10 text-rose-600' },
])
</script>

<template>
  <div>
    <section class="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white sm:p-10">
      <div class="banner-foto" :style="{ backgroundImage: `url(${pina})` }" aria-hidden="true" />
      <div class="absolute -bottom-24 -left-16 size-72 rounded-full bg-blue-400/25 blur-3xl" />
      <img
        :src="paliSaludando"
        alt=""
        aria-hidden="true"
        class="pali-saludando pointer-events-none absolute right-6 -bottom-3 hidden h-40 w-auto drop-shadow-xl lg:block"
      />
      <div class="relative max-w-xl">
        <UiBadge variant="outline">Sucursal {{ sucursalActiva?.nombre }}</UiBadge>
        <h1 class="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {{ saludo }}, {{ estado.sesion?.nombre?.split(' ')[0] }}
        </h1>
        <p class="mt-2 text-blue-100">Este es el resumen de tu negocio. ¿Qué quieres hacer ahora?</p>
        <div class="mt-6 flex flex-wrap gap-3">
          <UiButton variant="secondary" size="lg" @click="$emit('ir', 'venta')">
            <ShoppingCart class="size-5" />
            Nueva venta
          </UiButton>
          <UiButton variant="outline" size="lg" class="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white" @click="$emit('ir', 'entradas')">
            <PackagePlus class="size-5" />
            Registrar entrada
          </UiButton>
        </div>
      </div>
    </section>

    <div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <UiCard v-for="kpi in kpis" :key="kpi.titulo" class="p-6">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-slate-500">{{ kpi.titulo }}</p>
          <span :class="['grid size-10 place-items-center rounded-xl', kpi.color]">
            <component :is="kpi.icono" class="size-5" />
          </span>
        </div>
        <p class="mt-4 text-3xl font-extrabold tracking-tight">{{ kpi.valor }}</p>
        <p class="mt-1 text-xs text-slate-400">{{ kpi.detalle }}</p>
      </UiCard>
    </div>

    <UiCard class="mt-6 p-6 sm:p-8">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-2xl font-extrabold tracking-tight">Crecimiento de tu negocio</h2>
        <UiBadge variant="blue">Últimos 7 días</UiBadge>
      </div>

      <div class="columnas mt-6">
        <article class="columna">
          <h3 class="columna-titulo">Resumen de ventas</h3>
          <p class="text-sm text-slate-500">
            Total de la semana: <strong class="text-slate-900">{{ dinero(totalSemana) }}</strong>
          </p>
          <div class="mt-4 mb-5 flex w-full flex-1 items-end gap-2">
            <img :src="paliSenalando" alt="Pali señalando la gráfica de ventas" class="w-[34%] max-w-[130px] object-contain" />
            <div class="flex min-w-0 flex-1 flex-col items-center">
              <div class="grafica-lienzo">
                <Line :data="datosVentas" :options="opcionesVentas" aria-label="Ventas de los últimos 7 días" />
              </div>
              <div class="mt-1 flex w-full justify-between text-[11px] font-semibold text-slate-400 capitalize">
                <span v-for="dia in semana" :key="dia.etiqueta" :class="{ 'text-blue-600': dia.esHoy }">
                  {{ dia.esHoy ? 'Hoy' : dia.etiqueta.slice(0, 2) }}
                </span>
              </div>
            </div>
          </div>
          <p class="mb-4 text-center text-sm font-semibold text-slate-700">{{ mensajeVentas }}</p>
          <button type="button" class="btn-accion" @click="$emit('ir', 'historial')">Ver historial de ventas</button>
        </article>

        <article class="columna">
          <h3 class="columna-titulo text-center">Paleta del día: más vendida</h3>
          <img :src="paliPulgar" alt="Pali con el pulgar arriba" class="my-3 max-h-[200px] w-full max-w-[300px] object-contain" />
          <p v-if="paletaDelDia" class="mb-5 text-center text-sm text-slate-600">
            <strong class="text-slate-900">{{ paletaDelDia.nombre }}</strong>
            · {{ paletaDelDia.cantidad }} pzas {{ paletaDelDia.periodo }}
          </p>
          <p v-else class="mb-5 text-center text-sm text-slate-500">Aún no hay ventas. ¡Haz la primera!</p>
          <button type="button" class="btn-accion" @click="$emit('ir', 'productos')">Analizar productos</button>
        </article>

        <article class="columna">
          <h3 class="columna-titulo">Alertas y oportunidades</h3>
          <div class="mt-4 mb-5 flex w-full flex-1 items-center gap-3">
            <ul class="flex flex-1 list-none flex-col gap-2.5 p-0">
              <li v-for="alerta in alertas" :key="alerta.titulo" :class="['alerta', alerta.tipo]">
                <strong>{{ alerta.titulo }}</strong>
                <span>{{ alerta.detalle }}</span>
              </li>
            </ul>
            <img :src="paliPensando" alt="Pali pensando" class="w-[28%] max-w-[110px] object-contain" />
          </div>
          <button type="button" class="btn-accion" @click="$emit('ir', bajoStock.length ? 'entradas' : 'suscripciones')">
            Tomar acción
          </button>
        </article>
      </div>
    </UiCard>

    <UiCard class="mt-6 overflow-hidden">
      <div class="flex items-center justify-between p-6 pb-4">
        <h3 class="text-lg font-bold">Últimas ventas</h3>
        <UiButton variant="ghost" size="sm" @click="$emit('ir', 'historial')">
          Ver historial
          <ArrowRight class="size-4" />
        </UiButton>
      </div>
      <div class="overflow-x-auto">
        <table class="ip-table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Hora</th>
              <th>Productos</th>
              <th>Pago</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="venta in ultimas" :key="venta.id" class="cursor-pointer" @click="ventaVista = venta">
              <td class="font-bold text-slate-900">#{{ venta.folio }}</td>
              <td>{{ hora(venta.fecha) }}</td>
              <td class="max-w-xs truncate">{{ venta.partidas.map((p) => p.nombre).join(', ') }}</td>
              <td><UiBadge>{{ venta.metodoPago }}</UiBadge></td>
              <td class="text-right font-bold text-slate-900">{{ dinero(venta.total) }}</td>
            </tr>
            <tr v-if="!ultimas.length">
              <td colspan="5" class="py-10 text-center text-slate-400">Aún no hay ventas en esta sucursal.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>

    <Ticket v-if="ventaVista" :venta="ventaVista" @cerrar="ventaVista = null" />
  </div>
</template>

<style scoped>
.columnas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 2rem;
}

.columna {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
}

.columna-titulo {
  align-self: stretch;
  margin-bottom: 0.25rem;
  font-size: 1.25rem;
  font-weight: 800;
}

.grafica-lienzo {
  position: relative;
  width: 100%;
  height: 150px;
  border-bottom: 1px solid #e2e8f0;
  background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 37px, #f1f5f9 37px, #f1f5f9 38px);
}

.alerta {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.65rem 0.85rem;
  border-left: 4px solid;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #334155;
}

.alerta strong {
  font-size: 0.9rem;
  color: #0f172a;
}

.alerta.peligro {
  background: #fde8e8;
  border-color: #f87171;
}

.alerta.aviso {
  background: #fef3c7;
  border-color: #fbbf24;
}

.alerta.info {
  background: #e0f2fe;
  border-color: #38bdf8;
}

.btn-accion {
  margin-top: auto;
  padding: 0.7rem 1.7rem;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(to bottom, #3b82f6, #2563eb);
  color: #fff;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.btn-accion:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(37, 99, 235, 0.4);
}

.pali-saludando {
  transform-origin: bottom center;
  animation: saludo 3s ease-in-out infinite;
}

@keyframes saludo {
  0%,
  100% {
    transform: rotate(0);
  }
  50% {
    transform: rotate(-4deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pali-saludando {
    animation: none;
  }
}

html.oscuro .grafica-lienzo {
  border-color: #1e293b;
  background-image: repeating-linear-gradient(to bottom, transparent 0, transparent 37px, #131b2b 37px, #131b2b 38px);
}

html.oscuro .alerta {
  color: #cbd5e1;
}

html.oscuro .alerta strong {
  color: #f1f5f9;
}

html.oscuro .alerta.peligro {
  background: rgba(248, 113, 113, 0.12);
}

html.oscuro .alerta.aviso {
  background: rgba(96, 165, 250, 0.12);
  border-color: #60a5fa;
}

html.oscuro .alerta.info {
  background: rgba(56, 189, 248, 0.1);
}

.banner-foto {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: right center;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 55%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 55%);
}

.banner-foto::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(29, 78, 216, 0.95) 0%, rgba(29, 78, 216, 0.75) 100%);
}

@media (min-width: 768px) {
  .banner-foto {
    left: auto;
    width: 58%;
    -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 40%);
    mask-image: linear-gradient(90deg, transparent 0%, #000 40%);
  }

  .banner-foto::after {
    background: linear-gradient(90deg, #1d4ed8 0%, rgba(29, 78, 216, 0.85) 35%, rgba(29, 78, 216, 0.2) 100%);
  }
}
</style>
