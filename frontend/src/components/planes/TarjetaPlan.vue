<script setup lang="ts">
import { computed } from 'vue'
import { acentoPlan, precioPlan, type CicloPago, type Plan } from '@/stores/catalogo'
import { precio } from '@/lib/formato'
import { tema } from '@/lib/tema'
import { mascotaPlan } from './mascotas'

const props = withDefaults(
  defineProps<{ plan: Plan; ciclo: CicloPago; actual?: boolean; textoBoton?: string; soloVer?: boolean }>(),
  { actual: false, textoBoton: 'Elegir plan', soloVer: false },
)

defineEmits<{ elegir: [plan: Plan] }>()

const mascota = computed(() => mascotaPlan[props.plan.id])
</script>

<template>
  <article
    :class="['plan', `plan-${plan.id}`, { destacado: plan.destacado, actual }]"
    :style="{ '--acento': acentoPlan(plan, tema === 'oscuro') }"
  >
    <img :src="mascota.src" :alt="mascota.alt" class="plan-mascota" />

    <div class="plan-tarjeta">
      <span v-if="actual" class="insignia insignia-actual">Tu plan actual</span>
      <span v-else-if="plan.destacado" class="insignia">Más popular</span>

      <h2 class="plan-nombre">{{ plan.nombre }}</h2>
      <p class="plan-lema">{{ plan.lema }}</p>

      <p class="plan-precio">
        <span class="monto">{{ precio(precioPlan(plan, ciclo)) }}</span>
        <span class="periodo">MXN / {{ ciclo === 'mensual' ? 'mes' : 'año' }}</span>
      </p>
      <p v-if="ciclo === 'anual'" class="ahorro">Ahorras {{ precio(plan.precioMensual * 2) }} al año</p>

      <button v-if="!soloVer" type="button" class="btn-plan" :disabled="actual" @click="$emit('elegir', plan)">
        {{ actual ? 'Plan actual' : textoBoton }}
      </button>

      <p class="incluye">{{ plan.incluyeDe ? `Todo lo de ${plan.incluyeDe}, más:` : 'Incluye:' }}</p>
      <ul class="funciones">
        <li v-for="funcion in plan.incluye" :key="funcion">{{ funcion }}</li>
      </ul>
    </div>
  </article>
</template>

<style scoped>
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
.plan:focus-within .plan-mascota,
.plan.actual .plan-mascota {
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
  border: 2px solid transparent;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease,
    border-color 0.3s ease;
}

.plan:hover .plan-tarjeta,
.plan:focus-within .plan-tarjeta {
  transform: translateY(-6px);
  border-color: var(--acento);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
}

.plan.destacado .plan-tarjeta,
.plan.actual .plan-tarjeta {
  border-color: var(--acento);
}

.plan-especial-super .plan-tarjeta {
  background: linear-gradient(160deg, #1e293b, #0f172a);
  color: #fff;
}

.insignia {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.35rem 0.9rem;
  border-radius: 20px;
  background: var(--acento);
  color: #fff;
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
  margin: 0 0 0.3rem;
  color: var(--acento);
  font-size: 1.6rem;
  font-weight: 900;
}

.plan-lema {
  min-height: 2.6em;
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.35;
}

.plan-especial-super .plan-lema {
  color: #cbd5e1;
}

.plan-precio {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem;
  margin: 1.2rem 0 0;
}

.monto {
  color: #0f172a;
  font-size: 2.6rem;
  font-weight: 900;
  letter-spacing: -1px;
}

.plan-especial-super .monto {
  color: #fff;
}

.periodo {
  color: #64748b;
  font-size: 0.9rem;
}

.plan-especial-super .periodo {
  color: #94a3b8;
}

.ahorro {
  margin: 0.2rem 0 0;
  color: #10b981;
  font-size: 0.8rem;
  font-weight: 700;
}

.btn-plan {
  margin-top: 1.2rem;
  padding: 0.85rem 1rem;
  border: 2px solid var(--acento);
  border-radius: 14px;
  background: var(--acento);
  color: #fff;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  transition:
    filter 0.2s,
    transform 0.2s;
}

.btn-plan:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.btn-plan:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--acento) 40%, transparent);
  outline-offset: 2px;
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
  color: #334155;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.plan-especial-super .incluye {
  color: #e2e8f0;
}

.funciones {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin: 0;
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
  top: -1px;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  border-radius: 50%;
  background: var(--acento);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 900;
}

.plan-especial-super .funciones li {
  color: #e2e8f0;
}

.plan-especial-super .funciones li::before {
  color: #0f172a;
}

/* Modo oscuro: tarjetas negras (el acento azul de Especial Super llega por acentoPlan) */
html.oscuro .plan-tarjeta {
  background: #0f1522;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
}

html.oscuro .plan-especial-super .plan-tarjeta {
  background: linear-gradient(160deg, #0b1730, #05070c);
}

html.oscuro .monto {
  color: #f1f5f9;
}

html.oscuro .plan-nombre,
html.oscuro .btn-plan:disabled {
  color: color-mix(in srgb, var(--acento) 65%, #fff);
}

html.oscuro .plan-lema,
html.oscuro .periodo {
  color: #8a97ab;
}

html.oscuro .incluye {
  color: #cbd5e1;
}

html.oscuro .funciones li {
  color: #cbd5e1;
}

html.oscuro .insignia-actual {
  background: #2563eb;
  color: #fff;
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
