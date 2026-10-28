<script setup lang="ts">
import { computed } from 'vue'
import { Crown } from '@lucide/vue'
import IconoProducto from '../../icons/IconoProducto.vue'
import PaletaIcon from '../../icons/PaletaIcon.vue'
import type { Posicion } from './periodos'
import { dinero, plural } from '@/lib/formato'

const props = defineProps<{ ranking: Posicion[]; periodo: string }>()

const top = computed(() => props.ranking.slice(0, 5))
const ganador = computed(() => top.value[0] ?? null)
const maximo = computed(() => ganador.value?.cantidad ?? 1)
</script>

<template>
  <div class="flex h-full flex-col rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
    <div class="flex items-center justify-between gap-2">
      <p class="font-display text-sm font-semibold text-slate-900">Producto más vendido</p>
      <span class="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
        {{ periodo }}
      </span>
    </div>

    <template v-if="ganador">
      <div class="escena">
        <span class="disco" aria-hidden="true" />
        <Crown class="corona size-7 text-yellow-500" aria-hidden="true" />
        <div class="ganador">
          <IconoProducto :icono="ganador.icono" :categoria="ganador.categoria" :size="84" />
        </div>
      </div>

      <div class="aparecer text-center">
        <p class="line-clamp-2 text-lg leading-tight font-extrabold [overflow-wrap:anywhere] text-slate-900" :title="ganador.nombre">
          {{ ganador.nombre }}
        </p>
        <p class="mt-1 text-sm text-slate-500">
          <strong class="ip-cifra text-2xl text-blue-700">{{ ganador.cantidad.toLocaleString('es-MX') }}</strong>
          {{ ganador.cantidad === 1 ? 'pieza' : 'piezas' }} ·
          <span class="tabular-nums">{{ dinero(ganador.total) }}</span>
        </p>
      </div>

      <ol v-if="top.length > 1" class="mt-5 list-none space-y-2.5 p-0">
        <li v-for="(posicion, i) in top" :key="posicion.productoId" class="text-xs">
          <div class="flex justify-between gap-2 font-semibold text-slate-600">
            <span class="truncate" :title="posicion.nombre">{{ i + 1 }}. {{ posicion.nombre }}</span>
            <span class="shrink-0 tabular-nums">{{ plural(posicion.cantidad, 'pza', 'pzas') }}</span>
          </div>
          <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              :class="['barra h-full rounded-full', i === 0 ? 'bg-blue-600' : 'bg-blue-300']"
              :style="{ width: `${(posicion.cantidad / maximo) * 100}%`, animationDelay: `${i * 40}ms` }"
            />
          </div>
        </li>
      </ol>
    </template>

    <div v-else class="grid flex-1 place-items-center py-10 text-center">
      <div>
        <PaletaIcon variant="white" :size="56" class="mx-auto opacity-60" />
        <p class="mt-3 text-sm text-slate-500">Sin ventas en este periodo.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.escena {
  position: relative;
  display: grid;
  height: 9rem;
  place-items: center;
}

/* Un disco plano del color del negocio: la "estación" del ganador */
.disco {
  position: absolute;
  width: 6.5rem;
  height: 6.5rem;
  border-radius: 999px;
  background: var(--marca-100);
}

.ganador {
  position: relative;
  animation: entrar 240ms var(--ease-out) both;
}

.corona {
  position: absolute;
  top: 0.4rem;
  transform: rotate(-12deg);
}

.aparecer {
  animation: subir 240ms 60ms var(--ease-out) both;
}

.barra {
  transform-origin: left;
  animation: crecer 300ms var(--ease-out) both;
}

@keyframes entrar {
  from {
    opacity: 0;
    transform: scale(0.94);
  }
}

@keyframes subir {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}

@keyframes crecer {
  from {
    transform: scaleX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ganador,
  .aparecer {
    animation-name: aparecer-suave;
  }

  .barra {
    animation: none;
  }
}

@keyframes aparecer-suave {
  from {
    opacity: 0;
  }
}

html.oscuro .disco {
  background: color-mix(in oklab, var(--marca-600) 18%, transparent);
}
</style>
