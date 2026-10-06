import { ref, watch } from 'vue'

export const MODULOS = [
  { id: 'ventas', nombre: 'Ventas' },
  { id: 'inventario', nombre: 'Inventario' },
  { id: 'productos', nombre: 'Productos' },
  { id: 'empleados', nombre: 'Empleados' },
  { id: 'reportes', nombre: 'Reportes' },
  { id: 'suscripciones', nombre: 'Suscripciones' },
] as const

export const ACCIONES = [
  { id: 'ver', nombre: 'Ver' },
  { id: 'crear', nombre: 'Crear' },
  { id: 'editar', nombre: 'Editar' },
  { id: 'eliminar', nombre: 'Eliminar' },
] as const

export type ModuloId = (typeof MODULOS)[number]['id']
export type AccionId = (typeof ACCIONES)[number]['id']
export type Permiso = `${ModuloId}.${AccionId}`
export type RolId = 'administrador' | 'gerente' | 'cajero' | 'produccion'

export interface Rol {
  id: RolId
  nombre: string
  descripcion: string
  color: string
  fondo: string
  permisos: Permiso[]
}

export interface Empleado {
  id: string
  nombre: string
  correo: string
  telefono: string
  puesto: string
  fechaIngreso: string
  activo: boolean
  rolId: RolId
  permisos: Permiso[]
}

export type EmpleadoNuevo = Omit<Empleado, 'id'>

export const clavePermiso = (modulo: ModuloId, accion: AccionId): Permiso => `${modulo}.${accion}`

export const todosLosPermisos = (): Permiso[] =>
  MODULOS.flatMap((modulo) => ACCIONES.map((accion) => clavePermiso(modulo.id, accion.id)))

export const ordenarPermisos = (permisos: Permiso[]): Permiso[] =>
  todosLosPermisos().filter((permiso) => permisos.includes(permiso))

export const ROLES: Rol[] = [
  {
    id: 'administrador',
    nombre: 'Administrador',
    descripcion: 'Acceso total a la plataforma, incluida la facturación.',
    color: '#7c3aed',
    fondo: '#f3e8ff',
    permisos: todosLosPermisos(),
  },
  {
    id: 'gerente',
    nombre: 'Gerente',
    descripcion: 'Gestiona la operación diaria y al personal, sin facturación.',
    color: '#2563eb',
    fondo: '#dbeafe',
    permisos: [
      'ventas.ver', 'ventas.crear', 'ventas.editar', 'ventas.eliminar',
      'inventario.ver', 'inventario.crear', 'inventario.editar', 'inventario.eliminar',
      'productos.ver', 'productos.crear', 'productos.editar', 'productos.eliminar',
      'empleados.ver', 'empleados.crear', 'empleados.editar',
      'reportes.ver',
      'suscripciones.ver',
    ],
  },
  {
    id: 'cajero',
    nombre: 'Cajero',
    descripcion: 'Registra ventas y consulta productos e inventario.',
    color: '#059669',
    fondo: '#d1fae5',
    permisos: ['ventas.ver', 'ventas.crear', 'inventario.ver', 'productos.ver'],
  },
  {
    id: 'produccion',
    nombre: 'Producción',
    descripcion: 'Controla insumos, recetas y existencias de paletas.',
    color: '#d97706',
    fondo: '#fef3c7',
    permisos: [
      'inventario.ver', 'inventario.crear', 'inventario.editar',
      'productos.ver', 'productos.editar',
    ],
  },
]

export const obtenerRol = (rolId: RolId): Rol => ROLES.find((rol) => rol.id === rolId) ?? ROLES[0]!

export const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('')

export const formatearFecha = (fecha: string) =>
  new Date(`${fecha}T00:00:00`).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const generarId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const empleadoSemilla = (
  nombre: string,
  correo: string,
  telefono: string,
  puesto: string,
  fechaIngreso: string,
  rolId: RolId,
  activo = true,
): Empleado => ({
  id: generarId(),
  nombre,
  correo,
  telefono,
  puesto,
  fechaIngreso,
  activo,
  rolId,
  permisos: [...obtenerRol(rolId).permisos],
})

const semilla = (): Empleado[] => [
  empleadoSemilla('Mariana López Hernández', 'mariana.lopez@ipaletitas.com', '5512345678', 'Gerente general', '2023-02-15', 'administrador'),
  empleadoSemilla('Carlos Ramírez Soto', 'carlos.ramirez@ipaletitas.com', '5523456789', 'Encargado de sucursal', '2024-05-03', 'gerente'),
  empleadoSemilla('Ana Sofía Torres', 'ana.torres@ipaletitas.com', '5534567890', 'Cajera', '2025-01-20', 'cajero'),
  empleadoSemilla('Luis Fernando Díaz', 'luis.diaz@ipaletitas.com', '5545678901', 'Maestro paletero', '2024-09-10', 'produccion'),
  empleadoSemilla('Valeria Gómez Ruiz', 'valeria.gomez@ipaletitas.com', '5556789012', 'Cajera', '2025-06-01', 'cajero', false),
  empleadoSemilla('Jorge Méndez Castillo', 'jorge.mendez@ipaletitas.com', '', 'Almacenista', '2025-11-12', 'produccion'),
]

const CLAVE_ALMACENAMIENTO = 'ipaletitas:empleados'

const cargarEmpleados = (): Empleado[] => {
  try {
    const guardados = localStorage.getItem(CLAVE_ALMACENAMIENTO)
    if (guardados) return JSON.parse(guardados) as Empleado[]
  } catch {
    localStorage.removeItem(CLAVE_ALMACENAMIENTO)
  }
  return semilla()
}

// TODO: reemplazar localStorage por llamadas a la API cuando exista el backend
const empleados = ref<Empleado[]>(cargarEmpleados())

watch(empleados, (lista) => localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(lista)), {
  deep: true,
  immediate: true,
})

export function useEmpleados() {
  const crear = (datos: EmpleadoNuevo) => {
    const empleado: Empleado = { ...datos, id: generarId() }
    empleados.value.push(empleado)
    return empleado
  }

  const actualizar = (id: string, datos: EmpleadoNuevo) => {
    const indice = empleados.value.findIndex((empleado) => empleado.id === id)
    if (indice !== -1) empleados.value[indice] = { ...datos, id }
  }

  const eliminar = (id: string) => {
    empleados.value = empleados.value.filter((empleado) => empleado.id !== id)
  }

  const correoEnUso = (correo: string, exceptoId?: string) =>
    empleados.value.some((empleado) => empleado.correo === correo && empleado.id !== exceptoId)

  return { empleados, crear, actualizar, eliminar, correoEnUso }
}
