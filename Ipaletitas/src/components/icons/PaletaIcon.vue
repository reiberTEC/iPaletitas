<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'blue' | 'gold' | 'white' | 'green'
    size?: number
  }>(),
  {
    variant: 'blue',
    size: 32,
  },
)

const fills: Record<'blue' | 'gold' | 'white' | 'green', { stick: string; body: string; shine: string }> = {
  blue: { stick: '#FCD34D', body: '#2563EB', shine: 'rgba(255,255,255,0.35)' },
  gold: { stick: '#B45309', body: '#FCD34D', shine: 'rgba(255,255,255,0.55)' },
  white: { stick: '#FCD34D', body: '#FFFFFF', shine: 'rgba(37,99,235,0.18)' },
  green: { stick: '#FCD34D', body: '#10B981', shine: 'rgba(255,255,255,0.35)' },
}
</script>

<template>
  <svg
    class="paleta-animada"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M10.5 17H13.5V21C13.5 21.5523 13.0523 22 12.5 22H11.5C10.9477 22 10.5 21.5523 10.5 21V17Z"
      :fill="fills[variant].stick"
    />
    <path
      d="M7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V16C17 16.5523 16.5523 17 16 17H8C7.44772 17 7 16.5523 7 16V8Z"
      :fill="fills[variant].shine"
    />
    <path
      d="M8 8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V16C16 16.5523 15.5523 17 15 17H9C8.44772 17 8 16.5523 8 16V8Z"
      :fill="fills[variant].body"
    />
    <rect x="10.5" y="6" width="3" height="8" rx="1.5" fill="white" fill-opacity="0.35" />
  </svg>
</template>

<style scoped>
.paleta-animada {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center;
  animation: flotar 3s ease-in-out infinite;
}

.paleta-animada:hover {
  transform: rotate(-15deg) scale(1.15);
  animation: none;
}

@keyframes flotar {
  0% {
    transform: scale(1) translateY(0);
  }
  50% {
    transform: scale(1.05) translateY(-4px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .paleta-animada {
    animation: none;
  }
}
</style>
