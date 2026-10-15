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
    'ip-boton inline-flex appearance-none items-center justify-center gap-2 rounded-xl border-0 font-semibold whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
    {
      default: 'bg-blue-600 text-white hover:bg-blue-700',
      outline:
        'bg-white text-slate-800 ring-1 ring-inset ring-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:ring-blue-200',
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
