import type { IncomingMessage, ServerResponse } from 'node:http'

export type Json = Record<string, unknown> | unknown[] | string | number | boolean | null

const ORIGENES = (process.env.API_ORIGENES ?? 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

export function cors(req: IncomingMessage, res: ServerResponse) {
  const origen = req.headers.origin
  if (origen && ORIGENES.includes(origen)) {
    res.setHeader('Access-Control-Allow-Origin', origen)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export function json(res: ServerResponse, codigo: number, cuerpo: Json) {
  const texto = JSON.stringify(cuerpo)
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(texto),
  })
  res.end(texto)
}

export function error(res: ServerResponse, codigo: number, mensaje: string) {
  json(res, codigo, { error: mensaje })
}

export async function leerJson(req: IncomingMessage): Promise<unknown> {
  const trozos: Buffer[] = []
  let total = 0
  const limite = 3 * 1024 * 1024
  for await (const trozo of req) {
    total += (trozo as Buffer).length
    if (total > limite) throw new Error('cuerpo_grande')
    trozos.push(trozo as Buffer)
  }
  if (!trozos.length) return {}
  try {
    return JSON.parse(Buffer.concat(trozos).toString('utf8'))
  } catch {
    throw new Error('json_invalido')
  }
}

export function bearer(req: IncomingMessage): string | null {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) return null
  const token = h.slice(7).trim()
  return token || null
}
