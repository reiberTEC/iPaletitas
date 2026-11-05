<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import ModalBase from './ModalBase.vue'
import paliPulgar from '../assets/Img/pali-pulgar.webp'
import {
  CATEGORIAS,
  TASA_IVA,
  formatoMoneda,
  useCatalogo,
  type CategoriaId,
  type LineaVenta,
  type MetodoPago,
  type Producto,
  type Venta,
} from '../composables/useCatalogo'

const METODOS: { id: MetodoPago; texto: string; icono: string }[] = [
  { id: 'efectivo', texto: 'Efectivo', icono: '💵' },
  { id: 'tarjeta', texto: 'Tarjeta', icono: '💳' },
  { id: 'transferencia', texto: 'Transferencia', icono: '📲' },
]

const BILLETES = [50, 100, 200, 500]
const POCAS_PIEZAS = 8

const { productos, ventas, siguienteFolio, registrarVenta } = useCatalogo()

const busqueda = ref('')
const categoria = ref<CategoriaId | 'todas'>('todas')
const ticket = ref<LineaVenta[]>([])
const metodo = ref<MetodoPago>('efectivo')
const recibidoTexto = ref('')
const ventaCompletada = ref<Venta | null>(null)

const aviso = ref('')
let temporizadorAviso: ReturnType<typeof setTimeout> | undefined

const mostrarAviso = (mensaje: string) => {
  aviso.value = mensaje
  clearTimeout(temporizadorAviso)
  temporizadorAviso = setTimeout(() => (aviso.value = ''), 2600)
}

onUnmounted(() => clearTimeout(temporizadorAviso))

const moneda = (valor: number) => formatoMoneda.format(valor)

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const productosFiltrados = computed(() => {
  const termino = normalizar(busqueda.value.trim())
  return productos.value.filter(
    (producto) =>
      (categoria.value === 'todas' || producto.categoria === categoria.value) &&
      normalizar(producto.nombre).includes(termino),
  )
})

const cantidadEnTicket = (id: string) => ticket.value.find((linea) => linea.productoId === id)?.cantidad ?? 0
const disponible = (producto: Producto) => producto.stock - cantidadEnTicket(producto.id)

const agregar = (producto: Producto) => {
  if (disponible(producto) <= 0) {
    mostrarAviso(`No quedan más paletas de ${producto.nombre} en existencia`)
    return
  }

  const linea = ticket.value.find((l) => l.productoId === producto.id)
  if (linea) linea.cantidad++
  else ticket.value.push({ productoId: producto.id, nombre: producto.nombre, precio: producto.precio, cantidad: 1 })
}

const quitar = (linea: LineaVenta) => {
  ticket.value = ticket.value.filter((l) => l !== linea)
}

const cambiarCantidad = (linea: LineaVenta, delta: number) => {
  const producto = productos.value.find((p) => p.id === linea.productoId)
  if (delta > 0 && producto && disponible(producto) <= 0) {
    mostrarAviso(`Solo hay ${producto.stock} de ${producto.nombre}`)
    return
  }

  linea.cantidad += delta
  if (linea.cantidad <= 0) quitar(linea)
}

const vaciar = () => {
  ticket.value = []
  recibidoTexto.value = ''
}

const total = computed(() => ticket.value.reduce((suma, linea) => suma + linea.precio * linea.cantidad, 0))
const piezas = computed(() => ticket.value.reduce((suma, linea) => suma + linea.cantidad, 0))
// Los precios del catálogo ya incluyen IVA
const subtotal = computed(() => total.value / (1 + TASA_IVA))
const iva = computed(() => total.value - subtotal.value)

const recibido = computed(() => (metodo.value === 'efectivo' ? Number(recibidoTexto.value) || 0 : total.value))
const cambio = computed(() => Math.max(0, recibido.value - total.value))
const faltante = computed(() => Math.max(0, total.value - recibido.value))
const puedeCobrar = computed(() => ticket.value.length > 0 && faltante.value === 0)

const billetesSugeridos = computed(() => BILLETES.filter((billete) => billete > total.value))

const cobrar = () => {
  if (!puedeCobrar.value) return

  ventaCompletada.value = registrarVenta({
    lineas: ticket.value.map((linea) => ({ ...linea })),
    total: total.value,
    metodo: metodo.value,
    recibido: recibido.value,
    cambio: cambio.value,
  })
  vaciar()
}

const nuevaVenta = () => {
  ventaCompletada.value = null
  metodo.value = 'efectivo'
}

const ventasHoy = computed(() => {
  const hoy = new Date().toDateString()
  return ventas.value.filter((venta) => new Date(venta.fecha).toDateString() === hoy)
})
const totalHoy = computed(() => ventasHoy.value.reduce((suma, venta) => suma + venta.total, 0))

const textoMetodo = (id: MetodoPago) => METODOS.find((m) => m.id === id)?.texto ?? id
</script>

<template>
  <div class="pos-view">
    <header class="view-header">
      <div>
        <h1 class="titulo">Punto de venta</h1>
        <p class="subtitulo">Toca una paleta para agregarla al ticket.</p>
      </div>

      <div class="resumen-dia">
        <div class="resumen-item">
          <span class="resumen-etiqueta">Ventas de hoy</span>
          <strong>{{ ventasHoy.length }}</strong>
        </div>
        <div class="resumen-item">
          <span class="resumen-etiqueta">Ingresos de hoy</span>
          <strong>{{ moneda(totalHoy) }}</strong>
        </div>
      </div>
    </header>

    <div class="pos-layout">
      <section class="catalogo" aria-label="Catálogo de productos">
        <div class="filtros">
          <input v-model="busqueda" type="search" class="buscador" placeholder="🔍  Buscar sabor…" />

          <div class="chips" role="group" aria-label="Categorías">
            <button
              type="button"
              :class="['chip', { activo: categoria === 'todas' }]"
              :aria-pressed="categoria === 'todas'"
              @click="categoria = 'todas'"
            >
              Todas
            </button>
            <button
              v-for="cat in CATEGORIAS"
              :key="cat.id"
              type="button"
              :class="['chip', { activo: categoria === cat.id }]"
              :aria-pressed="categoria === cat.id"
              @click="categoria = cat.id"
            >
              {{ cat.nombre }}
            </button>
          </div>
        </div>

        <div v-if="productosFiltrados.length" class="productos">
          <button
            v-for="producto in productosFiltrados"
            :key="producto.id"
            type="button"
            class="producto"
            :style="{ '--fondo': producto.color }"
            :disabled="producto.stock === 0"
            @click="agregar(producto)"
          >
            <span v-if="cantidadEnTicket(producto.id)" class="en-ticket">{{ cantidadEnTicket(producto.id) }}</span>
            <span class="producto-icono" aria-hidden="true">{{ producto.icono }}</span>
            <span class="producto-nombre">{{ producto.nombre }}</span>
            <span class="producto-precio">{{ moneda(producto.precio) }}</span>
            <span v-if="producto.stock === 0" class="existencia agotado">Agotado</span>
            <span v-else-if="producto.stock <= POCAS_PIEZAS" class="existencia pocas">
              ¡Quedan {{ producto.stock }}!
            </span>
            <span v-else class="existencia">{{ producto.stock }} en existencia</span>
          </button>
        </div>

        <p v-else class="vacio">No encontramos sabores con “{{ busqueda }}”.</p>
      </section>

      <aside class="ticket" aria-label="Ticket de venta">
        <div class="ticket-encabezado">
          <div>
            <h2>Ticket</h2>
            <span class="folio">Folio {{ siguienteFolio() }}</span>
          </div>
          <button v-if="ticket.length" type="button" class="btn-enlace" @click="vaciar">Vaciar</button>
        </div>

        <ul v-if="ticket.length" class="lineas">
          <li v-for="linea in ticket" :key="linea.productoId" class="linea">
            <div class="linea-info">
              <span class="linea-nombre">{{ linea.nombre }}</span>
              <span class="linea-unitario">{{ moneda(linea.precio) }} c/u</span>
            </div>

            <div class="cantidad">
              <button type="button" aria-label="Quitar una" @click="cambiarCantidad(linea, -1)">−</button>
              <span>{{ linea.cantidad }}</span>
              <button type="button" aria-label="Agregar una" @click="cambiarCantidad(linea, 1)">+</button>
            </div>

            <span class="linea-total">{{ moneda(linea.precio * linea.cantidad) }}</span>
            <button type="button" class="btn-quitar" :aria-label="`Quitar ${linea.nombre}`" @click="quitar(linea)">
              ✕
            </button>
          </li>
        </ul>

        <div v-else class="ticket-vacio">
          <span aria-hidden="true">🍦</span>
          <p>Aún no hay productos en el ticket.</p>
        </div>

        <dl class="totales">
          <div>
            <dt>Subtotal</dt>
            <dd>{{ moneda(subtotal) }}</dd>
          </div>
          <div>
            <dt>IVA (16%)</dt>
            <dd>{{ moneda(iva) }}</dd>
          </div>
          <div class="total">
            <dt>Total · {{ piezas }} {{ piezas === 1 ? 'pieza' : 'piezas' }}</dt>
            <dd>{{ moneda(total) }}</dd>
          </div>
        </dl>

        <form class="pago" @submit.prevent="cobrar">
          <div class="metodos" role="radiogroup" aria-label="Método de pago">
            <label v-for="m in METODOS" :key="m.id" :class="['metodo', { activo: metodo === m.id }]">
              <input v-model="metodo" type="radio" name="metodo" :value="m.id" />
              <span aria-hidden="true">{{ m.icono }}</span>
              {{ m.texto }}
            </label>
          </div>

          <template v-if="metodo === 'efectivo'">
            <label class="recibido">
              <span>Recibido</span>
              <input v-model="recibidoTexto" type="number" min="0" step="0.5" inputmode="decimal" placeholder="0.00" />
            </label>

            <div class="rapidos">
              <button type="button" :disabled="!total" @click="recibidoTexto = String(total)">Exacto</button>
              <button v-for="billete in billetesSugeridos" :key="billete" type="button" @click="recibidoTexto = String(billete)">
                {{ moneda(billete) }}
              </button>
            </div>

            <p v-if="ticket.length && faltante > 0 && recibidoTexto" class="faltante">Faltan {{ moneda(faltante) }}</p>
            <p v-else-if="cambio > 0" class="cambio">
              Cambio <strong>{{ moneda(cambio) }}</strong>
            </p>
          </template>

          <button type="submit" class="btn-cobrar" :disabled="!puedeCobrar">
            Cobrar {{ total ? moneda(total) : '' }}
          </button>
        </form>
      </aside>
    </div>

    <ModalBase :abierto="!!ventaCompletada" titulo="¡Venta registrada!" ancho="440px" @cerrar="nuevaVenta">
      <div v-if="ventaCompletada" class="exito">
        <img :src="paliPulgar" alt="Pali con el pulgar arriba" class="exito-pali" />
        <p class="exito-folio">Folio {{ ventaCompletada.folio }}</p>
        <p class="exito-total">{{ moneda(ventaCompletada.total) }}</p>
        <p class="exito-metodo">Pagado con {{ textoMetodo(ventaCompletada.metodo).toLowerCase() }}</p>
        <p v-if="ventaCompletada.metodo === 'efectivo'" class="exito-cambio">
          Entrega de cambio: <strong>{{ moneda(ventaCompletada.cambio) }}</strong>
        </p>
      </div>

      <template #pie>
        <button type="button" class="btn btn-primario" @click="nuevaVenta">Nueva venta</button>
      </template>
    </ModalBase>

    <Transition name="aviso">
      <div v-if="aviso" class="aviso" role="status">{{ aviso }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.pos-view {
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

.resumen-dia {
  display: flex;
  gap: 1rem;
}

.resumen-item {
  display: flex;
  flex-direction: column;
  padding: 0.8rem 1.2rem;
  border-radius: 16px;
  background: white;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.resumen-etiqueta {
  font-size: 0.8rem;
  color: #64748b;
}

.resumen-item strong {
  font-size: 1.3rem;
  color: #0f172a;
}

.pos-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 1.5rem;
  align-items: start;
}

/* Catálogo */
.filtros {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-bottom: 1.3rem;
}

.buscador {
  width: 100%;
  padding: 0.85rem 1.1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  background: white;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.buscador:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  padding: 0.5rem 1rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 999px;
  background: white;
  color: #334155;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.chip:hover {
  border-color: #93c5fd;
}

.chip.activo {
  border-color: #2563eb;
  background: #2563eb;
  color: white;
}

.productos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 1rem;
}

.producto {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  padding: 1.2rem 0.8rem 1rem;
  border: 2px solid transparent;
  border-radius: 20px;
  background: white;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
  text-align: center;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.producto:hover:not(:disabled) {
  transform: translateY(-3px);
  border-color: #93c5fd;
  box-shadow: 0 14px 26px rgba(37, 99, 235, 0.15);
}

.producto:active:not(:disabled) {
  transform: scale(0.97);
}

.producto:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.producto-icono {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-bottom: 0.3rem;
  border-radius: 50%;
  background: var(--fondo);
  font-size: 2rem;
}

.producto-nombre {
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.producto-precio {
  font-size: 1.15rem;
  font-weight: 800;
  color: #2563eb;
}

.existencia {
  font-size: 0.75rem;
  color: #64748b;
}

.existencia.pocas {
  color: #d97706;
  font-weight: 700;
}

.existencia.agotado {
  color: #dc2626;
  font-weight: 700;
}

.en-ticket {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  min-width: 26px;
  height: 26px;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: #16a34a;
  color: white;
  font-size: 0.85rem;
  font-weight: 800;
  line-height: 26px;
}

.vacio {
  padding: 3rem 1rem;
  color: #64748b;
  text-align: center;
}

/* Ticket */
.ticket {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.5rem;
  border-radius: 24px;
  background: white;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.08);
}

.ticket-encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ticket-encabezado h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.folio {
  font-size: 0.8rem;
  color: #64748b;
}

.btn-enlace {
  border: none;
  background: none;
  color: #dc2626;
  font-weight: 600;
  cursor: pointer;
}

.lineas {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-height: 300px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin: 0;
}

.linea {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 70px 20px;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.7rem;
  border-radius: 14px;
  background: #f8fafc;
}

.linea-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.linea-nombre {
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
  overflow-wrap: anywhere;
}

.linea-unitario {
  font-size: 0.75rem;
  color: #64748b;
}

.cantidad {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cantidad button {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: #e2e8f0;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.cantidad button:hover {
  background: #dbeafe;
}

.cantidad span {
  min-width: 1.4rem;
  font-weight: 700;
  text-align: center;
}

.linea-total {
  font-weight: 700;
  text-align: right;
}

.btn-quitar {
  border: none;
  background: none;
  color: #94a3b8;
  cursor: pointer;
}

.btn-quitar:hover {
  color: #dc2626;
}

.ticket-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  padding: 1.5rem 0;
  color: #64748b;
}

.ticket-vacio span {
  font-size: 2.2rem;
}

.totales {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0;
  padding-top: 1rem;
  border-top: 2px dashed #e2e8f0;
}

.totales div {
  display: flex;
  justify-content: space-between;
  color: #475569;
}

.totales dd {
  margin: 0;
}

.totales .total {
  margin-top: 0.3rem;
  color: #0f172a;
  font-weight: 800;
}

.totales .total dd {
  font-size: 1.6rem;
}

.pago {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.metodos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.metodo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.6rem 0.3rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.metodo input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.metodo:focus-within {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
}

.metodo.activo {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
}

.recibido {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-weight: 700;
  color: #334155;
}

.recibido input {
  width: 60%;
  padding: 0.6rem 0.8rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1.1rem;
  text-align: right;
  outline: none;
}

.recibido input:focus {
  border-color: #3b82f6;
}

.rapidos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.rapidos button {
  flex: 1;
  padding: 0.45rem 0.5rem;
  border: 1.5px solid #bbf7d0;
  border-radius: 10px;
  background: #f0fdf4;
  color: #166534;
  font-weight: 700;
  cursor: pointer;
}

.rapidos button:hover:not(:disabled) {
  background: #dcfce7;
}

.rapidos button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.faltante,
.cambio {
  padding: 0.6rem 0.9rem;
  border-radius: 12px;
  font-weight: 600;
}

.faltante {
  background: #fef2f2;
  color: #b91c1c;
}

.cambio {
  display: flex;
  justify-content: space-between;
  background: #f0fdf4;
  color: #166534;
}

.cambio strong {
  font-size: 1.2rem;
}

.btn-cobrar {
  padding: 1rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(to bottom, #22c55e, #16a34a);
  color: white;
  font-size: 1.2rem;
  font-weight: 800;
  box-shadow: 0 10px 22px rgba(22, 163, 74, 0.35);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.btn-cobrar:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-cobrar:disabled {
  opacity: 0.45;
  box-shadow: none;
  cursor: not-allowed;
}

/* Modal de venta exitosa */
.exito {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.2rem;
}

.exito-pali {
  max-height: 160px;
  margin-bottom: 0.6rem;
}

.exito-folio {
  font-size: 0.85rem;
  color: #64748b;
}

.exito-total {
  font-size: 2.4rem;
  font-weight: 900;
  color: #16a34a;
}

.exito-metodo {
  color: #475569;
}

.exito-cambio {
  margin-top: 0.8rem;
  padding: 0.7rem 1rem;
  border-radius: 12px;
  background: #f0fdf4;
  color: #166534;
}

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

@media (max-width: 1100px) {
  .pos-layout {
    grid-template-columns: 1fr;
  }

  .ticket {
    position: static;
  }
}
</style>
