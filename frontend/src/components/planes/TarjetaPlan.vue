<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight } from '@lucide/vue'
import { PLANES, acentoPlan, precioPlan, type CicloPago, type Plan } from '@/stores/catalogo'
import { precio } from '@/lib/formato'
import { tema } from '@/lib/tema'
import { mascotaPlan } from './mascotas'

const props = withDefaults(
  defineProps<{
    plan: Plan
    ciclo: CicloPago
    actual?: boolean
    textoBoton?: string
    soloVer?: boolean
    /** Conservado para quien ya lo pasa; la jerarquía ya no depende de la altura. */
    escalonado?: boolean
  }>(),
  { actual: false, textoBoton: 'Elegir plan', soloVer: false, escalonado: false },
)

defineEmits<{ elegir: [plan: Plan] }>()

const mascota = computed(() => mascotaPlan[props.plan.id])
const escalon = computed(() => Math.max(0, PLANES.findIndex((p) => p.id === props.plan.id)))

const cupos = computed(() => [
  { etiqueta: 'Sucursales', valor: props.plan.limites.sucursales.toLocaleString('es-MX') },
  { etiqueta: 'Usuarios', valor: props.plan.limites.usuarios.toLocaleString('es-MX') },
  { etiqueta: 'Productos', valor: props.plan.limites.productos.toLocaleString('es-MX') },
  { etiqueta: 'Meses de historial', valor: props.plan.limites.historialMeses.toLocaleString('es-MX') },
])

const extras = computed(() =>
  props.plan.incluye.filter((item) => !/sucursal|usuario|producto|historial/i.test(item)),
)
</script>

<template>
  <article
    :class="['plan', `plan-${plan.id}`, { actual, destacado: plan.destacado, escalonado }]"
    :style="{ '--acento': acentoPlan(plan, tema === 'oscuro'), '--escalon': escalon }"
  >
    <div class="plan-tarjeta">
      <header class="plan-cabeza">
        <div>
          <h3 class="plan-nombre font-display">{{ plan.nombre }}</h3>
          <p v-if="actual" class="plan-nota">Es tu plan actual</p>
          <p v-else-if="plan.destacado" class="plan-nota">Nuestra recomendación</p>
        </div>
        <img :src="mascota.src" :alt="mascota.alt" class="plan-mascota" width="96" height="120" />
      </header>

      <p :key="ciclo" class="plan-precio">
        <span class="monto font-display">{{ precio(precioPlan(plan, ciclo)) }}</span>
        <span class="periodo">al {{ ciclo === 'mensual' ? 'mes' : 'año' }}</span>
      </p>
      <p v-if="ciclo === 'anual'" class="ahorro">Ahorras {{ precio(plan.precioMensual * 2) }} al año</p>
      <p class="plan-lema">{{ plan.lema }}</p>

      <dl class="cupos">
        <div v-for="cupo in cupos" :key="cupo.etiqueta">
          <dd class="font-display">{{ cupo.valor }}</dd>
          <dt>{{ cupo.etiqueta }}</dt>
        </div>
      </dl>

      <p v-if="extras.length" class="incluye">
        {{ plan.incluyeDe ? `Todo lo de ${plan.incluyeDe}, más:` : 'Incluye:' }}
      </p>
      <ul v-if="extras.length" class="estaciones">
        <li v-for="funcion in extras" :key="funcion">{{ funcion }}</li>
      </ul>

      <button v-if="!soloVer" type="button" class="plan-boton" :disabled="actual" @click="$emit('elegir', plan)">
        {{ actual ? 'Plan actual' : textoBoton }}
        <ArrowRight v-if="!actual" class="size-5" aria-hidden="true" />
      </button>
    </div>
  </article>
</template>

<style scoped>
.plan {
  --tinta-plan: color-mix(in oklab, var(--acento) 62%, #000);
  --papel: #fff;
  --tinta: #0f172a;
  --tinta-suave: #1e293b;
  display: flex;
  min-width: 0;
}

.plan-tarjeta {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  border-radius: 6px;
  background: var(--papel);
  color: var(--tinta);
  overflow: hidden;
}

.plan-tarjeta::before {
  content: '';
  display: block;
  height: 0.55rem;
  background: var(--acento);
}

.plan-cabeza,
.plan-precio,
.ahorro,
.plan-lema,
.cupos,
.incluye,
.estaciones {
  margin-inline: 1.35rem;
}

.plan-cabeza {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.plan-nombre {
  font-size: 1.35rem;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.05;
}

.plan-nota {
  margin-top: 0.4rem;
  color: var(--tinta-plan);
  font-size: 1rem;
  font-weight: 650;
  line-height: 1.3;
}

.plan-mascota {
  width: auto;
  height: 4.6rem;
  flex: none;
  object-fit: contain;
  transform-origin: bottom center;
  transition: transform 180ms cubic-bezier(0.23, 1, 0.32, 1);
}

.plan-precio {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.45rem 0.6rem;
  margin-top: 1.35rem;
}

.monto {
  font-size: clamp(2.4rem, 3vw, 3rem);
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  line-height: 0.9;
}

.periodo,
.plan-lema,
.estaciones li,
.cupos dt {
  color: var(--tinta-suave);
}

.periodo {
  font-size: 1rem;
}

.ahorro {
  margin-top: 0.55rem;
  color: #047857;
  font-size: 1rem;
  font-weight: 650;
}

.plan-lema {
  margin-top: 0.85rem;
  font-size: 1rem;
  line-height: 1.45;
}

.cupos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 0.75rem;
  margin-top: 1.5rem;
  margin-bottom: 0.4rem;
}

.cupos dd {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  line-height: 1;
}

.cupos dt {
  margin-top: 0.3rem;
  font-size: 0.95rem;
  line-height: 1.25;
}

.incluye {
  margin-top: 1.35rem;
  font-size: 1rem;
  font-weight: 650;
}

.estaciones {
  position: relative;
  display: grid;
  gap: 0.65rem;
  margin-top: 0.8rem;
  margin-bottom: 1.5rem;
  padding: 0;
  list-style: none;
}

.estaciones::before {
  content: '';
  position: absolute;
  top: 0.45rem;
  bottom: 0.45rem;
  left: 0.42rem;
  width: 0.28rem;
  border-radius: 999px;
  background: var(--acento);
}

.estaciones li {
  position: relative;
  padding-left: 1.7rem;
  font-size: 1rem;
  line-height: 1.35;
}

.estaciones li::before {
  content: '';
  position: absolute;
  top: 0.15rem;
  left: 0;
  width: 1rem;
  height: 1rem;
  border: 3px solid var(--acento);
  border-radius: 50%;
  background: var(--papel);
}

.plan-boton {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 3.75rem;
  margin-top: auto;
  padding: 0 1.35rem;
  border: 0;
  background: var(--tinta-plan);
  color: #fff;
  font: inherit;
  font-size: 1.05rem;
  font-weight: 650;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 140ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 140ms cubic-bezier(0.23, 1, 0.32, 1);
}

.plan-boton:active:not(:disabled) {
  transform: scale(0.97);
}

.plan-boton:focus-visible {
  outline: 3px solid var(--acento);
  outline-offset: -3px;
}

.plan-boton:disabled {
  background: color-mix(in oklab, var(--acento) 18%, var(--papel));
  color: var(--tinta-plan);
  cursor: default;
}

.plan-boton :deep(svg) {
  transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

.plan.destacado {
  --papel: color-mix(in oklab, var(--acento) 74%, #000);
  --tinta: #fff;
  --tinta-suave: #fff;
  --tinta-plan: #fff;
}

.plan.destacado .plan-tarjeta::before {
  background: color-mix(in oklab, #000 22%, var(--acento));
}

.plan.destacado .ahorro {
  color: #fff;
}

.plan.destacado .estaciones::before {
  background: #fff;
}

.plan.destacado .estaciones li::before {
  border-color: #fff;
  background: var(--acento);
}

.plan.destacado .plan-boton {
  background: #fff;
  color: color-mix(in oklab, var(--acento) 70%, #000);
}

.plan.destacado .plan-boton:disabled {
  background: color-mix(in oklab, #fff 72%, var(--acento));
  color: color-mix(in oklab, var(--acento) 70%, #000);
}

@media (hover: hover) and (pointer: fine) {
  .plan-boton:hover:not(:disabled) {
    background: color-mix(in oklab, var(--acento) 42%, #000);
  }

  .plan.destacado .plan-boton:hover:not(:disabled) {
    background: color-mix(in oklab, #fff 88%, var(--acento));
  }

  .plan-boton:hover:not(:disabled) :deep(svg) {
    transform: translateX(3px);
  }

  .plan:hover .plan-mascota {
    transform: translateY(-4px);
  }
}

@media (prefers-reduced-motion: no-preference) {
  .plan-precio {
    opacity: 1;
    filter: blur(0);
    transition:
      opacity 180ms cubic-bezier(0.23, 1, 0.32, 1),
      filter 180ms cubic-bezier(0.23, 1, 0.32, 1);

    @starting-style {
      opacity: 0;
      filter: blur(2px);
    }
  }
}

html.oscuro .plan:not(.destacado) {
  --papel: #131a26;
  --tinta: #f8fafc;
  --tinta-suave: #e2e8f0;
  --tinta-plan: color-mix(in oklab, var(--acento) 72%, #fff);
}

html.oscuro .plan:not(.destacado) .ahorro {
  color: #6ee7b7;
}

html.oscuro .plan:not(.destacado) .plan-boton:disabled {
  background: color-mix(in oklab, var(--acento) 22%, #131a26);
}
</style>
