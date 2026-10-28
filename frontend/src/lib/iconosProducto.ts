/** Catálogo de iconos que el usuario puede asignar a cada producto. */

export const ICONOS_PRODUCTO = [
  { id: 'paleta', etiqueta: 'Paleta' },
  { id: 'paleta-oro', etiqueta: 'Paleta oro' },
  { id: 'paleta-verde', etiqueta: 'Paleta verde' },
  { id: 'helado', etiqueta: 'Helado' },
  { id: 'cafe', etiqueta: 'Café' },
  { id: 'bebida', etiqueta: 'Bebida' },
  { id: 'comida', etiqueta: 'Comida' },
  { id: 'pizza', etiqueta: 'Pizza' },
  { id: 'sandwich', etiqueta: 'Sándwich' },
  { id: 'galleta', etiqueta: 'Galleta' },
  { id: 'pastel', etiqueta: 'Pastel' },
  { id: 'dulce', etiqueta: 'Dulce' },
  { id: 'fruta', etiqueta: 'Fruta' },
  { id: 'ensalada', etiqueta: 'Ensalada' },
  { id: 'sopa', etiqueta: 'Sopa' },
  { id: 'pan', etiqueta: 'Pan' },
  { id: 'pescado', etiqueta: 'Pescado' },
  { id: 'leche', etiqueta: 'Lácteos' },
  { id: 'caja', etiqueta: 'Caja' },
  { id: 'carrito', etiqueta: 'Abarrotes' },
  { id: 'ropa', etiqueta: 'Ropa' },
  { id: 'tech', etiqueta: 'Tech' },
] as const

export type IconoProductoId = (typeof ICONOS_PRODUCTO)[number]['id']

export function esIconoProducto(v: string | undefined | null): v is IconoProductoId {
  return Boolean(v && ICONOS_PRODUCTO.some((i) => i.id === v))
}

/** Si no eligieron icono, sugiere uno por categoría. */
export function iconoPorCategoria(categoria: string): IconoProductoId {
  const t = categoria.toLowerCase()
  if (t.includes('paleta') || t.includes('nieve') || t.includes('helado')) return 'helado'
  if (t.includes('agua') || t.includes('bebida') || t.includes('refresco')) return 'bebida'
  if (t.includes('café') || t.includes('cafe')) return 'cafe'
  if (t.includes('pizza')) return 'pizza'
  if (t.includes('pan')) return 'pan'
  if (t.includes('abarro')) return 'carrito'
  if (t.includes('ropa')) return 'ropa'
  if (t.includes('comida') || t.includes('taco') || t.includes('rest')) return 'comida'
  return 'caja'
}
