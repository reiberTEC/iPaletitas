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
    /** Cada plan es más alto que el anterior, como barras de una gráfica. */
    escalonado?: boolean
  }>(),
  { actual: false, textoBoton: 'Elegir plan', soloVer: false, escalonado: false },
)

defineEmits<{ elegir: [plan: Plan] }>()

const mascota = computed(() => mascotaPlan[props.plan.id])
const escalon = computed(() => Math.max(0, PLANES.findIndex((p) => p.id === props.plan.id)))
</script>

<template>
  <article
    :class="['plan', `plan-${plan.id}`, { actual, escalonado }]"
    :style="{ '--acento': acentoPlan(plan, tema === 'oscuro'), '--escalon': escalon }"
  >
    <img :src="mascota.src" :alt="mascota.alt" class="plan-mascota" loading="lazy" width="120" height="150" />

    <div class="plan-tarjeta">
      <h3 class="plan-nombre font-display">{{ plan.nombre }}</h3>

      <p class="plan-precio">
        <span class="monto font-display">{{ precio(precioPlan(plan, ciclo)) }}</span>
        <span class="periodo">al {{ ciclo === 'mensual' ? 'mes' : 'año' }}</span>
      </p>
      <p v-if="ciclo === 'anual'" class="ahorro">Ahorras {{ precio(plan.precioMensual * 2) }} al año</p>
      <p class="plan-lema">{{ plan.lema }}</p>
      <p v-if="actual" class="plan-nota">Es tu plan actual</p>
      <p v-else-if="plan.destacado" class="plan-nota">Nuestra recomendación</p>

      <p class="incluye">{{ plan.incluyeDe ? `Todo lo de ${plan.incluyeDe}, más:` : 'Incluye:' }}</p>
      <ul class="estaciones">
        <li v-for="funcion in plan.incluye" :key="funcion">{{ funcion }}</li>
      </ul>

      <button v-if="!soloVer" type="button" class="plan-boton" :disabled="actual" @click="$emit('elegir', plan)">
        {{ actual ? 'Plan actual' : textoBoton }}
        <ArrowRight v-if="!actual" class="size-5" aria-hidden="true" />
      </button>
    </div>
  </article>
</template>

<style scoped>
/* Cada plan es una línea del metro: su color corre por la lista y cada función es una estación. */
.plan {
  --tinta-plan: color-mix(in oklab, var(--acento) 58%, #000);
  position: relative;
  display: flex;
  flex-direction: column;
  padding-top: 7.5rem;
}

.plan-mascota {
  position: absolute;
  top: 0.4rem;
  right: 1.25rem;
  width: auto;
  height: 7.4rem;
  pointer-events: none;
  transition: transform 220ms var(--ease-out);
  transform-origin: bottom center;
}

.plan-tarjeta {
  display: flex;
  flex: 1;
  flex-direction: column;
  border-radius: 6px;
  background: color-mix(in oklab, var(--acento) 13%, #fff);
  color: #0f172a;
  overflow: hidden;
}

.plan-tarjeta > :not(.plan-boton) {
  margin-inline: 1.6rem;
}

.plan-nombre {
  margin-top: 1.6rem;
  color: var(--tinta-plan);
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.1;
}

.plan-nota {
  margin-top: 0.35rem;
  color: var(--tinta-plan);
  font-size: 1rem;
  font-weight: 700;
}

.plan-lema {
  margin-top: 0.75rem;
  color: #334155;
  font-size: 1rem;
  line-height: 1.45;
}

.plan-precio {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 1.1rem;
}

.monto {
  font-size: clamp(2.6rem, 3.6vw, 3.25rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
  line-height: 1;
}

.periodo {
  color: #334155;
  font-size: 1rem;
}

.ahorro {
  margin-top: 0.4rem;
  color: #047857;
  font-size: 1rem;
  font-weight: 700;
}

.incluye {
  margin-top: 1.6rem;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 700;
}

.estaciones {
  position: relative;
  display: grid;
  gap: 0.7rem;
  margin-top: 0.9rem;
  margin-bottom: 1.8rem;
  padding: 0;
  list-style: none;
}

.estaciones::before {
  content: '';
  position: absolute;
  top: 0.55rem;
  bottom: 0.55rem;
  left: calc(0.55rem - 2px);
  width: 4px;
  border-radius: 2px;
  background: var(--acento);
}

.estaciones li {
  position: relative;
  padding-left: 1.85rem;
  color: #1e293b;
  font-size: 1rem;
  line-height: 1.4;
}

.estaciones li::before {
  content: '';
  position: absolute;
  top: 0.2rem;
  left: 0;
  width: 1.1rem;
  height: 1.1rem;
  border: 3px solid var(--acento);
  border-radius: 50%;
  background: #fff;
}

.plan-boton {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 4rem;
  margin-top: auto;
  padding: 0 1.6rem;
  border: 0;
  background: var(--tinta-plan);
  color: #fff;
  font: inherit;
  font-size: 1.125rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    transform 160ms var(--ease-out);
}

.plan-boton:active:not(:disabled) {
  transform: scale(0.98);
}

.plan-boton:focus-visible {
  outline: 3px solid var(--acento);
  outline-offset: -3px;
}

.plan-boton:disabled {
  background: color-mix(in oklab, var(--acento) 24%, #fff);
  color: var(--tinta-plan);
  cursor: default;
}

.plan-boton :deep(svg) {
  transition: transform 200ms var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .plan-boton:hover:not(:disabled) {
    background: color-mix(in oklab, var(--acento) 48%, #000);
  }

  .plan-boton:hover:not(:disabled) :deep(svg) {
    transform: translateX(4px);
  }

  .plan:hover .plan-mascota {
    transform: translateY(-6px) rotate(-3deg);
  }
}

/* Escalones: de la línea Básica a Especial Super cada tarjeta crece como una barra. */
@media (min-width: 1280px) {
  .plan.escalonado .plan-tarjeta {
    min-height: calc(36rem + var(--escalon) * 3.25rem);
  }
}

/* Modo oscuro */
html.oscuro .plan {
  --tinta-plan: color-mix(in oklab, var(--acento) 70%, #fff);
}

html.oscuro .plan-tarjeta {
  background: color-mix(in oklab, var(--acento) 14%, #0f1522);
  color: #f1f5f9;
}

html.oscuro .plan-lema,
html.oscuro .periodo,
html.oscuro .estaciones li {
  color: #cbd5e1;
}

html.oscuro .incluye {
  color: #f1f5f9;
}

html.oscuro .ahorro {
  color: #34d399;
}

html.oscuro .estaciones li::before {
  background: #0f1522;
}

html.oscuro .plan-boton {
  background: color-mix(in oklab, var(--acento) 55%, #000);
}

html.oscuro .plan-boton:disabled {
  background: color-mix(in oklab, var(--acento) 22%, #0f1522);
  color: var(--tinta-plan);
}

@media (hover: hover) and (pointer: fine) {
  html.oscuro .plan-boton:hover:not(:disabled) {
    background: color-mix(in oklab, var(--acento) 45%, #000);
  }
}

@media (prefers-reduced-motion: reduce) {
  .plan-mascota,
  .plan-boton :deep(svg) {
    transition: none;
  }
}
</style>
