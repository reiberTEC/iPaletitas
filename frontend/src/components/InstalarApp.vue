<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Download, Monitor, Smartphone, Tablet } from '@lucide/vue'
import UiButton from './ui/Button.vue'
import {
  alCambiarInstalacion,
  esAppInstalada,
  esIos,
  pedirInstalacion,
  puedeInstalarNativo,
} from '@/lib/app'

const instalada = ref(esAppInstalada())
const disponible = ref(puedeInstalarNativo())
const instalando = ref(false)
const ios = ref(false)
let dejarDeEscuchar: (() => void) | undefined

onMounted(() => {
  ios.value = esIos()
  instalada.value = esAppInstalada()
  dejarDeEscuchar = alCambiarInstalacion((ok) => {
    disponible.value = ok
    instalada.value = esAppInstalada()
  })
})

onBeforeUnmount(() => dejarDeEscuchar?.())

async function instalar() {
  instalando.value = true
  try {
    await pedirInstalacion()
    instalada.value = esAppInstalada()
  } finally {
    instalando.value = false
  }
}
</script>

<template>
  <section id="descargar" class="instalar" aria-labelledby="titulo-descargar">
    <div class="instalar-texto">
      <p class="instalar-ojo">Aplicación</p>
      <h2 id="titulo-descargar" class="font-display" data-revela>Instálala en tu caja, tablet o celular</h2>
      <p data-revela style="--i: 1">
        iPaletitas no es una página para navegar: es la app de tu mostrador. La instalas una vez y la abres como
        cualquier otra aplicación, a pantalla completa, en escritorio, tableta o móvil.
      </p>

      <ul class="instalar-dispositivos" data-revela style="--i: 2">
        <li>
          <Monitor class="size-5" aria-hidden="true" />
          <span><strong>Escritorio</strong> — Windows o Mac, botón Instalar en el navegador o aquí abajo.</span>
        </li>
        <li>
          <Tablet class="size-5" aria-hidden="true" />
          <span><strong>Tableta</strong> — ideal en el mostrador; pantalla completa sin barras del navegador.</span>
        </li>
        <li>
          <Smartphone class="size-5" aria-hidden="true" />
          <span><strong>Celular</strong> — consulta ventas y stock; en iPhone: Compartir → “Añadir a pantalla de inicio”.</span>
        </li>
      </ul>

      <div class="instalar-accion" data-revela style="--i: 3">
        <p v-if="instalada" class="instalar-ok" role="status">Ya la tienes instalada. Ábrela desde tu menú de aplicaciones o la pantalla de inicio.</p>
        <template v-else-if="disponible">
          <UiButton size="lg" :disabled="instalando" @click="instalar">
            <Download class="size-5" aria-hidden="true" />
            {{ instalando ? 'Instalando…' : 'Instalar aplicación' }}
          </UiButton>
          <p class="instalar-ayuda">Se descarga en este dispositivo y queda en tu lista de apps.</p>
        </template>
        <template v-else-if="ios">
          <p class="instalar-pasos">
            En iPhone o iPad: toca <strong>Compartir</strong> → <strong>Añadir a pantalla de inicio</strong> → Añadir.
          </p>
        </template>
        <template v-else>
          <p class="instalar-pasos">
            En Chrome o Edge: menú <strong>⋮</strong> → <strong>Instalar iPaletitas</strong> (o el ícono ⊕ en la barra de
            dirección). En Android también puedes usar “Añadir a la pantalla de inicio”.
          </p>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.instalar {
  margin: 0 auto;
  max-width: 52rem;
  padding: 4rem 1.25rem 5rem;
}

.instalar-ojo {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--linea-negocio, #295bdc) 85%, #475569);
}

.instalar h2 {
  margin: 0 0 0.75rem;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #0f172a;
}

.instalar > .instalar-texto > p {
  margin: 0 0 1.5rem;
  max-width: 42rem;
  line-height: 1.55;
  color: #475569;
}

.instalar-dispositivos {
  margin: 0 0 1.75rem;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.85rem;
}

.instalar-dispositivos li {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  background: color-mix(in srgb, var(--linea-negocio, #295bdc) 6%, #f8fafc);
  color: #334155;
  font-size: 0.95rem;
  line-height: 1.45;
}

.instalar-dispositivos li :deep(svg) {
  flex-shrink: 0;
  margin-top: 0.15rem;
  color: var(--linea-negocio, #295bdc);
}

.instalar-accion {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.65rem;
}

.instalar-ayuda,
.instalar-pasos,
.instalar-ok {
  margin: 0;
  max-width: 36rem;
  font-size: 0.9rem;
  line-height: 1.45;
  color: #64748b;
}

.instalar-ok {
  font-weight: 600;
  color: #047857;
}

html.oscuro .instalar h2 {
  color: #f1f5f9;
}

html.oscuro .instalar > .instalar-texto > p,
html.oscuro .instalar-dispositivos li {
  color: #cbd5e1;
}

html.oscuro .instalar-dispositivos li {
  background: color-mix(in srgb, var(--linea-negocio, #295bdc) 18%, #131a26);
}

html.oscuro .instalar-ayuda,
html.oscuro .instalar-pasos {
  color: #94a3b8;
}

html.oscuro .instalar-ok {
  color: #6ee7b7;
}
</style>
