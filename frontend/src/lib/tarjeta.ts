export type MarcaTarjeta = 'Visa' | 'Mastercard' | 'American Express' | 'Carnet' | 'Tarjeta'
export type MarcaAceptada = Exclude<MarcaTarjeta, 'Tarjeta'>
export type Billetera = 'PayPal' | 'Mercado Pago' | 'Google Pay'
export type LogoPago = MarcaAceptada | Billetera

export const MARCAS_ACEPTADAS: MarcaAceptada[] = ['Visa', 'Mastercard', 'American Express', 'Carnet']
export const BILLETERAS: Billetera[] = ['PayPal', 'Mercado Pago', 'Google Pay']

export const esBilletera = (marca: string): marca is Billetera => (BILLETERAS as string[]).includes(marca)

export interface DatosTarjeta {
  titular: string
  numero: string
  vence: string
  cvv: string
}

/**
 * Lo único que se guarda del medio de pago: nunca el número completo ni el código de seguridad.
 * En una billetera (PayPal, Mercado Pago, Google Pay) no hay dígitos ni vencimiento: titular es el correo de esa cuenta.
 */
export interface TarjetaRegistrada {
  marca: MarcaTarjeta | Billetera
  ultimos4: string
  vence: string
  titular: string
}

export type ErroresTarjeta = Partial<Record<keyof DatosTarjeta, string>>

const soloDigitos = (texto: string) => texto.replace(/\D/g, '')

export function marcaDe(numero: string): MarcaTarjeta {
  const n = soloDigitos(numero)
  if (/^4/.test(n)) return 'Visa'
  if (/^3[47]/.test(n)) return 'American Express'
  if (/^(2869|5022|506[2-4]|6363|639[45])/.test(n)) return 'Carnet'
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return 'Mastercard'
  return 'Tarjeta'
}

const esAmex = (numero: string) => marcaDe(numero) === 'American Express'

export function formatearNumero(valor: string) {
  const n = soloDigitos(valor)
  if (esAmex(n)) {
    const amex = n.slice(0, 15)
    return [amex.slice(0, 4), amex.slice(4, 10), amex.slice(10)].filter(Boolean).join(' ')
  }
  return n.slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

export function formatearVence(valor: string) {
  const n = soloDigitos(valor).slice(0, 4)
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n
}

export const formatearCvv = (valor: string) => soloDigitos(valor).slice(0, 4)

function pasaLuhn(numero: string) {
  let suma = 0
  for (let i = 0; i < numero.length; i++) {
    let digito = Number(numero[numero.length - 1 - i])
    if (i % 2 === 1) {
      digito *= 2
      if (digito > 9) digito -= 9
    }
    suma += digito
  }
  return suma % 10 === 0
}

export function erroresTarjeta(datos: DatosTarjeta, hoy = new Date()): ErroresTarjeta {
  const errores: ErroresTarjeta = {}
  const numero = soloDigitos(datos.numero)
  const amex = esAmex(numero)

  if (!datos.titular.trim()) errores.titular = 'Escribe el nombre como aparece en la tarjeta.'

  if (numero && marcaDe(numero) === 'Tarjeta') {
    errores.numero = 'Solo aceptamos Visa, Mastercard, American Express y Carnet.'
  } else if (numero.length !== (amex ? 15 : 16) || !pasaLuhn(numero)) {
    errores.numero = 'Revisa el número: no corresponde a una tarjeta válida.'
  }

  const [mes, anio] = datos.vence.split('/').map(Number)
  const ultimoDia = mes && anio !== undefined ? new Date(2000 + anio, mes, 0, 23, 59, 59) : null
  if (!mes || mes > 12 || datos.vence.length !== 5 || !ultimoDia) {
    errores.vence = 'Escribe la fecha de vencimiento como MM/AA.'
  } else if (ultimoDia < hoy) {
    errores.vence = 'Esta tarjeta ya venció. Usa una vigente.'
  }

  if (datos.cvv.length !== (amex ? 4 : 3)) {
    errores.cvv = amex ? 'En American Express son 4 dígitos, al frente.' : 'Son los 3 dígitos al reverso.'
  }

  return errores
}

/** Si la tarjeta sigue vigente en esa fecha (vence el último día de su mes). Las billeteras no vencen. */
export function tarjetaVigente(tarjeta: Pick<TarjetaRegistrada, 'vence'>, fecha: string | number = Date.now()) {
  if (!tarjeta.vence) return true
  const [mes, anio] = tarjeta.vence.split('/').map(Number)
  if (!mes || anio === undefined) return false
  return new Date(fecha).getTime() <= new Date(2000 + anio, mes, 0, 23, 59, 59).getTime()
}

export function registrarTarjeta(datos: DatosTarjeta): TarjetaRegistrada {
  const numero = soloDigitos(datos.numero)
  return { marca: marcaDe(numero), ultimos4: numero.slice(-4), vence: datos.vence, titular: datos.titular.trim() }
}

export const registrarBilletera = (billetera: Billetera, correo: string): TarjetaRegistrada => ({
  marca: billetera,
  ultimos4: '',
  vence: '',
  titular: correo.trim(),
})

export const textoTarjeta = (tarjeta: Pick<TarjetaRegistrada, 'marca' | 'ultimos4' | 'titular'>) =>
  esBilletera(tarjeta.marca) ? `${tarjeta.marca} (${tarjeta.titular})` : `${tarjeta.marca} •••• ${tarjeta.ultimos4}`
