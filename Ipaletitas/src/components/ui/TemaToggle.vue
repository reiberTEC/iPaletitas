<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Moon, Sun } from '@lucide/vue'
import { alternarTema, tema } from '@/lib/tema'
import { cn } from '@/lib/utils'

defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <button
    type="button"
    :class="
      cn(
        'grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border-0 bg-transparent text-slate-600 transition hover:bg-slate-100 hover:text-slate-900',
        $props.class,
      )
    "
    :aria-label="tema === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    :title="tema === 'oscuro' ? 'Modo claro' : 'Modo oscuro'"
    @click="alternarTema"
  >
    <Sun v-if="tema === 'oscuro'" class="size-5" />
    <Moon v-else class="size-5" />
  </button>
</template>
