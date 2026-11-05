<script setup lang="ts">
import { computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide',
  {
    variants: {
      variant: {
        default: 'border-blue-200/80 bg-blue-50 text-[#1D4ED8]',
        cream: 'border-amber-200 bg-[#ffecd1] text-amber-900',
        glass: 'border-white/20 bg-white/10 text-white backdrop-blur-md',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const props = defineProps<{
  variant?: VariantProps<typeof badgeVariants>['variant']
  class?: string
}>()

const classes = computed(() => cn(badgeVariants({ variant: props.variant }), props.class))
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
