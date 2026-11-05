import { config } from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(aqui, '../.env.local') })
config({ path: resolve(aqui, '../.env') })
