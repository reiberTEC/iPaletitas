<script setup lang="ts">
import { onUnmounted, ref } from 'vue'
import billete from '../assets/Img/billete-pali.webp'

type Fase = 'oculto' | 'entrando' | 'cubriendo' | 'saliendo'

const DURACION_MS = 700

const fase = ref<Fase>('oculto')
let terminarFase: (() => void) | null = null
let respaldo: ReturnType<typeof setTimeout> | undefined

const precarga = new Image()
precarga.src = billete

const alTerminarAnimacion = () => {
  clearTimeout(respaldo)
  const terminar = terminarFase
  terminarFase = null
  terminar?.()
}

// animationend no se dispara si la pestaña deja de pintar; el temporizador evita quedarse atorado
const animar = (nueva: Fase) =>
  new Promise<void>((resolve) => {
    terminarFase = resolve
    fase.value = nueva
    respaldo = setTimeout(alTerminarAnimacion, DURACION_MS + 300)
  })

const cubrir = async () => {
  await precarga.decode().catch(() => undefined)
  await animar('entrando')
  fase.value = 'cubriendo'
}

const descubrir = async () => {
  await animar('saliendo')
  fase.value = 'oculto'
}

onUnmounted(() => clearTimeout(respaldo))

defineExpose({ cubrir, descubrir })
</script>

<template>
  <Teleport to="body">
    <div v-if="fase !== 'oculto'" class="escenario" aria-hidden="true">
      <img
        :src="billete"
        alt=""
        :class="['billete', fase]"
        :style="{ '--duracion': `${DURACION_MS}ms` }"
        @animationend.self="alTerminarAnimacion"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.escenario {
  position: fixed;
  inset: 0;
  z-index: 2000;
  overflow: hidden;
  cursor: progress;
}

/* Más grande que la pantalla para que las esquinas redondeadas del billete queden fuera */
.billete {
  position: absolute;
  top: 50%;
  left: 0;
  width: max(115vw, calc(115vh * 16 / 9));
  aspect-ratio: 16 / 9;
  max-width: none;
  filter: drop-shadow(0 30px 40px rgba(15, 23, 42, 0.45));
  will-change: transform;
  user-select: none;
}

.billete.entrando {
  animation: billete-entra var(--duracion) cubic-bezier(0.22, 0.8, 0.3, 1) forwards;
}

.billete.cubriendo {
  transform: translate(calc((100vw - 100%) / 2), -50%);
}

.billete.saliendo {
  animation: billete-sale var(--duracion) cubic-bezier(0.6, 0, 0.8, 0.4) forwards;
}

@keyframes billete-entra {
  from {
    transform: translate(-100%, -50%) rotate(-8deg) scale(0.9);
  }
  to {
    transform: translate(calc((100vw - 100%) / 2), -50%) rotate(0deg) scale(1);
  }
}

@keyframes billete-sale {
  from {
    transform: translate(calc((100vw - 100%) / 2), -50%) rotate(0deg) scale(1);
  }
  to {
    transform: translate(100vw, -50%) rotate(8deg) scale(0.9);
  }
}
</style>
