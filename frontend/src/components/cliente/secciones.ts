import { puede, type Permiso } from '@/stores/negocio'

export type Seccion =
  | 'inicio'
  | 'venta'
  | 'productos'
  | 'entradas'
  | 'caducados'
  | 'historial'
  | 'usuarios'
  | 'sucursales'
  | 'marca'
  | 'licencia'
  | 'suscripciones'
  | 'nosotros'

const PERMISO_SECCION: Partial<Record<Seccion, Permiso>> = {
  venta: 'ventas.crear',
  productos: 'productos.ver',
  entradas: 'entradas.ver',
  caducados: 'perdidas.ver',
  historial: 'historial.ver',
  usuarios: 'usuarios.ver',
  sucursales: 'sucursales.ver',
  marca: 'licencia.editar',
  suscripciones: 'licencia.ver',
  licencia: 'licencia.ver',
}

/** Inicio y Nosotros están abiertos para todo el equipo. */
export function puedeVer(seccion: Seccion) {
  const permiso = PERMISO_SECCION[seccion]
  return !permiso || puede(permiso)
}

export function colorCategoria(categoria: string): 'blue' | 'gold' | 'green' {
  const texto = categoria.toLowerCase()
  if (texto.includes('aguas')) return 'green'
  if (texto.includes('agua')) return 'gold'
  return 'blue'
}
