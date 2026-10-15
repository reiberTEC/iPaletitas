<script setup lang="ts">
import amex from '@/assets/pagos/amex.svg'
import googlePay from '@/assets/pagos/google-pay.svg'
import mastercard from '@/assets/pagos/mastercard.svg'
import mercadoPago from '@/assets/pagos/mercado-pago.svg'
import paypal from '@/assets/pagos/paypal.svg'
import visa from '@/assets/pagos/visa.svg'
import type { LogoPago } from '@/lib/tarjeta'

withDefaults(defineProps<{ marca: LogoPago; ancho?: number }>(), { ancho: 48 })

const LOGOS: Partial<Record<LogoPago, string>> = {
  Visa: visa,
  Mastercard: mastercard,
  'American Express': amex,
  PayPal: paypal,
  'Mercado Pago': mercadoPago,
  'Google Pay': googlePay,
}
</script>

<template>
  <img
    v-if="LOGOS[marca]"
    :src="LOGOS[marca]"
    :alt="marca"
    :width="ancho"
    :height="Math.round((ancho * 24) / 38)"
    draggable="false"
    class="shrink-0 object-contain"
  />
  <svg
    v-else
    :width="ancho"
    :height="Math.round((ancho * 24) / 38)"
    viewBox="0 0 38 24"
    role="img"
    :aria-label="marca"
    class="shrink-0"
  >
    <rect x=".5" y=".5" width="37" height="23" rx="2.5" fill="#fff" stroke="#000" stroke-opacity=".07" />
    <rect x="4" y="5" width="30" height="14" rx="2" fill="#d71920" />
    <text
      x="19"
      y="14.6"
      text-anchor="middle"
      textLength="24"
      lengthAdjust="spacingAndGlyphs"
      font-family="Arial, Helvetica, sans-serif"
      font-size="7"
      font-weight="900"
      fill="#fff"
    >
      CARNET
    </text>
  </svg>
</template>
