<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  Apple,
  CakeSlice,
  Candy,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Fish,
  IceCreamCone,
  Milk,
  Package,
  Pizza,
  Salad,
  Sandwich,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Soup,
  UtensilsCrossed,
} from '@lucide/vue'
import PaletaIcon from './PaletaIcon.vue'
import { esIconoProducto, iconoPorCategoria, type IconoProductoId } from '@/lib/iconosProducto'
import { estado } from '@/stores/negocio'

const props = withDefaults(
  defineProps<{
    icono?: string | null
    categoria?: string
    size?: number
    /** Vista previa forzada (selector / Mi marca). */
    forzar?: IconoProductoId
    animado?: boolean
  }>(),
  { categoria: '', size: 32, animado: true },
)

const id = computed<IconoProductoId>(() => {
  if (props.forzar) return props.forzar
  if (esIconoProducto(props.icono)) return props.icono
  if ((estado.marca.iconos ?? 'paleta') === 'genericos') return iconoPorCategoria(props.categoria)
  return 'paleta'
})

const esPaleta = computed(() => id.value.startsWith('paleta'))

const variantePaleta = computed(() => {
  if (id.value === 'paleta-oro') return 'gold' as const
  if (id.value === 'paleta-verde') return 'green' as const
  return 'blue' as const
})

const LUCIDE: Record<string, Component> = {
  helado: IceCreamCone,
  cafe: Coffee,
  bebida: CupSoda,
  comida: UtensilsCrossed,
  pizza: Pizza,
  sandwich: Sandwich,
  galleta: Cookie,
  pastel: CakeSlice,
  dulce: Candy,
  fruta: Apple,
  ensalada: Salad,
  sopa: Soup,
  pan: Croissant,
  pescado: Fish,
  leche: Milk,
  caja: Package,
  carrito: ShoppingBasket,
  ropa: Shirt,
  tech: Smartphone,
}

const Lucide = computed(() => LUCIDE[id.value] ?? Package)
</script>

<template>
  <span
    :class="['icono-producto', animado && !esPaleta && 'icono-producto--vivo']"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  >
    <PaletaIcon v-if="esPaleta" :variant="variantePaleta" :size="size" />
    <component :is="Lucide" v-else class="icono-lucide" :size="size" :stroke-width="2.25" />
  </span>
</template>

<style scoped>
.icono-producto {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--marca-600, #2563eb);
  transform-origin: center bottom;
}

.icono-producto--vivo {
  animation: icono-flotar 2.8s ease-in-out infinite;
}

.icono-producto--vivo:hover {
  animation: none;
  transform: translateY(-2px) scale(1.08) rotate(-6deg);
  transition: transform 180ms ease;
}

.icono-lucide {
  display: block;
}

@keyframes icono-flotar {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .icono-producto--vivo {
    animation: none;
  }
  .icono-producto--vivo:hover {
    transform: none;
  }
}
</style>
