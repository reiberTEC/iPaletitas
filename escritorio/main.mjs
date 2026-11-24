import { app, BrowserWindow, dialog, Menu, session, shell } from 'electron'
import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const RECURSOS = app.isPackaged ? join(process.resourcesPath, 'recursos') : join(aqui, 'recursos')
const SERVIDOR_PREDETERMINADO = 'https://ipaletitas.onrender.com'

// Stripe tiene que abrirse dentro de la ventana para que, al pagar, regrese al panel.
const DOMINIOS_PAGO = ['checkout.stripe.com', 'billing.stripe.com', 'pay.stripe.com']

app.setName('iPaletitas')
app.setAppUserModelId('com.reibertec.ipaletitas')

const DATOS = app.getPath('userData')
const ARCHIVO_CONFIG = join(DATOS, 'config.json')
const ARCHIVO_REGISTRO = join(DATOS, 'registro.log')

mkdirSync(DATOS, { recursive: true })
if (existsSync(ARCHIVO_REGISTRO) && statSync(ARCHIVO_REGISTRO).size > 2_000_000) writeFileSync(ARCHIVO_REGISTRO, '')

function registrar(...partes) {
  const linea = `[${new Date().toISOString()}] ${partes.map(String).join(' ')}`.trimEnd()
  console.log(linea)
  try {
    appendFileSync(ARCHIVO_REGISTRO, linea + '\n')
  } catch {
    /* el registro nunca debe tumbar la app */
  }
}

function leerConfig() {
  let config = {}
  try {
    config = JSON.parse(readFileSync(ARCHIVO_CONFIG, 'utf8'))
  } catch {
    /* primera vez */
  }
  if (!config.servidor) {
    config.servidor = SERVIDOR_PREDETERMINADO
    writeFileSync(ARCHIVO_CONFIG, JSON.stringify(config, null, 2))
  }
  return config
}

const config = leerConfig()
const SERVIDOR = String(config.servidor).replace(/\/+$/, '')
const ORIGEN = new URL(SERVIDOR).origin

let ventana = null

function esDelServidor(url) {
  try {
    return new URL(url).origin === ORIGEN
  } catch {
    return false
  }
}

function esDePago(url) {
  try {
    return DOMINIOS_PAGO.includes(new URL(url).hostname)
  } catch {
    return false
  }
}

function avisar(texto) {
  registrar(texto)
  ventana?.webContents
    .executeJavaScript(`window.avisar && window.avisar(${JSON.stringify(texto)})`)
    .catch(() => {})
}

/** Render en plan gratis se duerme; la primera petición puede tardar cerca de un minuto. */
async function esperarServidor() {
  const limite = Date.now() + 90_000
  let intento = 0
  while (Date.now() < limite) {
    intento += 1
    try {
      const r = await fetch(`${SERVIDOR}/api/salud`, { signal: AbortSignal.timeout(20_000) })
      if (r.ok) return true
      registrar('Servidor respondió', r.status)
    } catch (e) {
      registrar('Servidor sin respuesta:', e instanceof Error ? e.message : e)
    }
    if (intento === 1) avisar('Despertando el servidor… puede tardar hasta un minuto.')
    await new Promise((r) => setTimeout(r, 2_000))
  }
  return false
}

async function conectar() {
  await ventana?.loadFile(join(aqui, 'arranque.html'))
  avisar('Conectando con tu cuenta…')
  while (!(await esperarServidor())) {
    const { response } = await dialog.showMessageBox(ventana, {
      type: 'warning',
      title: 'iPaletitas',
      message: 'No se pudo conectar con el servidor.',
      detail: `Revisa tu conexión a internet.\n\nServidor: ${SERVIDOR}`,
      buttons: ['Reintentar', 'Salir'],
      defaultId: 0,
      cancelId: 1,
    })
    if (response === 1) {
      app.quit()
      return
    }
    avisar('Conectando con tu cuenta…')
  }
  avisar('Listo.')
  await ventana?.loadURL(SERVIDOR)
}

function crearVentana() {
  ventana = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    title: 'iPaletitas',
    icon: join(RECURSOS, 'icono.png'),
    backgroundColor: '#0b0f17',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  })
  ventana.once('ready-to-show', () => ventana?.show())
  ventana.on('closed', () => (ventana = null))

  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (!esDelServidor(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  ventana.webContents.on('will-navigate', (evento, url) => {
    if (esDelServidor(url) || esDePago(url) || url.startsWith('file:')) return
    evento.preventDefault()
    shell.openExternal(url)
  })
  ventana.webContents.on('did-fail-load', (_e, codigo, descripcion, url, principal) => {
    // -3 es una carga cancelada por otra navegación, no un fallo de red.
    if (!principal || codigo === -3 || !esDelServidor(url)) return
    registrar('No cargó el panel:', codigo, descripcion)
    conectar()
  })
}

function crearMenu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'Ver',
        submenu: [
          { role: 'reload', label: 'Recargar' },
          { role: 'forceReload', label: 'Recargar sin caché' },
          { type: 'separator' },
          { role: 'resetZoom', label: 'Tamaño normal' },
          { role: 'zoomIn', label: 'Acercar' },
          { role: 'zoomOut', label: 'Alejar' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: 'Pantalla completa' },
          { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
        ],
      },
      {
        label: 'Ayuda',
        submenu: [
          { label: 'Abrir iPaletitas en el navegador', click: () => shell.openExternal(SERVIDOR) },
          { type: 'separator' },
          { label: 'Abrir carpeta de configuración', click: () => shell.openPath(DATOS) },
          { label: 'Abrir registro', click: () => shell.openPath(ARCHIVO_REGISTRO) },
        ],
      },
    ]),
  )
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!ventana) return
    if (ventana.isMinimized()) ventana.restore()
    ventana.focus()
  })

  app.whenReady().then(async () => {
    // El panel lee esta marca (frontend/src/lib/plataforma.ts) para abrir en el login y no en la página web.
    session.defaultSession.setUserAgent(
      `${session.defaultSession.getUserAgent()} iPaletitasEscritorio/${app.getVersion()}`,
    )
    crearMenu()
    crearVentana()
    registrar('Servidor:', SERVIDOR)
    await conectar()
  })

  app.on('window-all-closed', () => app.quit())
}
