export type Seccion =
  | 'inicio'
  | 'venta'
  | 'productos'
  | 'entradas'
  | 'historial'
  | 'usuarios'
  | 'sucursales'
  | 'licencia'

export function colorCategoria(categoria: string): 'blue' | 'gold' | 'green' {
  const texto = categoria.toLowerCase()
  if (texto.includes('aguas')) return 'green'
  if (texto.includes('agua')) return 'gold'
  return 'blue'
}
