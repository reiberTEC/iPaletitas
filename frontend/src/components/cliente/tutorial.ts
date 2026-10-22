import paliPulgar from '@/assets/Img/pali-pulgar.webp'
import paliSaludando from '@/assets/Img/pali-saludando.webp'
import { estado, semanaGratis } from '@/stores/negocio'
import { puedeVer, type Seccion } from './secciones'

export interface PasoTutorial {
  id: string
  titulo: string
  texto: string
  /** Valor de `data-tour` del elemento que se resalta; sin él, la ventana sale al centro. */
  objetivo?: string
  /** Sección que se abre detrás mientras se explica. */
  seccion?: Seccion
  /** El elemento vive en el menú lateral, que en celular y tableta es un cajón que hay que abrir. */
  enMenu?: boolean
  /** Paso que solo aplica si la sesión puede ver esa sección. */
  requiere?: Seccion
  mascota?: string
  final?: boolean
}

export function pasosTutorial(): PasoTutorial[] {
  const negocio = estado.licencia?.negocio ?? 'tu negocio'
  const pasos: PasoTutorial[] = [
    {
      id: 'hola',
      seccion: 'inicio',
      titulo: `¡Bienvenido a ${negocio}!`,
      texto:
        'Te enseño cómo funciona el sistema en menos de un minuto. Puedes saltar el recorrido cuando quieras y repetirlo después desde la ayuda.',
      mascota: paliSaludando,
    },
    {
      id: 'menu',
      objetivo: 'menu',
      enMenu: true,
      titulo: 'Tu menú',
      texto:
        'Aquí están todas las secciones, agrupadas en Operación y Administración. La que tienes abierta se marca sobre la línea.',
    },
    {
      id: 'sucursal',
      objetivo: 'sucursal',
      enMenu: true,
      titulo: 'Sucursal activa',
      texto:
        'Las ventas, los productos y las existencias que ves son de esta sucursal. Si abres otro local, aquí cambias entre ellos.',
    },
    {
      id: 'venta',
      objetivo: 'vender',
      enMenu: true,
      requiere: 'venta',
      titulo: 'Punto de venta',
      texto:
        'El botón más importante: abre la caja para cobrar en efectivo, tarjeta o transferencia e imprimir el ticket.',
    },
    {
      id: 'productos',
      objetivo: 'estacion-productos',
      seccion: 'productos',
      enMenu: true,
      titulo: 'Tus productos',
      texto:
        'Te dejamos 3 productos de ejemplo: cambia sus precios, agrega los tuyos o bórralos. El número junto a Productos avisa cuando algo se está acabando.',
    },
    {
      id: 'entradas',
      objetivo: 'estacion-entradas',
      seccion: 'entradas',
      enMenu: true,
      titulo: 'Entradas de mercancía',
      texto:
        'Cuando te llegue producto, regístralo aquí: se suma a tus existencias y queda guardado el costo y el proveedor.',
    },
    {
      id: 'caducados',
      objetivo: 'estacion-caducados',
      seccion: 'caducados',
      enMenu: true,
      titulo: 'Caducados y pérdidas',
      texto:
        'Si algo se caducó o se echó a perder, aquí lo bajas del inventario: queda registrado como pérdida con su costo.',
    },
    {
      id: 'historial',
      objetivo: 'estacion-historial',
      seccion: 'historial',
      enMenu: true,
      titulo: 'Historial de ventas',
      texto: 'Cada venta con su ticket, gráficas por día, semana o mes, y cuál es tu producto estrella.',
    },
    {
      id: 'usuarios',
      objetivo: 'estacion-usuarios',
      seccion: 'usuarios',
      enMenu: true,
      titulo: 'Tu equipo',
      texto:
        'Da de alta a tus cajeros, gerentes o encargados de almacén. Cada rol ve solo lo que le toca y puedes ajustar sus permisos.',
    },
    {
      id: 'marca',
      objetivo: 'estacion-marca',
      seccion: 'marca',
      enMenu: true,
      titulo: 'Tu marca',
      texto: 'Sube tu logo y elige tu color: todo el sistema y tus tickets se pintan con él.',
    },
    {
      id: 'licencia',
      objetivo: 'estacion-licencia',
      seccion: 'licencia',
      enMenu: true,
      titulo: 'Tu licencia',
      texto: semanaGratis.value
        ? 'Tu clave, tu forma de pago y la fecha de renovación. Mientras dure tu semana gratis, desde aquí pides la devolución si no te convence.'
        : 'Tu clave, tu forma de pago y la fecha de renovación.',
    },
    {
      id: 'ayuda',
      objetivo: 'ayuda',
      seccion: 'inicio',
      titulo: '¿Te atoraste?',
      texto:
        'Aquí está la ayuda: pregúntale al asistente cómo hacer algo y te lleva a la sección, o repite este recorrido.',
    },
    {
      id: 'listo',
      titulo: '¡Listo para vender!',
      texto:
        'Ya conoces lo básico. Haz tu primera venta con los productos de ejemplo para ver cómo sale el ticket.',
      mascota: paliPulgar,
      final: true,
    },
  ]
  return pasos.filter((p) => {
    const seccion = p.requiere ?? p.seccion
    return !seccion || puedeVer(seccion)
  })
}
