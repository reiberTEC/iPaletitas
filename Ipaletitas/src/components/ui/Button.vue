<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'outline' | 'ghost' | 'secondary'
    size?: 'default' | 'sm' | 'lg'
    class?: HTMLAttributes['class']
    type?: 'button' | 'submit'
  }>(),
  {
    variant: 'default',
    size: 'default',
    type: 'button',
  },
)

const classes = computed(() =>
  cn(
    'inline-flex appearance-none items-center justify-center gap-2 rounded-xl border-0 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
    {
      default:
        'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25 hover:-translate-y-0.5 hover:shadow-blue-600/40',
      outline:
        'border border-slate-200 bg-white/80 text-slate-800 backdrop-blur hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-blue-700',
      secondary: 'bg-amber-300 text-slate-900 hover:bg-amber-200',
    }[props.variant],
    {
      default: 'h-10 px-4 text-sm',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-12 px-6 text-base',
    }[props.size],
    props.class,
  ),
)
</script>

<template>
  <button :type="type" :class="classes">
    <slot />
  </button>
</template>
