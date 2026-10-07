import paliMesero from '@/assets/Img/pali-mesero.webp'
import paliLentes from '@/assets/Img/pali-lentes.webp'
import paliPortafolio from '@/assets/Img/pali-portafolio.webp'
import paliSuper from '@/assets/Img/pali-super.webp'
import type { PlanId } from '@/stores/catalogo'

export const mascotaPlan: Record<PlanId, { src: string; alt: string }> = {
  basica: { src: paliMesero, alt: 'Pali de mesero con su charola' },
  doble: { src: paliLentes, alt: 'Pali con lentes' },
  'doble-especial': { src: paliPortafolio, alt: 'Pali ejecutivo con portafolio' },
  'especial-super': { src: paliSuper, alt: 'Pali con lentes, portafolio y charola' },
}
