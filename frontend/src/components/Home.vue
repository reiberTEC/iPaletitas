<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  ArrowRight,
  ArrowUp,
  Banknote,
  Check,
  Crown,
  HandCoins,
  ImageUp,
  Package,
  PackagePlus,
  ReceiptText,
  RotateCcw,
  Store,
  TriangleAlert,
  Users,
} from '@lucide/vue'
import PaletaIcon from './icons/PaletaIcon.vue'
import ChatBot from './ChatBot.vue'
import RedesSociales from './RedesSociales.vue'
import TarjetaPlan from './planes/TarjetaPlan.vue'
import SelectorCiclo from './planes/SelectorCiclo.vue'
import TemaToggle from './ui/TemaToggle.vue'
import { DIAS_COBRO, DIAS_GARANTIA, PLANES, type CicloPago } from '@/stores/catalogo'
import { COLOR_IPALETITAS, PASOS, coloresDelLogo, leerArchivo, logoReducido, rampaDe } from '@/lib/marca'
import { dinero, precio } from '@/lib/formato'
import paliSaludando from '@/assets/Img/pali-saludando.webp'
import paliSenalando from '@/assets/Img/pali-senalando.webp'
import paliPensando from '@/assets/Img/pali-pensando.webp'
import paliPulgar from '@/assets/Img/pali-pulgar.webp'
import billetePali from '@/assets/Img/billete-pali.webp'

const emit = defineEmits(['irLogin', 'irRegistro'])

const MAX_MB = 5
const precioDesde = precio(Math.min(...PLANES.map((p) => p.precioMensual)))
const ciclo = ref<CicloPago>('mensual')

/* ---------- Lo que ofrece: cada módulo es una estación de la línea ---------- */

const modulos = [
  {
    nombre: 'Punto de venta',
    texto: 'Cobra en efectivo, tarjeta o transferencia, calcula el cambio y entrega el ticket al momento.',
    icono: Banknote,
  },
  {
    nombre: 'Productos e inventario',
    texto: 'Precios y existencias por sucursal, con aviso cuando algo se agota o está por acabarse.',
    icono: Package,
  },
  {
    nombre: 'Entradas',
    texto: 'Registra la mercancía que llega, con proveedor y costo; el inventario se actualiza solo.',
    icono: PackagePlus,
  },
  {
    nombre: 'Historial de ventas',
    texto: 'Gráficas por día, semana o mes, tu producto más vendido y cada ticket a la mano.',
    icono: ReceiptText,
  },
  {
    nombre: 'Anticipos',
    texto: 'Aparta pedidos con un anticipo y cobra el saldo después; el ticket lleva la cuenta.',
    icono: HandCoins,
  },
  {
    nombre: 'Usuarios y permisos',
    texto: 'Cada empleado entra con su correo y solo ve lo que su rol le permite.',
    icono: Users,
  },
  {
    nombre: 'Sucursales',
    texto: 'Cada local con su propio inventario, sus ventas y su equipo.',
    icono: Store,
  },
  {
    nombre: 'Tu marca',
    texto: 'Sube tu logo y el panel toma los colores de tu negocio.',
    icono: ImageUp,
  },
]

/* ---------- Historial de ventas: datos de ejemplo por periodo ---------- */

type PeriodoDemo = 'dia' | 'semana' | 'mes'

const historialDemo: Record<
  PeriodoDemo,
  {
    etiqueta: string
    cambio: string
    tickets: number
    barras: { etiqueta: string; total: number }[]
    top: { nombre: string; piezas: number }[]
  }
> = {
  dia: {
    etiqueta: 'Día',
    cambio: '+12% vs ayer',
    tickets: 41,
    barras: [
      { etiqueta: '9', total: 120 },
      { etiqueta: '10', total: 180 },
      { etiqueta: '11', total: 260 },
      { etiqueta: '12', total: 340 },
      { etiqueta: '13', total: 410 },
      { etiqueta: '14', total: 380 },
      { etiqueta: '15', total: 300 },
      { etiqueta: '16', total: 270 },
      { etiqueta: '17', total: 220 },
    ],
    top: [
      { nombre: 'Paleta de mango', piezas: 34 },
      { nombre: 'Paleta de fresa con crema', piezas: 27 },
      { nombre: 'Agua de limón', piezas: 19 },
    ],
  },
  semana: {
    etiqueta: 'Semana',
    cambio: '+8% vs la semana pasada',
    tickets: 268,
    barras: [
      { etiqueta: 'Lun', total: 1650 },
      { etiqueta: 'Mar', total: 1820 },
      { etiqueta: 'Mié', total: 1940 },
      { etiqueta: 'Jue', total: 2110 },
      { etiqueta: 'Vie', total: 2560 },
      { etiqueta: 'Sáb', total: 3280 },
      { etiqueta: 'Dom', total: 2480 },
    ],
    top: [
      { nombre: 'Paleta de fresa con crema', piezas: 186 },
      { nombre: 'Paleta de mango', piezas: 171 },
      { nombre: 'Nieve de limón', piezas: 122 },
    ],
  },
  mes: {
    etiqueta: 'Mes',
    cambio: '+15% vs el mes pasado',
    tickets: 1032,
    barras: [
      { etiqueta: 'Sem 1', total: 13200 },
      { etiqueta: 'Sem 2', total: 14460 },
      { etiqueta: 'Sem 3', total: 17820 },
      { etiqueta: 'Sem 4', total: 15840 },
    ],
    top: [
      { nombre: 'Paleta de mango', piezas: 702 },
      { nombre: 'Paleta de fresa con crema', piezas: 655 },
      { nombre: 'Agua de horchata', piezas: 498 },
    ],
  },
}

const periodo = ref<PeriodoDemo>('semana')
const datosPeriodo = computed(() => historialDemo[periodo.value])
const totalPeriodo = computed(() => datosPeriodo.value.barras.reduce((suma, b) => suma + b.total, 0))
const maxBarra = computed(() => Math.max(...datosPeriodo.value.barras.map((b) => b.total)))
const maxTop = computed(() => datosPeriodo.value.top[0]?.piezas ?? 1)
const ventasHoy = historialDemo.dia.barras

/* ---------- Tu marca: la vista previa se pinta con el color que elijas ---------- */

const sabores = [
  { nombre: 'Fresa', color: '#e0313e' },
  { nombre: 'Chicle', color: '#e5428a' },
  { nombre: 'Mango', color: '#f2801f' },
  { nombre: 'Limón', color: '#3f9f2f' },
  { nombre: 'Menta', color: '#13a08f' },
  { nombre: 'iPaletitas', color: COLOR_IPALETITAS },
]

const color = ref(COLOR_IPALETITAS)
const logo = ref<string | null>(null)
const delLogo = ref<string[]>([])
const leyendo = ref(false)
const error = ref('')

const rampa = computed(() => rampaDe(color.value))

/* Las utilidades blue-* leen --color-blue-*, que se resuelve en :root; por eso se reescriben las dos. */
const estiloLinea = computed(() =>
  Object.fromEntries(PASOS.flatMap((p) => [[`--marca-${p}`, rampa.value[p]], [`--color-blue-${p}`, rampa.value[p]]])),
)

function elegir(hex: string) {
  color.value = hex
}

async function alElegirLogo(evento: Event) {
  const entrada = evento.target as HTMLInputElement
  const archivo = entrada.files?.[0]
  entrada.value = ''
  error.value = ''
  if (!archivo) return
  if (!archivo.type.startsWith('image/')) {
    error.value = 'Ese archivo no es una imagen. Prueba con tu logo en PNG, JPG, WEBP o SVG.'
    return
  }
  if (archivo.size > MAX_MB * 1024 * 1024) {
    error.value = `Tu logo pesa más de ${MAX_MB} MB. Prueba con una versión más ligera.`
    return
  }
  leyendo.value = true
  try {
    const reducido = await logoReducido(await leerArchivo(archivo))
    const colores = await coloresDelLogo(reducido)
    logo.value = reducido
    delLogo.value = colores
    elegir(colores[0] ?? color.value)
  } catch {
    error.value = 'No pudimos leer esa imagen. Intenta con otro archivo de tu logo.'
  } finally {
    leyendo.value = false
  }
}

function quitarLogo() {
  logo.value = null
  delLogo.value = []
  color.value = COLOR_IPALETITAS
}

/* ---------- Cobrar en un toque ---------- */

const venta = [
  { nombre: 'Paleta de mango', cantidad: 2, precio: 18 },
  { nombre: 'Paleta de fresa con crema', cantidad: 1, precio: 22 },
  { nombre: 'Agua de limón', cantidad: 1, precio: 18 },
]
const totalVenta = venta.reduce((suma, linea) => suma + linea.cantidad * linea.precio, 0)
const cobrado = ref(false)

/* Sabores que se leen sobre el amarillo; el azul se mezcla con él y se ve gris */
const saboresPaleta = ['#ef4444', '#f472b6', '#ffffff', '#22c55e', '#fb923c']

const carrilesPaleta = [
  { x: 3, tam: 44, dur: 24, retraso: -2, giro: 9 },
  { x: 11, tam: 30, dur: 31, retraso: -17, giro: -7 },
  { x: 19, tam: 56, dur: 27, retraso: -9, giro: 6 },
  { x: 28, tam: 34, dur: 22, retraso: -14, giro: -10 },
  { x: 36, tam: 48, dur: 33, retraso: -25, giro: 8 },
  { x: 45, tam: 28, dur: 25, retraso: -5, giro: -6 },
  { x: 53, tam: 52, dur: 29, retraso: -20, giro: 7 },
  { x: 61, tam: 36, dur: 23, retraso: -11, giro: -9 },
  { x: 69, tam: 46, dur: 30, retraso: -1, giro: 10 },
  { x: 77, tam: 30, dur: 26, retraso: -19, giro: -8 },
  { x: 85, tam: 54, dur: 32, retraso: -7, giro: 6 },
  { x: 93, tam: 38, dur: 24, retraso: -15, giro: -7 },
]

/* Cada carril lleva una segunda paleta a medio ciclo para que el fondo nunca se vea vacío */
const paletasFondo = carrilesPaleta.flatMap((paleta, i) => [
  { ...paleta, color: saboresPaleta[i % saboresPaleta.length]! },
  {
    x: paleta.x + 4,
    tam: Math.round(paleta.tam * 0.8),
    dur: paleta.dur + 3,
    retraso: paleta.retraso - (paleta.dur + 3) / 2,
    color: saboresPaleta[(i + 2) % saboresPaleta.length]!,
    giro: -paleta.giro,
  },
])

/* ---------- La vida de un producto, en cuatro estaciones ---------- */

const etapas = [
  { frase: 'Primero la das de alta.', existencia: 0, nota: 'Recién agregada al catálogo', estado: 'nuevo' },
  { frase: 'Luego registras la entrada.', existencia: 40, nota: 'Entrada de hoy: +40 piezas', estado: 'ok' },
  { frase: 'Después se vende y te avisa.', existencia: 6, nota: 'Vendiste 34 esta semana', estado: 'poco' },
  { frase: 'Al final la surtes y sigue.', existencia: 46, nota: 'Surtida: +40 piezas', estado: 'ok' },
] as const

const etiquetaEstado = { nuevo: 'Nuevo', ok: 'Con existencia', poco: 'Por acabarse' } as const

/* ---------- Preguntas ---------- */

const preguntas = [
  {
    p: '¿Sirve si no tengo paletería?',
    r: 'Sí. Das de alta lo que vendes: paletas, café, tortas o abarrotes. iPaletitas nació en una paletería, pero funciona en cualquier comercio de mostrador.',
  },
  {
    p: '¿Qué veo en el historial de ventas?',
    r: 'Tus ventas por día, semana o mes en una gráfica, la comparación con el periodo anterior, tu producto más vendido y cada ticket con su forma de pago. Puedes buscar por folio, producto o cliente.',
  },
  {
    p: '¿Mis empleados ven todo?',
    r: 'No. A cada uno le das un rol (Administrador, Gerente, Cajero o Almacén) y permisos por módulo. El cajero, por ejemplo, cobra y consulta, pero no ve usuarios, sucursales ni tu licencia.',
  },
  {
    p: '¿Funciona en celular o tablet?',
    r: 'Sí. Es una página web: entras desde la computadora del mostrador, una tablet o tu teléfono, sin instalar nada.',
  },
  {
    p: '¿Cómo funciona la semana gratis?',
    r: `Crear tu cuenta no cuesta. Al elegir tu plan lo pagas con tarjeta y, si en los primeros ${DIAS_GARANTIA} días no te convence, pides tu devolución desde el sistema y te regresamos el pago completo (una sola vez por cuenta). Las renovaciones se cobran solas a tu tarjeta; si el cobro no pasa, tienes ${DIAS_COBRO} días para pagar antes de que la cuenta se suspenda.`,
  },
  {
    p: '¿Puedo cambiar de plan o cancelar?',
    r: 'Sí. Subes o bajas de plan desde Suscripciones, dentro del sistema. No hay plazos forzosos y los precios ya incluyen IVA.',
  },
  {
    p: '¿Lleva mi contabilidad?',
    r: 'No. iPaletitas cobra, controla tu inventario y te muestra tus ventas. No se conecta con bancos ni lleva contabilidad completa.',
  },
  {
    p: '¿Puedo usar los colores de mi negocio?',
    r: 'Sí. Dentro del panel, en Mi marca, subes tu logo, eliges uno de sus colores y el menú, los botones y las gráficas lo toman. Vuelves al azul de iPaletitas con un clic.',
  },
]

/* ---------- Entradas al hacer scroll (una sola vez por elemento) ---------- */

const raiz = ref<HTMLElement | null>(null)
let observador: IntersectionObserver | undefined

onMounted(() => {
  const el = raiz.value
  if (!el || !('IntersectionObserver' in window)) return
  observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (!entrada.isIntersecting) continue
        entrada.target.classList.add('visto')
        observador?.unobserve(entrada.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  )
  el.querySelectorAll('[data-revela]').forEach((nodo) => observador!.observe(nodo))
  el.classList.add('con-revelado')
})

onBeforeUnmount(() => observador?.disconnect())

function subir() {
  window.scrollTo({ top: 0 })
}
</script>

<template>
  <div ref="raiz" class="home w-full font-sans">
    <!-- Portada: lo que hace el sistema, con el panel de un día de trabajo a la vista -->
    <section class="hero" aria-labelledby="titulo-home">
      <header class="barra">
        <a href="#" class="marca" aria-label="iPaletitas, inicio" @click.prevent="subir">
          <PaletaIcon variant="white" :size="30" />
          <span class="font-display">iPaletitas</span>
        </a>
        <nav class="barra-enlaces" aria-label="Principal">
          <a href="#ofrece">Qué ofrece</a>
          <a href="#historial">Historial</a>
          <a href="#planes">Planes</a>
          <a href="#preguntas">Preguntas</a>
        </nav>
        <div class="flex items-center gap-1">
          <TemaToggle class="text-white hover:bg-white/15 hover:text-white" />
          <button type="button" class="barra-entrar ip-boton" @click="emit('irLogin')">Entrar</button>
        </div>
      </header>

      <div class="hero-texto">
        <h1 id="titulo-home" class="titular font-display">
          <span class="renglon"><span style="--i: 0">Cobra, surte</span></span>
          <span class="renglon"><span style="--i: 1">y mira tus ventas.</span></span>
        </h1>
        <p class="hero-frase entra" style="--i: 2">
          Punto de venta, inventario, entradas, historial de ventas, anticipos, usuarios y sucursales en un solo sistema
          para tu paletería, tienda o cafetería.
        </p>
        <div class="hero-accion entra" style="--i: 3">
          <button type="button" class="accion ip-boton" @click="emit('irRegistro')">
            Crear cuenta
            <ArrowRight class="size-5" aria-hidden="true" />
          </button>
          <button type="button" class="accion-secundaria ip-boton" @click="emit('irLogin')">Ya tengo cuenta</button>
        </div>
        <p class="accion-nota entra" style="--i: 4">
          Semana gratis con devolución · planes desde {{ precioDesde }} al mes con IVA
        </p>
        <div class="hero-redes entra" style="--i: 5">
          <p id="redes-hero">Síguenos en redes</p>
          <RedesSociales aria-labelledby="redes-hero" />
        </div>
      </div>

      <div class="hero-pieza entra" style="--i: 3">
        <div class="pali" aria-hidden="true">
          <img :src="paliSaludando" alt="" width="150" height="190" />
        </div>

        <div class="pieza" data-ui role="img" aria-label="Vista del panel: ventas de hoy, producto más vendido y avisos de inventario">
          <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div class="flex min-w-0 items-center gap-3">
              <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-600 text-sm font-bold text-white">DC</span>
              <div class="min-w-0">
                <p class="truncate text-base font-bold text-slate-900">Paletería Don Chema</p>
                <p class="truncate text-sm text-slate-500">Matriz · hoy</p>
              </div>
            </div>
            <span class="shrink-0 text-xs text-slate-500">Datos de ejemplo</span>
          </div>

          <div class="grid gap-3 p-4">
            <div class="rounded-xl bg-blue-50 p-4">
              <div class="flex items-baseline justify-between gap-3">
                <p class="text-sm font-semibold text-blue-900">Ventas de hoy</p>
                <p class="text-sm text-blue-900">41 tickets</p>
              </div>
              <p class="mt-1 font-display text-3xl font-semibold tabular-nums text-blue-700">{{ dinero(2480) }}</p>
              <div class="mini-barras mt-3" aria-hidden="true">
                <span
                  v-for="(barra, i) in ventasHoy"
                  :key="barra.etiqueta"
                  :class="{ actual: i === 4 }"
                  :style="{ '--h': barra.total / 410, '--i': i }"
                />
              </div>
            </div>

            <div class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <span class="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                <Crown class="size-5" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-xs font-semibold text-slate-500">Más vendido hoy</p>
                <p class="truncate text-base font-bold text-slate-900">Paleta de mango</p>
              </div>
              <p class="shrink-0 font-display text-lg font-semibold tabular-nums text-slate-900">34 pzas</p>
            </div>

            <ul class="grid list-none gap-2 p-0">
              <li class="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
                <TriangleAlert class="size-4 shrink-0" />
                <span class="min-w-0 flex-1 truncate font-semibold">Agua de jamaica</span>
                <span class="shrink-0">Agotada</span>
              </li>
              <li class="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <TriangleAlert class="size-4 shrink-0" />
                <span class="min-w-0 flex-1 truncate font-semibold">Paleta de nuez</span>
                <span class="shrink-0">Quedan 5</span>
              </li>
            </ul>

            <span class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-display text-sm font-semibold text-white">
              <Banknote class="size-5" />
              Punto de venta
            </span>
          </div>
        </div>
      </div>
    </section>

    <main>
      <!-- Lo que ofrece: cada módulo es una estación de la línea -->
      <section id="ofrece" class="ofrece" aria-labelledby="titulo-ofrece">
        <div class="ofrece-cabeza" data-revela>
          <h2 id="titulo-ofrece" class="seccion-titulo font-display">Todo tu negocio en una sola línea</h2>
          <p class="ofrece-frase">
            Desde que cobras hasta que revisas cuánto vendiste en el mes. Cada parada es un módulo que ya viene listo
            dentro del sistema.
          </p>
        </div>
        <ol class="estaciones-oferta">
          <li v-for="(modulo, i) in modulos" :key="modulo.nombre" data-revela :style="{ '--i': i % 4 }">
            <span class="estacion-punto">
              <component :is="modulo.icono" class="size-5" aria-hidden="true" />
            </span>
            <h3 class="estacion-nombre font-display">{{ modulo.nombre }}</h3>
            <p class="estacion-texto">{{ modulo.texto }}</p>
          </li>
        </ol>
      </section>

      <!-- Historial de ventas: la gráfica funciona, con datos de ejemplo -->
      <section id="historial" class="historial" aria-labelledby="titulo-historial">
        <div class="historial-texto" data-revela>
          <h2 id="titulo-historial" class="seccion-titulo font-display">Sabe cuánto vendiste, cuándo y qué</h2>
          <p class="historial-frase">
            Cambia entre día, semana y mes. La gráfica, el total y tu producto más vendido se actualizan al momento, y
            cada ticket queda guardado con su forma de pago.
          </p>
          <img :src="paliSenalando" alt="Pali señalando la gráfica de ventas" class="historial-pali" width="150" height="196" loading="lazy" />
        </div>

        <div class="historial-panel" data-ui data-revela style="--i: 1">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="periodos" role="group" aria-label="Periodo">
              <button
                v-for="(datos, id) in historialDemo"
                :key="id"
                type="button"
                class="periodo ip-boton"
                :aria-pressed="periodo === id"
                @click="periodo = id"
              >
                {{ datos.etiqueta }}
              </button>
            </div>
            <span class="text-xs text-slate-500">Datos de ejemplo</span>
          </div>

          <div class="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <p class="text-sm font-semibold text-slate-500">Vendido</p>
              <p class="font-display text-4xl font-semibold tabular-nums text-slate-900">{{ dinero(totalPeriodo) }}</p>
            </div>
            <p class="text-sm text-slate-600">
              <span class="font-semibold text-emerald-700">{{ datosPeriodo.cambio }}</span>
              · {{ datosPeriodo.tickets.toLocaleString('es-MX') }} tickets
            </p>
          </div>

          <div class="grafica" aria-hidden="true">
            <div v-for="(barra, i) in datosPeriodo.barras" :key="`${periodo}-${barra.etiqueta}`" class="grafica-col">
              <span class="grafica-barra" :style="{ '--h': barra.total / maxBarra, '--i': i }" />
              <span class="grafica-etiqueta">{{ barra.etiqueta }}</span>
            </div>
          </div>

          <div class="mt-6 border-t border-slate-100 pt-5">
            <p class="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Crown class="size-4 text-amber-500" aria-hidden="true" />
              Lo más vendido
            </p>
            <ol class="mt-3 grid list-none gap-2.5 p-0">
              <li v-for="(producto, i) in datosPeriodo.top" :key="`${periodo}-${producto.nombre}`" class="top-fila">
                <span class="w-5 text-sm font-bold tabular-nums text-slate-400">{{ i + 1 }}</span>
                <span class="min-w-0 flex-1">
                  <span class="flex justify-between gap-3 text-sm">
                    <span class="truncate font-semibold text-slate-900">{{ producto.nombre }}</span>
                    <span class="shrink-0 tabular-nums text-slate-600">{{ producto.piezas.toLocaleString('es-MX') }} pzas</span>
                  </span>
                  <span class="top-medidor">
                    <span :style="{ '--h': producto.piezas / maxTop, '--i': i }" />
                  </span>
                </span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <!-- Cobrar: el control que mueve todo el sistema, en grande y funcionando -->
      <section id="como-funciona" :class="['cobro', { cobrado }]" aria-labelledby="titulo-cobro">
        <div class="cobro-paletas" aria-hidden="true">
          <span
            v-for="(paleta, i) in paletasFondo"
            :key="i"
            class="paleta-carril"
            :style="{
              left: `${paleta.x}%`,
              '--dur': `${paleta.dur}s`,
              '--retraso': `${paleta.retraso}s`,
              '--quieto': `${12 + ((i * 37) % 76)}%`,
            }"
          >
            <svg
              class="paleta-fondo"
              :width="paleta.tam"
              :height="paleta.tam * 1.6"
              viewBox="0 0 20 32"
              :style="{ color: paleta.color, '--giro': `${paleta.giro}deg` }"
            >
              <rect x="8.25" y="21" width="3.5" height="10" rx="1.75" fill="#d6a76a" />
              <path d="M2 9a8 8 0 0 1 16 0v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" fill="currentColor" />
              <rect x="5" y="6" width="2.5" height="11" rx="1.25" fill="#fff" fill-opacity="0.45" />
            </svg>
          </span>
        </div>

        <div class="cobro-texto" data-revela>
          <h2 id="titulo-cobro" class="seccion-titulo font-display">{{ cobrado ? 'Cobrado' : 'Cobra' }} en un toque.</h2>
          <p class="cobro-frase">
            El botón de cobrar es lo más grande del sistema. Eliges los productos, cobras y el ticket sale al momento.
          </p>
        </div>

        <img
          :src="billetePali"
          alt="Billete de un peso con Pali al centro"
          :class="['cobro-billete', { visible: cobrado }]"
          width="1280"
          height="720"
          loading="lazy"
        />

        <div class="ticket-marco" data-revela style="--i: 1">
          <div class="ticket" data-ui>
            <div class="ticket-cabeza">
              <span class="ip-picto ticket-picto"><Banknote /></span>
              <div>
                <p class="ticket-titulo">Venta actual</p>
                <p class="ticket-sub">Caja 1 · Matriz</p>
              </div>
            </div>
            <ul class="ticket-lineas">
              <li v-for="linea in venta" :key="linea.nombre">
                <span class="ticket-cant">{{ linea.cantidad }}×</span>
                <span class="ticket-nombre">{{ linea.nombre }}</span>
                <span class="ticket-monto">{{ dinero(linea.cantidad * linea.precio) }}</span>
              </li>
            </ul>
            <p class="ticket-total">
              <span>Total</span>
              <span>{{ dinero(totalVenta) }}</span>
            </p>
            <button
              type="button"
              :class="['ticket-cobrar ip-boton', { hecho: cobrado }]"
              :aria-pressed="cobrado"
              @click="cobrado = !cobrado"
            >
              <template v-if="cobrado">
                <Check aria-hidden="true" />
                Cobrado · otra venta
              </template>
              <template v-else>Cobrar {{ dinero(totalVenta) }}</template>
            </button>
            <p class="ticket-pie">
              {{ cobrado ? 'Ticket 1043 · efectivo · gracias por tu compra' : 'Toca el botón para cobrar' }}
            </p>
          </div>
        </div>
      </section>

      <!-- La vida de un producto: la misma tarjeta, cuatro estaciones -->
      <section class="vida" aria-labelledby="titulo-vida">
        <div v-for="(etapa, i) in etapas" :key="etapa.frase" :class="['vida-campo', `vida-${i}`]">
          <h2 v-if="i === 0" id="titulo-vida" class="vida-titulo font-display" data-revela>
            <span>Así vive</span>
            <span>un producto</span>
          </h2>
          <div class="producto" data-ui data-revela :style="{ '--i': i }">
            <p class="truncate text-base font-bold text-slate-900">Paleta de mango</p>
            <p class="text-sm tabular-nums text-slate-500">$18.00 la pieza</p>
            <div class="mt-4 rounded-lg bg-slate-50 px-3 py-2.5">
              <div class="flex items-baseline justify-between">
                <span class="text-sm text-slate-600">Existencia</span>
                <span class="font-display text-xl font-semibold tabular-nums text-slate-900">{{ etapa.existencia }} pzas</span>
              </div>
              <span class="medidor" aria-hidden="true">
                <span :style="{ width: `${(etapa.existencia / 46) * 100}%` }" :class="{ bajo: etapa.estado === 'poco' }" />
              </span>
            </div>
            <p class="mt-3 flex items-center justify-between gap-2 text-sm">
              <span :class="['producto-estado', `estado-${etapa.estado}`]">{{ etiquetaEstado[etapa.estado] }}</span>
              <span class="truncate text-slate-500">{{ etapa.nota }}</span>
            </p>
          </div>
          <p class="vida-frase" data-revela :style="{ '--i': i + 1 }">{{ etapa.frase }}</p>
        </div>
      </section>

      <!-- Tu marca: un extra, no el centro. La vista previa se pinta con el color elegido -->
      <section class="tu-marca" :style="estiloLinea" aria-labelledby="titulo-marca">
        <div class="tu-marca-texto" data-revela>
          <h2 id="titulo-marca" class="tu-marca-titulo font-display">Y con los colores de tu negocio</h2>
          <p class="tu-marca-frase">
            Dentro del panel, en Mi marca, subes tu logo y el menú, los botones y las gráficas toman sus colores. Pruébalo
            aquí:
          </p>
          <div class="prueba-opciones" role="group" aria-label="Color de tu negocio">
            <button
              v-for="sabor in sabores"
              :key="sabor.nombre"
              type="button"
              class="sabor ip-boton"
              :aria-pressed="color === sabor.color"
              @click="elegir(sabor.color)"
            >
              <span class="sabor-muestra" :style="{ backgroundColor: rampaDe(sabor.color)[600] }" />
              {{ sabor.nombre }}
            </button>
            <label class="sabor sabor-logo ip-boton">
              <input type="file" accept="image/*" class="sr-only" @change="alElegirLogo" />
              <ImageUp class="size-5" aria-hidden="true" />
              {{ leyendo ? 'Leyendo tu logo…' : logo ? 'Cambiar logo' : 'Sube tu logo' }}
            </label>
          </div>
          <div v-if="delLogo.length" class="prueba-logo" role="group" aria-label="Colores de tu logo">
            <span>De tu logo:</span>
            <button
              v-for="opcion in delLogo"
              :key="opcion"
              type="button"
              class="muestra-logo ip-boton"
              :aria-pressed="color === opcion"
              :aria-label="`Usar el color ${opcion} de tu logo`"
              :style="{ backgroundColor: rampaDe(opcion)[600] }"
              @click="elegir(opcion)"
            >
              <Check v-if="color === opcion" class="size-5" aria-hidden="true" />
            </button>
            <button type="button" class="quitar-logo" @click="quitarLogo">
              <RotateCcw class="size-4" aria-hidden="true" />
              Quitar logo
            </button>
          </div>
          <p v-if="error" class="prueba-error" role="alert">{{ error }}</p>
        </div>

        <div class="tu-marca-vista" data-ui data-revela style="--i: 1" role="img" :aria-label="`Vista previa del menú del panel con el color ${color}`">
          <div class="flex items-center gap-3">
            <span class="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-blue-600 text-sm font-bold text-white">
              <img v-if="logo" :src="logo" alt="" class="size-full bg-white object-contain p-1" />
              <template v-else>TN</template>
            </span>
            <p class="truncate text-base font-bold text-slate-900">Tu negocio</p>
          </div>
          <span class="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 font-display text-sm font-semibold text-white">
            <Banknote class="size-5" />
            Punto de venta
          </span>
          <ol class="linea relative mt-3 grid list-none gap-1 p-0">
            <li
              v-for="(estacion, i) in [
                { nombre: 'Productos', icono: Package },
                { nombre: 'Historial de ventas', icono: ReceiptText },
                { nombre: 'Usuarios', icono: Users },
              ]"
              :key="estacion.nombre"
              class="relative flex items-center gap-3 py-1 text-sm font-semibold"
            >
              <span
                :class="[
                  'relative z-10 grid size-8 place-items-center rounded-md',
                  i === 0 ? 'bg-blue-600 text-white' : 'estacion-libre text-blue-700 ring-2 ring-blue-600 ring-inset',
                ]"
              >
                <component :is="estacion.icono" class="size-4" />
              </span>
              <span :class="i === 0 ? 'text-slate-900' : 'text-slate-600'">{{ estacion.nombre }}</span>
            </li>
          </ol>
        </div>
      </section>

      <!-- Planes: cada uno es una línea del metro, más alta conforme crece -->
      <section id="planes" class="planes" aria-labelledby="titulo-planes">
        <div class="planes-cabeza" data-revela>
          <h2 id="titulo-planes" class="seccion-titulo font-display">Elige tu plan</h2>
          <p class="planes-frase">
            Precios en pesos con IVA incluido. Tu primera semana es gratis: si no te convence, te devolvemos tu pago. Cambias
            de plan cuando quieras desde el sistema.
          </p>
          <SelectorCiclo v-model="ciclo" class="mt-6" />
        </div>
        <div class="planes-lineas">
          <TarjetaPlan
            v-for="(plan, i) in PLANES"
            :key="plan.id"
            :plan="plan"
            :ciclo="ciclo"
            escalonado
            :texto-boton="`Elegir ${plan.nombre}`"
            data-revela
            :style="{ '--i': i }"
            @elegir="emit('irRegistro')"
          />
        </div>
      </section>

      <!-- Preguntas: una banda por pregunta, todas las respuestas a la vista -->
      <section id="preguntas" class="preguntas" aria-labelledby="titulo-preguntas">
        <div class="preguntas-cabeza">
          <h2 id="titulo-preguntas" class="font-display" data-revela>Antes de empezar</h2>
          <img :src="paliPensando" alt="Pali pensando, con un foco encendido" class="preguntas-pali" width="180" height="300" loading="lazy" data-revela />
        </div>
        <dl class="m-0">
          <div v-for="item in preguntas" :key="item.p" class="pregunta">
            <dt class="font-display" data-revela>{{ item.p }}</dt>
            <dd data-revela style="--i: 1">{{ item.r }}</dd>
          </div>
        </dl>
      </section>
    </main>

    <footer class="cierre">
      <div class="cierre-arriba">
        <a href="#" class="marca" aria-label="iPaletitas, volver arriba" @click.prevent="subir">
          <PaletaIcon variant="white" :size="26" />
          <span class="font-display">iPaletitas</span>
        </a>
        <p>Punto de venta e inventario para comercios de mostrador en México. Precios en pesos, IVA incluido.</p>
        <a href="#" class="cierre-subir" @click.prevent="subir">
          <ArrowUp class="size-4" aria-hidden="true" />
          Volver arriba
        </a>
      </div>

      <div class="cierre-centro">
        <button type="button" class="cierre-accion font-display" data-revela @click="emit('irRegistro')">
          Crea tu cuenta
        </button>
        <img :src="paliPulgar" alt="Pali con el pulgar arriba junto a una paleta enchilada" class="cierre-pali" width="320" height="210" loading="lazy" data-revela style="--i: 1" />
      </div>

      <div class="cierre-pie">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
          <nav class="flex flex-wrap gap-x-6 gap-y-2" aria-label="Pie de página">
            <button type="button" @click="emit('irLogin')">Iniciar sesión</button>
            <a href="#planes">Planes</a>
            <a href="#preguntas">Preguntas</a>
          </nav>
          <RedesSociales solo-icono aria-label="Redes sociales de iPaletitas" />
        </div>
        <p>Pali es la mascota de iPaletitas.</p>
        <p>Hecho en México · 2026</p>
      </div>
    </footer>

    <ChatBot @irRegistro="emit('irRegistro')" />
  </div>
</template>

<style scoped>
.home {
  --margen: clamp(1.25rem, 3vw, 2.5rem);
  --suelo: #f5f6f8;
  --suelo-2: #ffffff;
  --tinta: #0f172a;
  --tinta-2: #334155;
  --display: clamp(2.5rem, 9vw, 3.5rem);
  --titulo: clamp(2rem, 3.6vw, 3.25rem);
  --lead: clamp(1.25rem, 1.8vw, 1.6rem);
  --seccion: clamp(4.5rem, 9vw, 7rem);

  background: var(--suelo);
  color: var(--tinta);
  font-size: 1.125rem;
}

@media (min-width: 1024px) {
  .home {
    --display: clamp(3.75rem, 5.6vw, 5.5rem);
  }
}

.seccion-titulo {
  font-size: var(--titulo);
  font-weight: 700;
  line-height: 1.02;
  letter-spacing: -0.03em;
}

/* ---------- Portada ---------- */

.hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  padding-inline: var(--margen);
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: 4rem;
  background: var(--marca-600);
  color: #fff;
  overflow: clip;
}

.barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 4.75rem;
}

.marca {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: inherit;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.barra-enlaces a {
  color: inherit;
}

.barra-enlaces {
  display: none;
  gap: 2rem;
  font-size: 1rem;
  font-weight: 600;
}

.barra-enlaces a,
.cierre-pie a,
.cierre-pie button,
.cierre-subir {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-decoration-thickness: 2px;
  text-underline-offset: 0.3em;
  transition: text-decoration-color 180ms ease;
}

.barra-entrar {
  min-height: 2.75rem;
  padding: 0 1.1rem;
  border: 2px solid #fff;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.titular {
  margin-top: 2.5rem;
  font-size: var(--display);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.renglon {
  display: block;
  overflow: clip;
  padding-bottom: 0.08em;
  margin-bottom: -0.08em;
}

.renglon > span {
  display: block;
}

.prueba-opciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.sabor {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.875rem;
  padding: 0 0.95rem 0 0.55rem;
  border: 0;
  border-radius: 6px;
  background: #fff;
  color: #0f172a;
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.sabor {
  box-shadow: inset 0 0 0 1px var(--marca-200);
}

.sabor[aria-pressed='true'] {
  outline: 3px solid var(--marca-600);
  outline-offset: 2px;
}

.sabor-muestra {
  width: 1.65rem;
  height: 1.65rem;
  border-radius: 28%;
}

.sabor-logo {
  padding-left: 0.75rem;
  background: var(--marca-950);
  color: #fff;
}

.sabor-logo:focus-within {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.prueba-logo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.85rem;
  font-size: 1rem;
  font-weight: 600;
}

.muestra-logo {
  display: grid;
  width: 2.875rem;
  height: 2.875rem;
  place-items: center;
  border: 2px solid #fff;
  border-radius: 28%;
  color: #fff;
  cursor: pointer;
}

.quitar-logo {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 2.75rem;
  padding: 0 0.6rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.25em;
  cursor: pointer;
}

.prueba-error {
  margin-top: 0.85rem;
  padding: 0.6rem 0.85rem;
  border-radius: 6px;
  background: #fff1f2;
  color: #9f1239;
  font-size: 1rem;
  font-weight: 600;
}

.hero-frase {
  max-width: 44ch;
  margin-top: 1.5rem;
  color: var(--marca-50);
  font-size: 1.25rem;
  line-height: 1.5;
}

.hero-accion {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.accion,
.accion-secundaria {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  min-height: 3.5rem;
  padding: 0 1.5rem;
  border-radius: 6px;
  font: inherit;
  font-size: 1.125rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.accion {
  border: 0;
  background: #fff;
  color: var(--marca-800);
}

.accion-secundaria {
  border: 2px solid rgb(255 255 255 / 0.7);
  background: transparent;
  color: #fff;
}

.accion :deep(svg),
.accion svg {
  transition: transform 200ms var(--ease-out);
}

.accion-nota {
  margin-top: 1rem;
  color: var(--marca-100);
  font-size: 1rem;
}

.hero-redes {
  display: grid;
  gap: 0.75rem;
  margin-top: 2rem;
}

.hero-redes p {
  color: var(--marca-100);
  font-size: 0.95rem;
  font-weight: 600;
}

.hero-pieza {
  position: relative;
  z-index: 2;
  justify-self: center;
  width: min(100%, 25rem);
  margin-top: 3rem;
}

.pieza {
  position: relative;
  border-radius: 1rem;
  background: #fff;
  color: #0f172a;
  overflow: hidden;
  box-shadow: 0 24px 48px -24px rgb(4 22 76 / 0.55);
}

.mini-barras {
  display: flex;
  align-items: flex-end;
  gap: 0.3rem;
  height: 3rem;
}

.mini-barras span {
  flex: 1;
  height: 100%;
  border-radius: 3px 3px 1px 1px;
  background: var(--marca-300);
  transform: scaleY(var(--h));
  transform-origin: bottom;
}

.mini-barras span.actual {
  background: var(--marca-600);
}

/* Pali se asoma por la orilla del panel, volteado para mirarlo */
.pali {
  position: absolute;
  z-index: 3;
  right: -0.75rem;
  bottom: -2rem;
  width: 5.5rem;
  scale: -1 1;
}

.pali img {
  display: block;
  width: 100%;
  height: auto;
}

@media (min-width: 768px) {
  .barra-enlaces {
    display: flex;
  }
}

@media (min-width: 1024px) {
  .hero {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    grid-template-rows: auto 1fr;
    column-gap: 1.5rem;
    min-height: min(100svh, 56rem);
    padding-bottom: 5rem;
  }

  .barra {
    grid-column: 1 / -1;
  }

  .hero-texto {
    grid-column: 1 / 7;
    grid-row: 2;
    align-self: center;
  }

  .titular {
    margin-top: 0;
  }

  .hero-pieza {
    grid-column: 8 / 13;
    grid-row: 2;
    align-self: center;
    justify-self: center;
    width: 100%;
    max-width: 26rem;
    margin: 0;
  }

  .pieza {
    transform: rotate(-1.5deg);
  }

  .pali {
    right: auto;
    left: -4.5rem;
    bottom: -1.5rem;
    width: 7rem;
    scale: 1 1;
  }
}

/* ---------- Lo que ofrece ---------- */

.ofrece {
  padding: var(--seccion) var(--margen);
  background: var(--suelo-2);
}

.ofrece-cabeza {
  max-width: 46rem;
}

.ofrece-frase,
.historial-frase,
.tu-marca-frase {
  margin-top: 1.25rem;
  color: var(--tinta-2);
  font-size: 1.125rem;
  line-height: 1.55;
}

.estaciones-oferta {
  display: grid;
  margin-top: 3rem;
  padding: 0;
  list-style: none;
}

.estaciones-oferta li {
  position: relative;
  display: grid;
  grid-template-columns: 2.75rem minmax(0, 1fr);
  column-gap: 1rem;
  padding-bottom: 1.75rem;
}

/* La línea del metro une las estaciones; en celular corre hacia abajo */
.estaciones-oferta li::before {
  content: '';
  position: absolute;
  top: 2.75rem;
  bottom: 0;
  left: calc(1.375rem - 2px);
  width: 4px;
  background: var(--marca-600);
}

.estaciones-oferta li:last-child::before {
  display: none;
}

.estacion-punto {
  position: relative;
  z-index: 1;
  display: grid;
  grid-row: span 2;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 4px solid var(--marca-600);
  border-radius: 50%;
  background: var(--suelo-2);
  color: var(--marca-700);
}

.estacion-nombre {
  align-self: center;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.estacion-texto {
  margin-top: 0.35rem;
  color: var(--tinta-2);
  font-size: 1rem;
  line-height: 1.5;
}

@media (min-width: 900px) {
  .estaciones-oferta {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    row-gap: 3rem;
  }

  .estaciones-oferta li {
    grid-template-columns: minmax(0, 1fr);
    padding: 0 1.5rem 0 0;
  }

  /* En pantalla ancha cada fila es un tramo horizontal de la línea */
  .estaciones-oferta li::before {
    top: calc(1.375rem - 2px);
    right: 0;
    bottom: auto;
    left: 2.75rem;
    width: auto;
    height: 4px;
  }

  .estaciones-oferta li:nth-child(4n)::before {
    display: none;
  }

  .estacion-punto {
    grid-row: auto;
  }

  .estacion-nombre {
    margin-top: 1rem;
  }
}

/* ---------- Historial de ventas ---------- */

.historial {
  display: grid;
  gap: 3rem;
  padding: var(--seccion) var(--margen);
  background: var(--marca-50);
}

.historial-texto {
  position: relative;
  max-width: 34rem;
}

.historial-pali {
  display: none;
  width: 7.5rem;
  height: auto;
  margin-top: 2rem;
}

.historial-panel {
  padding: 1.5rem;
  border-radius: 1rem;
  background: #fff;
  color: #0f172a;
  box-shadow: 0 24px 48px -32px rgb(4 22 76 / 0.45);
}

.periodos {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 8px;
  background: #f1f5f9;
}

.periodo {
  min-height: 2.5rem;
  padding: 0 1rem;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #334155;
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.periodo[aria-pressed='true'] {
  background: var(--marca-600);
  color: #fff;
}

.grafica {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  height: 13rem;
  margin-top: 1.5rem;
}

.grafica-col {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
  min-width: 0;
}

.grafica-barra {
  flex: 1;
  width: 100%;
  max-width: 3.5rem;
  border-radius: 6px 6px 2px 2px;
  background: var(--marca-500);
  transform: scaleY(var(--h));
  transform-origin: bottom;
}

.grafica-etiqueta {
  color: #64748b;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.top-fila {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.top-medidor {
  display: block;
  height: 0.375rem;
  margin-top: 0.4rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.top-medidor span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #f59e0b;
  transform: scaleX(var(--h));
  transform-origin: left;
}

@media (min-width: 1024px) {
  .historial {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    align-items: center;
    column-gap: 4rem;
  }

  .historial-pali {
    display: block;
  }

  .historial-panel {
    padding: 2rem;
  }
}

/* ---------- Tu marca ---------- */

.tu-marca {
  display: grid;
  gap: 2.5rem;
  padding: var(--seccion) var(--margen);
  background: var(--marca-50);
  transition: background-color 420ms ease;
}

.tu-marca-texto {
  max-width: 38rem;
}

.tu-marca-titulo {
  font-size: clamp(1.75rem, 2.6vw, 2.5rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.tu-marca-vista {
  justify-self: center;
  width: min(100%, 20rem);
  padding: 1.25rem;
  border-radius: 1rem;
  background: #fff;
  color: #0f172a;
  box-shadow: 0 24px 48px -32px rgb(4 22 76 / 0.45);
}

.tu-marca-vista :is(.bg-blue-600, .ring-blue-600, .text-blue-700) {
  transition:
    background-color 420ms ease,
    color 420ms ease,
    box-shadow 420ms ease;
}

.estacion-libre {
  background: #fff;
}

.linea::before {
  content: '';
  position: absolute;
  top: 1.2rem;
  bottom: 1.2rem;
  left: calc(1rem - 1.5px);
  width: 3px;
  border-radius: 2px;
  background: var(--marca-600);
  transition: background-color 420ms ease;
}

@media (min-width: 900px) {
  .tu-marca {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    align-items: center;
    column-gap: 4rem;
  }
}

/* ---------- Cobrar ---------- */

.cobro {
  --campo: #fcd34d;
  --tinta-campo: #1c1606;
  position: relative;
  display: grid;
  min-height: 100vh;
  min-height: 100svh;
  padding: var(--seccion) var(--margen) 0;
  background: var(--campo);
  color: var(--tinta-campo);
  overflow: clip;
  transition:
    background-color 420ms ease,
    color 420ms ease;
}

.cobro.cobrado {
  --campo: #0d8a5f;
  --tinta-campo: #fff;
}

.cobro-paletas {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.45;
}

.paleta-carril {
  position: absolute;
  top: 0;
  bottom: 0;
  transform: translateY(var(--quieto));
}

.paleta-fondo {
  display: block;
  translate: -50% -100%;
  rotate: var(--giro);
}

@media (prefers-reduced-motion: no-preference) {
  .paleta-carril {
    animation: paleta-sube var(--dur) linear var(--retraso) infinite;
  }

  .paleta-fondo {
    animation: paleta-mece 3.2s ease-in-out var(--retraso) infinite alternate;
  }
}

@keyframes paleta-sube {
  from {
    transform: translateY(calc(100% + 120px));
  }
  to {
    transform: translateY(0);
  }
}

@keyframes paleta-mece {
  from {
    rotate: var(--giro);
  }
  to {
    rotate: calc(var(--giro) * -1);
  }
}

.cobro-texto {
  position: relative;
  z-index: 2;
  max-width: 34rem;
}

.cobro-frase {
  margin-top: 1.25rem;
  font-size: 1.125rem;
  line-height: 1.55;
}

.cobro-billete {
  position: absolute;
  z-index: 3;
  top: 2rem;
  right: var(--margen);
  width: min(42%, 22rem);
  height: auto;
  border-radius: 6px;
  opacity: 0;
  transform: translateY(24px) rotate(-6deg) scale(0.96);
  transition:
    opacity 300ms ease,
    transform 500ms var(--ease-out);
}

.cobro-billete.visible {
  opacity: 1;
  transform: rotate(-6deg);
}

.ticket-marco {
  position: relative;
  z-index: 1;
  align-self: end;
  justify-self: end;
  margin-top: 2.5rem;
  font-size: clamp(1rem, 1.8vw, 1.6rem);
}

.ticket {
  width: 22em;
  max-width: calc(100vw - 2 * var(--margen));
  padding: 1.4em 1.4em 0;
  border-radius: 1em 1em 0 0;
  background: #fff;
  color: #0f172a;
}

.ticket-cabeza {
  display: flex;
  align-items: center;
  gap: 0.75em;
}

.ticket-picto {
  width: 2.6em;
  height: 2.6em;
}

.ticket-picto :deep(svg),
.ticket-picto svg {
  width: 1.3em;
  height: 1.3em;
}

.ticket-titulo {
  font-weight: 700;
  line-height: 1.2;
}

.ticket-sub {
  color: #475569;
  font-size: 0.7em;
}

.ticket-lineas {
  display: grid;
  gap: 0.55em;
  margin-top: 1.1em;
  padding: 0.9em 0;
  border-block: 1px dashed #cbd5e1;
  list-style: none;
}

.ticket-lineas li {
  display: grid;
  grid-template-columns: 1.6em minmax(0, 1fr) auto;
  gap: 0.5em;
}

.ticket-cant,
.ticket-monto,
.ticket-total {
  font-variant-numeric: tabular-nums;
}

.ticket-cant {
  color: #475569;
}

.ticket-nombre {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticket-total {
  display: flex;
  justify-content: space-between;
  margin-top: 0.8em;
  font-family: var(--font-display);
  font-weight: 700;
}

.ticket-cobrar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  width: 100%;
  min-height: 2.9em;
  margin-top: 0.9em;
  border: 0;
  border-radius: 0.6em;
  background: var(--marca-600);
  color: #fff;
  font: inherit;
  font-family: var(--font-display);
  font-weight: 700;
  cursor: pointer;
}

.ticket-cobrar.hecho {
  background: #0d8a5f;
}

.ticket-cobrar :deep(svg),
.ticket-cobrar svg {
  width: 1.1em;
  height: 1.1em;
}

.ticket-pie {
  padding: 1em 0 2.2em;
  color: #475569;
  font-size: 0.7em;
  text-align: center;
}

@media (min-width: 1024px) {
  .cobro {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    grid-template-rows: auto 1fr;
    column-gap: 3rem;
  }

  .cobro-texto {
    grid-column: 1;
  }

  .cobro-billete {
    position: relative;
    top: auto;
    right: auto;
    grid-column: 1;
    grid-row: 2;
    align-self: center;
    width: min(80%, 22rem);
  }

  .ticket-marco {
    grid-column: 2;
    grid-row: 1 / 3;
    margin-top: 0;
  }
}

/* ---------- La vida de un producto ---------- */

.vida {
  display: grid;
}

.vida-campo {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: 22rem;
  padding: 2.5rem var(--margen) 2.25rem;
}

.vida-0 {
  background: var(--marca-50);
  color: var(--tinta);
}

.vida-1 {
  background: var(--marca-200);
  color: var(--tinta);
}

.vida-2 {
  background: var(--marca-600);
  color: #fff;
}

.vida-3 {
  background: var(--marca-900);
  color: #fff;
}

.vida-titulo {
  position: relative;
  z-index: 1;
  order: -2;
  font-size: var(--titulo);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.03em;
}

.vida-titulo span {
  display: block;
  white-space: nowrap;
}

.producto {
  width: 16.25rem;
  max-width: 100%;
  padding: 1rem;
  border-radius: 0.85rem;
  background: #fff;
  color: #0f172a;
  transition: transform 150ms var(--ease-out);
}

.medidor {
  display: block;
  height: 0.375rem;
  margin-top: 0.6rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.medidor span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--marca-600);
}

.medidor .bajo {
  background: #d97706;
}

.producto-estado {
  flex-shrink: 0;
  padding: 0.2rem 0.55rem;
  border-radius: 0.4rem;
  font-weight: 700;
}

.estado-nuevo {
  background: var(--marca-100);
  color: var(--marca-800);
}

.estado-ok {
  background: #d1fae5;
  color: #065f46;
}

.estado-poco {
  background: #fef3c7;
  color: #92400e;
}

.vida-frase {
  order: -1;
  max-width: 14ch;
  font-family: var(--font-display);
  font-size: var(--lead);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

@media (min-width: 700px) {
  .vida {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .vida-campo {
    min-height: 30rem;
  }

  .vida-frase {
    order: 0;
    margin-top: auto;
  }
}

@media (min-width: 1200px) {
  .vida {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .vida-campo {
    min-height: 34rem;
    padding-top: 2.75rem;
    padding-bottom: 2.25rem;
  }

  .producto {
    position: absolute;
    top: 38%;
    left: 50%;
    width: min(16.25rem, calc(100% - 2 * var(--margen)));
    translate: -50% 0;
  }
}

/* ---------- Planes ---------- */

.planes {
  padding: var(--seccion) var(--margen);
  background: var(--suelo);
}

.planes-cabeza {
  max-width: 40rem;
}

.planes-frase {
  margin-top: 1.25rem;
  color: var(--tinta-2);
  font-size: 1.125rem;
  line-height: 1.55;
}

.planes-lineas {
  display: grid;
  gap: 0.5rem;
  margin-top: 2rem;
}

@media (min-width: 640px) {
  .planes-lineas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: end;
  }
}

@media (min-width: 1280px) {
  .planes {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    column-gap: 0.5rem;
  }

  /* El título ocupa el hueco sobre las dos líneas más bajas */
  .planes-cabeza {
    position: relative;
    z-index: 1;
    grid-column: 1 / 3;
    grid-row: 1;
    align-self: start;
    padding-right: 2rem;
  }

  /* Comparte fila con el título: su hueco superior no debe tragarse los clics del selector */
  .planes-lineas {
    grid-column: 1 / -1;
    grid-row: 1;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin-top: 0;
    padding-top: 16rem;
    pointer-events: none;
  }

  .planes-lineas > * {
    pointer-events: auto;
  }
}

/* ---------- Preguntas ---------- */

.preguntas-cabeza {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  min-height: 15rem;
  padding: 3rem var(--margen) 2.5rem;
  background: var(--marca-950);
  color: #fff;
  overflow: clip;
}

.preguntas-cabeza h2 {
  position: relative;
  z-index: 1;
  max-width: 10ch;
  font-size: var(--display);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.035em;
}

.preguntas-pali {
  position: absolute;
  right: var(--margen);
  bottom: -1.5rem;
  width: auto;
  height: 70%;
  max-height: 20rem;
}

.pregunta {
  display: grid;
  gap: 0.85rem;
  padding: 2.25rem var(--margen);
  background: var(--suelo-2);
}

.pregunta:nth-child(even) {
  background: #e9edf3;
}

.pregunta dt {
  font-size: var(--lead);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.pregunta dd {
  margin: 0;
  max-width: 60ch;
  font-size: 1.125rem;
  line-height: 1.55;
}

@media (min-width: 900px) {
  .preguntas-cabeza {
    min-height: 19rem;
    padding-top: 4rem;
  }

  .pregunta {
    grid-template-columns: repeat(12, minmax(0, 1fr));
    column-gap: 1.5rem;
    padding-block: 3.5rem;
  }

  .pregunta dt {
    grid-column: 1 / 6;
  }

  .pregunta dd {
    grid-column: 7 / 13;
  }
}

/* ---------- Cierre ---------- */

.cierre {
  display: flex;
  flex-direction: column;
  padding: 3rem var(--margen) calc(2rem + env(safe-area-inset-bottom, 0px));
  background: var(--marca-600);
  color: #fff;
}

.cierre-arriba {
  display: grid;
  gap: 1rem;
  font-size: 1rem;
}

.cierre-arriba p {
  max-width: 44ch;
}

.cierre-subir {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
}

.cierre-centro {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  margin-top: auto;
  padding-top: 4rem;
}

.cierre-accion {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: var(--display);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.035em;
  text-align: left;
  text-decoration: underline;
  text-decoration-color: transparent;
  text-decoration-thickness: 0.06em;
  text-underline-offset: 0.12em;
  cursor: pointer;
  transition: text-decoration-color 200ms ease;
}

.cierre-pali {
  width: min(16rem, 60vw);
  height: auto;
}

.cierre-pie {
  display: grid;
  gap: 0.5rem;
  margin-top: 2.5rem;
  font-size: 1rem;
}

.cierre-pie button {
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.cierre-pie :is(a, button) {
  color: inherit;
}

@media (min-width: 900px) {
  .cierre-arriba {
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: start;
    column-gap: 3rem;
  }

  .cierre-pie {
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
  }

  .cierre-pie > :last-child {
    text-align: right;
  }
}

/* ---------- Respuesta bajo la mano ---------- */

@media (hover: hover) and (pointer: fine) {
  .barra-enlaces a:hover,
  .cierre-pie a:hover,
  .cierre-pie button:hover,
  .cierre-subir:hover,
  .cierre-accion:hover {
    text-decoration-color: currentColor;
  }

  .barra-entrar:hover {
    background: #fff;
    color: var(--marca-700);
  }

  .sabor:hover {
    background: var(--marca-100);
  }

  .sabor-logo:hover {
    background: var(--marca-900);
  }

  .accion:hover {
    background: var(--marca-50);
  }

  .accion-secundaria:hover {
    border-color: #fff;
    background: rgb(255 255 255 / 0.12);
  }

  .periodo:hover:not([aria-pressed='true']) {
    background: #e2e8f0;
  }

  .accion:hover svg {
    transform: translateX(4px);
  }

  .ticket-cobrar:hover {
    background: var(--marca-700);
  }

  .ticket-cobrar.hecho:hover {
    background: #0b744f;
  }

  .home .vida-campo:hover .producto {
    transform: translateY(-6px);
  }
}

/* ---------- Movimiento ---------- */

@media (prefers-reduced-motion: no-preference) {
  .renglon > span {
    animation: renglon-sube 900ms var(--ease-out) both;
    animation-delay: calc(var(--i, 0) * 110ms + 120ms);
  }

  .entra {
    animation: entra-sube 800ms var(--ease-out) both;
    animation-delay: calc(var(--i, 0) * 90ms + 200ms);
  }

  .con-revelado [data-revela] {
    opacity: 0;
    transform: translateY(24px);
    transition:
      opacity 700ms var(--ease-out),
      transform 900ms var(--ease-out);
    transition-delay: calc(var(--i, 0) * 80ms);
  }

  .con-revelado [data-revela].visto {
    opacity: 1;
    transform: none;
  }

  /* La tarjeta de producto conserva su respuesta al hover una vez que entró */
  .con-revelado .producto[data-revela].visto {
    transition:
      opacity 700ms var(--ease-out),
      transform 150ms var(--ease-out);
    transition-delay: 0ms;
  }
}

@media (prefers-reduced-motion: no-preference) {
  .grafica-barra,
  .mini-barras span {
    animation: barra-crece 560ms var(--ease-out) both;
    animation-delay: calc(var(--i, 0) * 40ms);
  }

  .mini-barras span {
    animation-delay: calc(var(--i, 0) * 40ms + 600ms);
  }

  .top-medidor span {
    animation: medidor-crece 600ms var(--ease-out) both;
    animation-delay: calc(var(--i, 0) * 60ms + 150ms);
  }

  .con-revelado .historial-panel:not(.visto) :is(.grafica-barra, .top-medidor span) {
    animation-play-state: paused;
  }
}

@keyframes barra-crece {
  from {
    transform: scaleY(0);
  }
}

@keyframes medidor-crece {
  from {
    transform: scaleX(0);
  }
}

@keyframes renglon-sube {
  from {
    transform: translateY(105%);
  }
}

@keyframes entra-sube {
  from {
    opacity: 0;
    transform: translateY(28px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cobro,
  .cobro-billete,
  .producto,
  .accion svg {
    transition-property: opacity, background-color, color;
  }

  .cobro-billete,
  .cobro-billete.visible {
    transform: none;
  }
}
</style>
