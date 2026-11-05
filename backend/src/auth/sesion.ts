import type { IncomingMessage, ServerResponse } from 'node:http'
import { query } from '../db.ts'
import { bearer, error } from '../http.ts'
import { verificarSesion } from './jwt.ts'

export interface UsuarioSesion {
  id: string
  cuentaId: string
  correo: string
  nombre: string
  rol: string
  sucursalId: string | null
}

export async function exigirUsuario(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<UsuarioSesion | null> {
  const token = bearer(req)
  if (!token) {
    error(res, 401, 'Necesitas iniciar sesión.')
    return null
  }

  let payload
  try {
    payload = await verificarSesion(token)
  } catch {
    error(res, 401, 'Sesión vencida o inválida. Vuelve a entrar.')
    return null
  }

  if (payload.tipo !== 'usuario' || !payload.cuentaId) {
    error(res, 403, 'Esta acción es solo para cuentas de negocio.')
    return null
  }

  const { rows } = await query<{
    id: string
    cuenta_id: string
    correo: string
    nombre: string
    rol: string
    activo: boolean
    sucursal_id: string | null
  }>(
    `SELECT id, cuenta_id, correo, nombre, rol::text AS rol, activo, sucursal_id
     FROM usuarios WHERE id = $1 AND cuenta_id = $2 LIMIT 1`,
    [payload.sub, payload.cuentaId],
  )

  const u = rows[0]
  if (!u?.activo) {
    error(res, 401, 'Sesión no válida.')
    return null
  }

  return {
    id: u.id,
    cuentaId: u.cuenta_id,
    correo: u.correo,
    nombre: u.nombre,
    rol: u.rol,
    sucursalId: u.sucursal_id,
  }
}
