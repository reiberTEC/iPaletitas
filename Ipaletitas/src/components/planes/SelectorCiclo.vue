<script setup lang="ts">
import type { CicloPago } from '@/stores/catalogo'

const ciclo = defineModel<CicloPago>({ required: true })

const ciclos: { id: CicloPago; etiqueta: string }[] = [
  { id: 'mensual', etiqueta: 'Mensual' },
  { id: 'anual', etiqueta: 'Anual' },
]
</script>

<template>
  <div class="inline-flex items-center gap-1 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
    <button
      v-for="op in ciclos"
      :key="op.id"
      type="button"
      :aria-pressed="ciclo === op.id"
      :class="[
        'flex cursor-pointer items-center gap-2 rounded-xl border-0 px-5 py-2 text-sm font-semibold transition',
        ciclo === op.id ? 'bg-blue-600 text-white shadow' : 'bg-transparent text-slate-600 hover:text-blue-700',
      ]"
      @click="ciclo = op.id"
    >
      {{ op.etiqueta }}
      <span
        v-if="op.id === 'anual'"
        :class="[
          'rounded-full px-2 py-0.5 text-[11px]',
          ciclo === 'anual' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700',
        ]"
      >
        2 meses gratis
      </span>
    </button>
  </div>
</template>
