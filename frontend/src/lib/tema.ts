import { ref, watch } from 'vue'

export type Tema = 'claro' | 'oscuro'

const CLAVE_TEMA = 'ipaletitas:tema'

function temaGuardado(): Tema {
  try {
    return localStorage.getItem(CLAVE_TEMA) === 'oscuro' ? 'oscuro' : 'claro'
  } catch {
    return 'claro'
  }
}

export const tema = ref<Tema>(temaGuardado())

watch(
  tema,
  (valor) => {
    document.documentElement.classList.toggle('oscuro', valor === 'oscuro')
    // La barra del navegador en el teléfono sigue el fondo del encabezado.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', valor === 'oscuro' ? '#0b0f17' : '#ffffff')
    localStorage.setItem(CLAVE_TEMA, valor)
  },
  { immediate: true },
)

export function alternarTema() {
  tema.value = tema.value === 'oscuro' ? 'claro' : 'oscuro'
}
