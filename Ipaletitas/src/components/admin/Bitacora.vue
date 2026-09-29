<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from '@lucide/vue'
import UiCard from '../ui/Card.vue'
import Encabezado from '../ui/Encabezado.vue'
import { estado } from '@/stores/admin'
import { fechaYHora, iniciales } from '@/lib/formato'

const busqueda = ref('')

const eventos = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return estado.bitacora.filter((e) => `${e.autor} ${e.accion} ${e.detalle}`.toLowerCase().includes(texto))
})

function color(accion: string) {
  if (/suspend/i.test(accion)) return 'bg-rose-500'
  if (/pago|suscripci/i.test(accion)) return 'bg-emerald-500'
  if (/sesi/i.test(accion)) return 'bg-slate-400'
  return 'bg-blue-500'
}
</script>

<template>
  <div>
    <Encabezado titulo="Bitácora" descripcion="Registro de todo lo que hacen los administradores sobre las cuentas.">
      <label class="relative w-72">
        <span class="sr-only">Buscar</span>
        <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input v-model="busqueda" class="ip-input ip-input-icono" placeholder="Buscar en la bitácora" />
      </label>
    </Encabezado>

    <UiCard class="bg-white p-6">
      <ol v-if="eventos.length" class="relative m-0 list-none space-y-6 p-0">
        <li v-for="evento in eventos" :key="evento.id" class="relative flex gap-4">
          <span class="grid size-10 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">
            {{ iniciales(evento.autor) }}
          </span>
          <div class="min-w-0 flex-1 border-b border-slate-100 pb-5">
            <p class="flex items-center gap-2 text-sm">
              <span :class="['size-2 rounded-full', color(evento.accion)]" />
              <strong>{{ evento.autor }}</strong>
              <span class="text-slate-600">{{ evento.accion.toLowerCase() }}</span>
            </p>
            <p class="mt-1 text-sm text-slate-500">{{ evento.detalle }}</p>
          </div>
          <span class="shrink-0 text-xs whitespace-nowrap text-slate-400">{{ fechaYHora(evento.fecha) }}</span>
        </li>
      </ol>
      <p v-else class="py-14 text-center text-slate-400">Todavía no hay movimientos registrados.</p>
    </UiCard>
  </div>
</template>
