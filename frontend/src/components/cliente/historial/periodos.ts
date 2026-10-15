import { estado, type Venta } from '@/stores/negocio'

export type Periodo = 'dia' | 'semana' | 'mes'

export const PERIODOS: { id: Periodo; etiqueta: string; descripcion: string; anterior: string }[] = [
  { id: 'dia', etiqueta: 'Día', descripcion: 'Hoy, por hora', anterior: 'ayer' },
  { id: 'semana', etiqueta: 'Semana', descripcion: 'Últimos 7 días', anterior: 'la semana anterior' },
  { id: 'mes', etiqueta: 'Mes', descripcion: 'Últimos 30 días', anterior: 'los 30 días anteriores' },
]

const DIAS: Record<Periodo, number> = { dia: 1, semana: 7, mes: 30 }

export interface Barra {
  etiqueta: string
  detalle: string
  total: number
  tickets: number
  actual: boolean
}

export interface Posicion {
  productoId: string
  nombre: string
  categoria: string
  cantidad: number
  total: number
}

/** `atras = 1` devuelve el periodo inmediatamente anterior, para comparar. */
export function rango(periodo: Periodo, atras = 0) {
  const dias = DIAS[periodo]
  const desde = new Date()
  desde.setHours(0, 0, 0, 0)
  desde.setDate(desde.getDate() - (dias - 1) - dias * atras)
  const hasta = new Date(desde)
  hasta.setDate(hasta.getDate() + dias)
  return { desde, hasta }
}

export function enRango(ventas: Venta[], { desde, hasta }: { desde: Date; hasta: Date }) {
  return ventas.filter((v) => {
    const fecha = new Date(v.fecha)
    return fecha >= desde && fecha < hasta
  })
}

const diaSemana = new Intl.DateTimeFormat('es-MX', { weekday: 'short' })
const diaCompleto = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

export function barras(ventas: Venta[], periodo: Periodo): Barra[] {
  if (periodo === 'dia') {
    const horas = ventas.map((v) => new Date(v.fecha).getHours())
    const ahora = new Date().getHours()
    const inicio = Math.min(8, ...horas)
    const fin = Math.max(20, ahora, ...horas)
    return Array.from({ length: fin - inicio + 1 }, (_, i) => {
      const hora = inicio + i
      const deLaHora = ventas.filter((v) => new Date(v.fecha).getHours() === hora)
      return {
        etiqueta: `${hora}:00`,
        detalle: `De ${hora}:00 a ${hora}:59`,
        total: deLaHora.reduce((suma, v) => suma + v.total, 0),
        tickets: deLaHora.length,
        actual: hora === ahora,
      }
    })
  }

  const { desde } = rango(periodo)
  return Array.from({ length: DIAS[periodo] }, (_, i) => {
    const dia = new Date(desde)
    dia.setDate(dia.getDate() + i)
    const delDia = ventas.filter((v) => new Date(v.fecha).toDateString() === dia.toDateString())
    const esHoy = i === DIAS[periodo] - 1
    return {
      etiqueta: esHoy ? 'Hoy' : periodo === 'semana' ? diaSemana.format(dia) : String(dia.getDate()),
      detalle: diaCompleto.format(dia),
      total: delDia.reduce((suma, v) => suma + v.total, 0),
      tickets: delDia.length,
      actual: esHoy,
    }
  })
}

export function ranking(ventas: Venta[]): Posicion[] {
  const posiciones = new Map<string, Posicion>()
  for (const venta of ventas) {
    for (const partida of venta.partidas) {
      const actual = posiciones.get(partida.productoId) ?? {
        productoId: partida.productoId,
        nombre: partida.nombre,
        categoria: estado.productos.find((p) => p.id === partida.productoId)?.categoria ?? '',
        cantidad: 0,
        total: 0,
      }
      actual.cantidad += partida.cantidad
      actual.total += partida.cantidad * partida.precio
      posiciones.set(partida.productoId, actual)
    }
  }
  return [...posiciones.values()].sort((a, b) => b.cantidad - a.cantidad || b.total - a.total)
}
