<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
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
} from 'chart.js'
import {
  ArrowRight,
  Banknote,
  Clock,
  Lightbulb,
  PackagePlus,
  Receipt,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
} from '@lucide/vue'
import pina from '@/assets/Img/Piña.jpg'
import paliSenalando from '@/assets/Img/pali-senalando.webp'
import paliPulgar from '@/assets/Img/pali-pulgar.webp'
import paliPensando from '@/assets/Img/pali-pensando.webp'
import paliSaludando from '@/assets/Img/pali-saludando.webp'
import UiBadge from '../ui/Badge.vue'
import UiButton from '../ui/Button.vue'
import UiCard from '../ui/Card.vue'
import Ticket from './Ticket.vue'
import { puedeVer, type Seccion } from './secciones'
import {
  DIAS_COBRO,
  caducados,
  diasRestantes,
  enPrueba,
  estado,
  faseActual,
  limiteDe,
  porCaducar,
  puede,
  semanaGratis,
  stock,
  sucursalActiva,
  uso,
  ventasSucursal,
  type Limite,
  type Venta,
} from '@/stores/negocio'
import { dinero, hora, mismoDia, plural } from '@/lib/formato'
import { rampaActual } from '@/lib/marca'
import { textoTarjeta } from '@/lib/tarjeta'
import { tema } from '@/lib/tema'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip)

defineEmits<{ ir: [seccion: Seccion]; cambiarPlan: [] }>()

const puedeSurtir = computed(() => puede('entradas.crear'))

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

const destinoAlertas = computed<Seccion | null>(() => {
  if ((caducados.value.length || porCaducar.value.length) && puedeVer('caducados')) return 'caducados'
  if (bajoStock.value.length) return puedeSurtir.value ? 'entradas' : puedeVer('productos') ? 'productos' : null
  return puede('licencia.editar') ? 'suscripciones' : null
})

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

/* La línea de ventas va en el color del negocio, plana: trazo de la marca y relleno de un tono claro. */
const datosVentas = computed<ChartData<'line'>>(() => {
  const rampa = rampaActual.value
  const oscuro = tema.value === 'oscuro'
  const trazo = oscuro ? rampa[400] : rampa[600]
  const ultimo = semana.value.length - 1
  return {
    labels: semana.value.map((d) => (d.esHoy ? 'Hoy' : d.etiqueta)),
    datasets: [
      {
        label: 'Ventas',
        data: semana.value.map((d) => d.total),
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        borderColor: trazo,
        backgroundColor: oscuro ? rampa[950] : rampa[100],
        pointRadius: semana.value.map((_, i) => (i === ultimo ? 5 : 0)),
        pointHoverRadius: 6,
        pointBackgroundColor: trazo,
        pointBorderColor: oscuro ? '#131a26' : '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  }
})

const opcionesVentas = computed<ChartOptions<'line'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { duration: 300, easing: 'easeOutQuart' },
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: { displayColors: false, callbacks: { label: (item) => dinero(Number(item.raw)) } },
  },
  scales: {
    x: { display: false },
    y: {
      beginAtZero: true,
      grace: '10%',
      border: { display: false },
      ticks: { display: false, maxTicksLimit: 5 },
      grid: { color: tema.value === 'oscuro' ? '#1b2436' : '#eef1f5', drawTicks: false },
    },
  },
}))

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

type TipoAlerta = 'peligro' | 'aviso' | 'info'

interface Alerta {
  tipo: TipoAlerta
  titulo: string
  detalle: string
}

const iconoAlerta: Record<TipoAlerta, Component> = { peligro: TriangleAlert, aviso: Clock, info: Lightbulb }

const nombresLimite: Record<Limite, string> = { sucursales: 'sucursales', usuarios: 'usuarios', productos: 'productos' }

const alertas = computed<Alerta[]>(() => {
  const lista: Alerta[] = []

  for (const p of caducados.value.slice(0, 2)) {
    lista.push({
      tipo: 'peligro',
      titulo: `Caducó ${p.nombre}`,
      detalle: `Quedan ${plural(stock(p), 'pieza', 'piezas')}. Pásalas a pérdida en Caducados.`,
    })
  }
  for (const p of porCaducar.value.slice(0, 1)) {
    lista.push({
      tipo: 'aviso',
      titulo: `Por caducar: ${p.nombre}`,
      detalle: `Quedan ${plural(stock(p), 'pieza', 'piezas')}. Véndelas primero o prepáralas para baja.`,
    })
  }
  for (const p of bajoStock.value.slice(0, 2)) {
    lista.push({
      tipo: 'peligro',
      titulo: stock(p) ? `Bajo stock en ${p.nombre}` : `Se agotó ${p.nombre}`,
      detalle: stock(p) ? `Quedan ${plural(stock(p), 'pieza', 'piezas')}, ¡haz un pedido!` : 'Súrtelo para volver a venderlo.',
    })
  }

  if (enPrueba.value && faseActual.value === 'vigente') {
    lista.push({
      tipo: 'aviso',
      titulo: `Te ${diasRestantes.value === 1 ? 'queda' : 'quedan'} ${plural(diasRestantes.value, 'día', 'días')} de prueba`,
      detalle: estado.licencia?.tarjeta
        ? `Al terminar, cobramos tu primer periodo a tu ${textoTarjeta(estado.licencia.tarjeta)}.`
        : `Al terminar, tienes ${DIAS_COBRO} días para pagar tu licencia por transferencia.`,
    })
  }

  if (semanaGratis.value && puede('licencia.editar')) {
    lista.push({
      tipo: 'info',
      titulo: `Semana gratis: ${semanaGratis.value.dias === 1 ? 'queda' : 'quedan'} ${plural(semanaGratis.value.dias, 'día', 'días')}`,
      detalle: 'Si el servicio no te convence, pide tu devolución completa desde Mi licencia.',
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
  { titulo: 'Ventas de hoy', valor: dinero(totalHoy.value), detalle: 'IVA incluido', icono: Banknote, alerta: false },
  { titulo: 'Tickets', valor: deHoy.value.length.toLocaleString('es-MX'), detalle: 'emitidos hoy', icono: Receipt, alerta: false },
  { titulo: 'Ticket promedio', valor: dinero(promedio.value), detalle: 'por cliente', icono: TrendingUp, alerta: false },
  {
    titulo: 'Bajo stock',
    valor: bajoStock.value.length.toLocaleString('es-MX'),
    detalle: bajoStock.value.length === 1 ? 'producto por surtir' : 'productos por surtir',
    icono: TriangleAlert,
    alerta: bajoStock.value.length > 0,
  },
])
</script>

<template>
  <div>
    <section class="mb-6 grid overflow-hidden rounded-3xl bg-blue-600 text-white md:grid-cols-[minmax(0,1fr)_minmax(0,38%)]">
      <div class="p-7 sm:p-10">
        <UiBadge variant="outline">Sucursal {{ sucursalActiva?.nombre }}</UiBadge>
        <h1 class="font-display mt-4 text-3xl font-semibold [overflow-wrap:anywhere] sm:text-4xl">
          {{ saludo }}, {{ estado.sesion?.nombre?.split(' ')[0] }}
        </h1>
        <p class="mt-2 max-w-[52ch]">Este es el resumen de tu negocio. ¿Qué quieres hacer ahora?</p>
        <div v-if="puedeVer('venta') || puedeSurtir" class="mt-6 flex flex-wrap gap-3">
          <UiButton
            v-if="puedeVer('venta')"
            size="lg"
            class="bg-white text-slate-900 hover:bg-blue-50"
            @click="$emit('ir', 'venta')"
          >
            <ShoppingCart class="size-5" />
            Nueva venta
          </UiButton>
          <UiButton
            v-if="puedeSurtir"
            variant="outline"
            size="lg"
            class="bg-transparent text-white ring-white/45 hover:bg-white/10 hover:text-white hover:ring-white/70"
            @click="$emit('ir', 'entradas')"
          >
            <PackagePlus class="size-5" />
            Registrar entrada
          </UiButton>
        </div>
      </div>
      <div class="relative hidden md:block" aria-hidden="true">
        <img :src="pina" alt="" class="absolute inset-0 size-full object-cover" />
        <img :src="paliSaludando" alt="" class="absolute bottom-0 left-4 h-40 w-auto" />
      </div>
    </section>

    <div class="ip-tira sm:grid-cols-2 xl:grid-cols-4">
      <div v-for="kpi in kpis" :key="kpi.titulo" class="p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-semibold text-slate-500">{{ kpi.titulo }}</p>
          <span :class="['ip-picto size-8', { peligro: kpi.alerta }]" aria-hidden="true">
            <component :is="kpi.icono" class="size-4" />
          </span>
        </div>
        <p :class="['ip-cifra mt-3', kpi.alerta ? 'text-rose-700' : 'text-slate-900']">{{ kpi.valor }}</p>
        <p class="mt-1 text-xs text-slate-500">{{ kpi.detalle }}</p>
      </div>
    </div>

    <UiCard class="mt-6 p-6 sm:p-8">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="font-display text-xl font-semibold sm:text-2xl">Crecimiento de tu negocio</h2>
        <UiBadge variant="blue">Últimos 7 días</UiBadge>
      </div>

      <div class="columnas mt-6">
        <article class="columna">
          <h3 class="columna-titulo">Resumen de ventas</h3>
          <p class="text-sm text-slate-500">
            Total de la semana: <strong class="tabular-nums text-slate-900">{{ dinero(totalSemana) }}</strong>
          </p>
          <div class="mt-4 mb-5 flex w-full flex-1 items-end gap-2">
            <img :src="paliSenalando" alt="Pali señalando la gráfica de ventas" class="w-[34%] max-w-[130px] object-contain" />
            <div class="flex min-w-0 flex-1 flex-col items-center">
              <div class="relative h-[150px] w-full">
                <Line :data="datosVentas" :options="opcionesVentas" aria-label="Ventas de los últimos 7 días" />
              </div>
              <div class="mt-1 flex w-full justify-between text-[11px] font-semibold text-slate-500 capitalize">
                <span v-for="dia in semana" :key="dia.etiqueta" :class="{ 'text-blue-700': dia.esHoy }">
                  {{ dia.esHoy ? 'Hoy' : dia.etiqueta.slice(0, 2) }}
                </span>
              </div>
            </div>
          </div>
          <p class="mb-4 text-center text-sm font-semibold text-slate-700">{{ mensajeVentas }}</p>
          <UiButton v-if="puedeVer('historial')" class="mt-auto" @click="$emit('ir', 'historial')">
            Ver historial de ventas
          </UiButton>
        </article>

        <article class="columna">
          <h3 class="columna-titulo text-center">Paleta del día: más vendida</h3>
          <img :src="paliPulgar" alt="Pali con el pulgar arriba" class="my-3 max-h-[200px] w-full max-w-[300px] object-contain" />
          <p v-if="paletaDelDia" class="mb-5 text-center text-sm text-slate-600">
            <strong class="text-slate-900">{{ paletaDelDia.nombre }}</strong>
            · {{ plural(paletaDelDia.cantidad, 'pieza', 'piezas') }} {{ paletaDelDia.periodo }}
          </p>
          <p v-else class="mb-5 text-center text-sm text-slate-500">Aún no hay ventas. ¡Haz la primera!</p>
          <UiButton v-if="puedeVer('productos')" class="mt-auto" @click="$emit('ir', 'productos')">
            Analizar productos
          </UiButton>
        </article>

        <article class="columna">
          <h3 class="columna-titulo">Alertas y oportunidades</h3>
          <div class="mt-4 mb-5 flex w-full flex-1 items-center gap-3">
            <ul class="flex min-w-0 flex-1 list-none flex-col gap-2 p-0">
              <li v-for="alerta in alertas" :key="alerta.titulo" :class="['alerta', alerta.tipo]">
                <span class="alerta-icono" aria-hidden="true">
                  <component :is="iconoAlerta[alerta.tipo]" class="size-4" />
                </span>
                <span class="min-w-0">
                  <strong>{{ alerta.titulo }}</strong>
                  <span>{{ alerta.detalle }}</span>
                </span>
              </li>
            </ul>
            <img :src="paliPensando" alt="Pali pensando" class="w-[28%] max-w-[110px] object-contain" />
          </div>
          <UiButton v-if="destinoAlertas" class="mt-auto" @click="$emit('ir', destinoAlertas)">Tomar acción</UiButton>
        </article>
      </div>
    </UiCard>

    <UiCard class="mt-6 overflow-hidden">
      <div class="flex items-center justify-between p-6 pb-4">
        <h3 class="font-display text-lg font-semibold">Últimas ventas</h3>
        <UiButton v-if="puedeVer('historial')" variant="ghost" size="sm" @click="$emit('ir', 'historial')">
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
              <td class="whitespace-nowrap">{{ hora(venta.fecha) }}</td>
              <td>
                <span class="block max-w-xs truncate" :title="venta.partidas.map((p) => p.nombre).join(', ')">
                  {{ venta.partidas.map((p) => p.nombre).join(', ') }}
                </span>
              </td>
              <td><UiBadge>{{ venta.metodoPago }}</UiBadge></td>
              <td class="text-right font-bold whitespace-nowrap text-slate-900">{{ dinero(venta.total) }}</td>
            </tr>
            <tr v-if="!ultimas.length">
              <td colspan="5" class="py-10 text-center text-slate-500">Aún no hay ventas en esta sucursal.</td>
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
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 600;
}

.ip-picto.peligro {
  background: #e11d48;
}

/* Alertas: el ícono lleva el color del aviso; el fondo es un solo tono, sin filos de color */
.alerta {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  padding: 0.65rem 0.75rem;
  border-radius: 0.75rem;
  color: #334155;
  font-size: 0.8rem;
}

.alerta strong {
  display: block;
  color: #0f172a;
  font-size: 0.875rem;
  overflow-wrap: anywhere;
}

.alerta-icono {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 0.5rem;
  color: #fff;
}

.alerta.peligro {
  background: #fff1f2;
}

.alerta.peligro .alerta-icono {
  background: #e11d48;
}

.alerta.aviso {
  background: #fff7ed;
}

.alerta.aviso .alerta-icono {
  background: #c2410c;
}

.alerta.info {
  background: var(--marca-50);
}

.alerta.info .alerta-icono {
  background: var(--marca-600);
}

html.oscuro .alerta {
  color: #cbd5e1;
}

html.oscuro .alerta strong {
  color: #f1f5f9;
}

html.oscuro .alerta.peligro {
  background: rgb(244 63 94 / 0.12);
}

html.oscuro .alerta.aviso {
  background: rgb(249 115 22 / 0.12);
}

html.oscuro .alerta.info {
  background: color-mix(in oklab, var(--marca-600) 14%, transparent);
}
</style>
