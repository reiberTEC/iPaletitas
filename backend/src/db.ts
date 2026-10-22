import './cargar-env.ts'
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL. Copia backend/.env.example a backend/.env.local y pon tu contraseña.')
  process.exit(1)
}

export const pool = new pg.Pool({
  connectionString: url,
  max: 10,
})

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
) {
  return pool.query<T>(text, params)
}
