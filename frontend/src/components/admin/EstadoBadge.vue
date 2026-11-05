<script setup lang="ts">
import type { EstadoCuenta, EstadoPago } from '@/stores/admin'

defineProps<{ estado: EstadoCuenta | EstadoPago }>()

const colores: Record<EstadoCuenta | EstadoPago, string> = {
  Activa: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Pagado: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  'En prueba': 'bg-blue-50 text-blue-700 ring-blue-600/20',
  Pendiente: 'bg-amber-50 text-amber-800 ring-amber-500/30',
  'En periodo de cobro': 'bg-amber-50 text-amber-800 ring-amber-500/30',
  Vencido: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Suspendida: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Cancelada: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  Reembolsado: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset',
      colores[estado],
    ]"
  >
    <span class="size-1.5 rounded-full bg-current" />
    {{ estado }}
  </span>
</template>
