<script setup lang="ts">
import { ArrowLeft, Check } from '@lucide/vue'
import PaletaIcon from './icons/PaletaIcon.vue'
import UiButton from './ui/Button.vue'
import TemaToggle from './ui/TemaToggle.vue'

defineProps<{ paso: 1 | 2 | 3; sinVolver?: boolean }>()
defineEmits(['volver'])

const pasos = ['Crear cuenta', 'Suscripción', 'Pago']
</script>

<template>
  <header class="flujo">
    <div class="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center justify-between gap-6 px-5 sm:px-6">
      <div class="flex items-center gap-2.5">
        <span class="ip-picto size-10"><PaletaIcon variant="white" :size="24" /></span>
        <span class="font-display text-lg font-extrabold tracking-tight text-slate-900">iPaletitas</span>
      </div>

      <!-- Los tres pasos son estaciones de una misma línea -->
      <ol class="estaciones" aria-label="Progreso">
        <li
          v-for="(nombre, i) in pasos"
          :key="nombre"
          :class="['estacion', { hecha: i + 1 < paso, actual: i + 1 === paso }]"
          :aria-current="i + 1 === paso ? 'step' : undefined"
        >
          <span class="estacion-punto">
            <Check v-if="i + 1 < paso" class="size-3.5" :stroke-width="3" />
          </span>
          <span class="estacion-nombre">{{ nombre }}</span>
        </li>
      </ol>

      <div class="flex items-center gap-2">
        <TemaToggle />
        <UiButton v-if="!sinVolver" variant="ghost" class="h-11 text-base" @click="$emit('volver')">
          <ArrowLeft class="size-4" />
          Volver
        </UiButton>
      </div>
    </div>

    <p class="flujo-movil">
      Paso {{ paso }} de {{ pasos.length }} · <strong>{{ pasos[paso - 1] }}</strong>
    </p>
  </header>
</template>

<style scoped>
.flujo {
  position: sticky;
  top: 0;
  z-index: 30;
  padding: env(safe-area-inset-top) env(safe-area-inset-right) 0 env(safe-area-inset-left);
  background: #fff;
}

.estaciones {
  display: none;
  align-items: flex-start;
  margin: 0;
  padding: 0;
  list-style: none;
}

.estacion {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  width: 8.5rem;
}

/* Tramo de vía hacia la estación anterior */
.estacion + .estacion::before {
  content: '';
  position: absolute;
  top: 0.5625rem;
  right: 50%;
  width: 100%;
  height: 4px;
  background: #d9dee6;
}

.estacion.hecha + .estacion::before {
  background: var(--marca-600);
}

.estacion-punto {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 1.375rem;
  height: 1.375rem;
  border: 4px solid #d9dee6;
  border-radius: 999px;
  background: #fff;
  color: #fff;
}

.hecha .estacion-punto {
  border-color: var(--marca-600);
  background: var(--marca-600);
}

.actual .estacion-punto {
  border-color: var(--marca-600);
}

.estacion-nombre {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.actual .estacion-nombre {
  color: #0f172a;
  font-weight: 800;
}

.flujo-movil {
  margin: 0;
  padding: 0 1.25rem 0.75rem;
  color: #475569;
  font-size: 0.9375rem;
}

.flujo-movil strong {
  color: #0f172a;
}

@media (min-width: 768px) {
  .estaciones {
    display: flex;
  }

  .flujo-movil {
    display: none;
  }
}
</style>
