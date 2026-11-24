// Arma escritorio/recursos. El panel y la API viven en el servidor; aquí solo va el ícono.
import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const recursos = join(aqui, 'recursos')

rmSync(recursos, { recursive: true, force: true })
mkdirSync(recursos, { recursive: true })
cpSync(join(aqui, '..', 'frontend', 'public', 'icons', 'icon-512.png'), join(recursos, 'icono.png'))

console.log('Recursos listos en', recursos)
