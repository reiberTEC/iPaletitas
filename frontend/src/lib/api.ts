/** Cliente HTTP de la API. En desarrollo Vite reenvía /api al backend (8788). */

const CLAVE_TOKEN = 'ipaletitas:token'

export type TipoSesionApi = 'usuario' | 'staff'

export interface UsuarioApi {
  id: string
  nombre: string
  correo: string
  rol: string
}

export interface CuentaApi {
  id: string
  activada: boolean
  planId: string
  claveLicencia: string
  suspendida?: boolean
  cancelada?: boolean
}

export interface RespuestaAuth {
  token: string
  tipo: TipoSesionApi
  usuario: UsuarioApi
  cuenta?: CuentaApi
}

/** Estado del panel tal como lo devuelve GET /api/negocio */
export type SnapshotNegocio = Record<string, unknown>

export class ErrorApi extends Error {
  constructor(
    message: string,
    readonly codigo: number,
  ) {
    super(message)
    this.name = 'ErrorApi'
  }
}

export function guardarToken(token: string | null) {
  if (token) localStorage.setItem(CLAVE_TOKEN, token)
  else localStorage.removeItem(CLAVE_TOKEN)
}

export function leerToken() {
  return localStorage.getItem(CLAVE_TOKEN)
}

async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = leerToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let respuesta: Response
  try {
    respuesta = await fetch(ruta, { ...init, headers })
  } catch {
    throw new ErrorApi(
      'No se pudo conectar con el servidor. ¿Está corriendo la API? (cd backend && npm run dev)',
      0,
    )
  }

  const cuerpo = (await respuesta.json().catch(() => ({}))) as { error?: string }
  if (!respuesta.ok) {
    throw new ErrorApi(cuerpo.error || 'Algo salió mal. Intenta de nuevo.', respuesta.status)
  }
  return cuerpo as T
}

export function registrarApi(correo: string, password: string) {
  return pedir<RespuestaAuth>('/api/auth/registro', {
    method: 'POST',
    body: JSON.stringify({ correo, password }),
  })
}

export function loginApi(correo: string, password: string) {
  return pedir<RespuestaAuth>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo, password }),
  })
}

export function yoApi() {
  return pedir<Omit<RespuestaAuth, 'token'>>('/api/auth/yo')
}

export function obtenerNegocioApi() {
  return pedir<SnapshotNegocio>('/api/negocio')
}

export function activarLicenciaApi(datos: unknown) {
  return pedir<SnapshotNegocio>('/api/negocio/activar', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function terminarTutorialApi() {
  return pedir<SnapshotNegocio>('/api/negocio/tutorial/terminar', { method: 'POST' })
}

export function guardarMarcaApi(marca: {
  logo: string | null
  color: string | null
  iconos?: 'paleta' | 'genericos'
  ambiente?: 'clasico' | 'tinte' | 'vivo'
}) {
  return pedir<SnapshotNegocio>('/api/negocio/marca', {
    method: 'PUT',
    body: JSON.stringify(marca),
  })
}

export function quitarMarcaApi() {
  return pedir<SnapshotNegocio>('/api/negocio/marca', { method: 'DELETE' })
}

export function cambiarPlanApi(planId: string, ciclo: string) {
  return pedir<SnapshotNegocio>('/api/negocio/plan', {
    method: 'PUT',
    body: JSON.stringify({ planId, ciclo }),
  })
}

export function cambiarSucursalApi(id: string) {
  return pedir<SnapshotNegocio>('/api/negocio/sucursal-activa', {
    method: 'PUT',
    body: JSON.stringify({ id }),
  })
}

export function crearProductoApi(datos: unknown) {
  return pedir<SnapshotNegocio>('/api/negocio/productos', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function actualizarProductoApi(id: string, datos: unknown) {
  return pedir<SnapshotNegocio>(`/api/negocio/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  })
}

export function eliminarProductoApi(id: string) {
  return pedir<SnapshotNegocio>(`/api/negocio/productos/${id}`, { method: 'DELETE' })
}

export function registrarEntradaApi(datos: unknown) {
  return pedir<SnapshotNegocio>('/api/negocio/entradas', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function registrarPerdidaApi(datos: unknown) {
  return pedir<SnapshotNegocio>('/api/negocio/perdidas', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function registrarVentaApi(datos: unknown) {
  return pedir<SnapshotNegocio>('/api/negocio/ventas', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function abonarAnticipoApi(ventaId: string, datos: unknown) {
  return pedir<SnapshotNegocio>(`/api/negocio/ventas/${ventaId}/abonar`, {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function crearUsuarioApi(datos: unknown) {
  return pedir<SnapshotNegocio>('/api/negocio/usuarios', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function actualizarUsuarioApi(id: string, datos: unknown) {
  return pedir<SnapshotNegocio>(`/api/negocio/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  })
}

export function eliminarUsuarioApi(id: string) {
  return pedir<SnapshotNegocio>(`/api/negocio/usuarios/${id}`, { method: 'DELETE' })
}

export function reactivarUsuarioApi(id: string) {
  return pedir<SnapshotNegocio>(`/api/negocio/usuarios/${id}/reactivar`, { method: 'POST' })
}

export function crearSucursalApi(datos: unknown) {
  return pedir<SnapshotNegocio>('/api/negocio/sucursales', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function invitarUsuarioApi(id: string) {
  return pedir<SnapshotNegocio & { enlaceInvitacion?: string }>(`/api/negocio/usuarios/${id}/invitar`, {
    method: 'POST',
  })
}

export function olvidarPasswordApi(correo: string) {
  return pedir<{ ok: boolean; mensaje: string; enlace?: string }>('/api/auth/olvidar', {
    method: 'POST',
    body: JSON.stringify({ correo }),
  })
}

export function definirPasswordApi(token: string, password: string) {
  return pedir<{ ok: boolean; mensaje: string }>('/api/auth/definir', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}

export function cambiarPasswordApi(actual: string, nueva: string) {
  return pedir<{ ok: boolean }>('/api/auth/cambiar', {
    method: 'PUT',
    body: JSON.stringify({ actual, nueva }),
  })
}

export function estadoPagosApi() {
  return pedir<{ stripe: boolean }>('/api/pagos/estado')
}

export function crearCheckoutApi(datos: unknown) {
  return pedir<{ url: string; sessionId: string }>('/api/pagos/checkout', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function confirmarPagoApi(sessionId: string) {
  return pedir<SnapshotNegocio>('/api/pagos/confirmar', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  })
}

export function portalPagosApi() {
  return pedir<{ url: string }>('/api/pagos/portal', { method: 'POST' })
}

export function sincronizarPagosApi() {
  return pedir<SnapshotNegocio>('/api/pagos/sincronizar', { method: 'POST' })
}
