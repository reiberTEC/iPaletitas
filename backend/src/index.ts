import './cargar-env.ts'
import { createServer } from 'node:http'
import { manejarAuth } from './auth/rutas.ts'
import { query } from './db.ts'
import { cors, error, json } from './http.ts'
import { manejarNegocio } from './negocio/rutas.ts'

const PUERTO = Number(process.env.API_PUERTO ?? 8788)

const servidor = createServer(async (req, res) => {
  cors(req, res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const ruta = url.pathname.replace(/\/+$/, '') || '/'

  try {
    if (req.method === 'GET' && ruta === '/api/salud') {
      await query('SELECT 1')
      return json(res, 200, { ok: true, servicio: 'ipaletitas-api' })
    }

    if (ruta.startsWith('/api/auth')) {
      return await manejarAuth(req, res, ruta)
    }

    if (ruta.startsWith('/api/negocio')) {
      return await manejarNegocio(req, res, ruta)
    }

    error(res, 404, 'Ruta no encontrada.')
  } catch (e) {
    console.error(e)
    error(res, 500, 'Error interno del servidor.')
  }
})

servidor.listen(PUERTO, '127.0.0.1', () => {
  console.log(`API iPaletitas en http://127.0.0.1:${PUERTO}`)
  console.log('  Auth + /api/negocio (panel)')
})
