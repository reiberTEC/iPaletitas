import { ShieldCheck, ShoppingCart, Truck, UserCog, type LucideIcon } from '@lucide/vue'
import type { Rol } from '@/stores/negocio'

export const estiloRol: Record<Rol, { icono: LucideIcon; avatar: string; etiqueta: string; tarjeta: string }> = {
  Administrador: {
    icono: ShieldCheck,
    avatar: 'bg-violet-600',
    etiqueta: 'bg-violet-100 text-violet-700',
    tarjeta: 'bg-violet-50 ring-violet-500 text-violet-700',
  },
  Gerente: {
    icono: UserCog,
    avatar: 'bg-blue-600',
    etiqueta: 'bg-blue-100 text-blue-700',
    tarjeta: 'bg-blue-50 ring-blue-500 text-blue-700',
  },
  Cajero: {
    icono: ShoppingCart,
    avatar: 'bg-emerald-600',
    etiqueta: 'bg-emerald-100 text-emerald-700',
    tarjeta: 'bg-emerald-50 ring-emerald-500 text-emerald-700',
  },
  Almacén: {
    icono: Truck,
    avatar: 'bg-orange-500',
    etiqueta: 'bg-orange-100 text-orange-700',
    tarjeta: 'bg-orange-50 ring-orange-500 text-orange-700',
  },
}
