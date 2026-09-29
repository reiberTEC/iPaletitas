<script setup lang="ts">
import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'vue'

defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="
      cn(
        'rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm shadow-slate-900/5 backdrop-blur-xl',
        $props.class,
      )
    "
  >
    <slot />
  </div>
</template>
