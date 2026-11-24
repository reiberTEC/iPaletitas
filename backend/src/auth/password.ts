import { createHash, randomBytes } from 'node:crypto'
import { query } from '../db.ts'

function frontendUrl() {
  return (process.env.FRONTEND_URL ?? 'http://localhost:8788').replace(/\/+$/, '')
}

let tablaTokensLista = false

/** La tabla vive en 003_auth_pagos.sql, que Docker solo corre al crear el volumen. */
export async function asegurarTablaPasswordTokens() {
  if (tablaTokensLista) return
  await query(`CREATE TABLE IF NOT EXISTS password_tokens (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id   uuid REFERENCES usuarios (id) ON DELETE CASCADE,
    staff_id     uuid REFERENCES staff (id) ON DELETE CASCADE,
    token_hash   text NOT NULL,
    proposito    text NOT NULL,
    vence        timestamptz NOT NULL,
    usado_en     timestamptz,
    creado_en    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT password_tokens_sujeto_chk CHECK (
      (usuario_id IS NOT NULL AND staff_id IS NULL)
      OR (usuario_id IS NULL AND staff_id IS NOT NULL)
    )
  )`)
  await query(`ALTER TABLE password_tokens DROP CONSTRAINT IF EXISTS password_tokens_proposito_check`)
  await query(
    `ALTER TABLE password_tokens
     ADD CONSTRAINT password_tokens_proposito_check
     CHECK (proposito IN ('recuperar', 'invitar'))`,
  )
  await query(
    `CREATE INDEX IF NOT EXISTS password_tokens_hash_idx ON password_tokens (token_hash) WHERE usado_en IS NULL`,
  )
  await query(
    `CREATE INDEX IF NOT EXISTS password_tokens_usuario_idx ON password_tokens (usuario_id) WHERE usado_en IS NULL`,
  )
  tablaTokensLista = true
}

const PASS_MIN = 8
const HORAS_RECUPERAR = 2
const DIAS_INVITAR = 7

export { PASS_MIN }

export async function hashPassword(password: string) {
  const { rows } = await query<{ hash: string }>(`SELECT crypt($1, gen_salt('bf')) AS hash`, [password])
  return rows[0]!.hash
}

/** Contraseña aleatoria imposible de adivinar hasta que definan una con el enlace. */
export function passwordTemporal() {
  return randomBytes(24).toString('base64url')
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function generarTokenPlano() {
  return randomBytes(32).toString('base64url')
}

export function enlaceDefinir(token: string) {
  return `${frontendUrl()}/?definir=${encodeURIComponent(token)}`
}

export async function crearTokenPassword(opts: {
  usuarioId?: string
  staffId?: string
  proposito: 'recuperar' | 'invitar'
}) {
  await asegurarTablaPasswordTokens()
  const token = generarTokenPlano()
  const horas = opts.proposito === 'invitar' ? DIAS_INVITAR * 24 : HORAS_RECUPERAR
  const vence = new Date(Date.now() + horas * 3_600_000)

  // Invalida tokens previos del mismo sujeto y propósito.
  if (opts.usuarioId) {
    await query(
      `UPDATE password_tokens SET usado_en = now()
       WHERE usuario_id = $1 AND proposito = $2 AND usado_en IS NULL`,
      [opts.usuarioId, opts.proposito],
    )
    await query(
      `INSERT INTO password_tokens (usuario_id, token_hash, proposito, vence)
       VALUES ($1, $2, $3, $4)`,
      [opts.usuarioId, hashToken(token), opts.proposito, vence.toISOString()],
    )
  } else if (opts.staffId) {
    await query(
      `UPDATE password_tokens SET usado_en = now()
       WHERE staff_id = $1 AND proposito = $2 AND usado_en IS NULL`,
      [opts.staffId, opts.proposito],
    )
    await query(
      `INSERT INTO password_tokens (staff_id, token_hash, proposito, vence)
       VALUES ($1, $2, $3, $4)`,
      [opts.staffId, hashToken(token), opts.proposito, vence.toISOString()],
    )
  } else {
    throw new Error('token_sin_sujeto')
  }

  return { token, enlace: enlaceDefinir(token), vence }
}

export async function consumirTokenPassword(tokenPlano: string, nuevaPassword: string) {
  if (nuevaPassword.length < PASS_MIN) {
    return { ok: false as const, error: `La contraseña debe tener al menos ${PASS_MIN} caracteres.` }
  }

  const { rows } = await query<{
    id: string
    usuario_id: string | null
    staff_id: string | null
    vence: Date
    usado_en: Date | null
  }>(
    `SELECT id, usuario_id, staff_id, vence, usado_en
     FROM password_tokens
     WHERE token_hash = $1
     LIMIT 1`,
    [hashToken(tokenPlano)],
  )

  const fila = rows[0]
  if (!fila || fila.usado_en) return { ok: false as const, error: 'Este enlace ya se usó o no es válido.' }
  if (new Date(fila.vence).getTime() < Date.now()) {
    return { ok: false as const, error: 'Este enlace ya venció. Pide uno nuevo.' }
  }

  const hash = await hashPassword(nuevaPassword)
  if (fila.usuario_id) {
    await query(`UPDATE usuarios SET password_hash = $2, actualizado_en = now() WHERE id = $1`, [
      fila.usuario_id,
      hash,
    ])
  } else if (fila.staff_id) {
    await query(`UPDATE staff SET password_hash = $2 WHERE id = $1`, [fila.staff_id, hash])
  }

  await query(`UPDATE password_tokens SET usado_en = now() WHERE id = $1`, [fila.id])
  return { ok: true as const }
}
