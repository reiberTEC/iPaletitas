import { ref } from 'vue'

/** Hora actual reactiva: vencimientos, plazos de cobro y suspensiones cambian sin recargar la página. */
export const ahora = ref(Date.now())

setInterval(() => (ahora.value = Date.now()), 60_000)
