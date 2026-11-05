const LETRAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function bloque() {
  return Array.from({ length: 4 }, () => LETRAS[Math.floor(Math.random() * LETRAS.length)]).join('')
}

/** Misma forma que el frontend: IPAL-XXXX-XXXX-XXXX */
export function generarClaveLicencia() {
  return `IPAL-${bloque()}-${bloque()}-${bloque()}`
}
