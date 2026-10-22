<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'
import PortadaAcceso from './acceso/PortadaAcceso.vue'
import paliPulgar from '@/assets/Img/pali-pulgar.webp'
import { ErrorApi, guardarToken, registrarApi } from '@/lib/api'
import { DIAS_GARANTIA } from '@/stores/catalogo'
import { iniciarSesion, registrarCuenta, sincronizarDesdeApi } from '@/stores/negocio'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const cargando = ref(false)

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const emit = defineEmits<{
  irLogin: []
  irHome: []
  registrado: []
}>()

const handleRegister = async () => {
  cargando.value = true
  error.value = ''
  try {
    const sesion = await registrarApi(email.value, password.value)
    guardarToken(sesion.token)
    const local = registrarCuenta(sesion.usuario.correo)
    if (local) iniciarSesion(sesion.usuario.correo)
    try {
      await sincronizarDesdeApi()
    } catch {
      /* local ya quedó listo */
    }
    emit('registrado')
  } catch (e) {
    error.value = e instanceof ErrorApi ? e.message : 'No se pudo crear la cuenta.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <PortadaAcceso
      frase="Tu negocio, en su propia línea."
      :mascota="paliPulgar"
      mascota-alt="Pali, la paleta de iPaletitas, con el pulgar arriba"
      @ir-home="emit('irHome')"
    />

    <main class="right-panel">
      <div class="form-wrapper">
        <h1 class="title">Crea tu cuenta</h1>
        <p class="subtitle">
          Crear tu cuenta no cuesta nada. Al elegir tu plan lo pagas con tarjeta y tu primera semana es gratis: si en
          {{ DIAS_GARANTIA }} días no te convence, te devolvemos tu dinero.
        </p>

        <form class="login-form" @submit.prevent="handleRegister">
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
                autocomplete="new-password"
                placeholder="Mínimo 8 caracteres"
                required
                minlength="8"
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

          <p v-if="error" class="login-error" role="alert">
            {{ error }}
            <a href="#" @click.prevent="emit('irLogin')">Iniciar sesión</a>
          </p>

          <button type="submit" class="btn-primary ip-boton" :disabled="cargando">
            {{ cargando ? 'Creando…' : 'Crear cuenta' }}
          </button>
        </form>

        <div class="links">
          <p class="link-register">
            ¿Ya tienes una cuenta? <a href="#" @click.prevent="$emit('irLogin')">Inicia sesión</a>
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

.login-error a {
  color: inherit;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
