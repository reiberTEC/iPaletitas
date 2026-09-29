<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'blue' | 'gold' | 'outline'
    class?: HTMLAttributes['class']
  }>(),
  { variant: 'default' },
)

const classes = computed(() =>
  cn(
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
    {
      default: 'bg-slate-100 text-slate-700',
      blue: 'bg-blue-600/10 text-blue-700 ring-1 ring-inset ring-blue-600/15',
      gold: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-300/60',
      outline: 'border border-white/20 bg-white/10 text-white',
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
