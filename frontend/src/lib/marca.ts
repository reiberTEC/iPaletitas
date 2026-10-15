/**
 * Marca blanca: convierte el color de un negocio (o el de su logo) en la escala 50–950
 * que usan todas las utilidades `blue-*` del sistema, de modo que el panel entero adopta su marca.
 */
import { reactive, shallowRef } from 'vue'

export const COLOR_IPALETITAS = '#2456d6'

export const PASOS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
type Paso = (typeof PASOS)[number]
export type Rampa = Record<Paso, string>

/* Luminosidad OKLCH de cada paso y cuánto croma conserva (los extremos se desaturan). */
const LUZ: Record<Paso, number> = {
  50: 0.975,
  100: 0.94,
  200: 0.885,
  300: 0.8,
  400: 0.7,
  500: 0.6,
  600: 0.52,
  700: 0.45,
  800: 0.38,
  900: 0.31,
  950: 0.23,
}
const CROMA: Record<Paso, number> = {
  50: 0.18,
  100: 0.3,
  200: 0.5,
  300: 0.75,
  400: 0.95,
  500: 1,
  600: 1,
  700: 0.92,
  800: 0.8,
  900: 0.66,
  950: 0.5,
}

type Rgb = [number, number, number]
type Oklch = [number, number, number]

const aLineal = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const aGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

export function hexARgb(hex: string): Rgb {
  const limpio = hex.replace('#', '')
  const completo = limpio.length === 3 ? [...limpio].map((c) => c + c).join('') : limpio
  const n = parseInt(completo, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function rgbAHex([r, g, b]: Rgb) {
  return `#${[r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('')}`
}

function rgbAOklch([r, g, b]: Rgb): Oklch {
  const [lr, lg, lb] = [r, g, b].map((v) => aLineal(v / 255)) as Rgb
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  return [L, Math.hypot(a, bb), ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360]
}

/** Devuelve el color en sRGB lineal sin recortar (puede salirse de 0..1). */
function oklchALineal([L, C, h]: Oklch): Rgb {
  const a = C * Math.cos((h * Math.PI) / 180)
  const b = C * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const dentroDeGama = (rgb: Rgb) => rgb.every((v) => v >= -0.0005 && v <= 1.0005)

/** Reduce el croma hasta que el color quepa en sRGB, conservando luz y tono. */
function oklchAHex([L, C, h]: Oklch) {
  let bajo = 0
  let alto = C
  if (!dentroDeGama(oklchALineal([L, C, h]))) {
    for (let i = 0; i < 18; i++) {
      const medio = (bajo + alto) / 2
      if (dentroDeGama(oklchALineal([L, medio, h]))) bajo = medio
      else alto = medio
    }
    C = bajo
  }
  return rgbAHex(oklchALineal([L, C, h]).map((v) => aGamma(Math.min(1, Math.max(0, v))) * 255) as Rgb)
}

export function rampaDe(hex: string): Rampa {
  const [, C, h] = rgbAOklch(hexARgb(hex))
  // En un gris, negro o blanco el tono es ruido de redondeo: la línea sale neutra, sin tinte.
  const croma = C < 0.015 ? 0 : Math.max(C, 0.02)
  return Object.fromEntries(PASOS.map((p) => [p, oklchAHex([LUZ[p], croma * CROMA[p], h])])) as Rampa
}

function luminancia(hex: string) {
  const [r, g, b] = hexARgb(hex).map((v) => aLineal(v / 255)) as Rgb
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contraste(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m) as [number, number]
  return (x + 0.05) / (y + 0.05)
}

/** Rampa en uso, para lo que se pinta fuera de CSS (las gráficas en canvas). */
export const rampaActual = shallowRef<Rampa>(rampaDe(COLOR_IPALETITAS))

/** Aplica la marca a toda la página (el panel, sus modales y el ticket). */
export function aplicarMarca(hex: string | null | undefined, raiz: HTMLElement = document.documentElement) {
  const rampa = rampaDe(hex || COLOR_IPALETITAS)
  for (const paso of PASOS) raiz.style.setProperty(`--marca-${paso}`, rampa[paso])
  raiz.style.setProperty('--marca', hex || COLOR_IPALETITAS)
  rampaActual.value = rampa
}

/* ---------- Lectura de colores de un logo ---------- */

function cargarImagen(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const imagen = new Image()
    imagen.onload = () => resolve(imagen)
    imagen.onerror = () => reject(new Error('No se pudo leer la imagen.'))
    imagen.src = src
  })
}

export function leerArchivo(archivo: File) {
  return new Promise<string>((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(String(lector.result))
    lector.onerror = () => reject(new Error('No se pudo abrir el archivo.'))
    lector.readAsDataURL(archivo)
  })
}

/** Reduce el logo para guardarlo sin llenar el almacenamiento del navegador. */
export async function logoReducido(src: string, lado = 256) {
  const imagen = await cargarImagen(src)
  const escala = Math.min(1, lado / Math.max(imagen.naturalWidth, imagen.naturalHeight))
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.max(1, Math.round(imagen.naturalWidth * escala))
  lienzo.height = Math.max(1, Math.round(imagen.naturalHeight * escala))
  lienzo.getContext('2d')!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height)
  return lienzo.toDataURL('image/png')
}

async function medirClaridad(src: string) {
  const imagen = await cargarImagen(src)
  const lado = 48
  const lienzo = document.createElement('canvas')
  lienzo.width = lado
  lienzo.height = lado
  const contexto = lienzo.getContext('2d', { willReadFrequently: true })!
  contexto.drawImage(imagen, 0, 0, lado, lado)
  const { data } = contexto.getImageData(0, 0, lado, lado)
  let suma = 0
  let visibles = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 160) continue
    suma += rgbAOklch([data[i]!, data[i + 1]!, data[i + 2]!])[0]
    visibles++
  }
  return visibles > 0 && suma / visibles > 0.86
}

const claridadLogos = reactive(new Map<string, boolean>())

/** Un logo casi blanco desaparece sobre fondo blanco: estos van sobre el color del negocio. */
export function logoEsClaro(src: string | null | undefined) {
  if (!src) return false
  if (!claridadLogos.has(src)) {
    claridadLogos.set(src, false)
    medirClaridad(src)
      .then((claro) => claridadLogos.set(src, claro))
      .catch(() => undefined)
  }
  return claridadLogos.get(src) ?? false
}

/**
 * Propone hasta `cuantos` colores de marca: agrupa los píxeles por tono y favorece
 * los colores frecuentes y vivos. Si el logo es blanco y negro, propone su tono más oscuro.
 */
export async function coloresDelLogo(src: string, cuantos = 5): Promise<string[]> {
  const imagen = await cargarImagen(src)
  const lado = 72
  const lienzo = document.createElement('canvas')
  lienzo.width = lado
  lienzo.height = lado
  const contexto = lienzo.getContext('2d', { willReadFrequently: true })!
  contexto.drawImage(imagen, 0, 0, lado, lado)
  const { data } = contexto.getImageData(0, 0, lado, lado)

  const cubetas = new Map<number, { r: number; g: number; b: number; n: number }>()
  let oscuro: { hex: string; luz: number } | null = null

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 160) continue
    const rgb: Rgb = [data[i]!, data[i + 1]!, data[i + 2]!]
    const [L, C] = rgbAOklch(rgb)
    if (L < 0.9 && (!oscuro || L < oscuro.luz)) oscuro = { hex: rgbAHex(rgb), luz: L }
    if (C < 0.045 || L > 0.96 || L < 0.12) continue
    const clave = ((rgb[0] >> 4) << 8) | ((rgb[1] >> 4) << 4) | (rgb[2] >> 4)
    const cubeta = cubetas.get(clave) ?? { r: 0, g: 0, b: 0, n: 0 }
    cubeta.r += rgb[0]
    cubeta.g += rgb[1]
    cubeta.b += rgb[2]
    cubeta.n++
    cubetas.set(clave, cubeta)
  }

  const candidatos = [...cubetas.values()]
    .map((c) => {
      const rgb: Rgb = [c.r / c.n, c.g / c.n, c.b / c.n]
      const [, C, h] = rgbAOklch(rgb)
      return { hex: rgbAHex(rgb), h, puntaje: c.n * (0.4 + C * 4) }
    })
    .sort((a, b) => b.puntaje - a.puntaje)

  const elegidos: typeof candidatos = []
  for (const candidato of candidatos) {
    const parecido = elegidos.some((e) => Math.min(Math.abs(e.h - candidato.h), 360 - Math.abs(e.h - candidato.h)) < 22)
    if (!parecido) elegidos.push(candidato)
    if (elegidos.length === cuantos) break
  }

  if (!elegidos.length) return oscuro ? [oscuro.hex] : [COLOR_IPALETITAS]
  return elegidos.map((e) => e.hex)
}
