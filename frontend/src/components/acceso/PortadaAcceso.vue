<script setup lang="ts">
import PaletaIcon from '../icons/PaletaIcon.vue'
import pina from '@/assets/Img/Piña.jpg'

defineProps<{ frase: string; mascota: string; mascotaAlt: string }>()
defineEmits(['irHome'])
</script>

<template>
  <aside class="portada">
    <img :src="pina" alt="" class="portada-foto" />

    <button type="button" class="portada-marca ip-boton" @click="$emit('irHome')">
      <span class="ip-picto size-11"><PaletaIcon variant="white" :size="26" /></span>
      <span class="font-display">iPaletitas</span>
      <span class="sr-only">, volver al inicio</span>
    </button>

    <div class="portada-letrero">
      <p class="font-display">{{ frase }}</p>
      <img :src="mascota" :alt="mascotaAlt" class="portada-pali" width="160" height="200" />
    </div>
  </aside>
</template>

<style scoped>
.portada {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 11rem;
  padding: max(1.25rem, env(safe-area-inset-top)) 1.25rem 1.25rem max(1.25rem, env(safe-area-inset-left));
  overflow: hidden;
  background: var(--marca-900);
}

.portada-foto {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: right center;
}

.portada-marca {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  align-self: flex-start;
  min-height: 2.75rem;
  padding: 0.25rem 1rem 0.25rem 0.25rem;
  border: 0;
  border-radius: 0.875rem;
  background: #fff;
  color: #0f172a;
  font: inherit;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  cursor: pointer;
}

.portada-marca:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

/* Letrero de estación: bloque plano de la línea sobre la foto, sin velos ni degradados */
.portada-letrero {
  position: relative;
  display: none;
  align-items: flex-end;
  gap: 1rem;
  max-width: 34rem;
  padding: 1.75rem 1.75rem 0;
  border-radius: 1.25rem;
  background: var(--marca-600);
  color: #fff;
}

.portada-letrero p {
  flex: 1;
  padding-bottom: 1.75rem;
  font-size: clamp(1.75rem, 2.6vw, 2.5rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
  text-wrap: balance;
}

.portada-pali {
  flex-shrink: 0;
  width: 8.5rem;
  height: auto;
}

@media (hover: hover) and (pointer: fine) {
  .portada-marca:hover {
    background: var(--marca-50);
  }
}

@media (min-width: 851px) {
  .portada {
    flex: 1;
    min-height: 100svh;
    padding: max(2.5rem, env(safe-area-inset-top)) 2.5rem 2.5rem max(2.5rem, env(safe-area-inset-left));
  }

  .portada-letrero {
    display: flex;
  }
}
</style>
