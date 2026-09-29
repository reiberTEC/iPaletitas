<script setup lang="ts">
import { ArrowLeft, Check } from '@lucide/vue'
import PaletaIcon from './icons/PaletaIcon.vue'
import UiButton from './ui/Button.vue'

defineProps<{ paso: 1 | 2 | 3 }>()
defineEmits(['volver'])

const pasos = ['Crear cuenta', 'Elegir licencia', 'Activar']
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl">
    <div class="mx-auto flex h-[4.5rem] w-full max-w-6xl items-center justify-between gap-6 px-6">
      <div class="flex items-center gap-2.5">
        <PaletaIcon variant="blue" :size="30" />
        <span class="text-lg font-extrabold tracking-tight text-slate-900">iPaletitas</span>
      </div>

      <ol class="hidden list-none items-center gap-3 p-0 md:flex" aria-label="Progreso">
        <li v-for="(nombre, i) in pasos" :key="nombre" class="flex items-center gap-3">
          <span
            :class="[
              'grid size-7 place-items-center rounded-full text-xs font-bold',
              i + 1 < paso
                ? 'bg-emerald-500 text-white'
                : i + 1 === paso
                  ? 'bg-blue-600 text-white ring-4 ring-blue-600/15'
                  : 'bg-slate-200 text-slate-500',
            ]"
          >
            <Check v-if="i + 1 < paso" class="size-4" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span :class="['text-sm font-semibold', i + 1 === paso ? 'text-slate-900' : 'text-slate-400']">
            {{ nombre }}
          </span>
          <span v-if="i < pasos.length - 1" class="h-px w-10 bg-slate-200" />
        </li>
      </ol>

      <UiButton variant="ghost" @click="$emit('volver')">
        <ArrowLeft class="size-4" />
        Volver
      </UiButton>
    </div>
  </header>
</template>
