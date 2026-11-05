<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import ModalBase from './ModalBase.vue'
import paliMesero from '../assets/Img/pali-mesero.webp'
import paliLentes from '../assets/Img/pali-lentes.webp'
import paliPortafolio from '../assets/Img/pali-portafolio.webp'
import paliSuper from '../assets/Img/pali-super.webp'

type PlanId = 'basica' | 'doble' | 'doble-especial' | 'especial-super'

interface Plan {
  id: PlanId
  nombre: string
  lema: string
  precio: number
  acento: string
  mascota: string
  mascotaAlt: string
  incluyeDe?: string
  destacado?: boolean
  funciones: string[]
}

const planes: Plan[] = [
  {
    id: 'basica',
    nombre: 'Básica',
    lema: 'Para la paletería que va empezando.',
    precio: 199,
    acento: '#10b981',
    mascota: paliMesero,
    mascotaAlt: 'Pali de mesero con su charola',
    funciones: [
      '1 sucursal',
      'Hasta 2 usuarios',
      'Punto de venta para registrar tus ventas',
      'Catálogo de hasta 50 productos',
      'Control de inventario básico',
      'Reporte diario de ventas',
      'Soporte por correo',
    ],
  },
  {
    id: 'doble',
    nombre: 'Doble',
    lema: 'Para negocios que ya despegaron.',
    precio: 399,
    acento: '#3b82f6',
    mascota: paliLentes,
    mascotaAlt: 'Pali con lentes',
    incluyeDe: 'Básica',
    funciones: [
      'Hasta 2 sucursales',
      'Hasta 5 usuarios',
      'Productos ilimitados',
      'Recetario digital vinculado al inventario',
      'Alertas de stock bajo',
      'Reportes semanales y mensuales',
      'Soporte por chat',
    ],
  },
  {
    id: 'doble-especial',
    nombre: 'Doble Especial',
    lema: 'Para crecer con varias sucursales y equipo.',
    precio: 699,
    acento: '#7c3aed',
    mascota: paliPortafolio,
    mascotaAlt: 'Pali ejecutivo con portafolio',
    incluyeDe: 'Doble',
    destacado: true,
    funciones: [
      'Hasta 5 sucursales',
      'Hasta 15 usuarios',
      'Gestión de empleados con roles y permisos',
      'Control de insumos y producción por lotes',
      'Dashboards con gráficas en tiempo real',
      'Exporta reportes a Excel y PDF',
      'Soporte prioritario',
    ],
  },
  {
    id: 'especial-super',
    nombre: 'Especial Super',
    lema: 'Todo iPaletitas, sin límites.',
    precio: 1199,
    acento: '#f59e0b',
    mascota: paliSuper,
    mascotaAlt: 'Pali con lentes, portafolio y charola',
    incluyeDe: 'Doble Especial',
    funciones: [
      'Sucursales y usuarios ilimitados',
      'Pronóstico de demanda por temporada',
      'Programa de lealtad para tus clientes',
      'Facturación electrónica (CFDI) integrada',
      'API e integraciones con otras plataformas',
      'Asesor dedicado y soporte 24/7',
    ],
  },
]

const formatoPrecio = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

/* Plan contratado */
// TODO: obtener y actualizar el plan desde el backend e integrar la pasarela de pago
const CLAVE_PLAN = 'ipaletitas:plan'
const planActual = ref<PlanId>((localStorage.getItem(CLAVE_PLAN) as PlanId | null) ?? 'basica')
watch(planActual, (plan) => localStorage.setItem(CLAVE_PLAN, plan), { immediate: true })

const modalCambio = ref(false)
const planSeleccionado = ref<Plan | null>(null)

const pedirCambio = (plan: Plan) => {
  planSeleccionado.value = plan
  modalCambio.value = true
}

const esMejora = computed(() => {
  if (!planSeleccionado.value) return true
  const indiceActual = planes.findIndex((plan) => plan.id === planActual.value)
  const indiceNuevo = planes.findIndex((plan) => plan.id === planSeleccionado.value?.id)
  return indiceNuevo > indiceActual
})

const aviso = ref('')
let temporizadorAviso: ReturnType<typeof setTimeout> | undefined

const confirmarCambio = () => {
  if (!planSeleccionado.value) return
  planActual.value = planSeleccionado.value.id
  aviso.value = `¡Listo! Ahora tienes el plan ${planSeleccionado.value.nombre}.`
  clearTimeout(temporizadorAviso)
  temporizadorAviso = setTimeout(() => (aviso.value = ''), 3000)
  modalCambio.value = false
}

onUnmounted(() => clearTimeout(temporizadorAviso))
</script>

<template>
  <div class="suscripciones-view">
    <header class="encabezado">
      <h1 class="titulo">Suscripciones</h1>
      <p class="subtitulo">Elige el plan que mejor le queda a tu paletería. Puedes cambiarlo cuando quieras.</p>
    </header>

    <div class="planes">
      <article
        v-for="plan in planes"
        :key="plan.id"
        :class="['plan', `plan-${plan.id}`, { destacado: plan.destacado, actual: plan.id === planActual }]"
        :style="{ '--acento': plan.acento }"
      >
        <img :src="plan.mascota" :alt="plan.mascotaAlt" class="plan-mascota" />

        <div class="plan-tarjeta">
          <span v-if="plan.id === planActual" class="insignia insignia-actual">Tu plan actual</span>
          <span v-else-if="plan.destacado" class="insignia">⭐ Más popular</span>

          <h2 class="plan-nombre">{{ plan.nombre }}</h2>
          <p class="plan-lema">{{ plan.lema }}</p>

          <p class="plan-precio">
            <span class="monto">{{ formatoPrecio.format(plan.precio) }}</span>
            <span class="periodo">MXN / mes</span>
          </p>

          <button
            type="button"
            class="btn-plan"
            :disabled="plan.id === planActual"
            @click="pedirCambio(plan)"
          >
            {{ plan.id === planActual ? 'Plan actual' : 'Elegir plan' }}
          </button>

          <p class="incluye">{{ plan.incluyeDe ? `Todo lo de ${plan.incluyeDe}, más:` : 'Incluye:' }}</p>
          <ul class="funciones">
            <li v-for="funcion in plan.funciones" :key="funcion">{{ funcion }}</li>
          </ul>
        </div>
      </article>
    </div>

    <p class="nota">Precios en pesos mexicanos con IVA incluido. Sin plazos forzosos: cancela cuando quieras.</p>

    <ModalBase :abierto="modalCambio" titulo="Cambiar de plan" ancho="460px" @cerrar="modalCambio = false">
      <div v-if="planSeleccionado" class="confirmacion">
        <img :src="planSeleccionado.mascota" alt="" aria-hidden="true" class="confirmacion-mascota" />
        <p>
          ¿Quieres {{ esMejora ? 'mejorar' : 'cambiar' }} tu suscripción al plan
          <strong>{{ planSeleccionado.nombre }}</strong> por
          <strong>{{ formatoPrecio.format(planSeleccionado.precio) }} MXN al mes</strong>?
        </p>
        <p class="confirmacion-detalle">El cambio se aplica de inmediato y se ajusta en tu próximo cobro.</p>
      </div>
      <template #pie>
        <button type="button" class="btn btn-secundario" @click="modalCambio = false">Cancelar</button>
        <button type="button" class="btn btn-primario" @click="confirmarCambio">Confirmar cambio</button>
      </template>
    </ModalBase>

    <Transition name="aviso">
      <div v-if="aviso" class="aviso" role="status">🎉 {{ aviso }}</div>
    </Transition>
  </div>
</template>

<style scoped>
.suscripciones-view {
  max-width: 1400px;
  margin: 0 auto;
}

.encabezado {
  text-align: center;
  margin-bottom: 1rem;
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
  font-size: 1.05rem;
}

/* Rejilla de planes: el espacio superior es donde se asoma la mascota */
.planes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding-top: 150px;
  align-items: stretch;
}

.plan {
  position: relative;
  display: flex;
}

.plan-mascota {
  position: absolute;
  right: 14px;
  bottom: calc(100% - 46px);
  z-index: 0;
  height: 180px;
  width: auto;
  opacity: 0;
  transform: translateY(75%) scale(0.6) rotate(-8deg);
  transform-origin: bottom center;
  transition:
    transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s ease;
  pointer-events: none;
}

.plan:hover .plan-mascota,
.plan:focus-within .plan-mascota {
  opacity: 1;
  transform: translateY(0) scale(1) rotate(0deg);
}

.plan-tarjeta {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.6rem 1.8rem;
  border-radius: 24px;
  border: 2px solid transparent;
  background: white;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}

.plan:hover .plan-tarjeta,
.plan:focus-within .plan-tarjeta {
  transform: translateY(-6px);
  border-color: var(--acento);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
}

.plan.destacado .plan-tarjeta {
  border-color: var(--acento);
}

.plan-especial-super .plan-tarjeta {
  background: linear-gradient(160deg, #1e293b, #0f172a);
  color: white;
}

.insignia {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.35rem 0.9rem;
  border-radius: 20px;
  background: var(--acento);
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.15);
}

.insignia-actual {
  background: #0f172a;
}

.plan-especial-super .insignia-actual {
  background: var(--acento);
  color: #0f172a;
}

.plan-nombre {
  font-size: 1.6rem;
  font-weight: 900;
  color: var(--acento);
  margin-bottom: 0.3rem;
}

.plan-lema {
  min-height: 2.6em;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.35;
}

.plan-especial-super .plan-lema {
  color: #cbd5e1;
}

.plan-precio {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin: 1.2rem 0;
}

.monto {
  font-size: 2.6rem;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: -1px;
}

.plan-especial-super .monto {
  color: white;
}

.periodo {
  color: #64748b;
  font-size: 0.9rem;
}

.plan-especial-super .periodo {
  color: #94a3b8;
}

.btn-plan {
  padding: 0.85rem 1rem;
  border: 2px solid var(--acento);
  border-radius: 14px;
  background: var(--acento);
  color: white;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: filter 0.2s, transform 0.2s;
}

.btn-plan:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.btn-plan:disabled {
  background: transparent;
  color: var(--acento);
  cursor: default;
}

.plan-especial-super .btn-plan:not(:disabled) {
  color: #0f172a;
}

.incluye {
  margin: 1.5rem 0 0.8rem;
  font-size: 0.85rem;
  font-weight: 800;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.plan-especial-super .incluye {
  color: #e2e8f0;
}

.funciones {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0;
  list-style: none;
}

.funciones li {
  position: relative;
  padding-left: 1.7rem;
  color: #334155;
  font-size: 0.93rem;
  line-height: 1.4;
}

.funciones li::before {
  content: '✓';
  position: absolute;
  left: 0;
  top: -1px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background: var(--acento);
  color: white;
  font-size: 0.7rem;
  font-weight: 900;
}

.plan-especial-super .funciones li {
  color: #e2e8f0;
}

.plan-especial-super .funciones li::before {
  color: #0f172a;
}

.nota {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
}

/* Modal de confirmación */
.confirmacion {
  text-align: center;
  color: #334155;
  line-height: 1.6;
}

.confirmacion-mascota {
  height: 130px;
  margin: 0 auto 0.8rem;
  display: block;
}

.confirmacion-detalle {
  margin-top: 0.6rem;
  font-size: 0.85rem;
  color: #64748b;
}

.btn {
  padding: 0.7rem 1.4rem;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
}

.btn-primario {
  background: linear-gradient(to bottom, #3b82f6, #2563eb);
  color: white;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3);
}

.btn-secundario {
  background: white;
  color: #334155;
  border: 1.5px solid #e2e8f0;
}

.btn-secundario:hover {
  background: #f1f5f9;
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

/* En pantallas táctiles no hay hover: la mascota se muestra siempre */
@media (hover: none) {
  .plan-mascota {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .plan-mascota,
  .plan-tarjeta {
    transition: opacity 0.2s ease;
  }

  .plan:hover .plan-mascota,
  .plan:focus-within .plan-mascota {
    transform: none;
  }
}
</style>
