<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'
import PortadaAcceso from './acceso/PortadaAcceso.vue'
import paliSaludando from '@/assets/Img/pali-saludando.webp'
import { ErrorApi, guardarToken, loginApi } from '@/lib/api'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const cargando = ref(false)

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const emit = defineEmits<{
  irRegistro: []
  irHome: []
  irRecuperar: []
  ingresar: [correo: string, comoAdmin: boolean]
}>()

const handleLogin = async () => {
  cargando.value = true
  error.value = ''
  try {
    // El backend decide: si el correo está en staff → consola; si no → panel del negocio.
    const sesion = await loginApi(email.value, password.value)
    guardarToken(sesion.token)
    emit('ingresar', sesion.usuario.correo, sesion.tipo === 'staff')
  } catch (e) {
    error.value = e instanceof ErrorApi ? e.message : 'No se pudo iniciar sesión.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <PortadaAcceso
      frase="Tu caja te está esperando."
      :mascota="paliSaludando"
      mascota-alt="Pali, la paleta de iPaletitas, saludando"
      @ir-home="emit('irHome')"
    />

    <main class="right-panel">
      <div class="form-wrapper">
        <h1 class="title">Entra a tu cuenta</h1>
        <p class="subtitle">Tus productos, tus ventas y tus sucursales, donde los dejaste.</p>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="input-group">
            <label for="email">Correo electrónico</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              inputmode="email"
              placeholder="ejemplo@correo.com"
              required
              :disabled="cargando"
              @input="error = ''"
            />
          </div>

          <div class="input-group">
            <label for="password">Contraseña</label>
            <div class="password-input-wrapper">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Tu contraseña"
                required
                :disabled="cargando"
              />
              <button
                type="button"
                class="btn-eye"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                :aria-pressed="showPassword"
                @click="togglePassword"
              >
                <EyeOff v-if="showPassword" class="size-5" />
                <Eye v-else class="size-5" />
              </button>
            </div>
          </div>

          <p v-if="error" class="login-error" role="alert">{{ error }}</p>

          <button type="submit" class="btn-primary ip-boton" :disabled="cargando">
            {{ cargando ? 'Entrando…' : 'Iniciar sesión' }}
          </button>
        </form>

        <div class="links">
          <a href="#" class="link-forgot" @click.prevent="emit('irRecuperar')">¿Olvidaste tu contraseña?</a>
          <p class="link-register">
            ¿Todavía no tienes cuenta? <a href="#" @click.prevent="$emit('irRegistro')">Créala gratis</a>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<style src="../assets/Login.css"></style>

<style scoped>
.login-error {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 0.9375rem;
}
</style>
