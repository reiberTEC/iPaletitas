const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const monedaEntera = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})
const soloFecha = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
const fechaHora = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
const soloHora = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' })

export const dinero = (valor: number) => moneda.format(valor)
export const precio = (valor: number) => monedaEntera.format(valor)
export const fecha = (iso: string) => soloFecha.format(new Date(iso))
export const fechaYHora = (iso: string) => fechaHora.format(new Date(iso))
export const hora = (iso: string) => soloHora.format(new Date(iso))

export function mismoDia(iso: string, dia = new Date()) {
  return new Date(iso).toDateString() === dia.toDateString()
}

export function iniciales(nombre: string) {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}
