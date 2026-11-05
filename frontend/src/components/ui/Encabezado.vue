<script setup lang="ts">
defineProps<{ titulo: string; descripcion?: string }>()
</script>

<template>
  <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div class="min-w-0">
      <h1 class="font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-[1.75rem]">{{ titulo }}</h1>
      <p v-if="descripcion" class="mt-2 max-w-[65ch] text-slate-500">{{ descripcion }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <slot />
    </div>
  </div>
</template>
