<script setup lang="ts">
import { computed } from 'vue'
import { Printer } from '@lucide/vue'
import PaletaIcon from '../icons/PaletaIcon.vue'
import UiButton from '../ui/Button.vue'
import UiModal from '../ui/Modal.vue'
import { IVA, estado, nombreSucursal, pagadoDe, saldoDe, type Venta } from '@/stores/negocio'
import { dinero, fechaDia, fechaYHora } from '@/lib/formato'

const props = defineProps<{ venta: Venta }>()
defineEmits(['cerrar'])

const subtotal = computed(() => props.venta.total / (1 + IVA))
const cambio = computed(() => Math.max(0, props.venta.recibido - props.venta.total))
const saldo = computed(() => saldoDe(props.venta))
const imprimir = () => window.print()
</script>

<template>
  <UiModal titulo="Ticket de venta" ancho="max-w-md" @cerrar="$emit('cerrar')">
    <div class="ticket-imprimible rounded-2xl bg-white p-6 font-mono text-[13px] text-slate-800 ring-1 ring-slate-200">
      <div class="text-center">
        <PaletaIcon variant="blue" :size="34" class="mx-auto" />
        <p class="mt-2 text-base font-bold">{{ estado.licencia?.negocio }}</p>
        <p class="text-xs text-slate-500">Sucursal {{ nombreSucursal(venta.sucursalId) }}</p>
        <p v-if="estado.licencia?.telefono" class="text-xs text-slate-500">Tel. {{ estado.licencia.telefono }}</p>
      </div>

      <div class="my-4 border-t border-dashed border-slate-300" />

      <div class="space-y-1">
        <p class="flex justify-between"><span>Folio</span><span class="font-bold">#{{ venta.folio }}</span></p>
        <p class="flex justify-between"><span>Fecha</span><span>{{ fechaYHora(venta.fecha) }}</span></p>
        <p class="flex justify-between"><span>Atendió</span><span>{{ venta.cajero }}</span></p>
        <template v-if="venta.anticipo">
          <p class="flex justify-between"><span>Cliente</span><span>{{ venta.anticipo.cliente }}</span></p>
          <p v-if="venta.anticipo.telefono" class="flex justify-between">
            <span>Teléfono</span><span>{{ venta.anticipo.telefono }}</span>
          </p>
          <p v-if="venta.anticipo.entrega" class="flex justify-between">
            <span>Entrega</span><span>{{ fechaDia(venta.anticipo.entrega) }}</span>
          </p>
        </template>
      </div>

      <div class="my-4 border-t border-dashed border-slate-300" />

      <div class="space-y-2">
        <div v-for="partida in venta.partidas" :key="partida.productoId">
          <p>{{ partida.nombre }}</p>
          <p class="flex justify-between text-slate-500">
            <span>{{ partida.cantidad }} x {{ dinero(partida.precio) }}</span>
            <span class="text-slate-800">{{ dinero(partida.cantidad * partida.precio) }}</span>
          </p>
        </div>
      </div>

      <div class="my-4 border-t border-dashed border-slate-300" />

      <div class="space-y-1">
        <p class="flex justify-between"><span>Subtotal</span><span>{{ dinero(subtotal) }}</span></p>
        <p class="flex justify-between"><span>IVA 16%</span><span>{{ dinero(venta.total - subtotal) }}</span></p>
        <p class="flex justify-between text-base font-bold"><span>TOTAL</span><span>{{ dinero(venta.total) }}</span></p>
      </div>

      <div v-if="venta.anticipo" class="mt-3 space-y-1 text-slate-500">
        <div v-for="(pago, i) in venta.anticipo.pagos" :key="pago.fecha">
          <p class="flex justify-between">
            <span>{{ i === 0 ? 'Anticipo' : 'Abono' }} · {{ pago.metodo }}</span>
            <span class="text-slate-800">{{ dinero(pago.monto) }}</span>
          </p>
          <p class="flex justify-between text-[11px]">
            <span>{{ fechaYHora(pago.fecha) }}</span>
            <span v-if="pago.recibido > pago.monto">Cambio {{ dinero(pago.recibido - pago.monto) }}</span>
          </p>
        </div>
        <p class="flex justify-between pt-1"><span>Pagado</span><span>{{ dinero(pagadoDe(venta)) }}</span></p>
        <p class="flex justify-between text-base font-bold text-slate-800">
          <span>{{ saldo > 0 ? 'SALDO PENDIENTE' : 'LIQUIDADO' }}</span>
          <span>{{ dinero(saldo) }}</span>
        </p>
      </div>

      <div v-else class="mt-3 space-y-1 text-slate-500">
        <p class="flex justify-between"><span>Pago</span><span>{{ venta.metodoPago }}</span></p>
        <template v-if="venta.metodoPago === 'Efectivo'">
          <p class="flex justify-between"><span>Recibido</span><span>{{ dinero(venta.recibido) }}</span></p>
          <p class="flex justify-between"><span>Cambio</span><span>{{ dinero(cambio) }}</span></p>
        </template>
      </div>

      <div class="my-4 border-t border-dashed border-slate-300" />
      <p class="text-center">¡Gracias por su compra!</p>
    </div>

    <div class="mt-6 grid grid-cols-2 gap-3">
      <UiButton variant="outline" @click="imprimir">
        <Printer class="size-4" />
        Imprimir
      </UiButton>
      <UiButton @click="$emit('cerrar')">Listo</UiButton>
    </div>
  </UiModal>
</template>
