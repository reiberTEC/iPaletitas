import { DIAS_COBRO, DIAS_GARANTIA, MESES_SIN_INTERESES, PLANES } from '@/stores/catalogo'
import { agotados, porAcabarse } from '@/stores/negocio'
import { puedeVer, type Seccion } from '@/components/cliente/secciones'
import { precio } from './formato'

export type Contexto = 'publico' | 'panel'

export type Accion = 'registro' | 'planes' | 'recorrido' | 'vender' | `ir:${Seccion}`

export interface MensajeChat {
  id: number
  autor: 'bot' | 'usuario'
  texto: string
  acciones?: Accion[]
}

export interface Respuesta {
  texto: string
  acciones: Accion[]
  sugerencias: string[]
  origen: 'ia' | 'local'
}

/** Lo que el asistente del panel sabe de la sesión. Nada de ventas, clientes ni datos de pago. */
export interface DatosPanel {
  negocio: string
  seccion: string
  plan: string
  estadoLicencia: string
  rol: string
  secciones: string[]
  productos: number
  avisosInventario: number
}

const ETIQUETAS: Record<Seccion, string> = {
  inicio: 'Inicio',
  venta: 'Punto de venta',
  productos: 'Productos',
  entradas: 'Entradas',
  caducados: 'Caducados',
  historial: 'Historial de ventas',
  usuarios: 'Usuarios',
  sucursales: 'Sucursales',
  marca: 'Mi marca',
  licencia: 'Mi licencia',
  suscripciones: 'Suscripciones',
  nosotros: 'Nosotros',
}

const SECCIONES = Object.keys(ETIQUETAS) as Seccion[]

export const etiquetaSeccion = (seccion: Seccion) => ETIQUETAS[seccion]

export function etiquetaAccion(accion: Accion) {
  if (accion === 'registro') return 'Crear cuenta gratis'
  if (accion === 'planes') return 'Ver planes'
  if (accion === 'recorrido') return 'Ver recorrido guiado'
  if (accion === 'vender') return 'Abrir punto de venta'
  return `Ir a ${ETIQUETAS[accion.slice(3) as Seccion]}`
}

function esAccion(valor: unknown): valor is Accion {
  if (typeof valor !== 'string') return false
  if (['registro', 'planes', 'recorrido', 'vender'].includes(valor)) return true
  return valor.startsWith('ir:') && SECCIONES.includes(valor.slice(3) as Seccion)
}

/** En la página pública solo hay acciones de venta; en el panel, solo lo que la sesión puede abrir. */
function accionesPermitidas(acciones: unknown[], contexto: Contexto): Accion[] {
  const validas = acciones.filter(esAccion).filter((accion) => {
    if (contexto === 'publico') return accion === 'registro' || accion === 'planes'
    if (accion === 'registro' || accion === 'planes') return false
    if (accion === 'vender') return puedeVer('venta')
    if (accion.startsWith('ir:')) return puedeVer(accion.slice(3) as Seccion)
    return true
  })
  return [...new Set(validas)].slice(0, 3)
}

/* ---------- Base de conocimiento ---------- */

interface Tema {
  contexto: Contexto | 'ambos'
  /** Palabras o raíces sin acentos; las frases de varias palabras pesan el doble. */
  claves: string[]
  texto: () => string
  acciones?: Accion[]
  sugerencias?: string[]
}

const listaPlanes = () => {
  const nombres = PLANES.map((p) => `${p.nombre} ${precio(p.precioMensual)}`)
  return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
}

const limite = (n: number, singular: string, varios: string) =>
  Number.isFinite(n) ? `${n} ${n === 1 ? singular : varios}` : `${varios} ilimitados`

const TEMAS: Tema[] = [
  {
    contexto: 'ambos',
    claves: ['hola', 'buenas', 'buen dia', 'que tal', 'hey'],
    texto: () => '¡Hola! Pregúntame lo que quieras sobre iPaletitas.',
  },
  {
    contexto: 'ambos',
    claves: ['gracias', 'genial', 'perfecto', 'excelente', 'listo'],
    texto: () => '¡Con gusto! Si te surge otra duda, aquí sigo.',
  },
  {
    contexto: 'ambos',
    claves: ['humano', 'persona', 'asesor', 'contacto', 'contactar', 'whatsapp', 'hablar con', 'soporte'],
    texto: () =>
      'Puedes escribirle al equipo de iPaletitas por WhatsApp o redes sociales; los enlaces están en "Síguenos en redes" de la página principal y en la sección Nosotros del panel.',
  },

  /* ----- Página pública: dudas antes de contratar ----- */
  {
    contexto: 'publico',
    claves: ['precio', 'cuesta', 'costo', 'plan', 'mensual', 'anual', 'tarifa'],
    texto: () =>
      `Hay ${PLANES.length} planes al mes: ${listaPlanes()}, con IVA incluido. Si pagas anual te regalamos 2 meses.`,
    acciones: ['planes', 'registro'],
    sugerencias: ['¿Cuántas sucursales puedo tener?', '¿Hay semana gratis?', '¿Cómo pago?'],
  },
  {
    contexto: 'publico',
    claves: ['gratis', 'prueba', 'devolucion', 'garantia', 'reembolso', 'semana', 'no me convence'],
    texto: () =>
      `Crear tu cuenta es gratis. Al contratar pagas tu plan y tienes una semana gratis: si en ${DIAS_GARANTIA} días no te convence, pides la devolución completa desde "Mi licencia" (una vez por cuenta).`,
    acciones: ['registro'],
    sugerencias: ['¿Cómo pago?', '¿Puedo cancelar cuando quiera?'],
  },
  {
    contexto: 'publico',
    claves: ['pago', 'pagar', 'pagas', 'tarjeta', 'renovacion', 'renueva', 'cobro', 'stripe', 'paypal', 'mercado pago'],
    texto: () =>
      `Al contratar pagas con tarjeta por Stripe. Las renovaciones se cobran solas a esa tarjeta; en Mi licencia puedes administrar el pago (cambiar tarjeta o cancelar). PayPal y Mercado Pago aún no están. Si un cobro no pasa, tienes ${DIAS_COBRO} días antes de que se suspenda.`,
    sugerencias: ['¿Hay semana gratis?', '¿Tienen cupones?'],
  },
  {
    contexto: 'publico',
    claves: ['cupon', 'descuento', 'promocion', 'codigo'],
    texto: () => 'Sí: al pagar puedes escribir un cupón y se descuenta de tu primer pago. Las renovaciones van a precio normal.',
    sugerencias: ['¿Cuánto cuesta?'],
  },
  {
    contexto: 'publico',
    claves: ['sucursal', 'local', 'locales', 'negocios', 'tiendas'],
    texto: () =>
      `Depende del plan: ${PLANES.map((p) => `${p.nombre}, ${limite(p.limites.sucursales, 'sucursal', 'sucursales')}`).join('; ')}. Cada sucursal lleva su propio inventario y sus ventas.`,
    acciones: ['planes'],
    sugerencias: ['¿Cuántos usuarios incluye?', '¿Cuánto cuesta?'],
  },
  {
    contexto: 'publico',
    claves: ['usuario', 'emplead', 'cajer', 'rol', 'permiso', 'equipo', 'trabajador'],
    texto: () =>
      `Das de alta a tu equipo con roles como cajero, gerente o almacén, y cada quien ve solo lo que le toca. Por plan: ${PLANES.map((p) => `${p.nombre}, ${limite(p.limites.usuarios, 'usuario', 'usuarios')}`).join('; ')}.`,
    acciones: ['planes'],
  },
  {
    contexto: 'publico',
    claves: ['celular', 'telefono', 'tablet', 'movil', 'computadora', 'internet', 'app', 'aplicacion', 'instalar', 'descargar'],
    texto: () =>
      'Sí. Es una plataforma web: entras desde el navegador de tu computadora, tablet o teléfono, sin instalar nada.',
    sugerencias: ['¿Qué incluye?', 'Crear cuenta'],
  },
  {
    contexto: 'publico',
    claves: ['ticket', 'comprobante', 'imprimir', 'impresora', 'recibo'],
    texto: () => 'Al cobrar se genera el ticket al momento, con tu logo, y queda guardado en el historial para reimprimirlo.',
  },
  {
    contexto: 'publico',
    claves: ['inventario', 'existencia', 'stock', 'surtir', 'agotado', 'proveedor', 'mercancia'],
    texto: () =>
      'Cada venta descuenta del inventario y cada entrada de mercancía lo suma. Te avisamos cuando un producto está por acabarse o se agotó.',
  },
  {
    contexto: 'publico',
    claves: ['factura', 'facturacion', 'cfdi', 'sat'],
    texto: () =>
      'Hoy iPaletitas no emite CFDI. Llevas ventas, inventario y caducados; la factura al SAT la haces con tu contador o un PAC. Si buscas techos de uso, mira los planes.',
    acciones: ['planes'],
  },
  {
    contexto: 'publico',
    claves: ['cancelar', 'cancelo', 'baja', 'dar de baja', 'plazo forzoso', 'contrato', 'cambiar de plan'],
    texto: () =>
      `No hay plazo forzoso: cambias de plan cuando quieras desde Suscripciones. Y si en tu semana gratis (${DIAS_GARANTIA} días) no te convence, pides la devolución completa.`,
  },
  {
    contexto: 'publico',
    claves: ['logo', 'color', 'marca', 'personalizar', 'colores'],
    texto: () => 'Sí: subes tu logo y eliges tu color, y todo el sistema y tus tickets se pintan con él.',
  },
  {
    contexto: 'publico',
    claves: ['banco', 'contabilidad', 'marketing', 'nomina', 'contador'],
    texto: () =>
      'Eso queda fuera de iPaletitas: no nos conectamos con bancos ni llevamos contabilidad, nómina o campañas de marketing.',
  },
  {
    contexto: 'publico',
    claves: ['crear cuenta', 'registr', 'empezar', 'comenzar', 'abrir cuenta', 'darme de alta', 'inscrib'],
    texto: () =>
      'Crear tu cuenta toma un minuto y es gratis. Te dejamos 3 productos de ejemplo y un recorrido guiado para que vendas desde el primer día.',
    acciones: ['registro'],
  },
  // Va al final de los temas públicos: en un empate gana el tema más específico.
  {
    contexto: 'publico',
    claves: ['incluye', 'sirve', 'funciones', 'modulo', 'que hace', 'que ofrece', 'caracteristicas', 'para que'],
    texto: () =>
      'Con iPaletitas cobras con ticket, controlas tu inventario y las entradas de mercancía, ves tu historial de ventas con gráficas y das acceso a tu equipo con permisos por rol. También le pones tu logo y tus colores.',
    sugerencias: ['¿Cuánto cuesta?', '¿Funciona en celular?', '¿Hay semana gratis?'],
  },

  /* ----- Panel: cómo hacer las cosas ----- */
  {
    contexto: 'panel',
    claves: ['vend', 'venta', 'cobr', 'caja', 'punto de venta', 'efectivo', 'transferencia', 'tarjeta'],
    texto: () =>
      'Abre el Punto de venta, toca los productos para agregarlos al ticket, elige efectivo, tarjeta o transferencia y presiona Cobrar. El ticket sale al momento.',
    acciones: ['vender'],
    sugerencias: ['¿Cómo hago un anticipo?', '¿Cómo reimprimo un ticket?'],
  },
  {
    contexto: 'panel',
    claves: ['anticipo', 'apartado', 'abono', 'pedido', 'encargo'],
    texto: () =>
      'En el Punto de venta activa "Venta con anticipo": el cliente paga una parte ahora y el resto después. Los pendientes los ves en el botón Anticipos.',
    acciones: ['vender'],
  },
  {
    contexto: 'panel',
    claves: ['agregar producto', 'nuevo producto', 'alta de producto', 'producto', 'precio', 'catalogo'],
    texto: () =>
      'En Productos presiona "Nuevo producto" y llena nombre, categoría, precio, costo y existencia mínima. Con el lápiz editas uno y desde ahí también lo borras.',
    acciones: ['ir:productos'],
    sugerencias: ['¿Qué se está acabando?', '¿Cómo registro mercancía?'],
  },
  {
    contexto: 'panel',
    claves: ['agotado', 'acabando', 'acabar', 'stock', 'existencia', 'minimo', 'inventario', 'falta', 'quedan'],
    texto: () => {
      const bajos = porAcabarse.value.map((p) => p.nombre)
      const sin = agotados.value.map((p) => p.nombre)
      if (!bajos.length && !sin.length) return 'Por ahora todo tu inventario está por arriba del mínimo.'
      const partes = []
      if (sin.length) partes.push(`agotados: ${sin.slice(0, 4).join(', ')}`)
      if (bajos.length) partes.push(`por acabarse: ${bajos.slice(0, 4).join(', ')}`)
      return `En esta sucursal tienes ${partes.join('; ')}. Desde Productos usa "Surtir" o registra una entrada.`
    },
    acciones: ['ir:productos', 'ir:entradas'],
  },
  {
    contexto: 'panel',
    claves: ['entrada', 'surtir', 'llego', 'mercancia', 'proveedor', 'compra', 'resurtir'],
    texto: () =>
      'En Entradas registra lo que te llegó: producto, cantidad, costo y proveedor. Se suma a tus existencias al guardar.',
    acciones: ['ir:entradas'],
  },
  {
    contexto: 'panel',
    claves: ['caduc', 'vencid', 'perdida', 'pérdida', 'merma', 'descompos', 'echar a perder', 'tirar'],
    texto: () =>
      'En Caducados ves lo que ya venció o está por vencer. Ahí lo pasas a pérdida: se baja del inventario y queda el costo registrado.',
    acciones: ['ir:caducados'],
    sugerencias: ['¿Cómo agrego la fecha de caducidad?', '¿Cómo hago una venta?'],
  },
  {
    contexto: 'panel',
    claves: ['historial', 'reporte', 'cuanto vendi', 'grafica', 'corte', 'estrella', 'ganancia', 'ventas del dia'],
    texto: () =>
      'En Historial de ventas ves cada venta con su ticket, gráficas por día, semana o mes y tu producto estrella.',
    acciones: ['ir:historial'],
  },
  {
    contexto: 'panel',
    claves: ['ticket', 'reimprimir', 'imprimir', 'comprobante', 'recibo'],
    texto: () => 'Busca la venta en Historial de ventas y ábrela: desde ahí vuelves a imprimir su ticket.',
    acciones: ['ir:historial'],
  },
  {
    contexto: 'panel',
    claves: ['usuario', 'emplead', 'cajer', 'rol', 'permiso', 'contrasena', 'equipo', 'acceso', 'trabajador', 'gerente'],
    texto: () =>
      'En Usuarios presiona "Nuevo usuario", elige su rol (cajero, gerente, almacén…) y ajusta sus permisos. Cada quien entra con su correo y contraseña.',
    acciones: ['ir:usuarios'],
  },
  {
    contexto: 'panel',
    claves: ['sucursal', 'sucursales', 'local', 'otra tienda', 'cambiar de sucursal'],
    texto: () =>
      'Cambias de sucursal con el selector arriba del menú. Para abrir una nueva ve a Sucursales; el número que puedes tener depende de tu plan.',
    acciones: ['ir:sucursales'],
  },
  {
    contexto: 'panel',
    claves: ['logo', 'color', 'marca', 'personalizar', 'colores'],
    texto: () => 'En Mi marca subes tu logo y eliges tu color; el sistema y tus tickets se pintan con él.',
    acciones: ['ir:marca'],
  },
  {
    contexto: 'panel',
    claves: ['plan', 'mejorar', 'cambiar plan', 'suscripcion', 'limite', 'subir de plan'],
    texto: () => 'En Suscripciones comparas los planes, ves qué incluye cada uno y cambias el tuyo.',
    acciones: ['ir:suscripciones'],
  },
  {
    contexto: 'panel',
    claves: ['licencia', 'clave', 'vence', 'vencimiento', 'renovacion', 'renueva', 'mi tarjeta', 'cambiar tarjeta', 'pago', 'mensualidad'],
    texto: () =>
      `En Mi licencia ves tu clave, tu tarjeta y la fecha de renovación. Si un cobro no pasa, tienes ${DIAS_COBRO} días para pagar antes de que se suspenda.`,
    acciones: ['ir:licencia'],
  },
  {
    contexto: 'panel',
    claves: ['devolucion', 'reembolso', 'semana gratis', 'garantia', 'cancelar', 'baja'],
    texto: () =>
      `Durante tu semana gratis (${DIAS_GARANTIA} días desde el primer pago) pides la devolución completa desde Mi licencia, una sola vez por cuenta.`,
    acciones: ['ir:licencia'],
  },
  {
    contexto: 'panel',
    claves: ['recorrido', 'tutorial', 'tour', 'guia', 'como funciona', 'no se usar', 'empezar', 'ensenar'],
    texto: () => 'Te puedo volver a mostrar el recorrido guiado: en un minuto te enseña cada parte del panel.',
    acciones: ['recorrido'],
  },
]

const SUGERENCIAS_INICIALES: Record<Contexto, string[]> = {
  publico: ['¿Qué incluye?', '¿Cuánto cuesta?', '¿Funciona en celular?', 'Crear cuenta'],
  panel: ['¿Cómo hago una venta?', '¿Cómo agrego un producto?', '¿Qué se está acabando?', 'Agregar a mi equipo'],
}

export const sugerenciasIniciales = (contexto: Contexto) => SUGERENCIAS_INICIALES[contexto]

export function saludo(contexto: Contexto) {
  return contexto === 'publico'
    ? '¡Hola! Soy el asistente de iPaletitas. ¿En qué te puedo ayudar hoy?'
    : '¡Hola! Pregúntame cómo hacer algo en el sistema y te llevo a la sección.'
}

export function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Gana el tema con más claves presentes; una palabra cuenta si empieza con la clave ("planes" ← "plan"). */
export function responderLocal(pregunta: string, contexto: Contexto): Respuesta {
  const texto = normalizar(pregunta)
  const palabras = texto.split(' ')
  let mejor: Tema | null = null
  let puntos = 0

  for (const tema of TEMAS) {
    if (tema.contexto !== 'ambos' && tema.contexto !== contexto) continue
    const suma = tema.claves.reduce((total, clave) => {
      if (clave.includes(' ')) return total + (texto.includes(clave) ? 2 : 0)
      return total + (palabras.some((p) => p.startsWith(clave)) ? 1 : 0)
    }, 0)
    if (suma > puntos) {
      mejor = tema
      puntos = suma
    }
  }

  if (!mejor) {
    return {
      texto:
        contexto === 'publico'
          ? 'Esa no me la sé todavía. Puedo contarte de precios, la semana gratis, sucursales o cómo funciona; o escríbele al equipo por WhatsApp desde "Síguenos en redes".'
          : 'No estoy seguro de eso. Puedo explicarte cómo vender, manejar productos e inventario, tu equipo o tu plan; o repasa el recorrido guiado.',
      acciones: accionesPermitidas(contexto === 'publico' ? ['planes'] : ['recorrido'], contexto),
      sugerencias: SUGERENCIAS_INICIALES[contexto],
      origen: 'local',
    }
  }

  return {
    texto: mejor.texto(),
    acciones: accionesPermitidas(mejor.acciones ?? [], contexto),
    sugerencias: mejor.sugerencias ?? SUGERENCIAS_INICIALES[contexto],
    origen: 'local',
  }
}

/* ---------- IA: un servidor propio guarda la clave del modelo; si no contesta, responde la base local ---------- */

const URL_IA = import.meta.env.VITE_ASISTENTE_URL || '/api/asistente'
const ESPERA_TRAS_FALLA = 2 * 60_000
let iaCaidaHasta = 0

function hechos() {
  return {
    planes: PLANES.map((p) => ({
      nombre: p.nombre,
      precioMensual: p.precioMensual,
      sucursales: Number.isFinite(p.limites.sucursales) ? p.limites.sucursales : null,
      usuarios: Number.isFinite(p.limites.usuarios) ? p.limites.usuarios : null,
      incluye: p.incluye,
    })),
    diasGarantia: DIAS_GARANTIA,
    diasCobro: DIAS_COBRO,
    mesesSinIntereses: [...MESES_SIN_INTERESES],
  }
}

async function preguntarIA(
  historial: MensajeChat[],
  contexto: Contexto,
  panel?: DatosPanel,
): Promise<{ texto: string; acciones: Accion[] } | null> {
  if (Date.now() < iaCaidaHasta) return null
  try {
    const respuesta = await fetch(URL_IA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contexto,
        mensajes: historial.slice(-10).map((m) => ({ rol: m.autor === 'bot' ? 'asistente' : 'usuario', texto: m.texto })),
        hechos: hechos(),
        panel,
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!respuesta.ok) throw new Error(String(respuesta.status))
    const datos = (await respuesta.json()) as { texto?: unknown; acciones?: unknown }
    if (typeof datos.texto !== 'string' || !datos.texto.trim()) throw new Error('vacía')
    return {
      texto: datos.texto.trim(),
      acciones: accionesPermitidas(Array.isArray(datos.acciones) ? datos.acciones : [], contexto),
    }
  } catch {
    iaCaidaHasta = Date.now() + ESPERA_TRAS_FALLA
    return null
  }
}

export async function preguntar(historial: MensajeChat[], contexto: Contexto, panel?: DatosPanel): Promise<Respuesta> {
  const pregunta = historial.at(-1)?.texto ?? ''
  const local = responderLocal(pregunta, contexto)
  const ia = await preguntarIA(historial, contexto, panel)
  if (!ia) return local
  return { texto: ia.texto, acciones: ia.acciones, sugerencias: local.sugerencias, origen: 'ia' }
}
