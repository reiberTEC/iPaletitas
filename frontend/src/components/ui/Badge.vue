<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'blue' | 'gold' | 'outline' | 'aviso' | 'peligro' | 'ok'
    class?: HTMLAttributes['class']
  }>(),
  { variant: 'default' },
)

const classes = computed(() =>
  cn(
    'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap',
    {
      default: 'bg-slate-100 text-slate-700',
      blue: 'bg-blue-50 text-blue-700',
      gold: 'bg-amber-100 text-amber-800',
      outline: 'border border-white/20 bg-white/10 text-white',
      aviso: 'bg-orange-50 text-orange-700',
      peligro: 'bg-rose-50 text-rose-700',
      ok: 'bg-emerald-50 text-emerald-700',
    }[props.variant],
    props.class,
  ),
)
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
