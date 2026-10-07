<script setup lang="ts">
import { computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(37,99,235,0.35)]',
        outline:
          'border border-blue-200 bg-white/80 text-[#2563EB] backdrop-blur-sm hover:bg-blue-50',
        ghost: 'text-slate-600 hover:bg-slate-100/80 hover:text-[#2563EB]',
        cream:
          'bg-[#ffecd1] text-slate-900 hover:-translate-y-0.5 hover:bg-[#ffe3b8]',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type Props = {
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
  class?: string
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'button',
})

const classes = computed(() =>
  cn(buttonVariants({ variant: props.variant, size: props.size }), props.class),
)
</script>

<template>
  <button :type="type" :class="classes">
    <slot />
  </button>
</template>
