/** Detección de modo app (instalada / pantalla completa), no navegador con pestañas. */

export function esAppInstalada() {
  if (typeof window === 'undefined') return false
  const modo =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches
  const iosStandalone = 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return modo || iosStandalone
}

export function marcarModoApp() {
  document.documentElement.classList.toggle('app-instalada', esAppInstalada())
  document.documentElement.dataset.plataforma = plataforma()
}

export type PlataformaCliente = 'escritorio' | 'tableta' | 'movil'

export function plataforma(): PlataformaCliente {
  const ancho = window.innerWidth
  const tactil = window.matchMedia('(pointer: coarse)').matches
  if (ancho < 640) return 'movil'
  if (ancho < 1024 || (tactil && ancho < 1280)) return 'tableta'
  return 'escritorio'
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let eventoInstalar: BeforeInstallPromptEvent | null = null
const oyentes = new Set<(disponible: boolean) => void>()

export function puedeInstalarNativo() {
  return eventoInstalar !== null
}

export function alCambiarInstalacion(fn: (disponible: boolean) => void) {
  oyentes.add(fn)
  fn(eventoInstalar !== null)
  return () => oyentes.delete(fn)
}

function avisar() {
  for (const fn of oyentes) fn(eventoInstalar !== null)
}

export function escucharInstalacion() {
  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault()
    eventoInstalar = evento as BeforeInstallPromptEvent
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    eventoInstalar = null
    marcarModoApp()
    avisar()
  })
  window.matchMedia('(display-mode: standalone)').addEventListener('change', marcarModoApp)
}

export async function pedirInstalacion() {
  if (!eventoInstalar) return false
  await eventoInstalar.prompt()
  const { outcome } = await eventoInstalar.userChoice
  eventoInstalar = null
  avisar()
  return outcome === 'accepted'
}

export function esIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
