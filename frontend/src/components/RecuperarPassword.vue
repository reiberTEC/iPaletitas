<script setup lang="ts">
import { ref } from 'vue'
import PortadaAcceso from './acceso/PortadaAcceso.vue'
import paliPensando from '@/assets/Img/pali-pensando.webp'
import { ErrorApi, olvidarPasswordApi } from '@/lib/api'

const emit = defineEmits<{ irLogin: []; irHome: [] }>()

const correo = ref('')
const cargando = ref(false)
const error = ref('')
const mensaje = ref('')

async function enviar() {
  cargando.value = true
  error.value = ''
  mensaje.value = ''
  try {
    const r = await olvidarPasswordApi(correo.value)
    mensaje.value = r.mensaje
  } catch (e) {
    error.value = e instanceof ErrorApi ? e.message : 'No se pudo procesar la solicitud.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <PortadaAcceso
      frase="Te ayudamos a volver a entrar."
      :mascota="paliPensando"
      mascota-alt="Pali pensando"
      @ir-home="emit('irHome')"
    />

    <main class="right-panel">
      <div class="form-wrapper">
        <h1 class="title">Recuperar contraseña</h1>
        <p class="subtitle">
          Escribe el correo de tu cuenta. Por seguridad no mostramos el enlace aquí: cuando haya correo lo
          mandamos ahí. En desarrollo el enlace sale en la terminal del backend.
        </p>

        <form class="login-form" @submit.prevent="enviar">
          <div class="input-group">
            <label for="correo-rec">Correo electrónico</label>
            <input
              id="correo-rec"
              v-model="correo"
              type="email"
              autocomplete="email"
              required
              :disabled="cargando"
              placeholder="ejemplo@correo.com"
            />
          </div>

          <p v-if="error" class="login-error" role="alert">{{ error }}</p>
          <p v-if="mensaje" class="login-ok" role="status">{{ mensaje }}</p>

          <button type="submit" class="btn-primary ip-boton" :disabled="cargando">
            {{ cargando ? 'Enviando…' : 'Continuar' }}
          </button>
        </form>

        <div class="links">
          <a href="#" class="link-forgot" @click.prevent="emit('irLogin')">Volver a iniciar sesión</a>
        </div>
      </div>
    </main>
  </div>
</template>

<style src="../assets/Login.css"></style>

<style scoped>
.login-ok {
  margin: 0;
  color: #065f46;
  font-size: 0.9375rem;
  line-height: 1.5;
}
</style>
