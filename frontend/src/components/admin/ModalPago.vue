<script setup lang="ts">
import { ref } from 'vue'
import { ArrowRightLeft, CalendarCheck } from '@lucide/vue'
import UiButton from '../ui/Button.vue'
import UiModal from '../ui/Modal.vue'
import { METODO_COBRO } from '@/stores/admin'
import { dinero, fecha } from '@/lib/formato'

defineProps<{
  cargo: { folio: number; negocio: string; concepto: string; monto: number }
  venceNuevo: string | null
}>()
const emit = defineEmits<{ confirmar: [referencia: string]; cerrar: [] }>()

const referencia = ref('')
</script>

<template>
  <UiModal titulo="Registrar pago" @cerrar="emit('cerrar')">
    <form @submit.prevent="emit('confirmar', referencia)">
      <div class="rounded-2xl bg-slate-50 p-4">
        <p class="text-sm text-slate-500">F-{{ cargo.folio }} · {{ cargo.negocio }}</p>
        <p class="mt-1 font-semibold">{{ cargo.concepto }}</p>
        <p class="mt-3 text-3xl font-extrabold tabular-nums">{{ dinero(cargo.monto) }}</p>
      </div>

      <div class="mt-5 flex items-center gap-3 rounded-xl p-3 ring-1 ring-slate-200">
        <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-600/10 text-blue-700">
          <ArrowRightLeft class="size-4" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="text-sm font-semibold">Pagó por {{ METODO_COBRO.toLowerCase() }}</p>
          <p class="text-xs text-slate-500">Los pagos con tarjeta se cobran solos; aquí solo se registran transferencias.</p>
        </div>
      </div>

      <label class="ip-label mt-5" for="pago-referencia">
        Folio o clave de rastreo <span class="font-normal text-slate-500">(opcional)</span>
      </label>
      <input
        id="pago-referencia"
        v-model="referencia"
        class="ip-input"
        autocomplete="off"
        maxlength="40"
        placeholder="Ej. 7302 o MBAN01002610140001"
      />

      <p v-if="venceNuevo" class="mt-5 flex items-start gap-2 text-sm text-slate-600">
        <CalendarCheck class="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
        <span>
          Al confirmar, la licencia queda activa hasta el
          <strong class="text-slate-900 tabular-nums">{{ fecha(venceNuevo) }}</strong>.
        </span>
      </p>

      <div class="mt-6 flex justify-end gap-3">
        <UiButton type="button" variant="outline" @click="emit('cerrar')">Cancelar</UiButton>
        <UiButton type="submit">Confirmar pago</UiButton>
      </div>
    </form>
  </UiModal>
</template>
