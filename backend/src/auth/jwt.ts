import { SignJWT, jwtVerify } from 'jose'

export type SesionTipo = 'usuario' | 'staff'

export interface SesionPayload {
  sub: string
  tipo: SesionTipo
  correo: string
  cuentaId?: string
}

function secreto() {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('Falta JWT_SECRET en .env.local')
  return new TextEncoder().encode(s)
}

export async function firmarSesion(datos: SesionPayload, dias = 14) {
  return new SignJWT({ tipo: datos.tipo, correo: datos.correo, cuentaId: datos.cuentaId })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(datos.sub)
    .setIssuedAt()
    .setExpirationTime(`${dias}d`)
    .sign(secreto())
}

export async function verificarSesion(token: string): Promise<SesionPayload> {
  const { payload } = await jwtVerify(token, secreto())
  const sub = typeof payload.sub === 'string' ? payload.sub : ''
  const tipo = payload.tipo === 'staff' ? 'staff' : payload.tipo === 'usuario' ? 'usuario' : null
  const correo = typeof payload.correo === 'string' ? payload.correo : ''
  const cuentaId = typeof payload.cuentaId === 'string' ? payload.cuentaId : undefined
  if (!sub || !tipo || !correo) throw new Error('token_invalido')
  return { sub, tipo, correo, cuentaId }
}
