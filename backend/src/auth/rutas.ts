import type { IncomingMessage, ServerResponse } from 'node:http'
import { pool, query } from '../db.ts'
import { bearer, error, json, leerJson } from '../http.ts'
import { generarClaveLicencia } from './claves.ts'
import { firmarSesion, verificarSesion } from './jwt.ts'
import { PERMISOS_ADMIN } from './permisos.ts'

const CORREO_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASS_MIN = 8

function limpiaCorreo(v: unknown) {
  return typeof v === 'string' ? v.trim().toLowerCase() : ''
}

function limpiaPass(v: unknown) {
  return typeof v === 'string' ? v : ''
}

function nombreDesdeCorreo(correo: string) {
  const parte = correo.split('@')[0] ?? ''
  const limpio = parte.replace(/[._-]+/g, ' ').trim()
  if (!limpio) return 'Titular'
  return limpio.replace(/\b\w/g, (c) => c.toUpperCase())
}

async function hashPassword(password: string) {
  const { rows } = await query<{ hash: string }>('SELECT crypt($1, gen_salt(\'bf\')) AS hash', [password])
  return rows[0]!.hash
}

export async function manejarAuth(req: IncomingMessage, res: ServerResponse, ruta: string) {
  if (req.method === 'POST' && ruta === '/api/auth/registro') {
    return registro(req, res)
  }
  if (req.method === 'POST' && ruta === '/api/auth/login') {
    return login(req, res)
  }
  if (req.method === 'GET' && ruta === '/api/auth/yo') {
    return yo(req, res)
  }
  error(res, 404, 'Ruta no encontrada.')
}

async function registro(req: IncomingMessage, res: ServerResponse) {
  let cuerpo: unknown
  try {
    cuerpo = await leerJson(req)
  } catch (e) {
    return error(res, 400, e instanceof Error && e.message === 'cuerpo_grande' ? 'Petición demasiado grande.' : 'JSON inválido.')
  }

  const datos = (cuerpo ?? {}) as Record<string, unknown>
  const correo = limpiaCorreo(datos.correo)
  const password = limpiaPass(datos.password)

  if (!CORREO_OK.test(correo)) return error(res, 400, 'Revisa que el correo esté bien escrito.')
  if (password.length < PASS_MIN) {
    return error(res, 400, `La contraseña debe tener al menos ${PASS_MIN} caracteres.`)
  }
  if (correo.endsWith('@ipaletitas.com')) {
    return error(res, 400, 'Ese correo es solo para el equipo de iPaletitas. Usa otro para tu negocio.')
  }

  const existe = await query(
    `SELECT 1 FROM usuarios WHERE lower(correo) = $1
     UNION ALL
     SELECT 1 FROM cuentas WHERE lower(titular_correo) = $1
     UNION ALL
     SELECT 1 FROM staff WHERE lower(correo) = $1
     LIMIT 1`,
    [correo],
  )
  if (existe.rowCount) {
    return error(res, 409, 'Ya hay una cuenta con este correo. Inicia sesión para entrar a ella.')
  }

  const passwordHash = await hashPassword(password)
  const nombre = nombreDesdeCorreo(correo)
  const clave = generarClaveLicencia()
  const vence = new Date()
  vence.setDate(vence.getDate() + 7)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const cuenta = await client.query<{ id: string }>(
      `INSERT INTO cuentas (
         negocio, giro, telefono, titular_correo, plan_id, ciclo,
         clave_licencia, vence, en_prueba, tutorial_pendiente
       ) VALUES (
         '', '', '', $1, 'basica', 'mensual',
         $2, $3, true, true
       ) RETURNING id`,
      [correo, clave, vence.toISOString()],
    )
    const cuentaId = cuenta.rows[0]!.id

    const sucursal = await client.query<{ id: string }>(
      `INSERT INTO sucursales (cuenta_id, nombre, direccion, activa)
       VALUES ($1, 'Sucursal principal', '', true)
       RETURNING id`,
      [cuentaId],
    )
    const sucursalId = sucursal.rows[0]!.id

    const usuario = await client.query<{ id: string; nombre: string; correo: string; rol: string }>(
      `INSERT INTO usuarios (
         cuenta_id, sucursal_id, nombre, correo, puesto, rol, activo, password_hash, permisos
       ) VALUES (
         $1, $2, $3, $4, 'Titular', 'Administrador', true, $5, $6::text[]
       ) RETURNING id, nombre, correo, rol::text AS rol`,
      [cuentaId, sucursalId, nombre, correo, passwordHash, [...PERMISOS_ADMIN]],
    )

    await client.query(
      `INSERT INTO bitacora (autor, accion, detalle, cuenta_id)
       VALUES ($1, 'Registró su cuenta', $2, $3)`,
      [correo, 'Cuenta pendiente de elegir plan', cuentaId],
    )

    await client.query('COMMIT')

    const u = usuario.rows[0]!
    const token = await firmarSesion({
      sub: u.id,
      tipo: 'usuario',
      correo: u.correo,
      cuentaId,
    })

    return json(res, 201, {
      token,
      tipo: 'usuario',
      usuario: {
        id: u.id,
        nombre: u.nombre,
        correo: u.correo,
        rol: u.rol,
      },
      cuenta: {
        id: cuentaId,
        activada: false,
        planId: 'basica',
        claveLicencia: clave,
      },
    })
  } catch (e) {
    await client.query('ROLLBACK')
    console.error(e)
    return error(res, 500, 'No se pudo crear la cuenta. Intenta de nuevo.')
  } finally {
    client.release()
  }
}

async function login(req: IncomingMessage, res: ServerResponse) {
  let cuerpo: unknown
  try {
    cuerpo = await leerJson(req)
  } catch {
    return error(res, 400, 'JSON inválido.')
  }

  const datos = (cuerpo ?? {}) as Record<string, unknown>
  const correo = limpiaCorreo(datos.correo)
  const password = limpiaPass(datos.password)
  const comoAdmin = Boolean(datos.comoAdmin)

  if (!CORREO_OK.test(correo) || !password) {
    return error(res, 400, 'Correo y contraseña son obligatorios.')
  }

  if (comoAdmin) {
    if (!correo.endsWith('@ipaletitas.com')) {
      return error(res, 403, 'Esta cuenta no tiene permisos de administrador. Usa un correo @ipaletitas.com.')
    }

    const { rows } = await query<{ id: string; nombre: string; correo: string }>(
      `SELECT id, nombre, correo
       FROM staff
       WHERE lower(correo) = $1
         AND activo
         AND password_hash = crypt($2, password_hash)
       LIMIT 1`,
      [correo, password],
    )
    const staff = rows[0]
    if (!staff) return error(res, 401, 'Correo o contraseña incorrectos.')

    const token = await firmarSesion({ sub: staff.id, tipo: 'staff', correo: staff.correo })
    return json(res, 200, {
      token,
      tipo: 'staff',
      usuario: { id: staff.id, nombre: staff.nombre, correo: staff.correo, rol: 'Staff' },
    })
  }

  const { rows } = await query<{
    id: string
    nombre: string
    correo: string
    rol: string
    activo: boolean
    cuenta_id: string
    negocio: string
    plan_id: string
    clave_licencia: string
    suspendida: boolean
    cancelada: boolean
  }>(
    `SELECT u.id, u.nombre, u.correo, u.rol::text AS rol, u.activo,
            c.id AS cuenta_id, c.negocio, c.plan_id::text AS plan_id,
            c.clave_licencia, c.suspendida, c.cancelada
     FROM usuarios u
     JOIN cuentas c ON c.id = u.cuenta_id
     WHERE lower(u.correo) = $1
       AND u.password_hash = crypt($2, u.password_hash)
     LIMIT 1`,
    [correo, password],
  )

  const fila = rows[0]
  if (!fila) return error(res, 401, 'Correo o contraseña incorrectos.')
  if (!fila.activo) {
    return error(res, 403, 'Tu usuario está desactivado. Habla con el administrador de tu negocio.')
  }

  const token = await firmarSesion({
    sub: fila.id,
    tipo: 'usuario',
    correo: fila.correo,
    cuentaId: fila.cuenta_id,
  })

  json(res, 200, {
    token,
    tipo: 'usuario',
    usuario: {
      id: fila.id,
      nombre: fila.nombre,
      correo: fila.correo,
      rol: fila.rol,
    },
    cuenta: {
      id: fila.cuenta_id,
      activada: Boolean(fila.negocio?.trim()),
      planId: fila.plan_id,
      claveLicencia: fila.clave_licencia,
      suspendida: fila.suspendida,
      cancelada: fila.cancelada,
    },
  })
}

async function yo(req: IncomingMessage, res: ServerResponse) {
  const token = bearer(req)
  if (!token) return error(res, 401, 'Necesitas iniciar sesión.')

  let sesion
  try {
    sesion = await verificarSesion(token)
  } catch {
    return error(res, 401, 'Sesión vencida o inválida. Vuelve a entrar.')
  }

  if (sesion.tipo === 'staff') {
    const { rows } = await query<{ id: string; nombre: string; correo: string; activo: boolean }>(
      `SELECT id, nombre, correo, activo FROM staff WHERE id = $1 LIMIT 1`,
      [sesion.sub],
    )
    const staff = rows[0]
    if (!staff?.activo) return error(res, 401, 'Sesión no válida.')
    return json(res, 200, {
      tipo: 'staff',
      usuario: { id: staff.id, nombre: staff.nombre, correo: staff.correo, rol: 'Staff' },
    })
  }

  const { rows } = await query<{
    id: string
    nombre: string
    correo: string
    rol: string
    activo: boolean
    cuenta_id: string
    negocio: string
    plan_id: string
    clave_licencia: string
    suspendida: boolean
    cancelada: boolean
  }>(
    `SELECT u.id, u.nombre, u.correo, u.rol::text AS rol, u.activo,
            c.id AS cuenta_id, c.negocio, c.plan_id::text AS plan_id,
            c.clave_licencia, c.suspendida, c.cancelada
     FROM usuarios u
     JOIN cuentas c ON c.id = u.cuenta_id
     WHERE u.id = $1
     LIMIT 1`,
    [sesion.sub],
  )
  const fila = rows[0]
  if (!fila?.activo) return error(res, 401, 'Sesión no válida.')

  json(res, 200, {
    tipo: 'usuario',
    usuario: {
      id: fila.id,
      nombre: fila.nombre,
      correo: fila.correo,
      rol: fila.rol,
    },
    cuenta: {
      id: fila.cuenta_id,
      activada: Boolean(fila.negocio?.trim()),
      planId: fila.plan_id,
      claveLicencia: fila.clave_licencia,
      suspendida: fila.suspendida,
      cancelada: fila.cancelada,
    },
  })
}
