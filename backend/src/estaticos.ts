import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, sep } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json',
}

/** Carpeta del build de Vue (`frontend/dist`). */
export function carpetaPublica() {
  return process.env.STATIC_DIR || join(process.cwd(), '../frontend/dist')
}

export function hayFrontend() {
  return existsSync(join(carpetaPublica(), 'index.html'))
}

function rutaSegura(raiz: string, pedida: string) {
  const limpia = decodeURIComponent(pedida.split('?')[0] ?? '/').replace(/^\/+/, '')
  const absoluta = normalize(join(raiz, limpia || 'index.html'))
  const raizNorm = normalize(raiz + sep)
  if (!absoluta.startsWith(raizNorm) && absoluta !== normalize(raiz)) return null
  return absoluta
}

/** Sirve el build del panel. SPA: rutas desconocidas → index.html. */
export function servirEstatico(req: IncomingMessage, res: ServerResponse, pathname: string): boolean {
  const raiz = carpetaPublica()
  if (!existsSync(join(raiz, 'index.html'))) return false

  let archivo = rutaSegura(raiz, pathname === '/' ? '/index.html' : pathname)
  if (!archivo) {
    res.writeHead(403)
    res.end('Forbidden')
    return true
  }

  if (!existsSync(archivo) || statSync(archivo).isDirectory()) {
    // Activos con extensión inexistente → 404; el resto es la SPA.
    if (extname(pathname)) {
      res.writeHead(404)
      res.end('Not found')
      return true
    }
    archivo = join(raiz, 'index.html')
  }

  const tipo = TIPOS[extname(archivo).toLowerCase()] ?? 'application/octet-stream'
  const esHtml = extname(archivo).toLowerCase() === '.html'
  res.writeHead(200, {
    'Content-Type': tipo,
    'Cache-Control': esHtml ? 'no-cache' : 'public, max-age=31536000, immutable',
  })
  createReadStream(archivo).pipe(res)
  return true
}
