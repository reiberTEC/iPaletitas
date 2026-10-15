<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Lock } from '@lucide/vue'
import LogoTarjeta from './LogoTarjeta.vue'
import {
  MARCAS_ACEPTADAS,
  erroresTarjeta,
  formatearCvv,
  formatearNumero,
  formatearVence,
  marcaDe,
  registrarTarjeta,
  type DatosTarjeta,
  type TarjetaRegistrada,
} from '@/lib/tarjeta'

const tarjeta = reactive<DatosTarjeta>({ titular: '', numero: '', vence: '', cvv: '' })
const revisar = ref(false)
const errores = computed(() => (revisar.value ? erroresTarjeta(tarjeta) : {}))

const detectada = computed(() => {
  const marca = marcaDe(tarjeta.numero)
  return marca === 'Tarjeta' ? null : marca
})
const esAmex = computed(() => detectada.value === 'American Express')

function formatear(campo: 'numero' | 'vence' | 'cvv', formato: (valor: string) => string, evento: Event) {
  const input = evento.target as HTMLInputElement
  tarjeta[campo] = formato(input.value)
  input.value = tarjeta[campo]
}

/** Muestra los errores y lleva el foco al primero; si todo está bien, devuelve lo que se guarda de la tarjeta. */
function validar(): TarjetaRegistrada | null {
  revisar.value = true
  const campo = Object.keys(erroresTarjeta(tarjeta))[0]
  if (campo) {
    document.getElementById(`tarjeta-${campo}`)?.focus()
    return null
  }
  return registrarTarjeta(tarjeta)
}

defineExpose({ validar })
</script>

<template>
  <div class="grid gap-5 sm:grid-cols-[1fr_7rem_6rem]">
    <div class="sm:col-span-3">
      <p class="sr-only">Tarjetas que aceptamos: {{ MARCAS_ACEPTADAS.join(', ') }}, de crédito o débito.</p>
      <ul class="marcas" aria-hidden="true">
        <li
          v-for="marca in MARCAS_ACEPTADAS"
          :key="marca"
          :class="['marca', { apagada: detectada && detectada !== marca }]"
        >
          <LogoTarjeta :marca="marca" :ancho="40" />
        </li>
      </ul>
    </div>

    <div>
      <label class="ip-label" for="tarjeta-numero">Número de tarjeta</label>
      <div class="relative">
        <input
          id="tarjeta-numero"
          :value="tarjeta.numero"
          class="ip-input pr-16 tabular-nums"
          autocomplete="cc-number"
          inputmode="numeric"
          :placeholder="esAmex ? '3714 496353 98431' : '1234 5678 9012 3456'"
          :aria-invalid="Boolean(errores.numero)"
          :aria-describedby="errores.numero ? 'error-numero' : undefined"
          @input="formatear('numero', formatearNumero, $event)"
        />
        <LogoTarjeta v-if="detectada" :marca="detectada" :ancho="36" class="tarjeta-logo" aria-hidden="true" />
      </div>
      <p v-if="errores.numero" id="error-numero" class="tarjeta-error">{{ errores.numero }}</p>
    </div>
    <div>
      <label class="ip-label" for="tarjeta-vence">Vence</label>
      <input
        id="tarjeta-vence"
        :value="tarjeta.vence"
        class="ip-input tabular-nums"
        autocomplete="cc-exp"
        inputmode="numeric"
        placeholder="MM/AA"
        :aria-invalid="Boolean(errores.vence)"
        :aria-describedby="errores.vence ? 'error-vence' : undefined"
        @input="formatear('vence', formatearVence, $event)"
      />
    </div>
    <div>
      <label class="ip-label" for="tarjeta-cvv">CVV</label>
      <input
        id="tarjeta-cvv"
        :value="tarjeta.cvv"
        class="ip-input tabular-nums"
        type="password"
        autocomplete="cc-csc"
        inputmode="numeric"
        :placeholder="esAmex ? '1234' : '123'"
        :aria-invalid="Boolean(errores.cvv)"
        :aria-describedby="errores.cvv ? 'error-cvv' : undefined"
        @input="formatear('cvv', formatearCvv, $event)"
      />
    </div>
    <p v-if="errores.vence" id="error-vence" class="tarjeta-error sm:col-span-3">{{ errores.vence }}</p>
    <p v-if="errores.cvv" id="error-cvv" class="tarjeta-error sm:col-span-3">{{ errores.cvv }}</p>

    <div v-if="$slots.default" class="sm:col-span-3">
      <slot />
    </div>

    <div class="sm:col-span-3">
      <label class="ip-label" for="tarjeta-titular">Nombre del titular de la tarjeta</label>
      <input
        id="tarjeta-titular"
        v-model="tarjeta.titular"
        class="ip-input"
        autocomplete="cc-name"
        placeholder="Como aparece en la tarjeta"
        :aria-invalid="Boolean(errores.titular)"
        :aria-describedby="errores.titular ? 'error-titular' : undefined"
      />
      <p v-if="errores.titular" id="error-titular" class="tarjeta-error">{{ errores.titular }}</p>
    </div>

    <p class="m-0 flex items-center gap-2 text-sm text-slate-500 sm:col-span-3">
      <Lock class="size-4 shrink-0" aria-hidden="true" />
      Solo guardamos la marca y los últimos 4 dígitos; nunca el número completo ni el CVV.
    </p>
  </div>
</template>

<style scoped>
.marcas {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.marca {
  display: flex;
  transition: opacity 150ms ease;
}

.marca.apagada {
  opacity: 0.3;
}

.tarjeta-logo {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  translate: 0 -50%;
  pointer-events: none;
}

.tarjeta-error {
  margin: 0.5rem 0 0;
  color: #b91c1c;
  font-size: 0.9375rem;
}

.ip-input[aria-invalid='true'] {
  border-color: #dc2626;
}

html.oscuro .tarjeta-error {
  color: #fca5a5;
}
</style>
