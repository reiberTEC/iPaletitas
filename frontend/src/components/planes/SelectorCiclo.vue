<script setup lang="ts">
import type { CicloPago } from '@/stores/catalogo'

const ciclo = defineModel<CicloPago>({ required: true })

const ciclos: { id: CicloPago; etiqueta: string; nota?: string }[] = [
  { id: 'mensual', etiqueta: 'Mensual' },
  { id: 'anual', etiqueta: 'Anual', nota: '2 meses gratis' },
]
</script>

<template>
  <div class="ciclo inline-flex items-center gap-1 rounded-md p-1" role="group" aria-label="Forma de pago">
    <button
      v-for="op in ciclos"
      :key="op.id"
      type="button"
      :aria-pressed="ciclo === op.id"
      :class="[
        'ip-boton ciclo-op flex min-h-11 cursor-pointer items-center gap-2 rounded-[4px] border-0 px-4 text-base font-semibold',
        ciclo === op.id ? 'bg-blue-600 text-white' : 'bg-transparent text-slate-700 hover:text-blue-700',
      ]"
      @click="ciclo = op.id"
    >
      {{ op.etiqueta }}
      <span v-if="op.nota" :class="['text-sm font-medium', ciclo === op.id ? 'text-white' : 'text-emerald-800']">
        {{ op.nota }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.ciclo-op {
  transition: transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease;
}

.ciclo-op:active {
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .ciclo-op,
  .ciclo-op:active {
    transition: background-color 140ms ease;
    transform: none;
  }
}

.ciclo {
  background: #e6e9ef;
}

html.oscuro .ciclo {
  background: #182132;
}
</style>
