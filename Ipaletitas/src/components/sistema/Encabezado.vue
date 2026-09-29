<script setup lang="ts">
defineProps<{ titulo: string; descripcion?: string }>()
</script>

<template>
  <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{{ titulo }}</h1>
      <p v-if="descripcion" class="mt-1.5 text-slate-500">{{ descripcion }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <slot />
    </div>
  </div>
</template>
