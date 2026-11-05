<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'
import PortadaAcceso from './acceso/PortadaAcceso.vue'
import paliPulgar from '@/assets/Img/pali-pulgar.webp'
import { ErrorApi, definirPasswordApi } from '@/lib/api'

const props = defineProps<{ token: string }>()
const emit = defineEmits<{ irLogin: []; irHome: [] }>()

const password = ref('')
const confirmar = ref('')
const show = ref(false)
const cargando = ref(false)
const error = ref('')
const listo = ref(false)

async function guardar() {
  error.value = ''
  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }
  if (password.value !== confirmar.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }
  cargando.value = true
  try {
    await definirPasswordApi(props.token, password.value)
    listo.value = true
  } catch (e) {
    error.value = e instanceof ErrorApi ? e.message : 'No se pudo guardar la contraseña.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <PortadaAcceso
      frase="Elige una contraseña segura."
      :mascota="paliPulgar"
      mascota-alt="Pali con pulgar arriba"
      @ir-home="emit('irHome')"
    />

    <main class="right-panel">
      <div class="form-wrapper">
        <template v-if="listo">
          <h1 class="title">Listo</h1>
          <p class="subtitle">Tu contraseña quedó guardada. Ya puedes entrar a tu cuenta.</p>
          <button type="button" class="btn-primary ip-boton" @click="emit('irLogin')">Ir a iniciar sesión</button>
        </template>

        <template v-else>
          <h1 class="title">Definir contraseña</h1>
          <p class="subtitle">Mínimo 8 caracteres. Úsala la próxima vez que entres.</p>

          <form class="login-form" @submit.prevent="guardar">
            <div class="input-group">
              <label for="pass-nueva">Nueva contraseña</label>
              <div class="password-input-wrapper">
                <input
                  id="pass-nueva"
                  v-model="password"
                  :type="show ? 'text' : 'password'"
                  autocomplete="new-password"
                  required
                  minlength="8"
                  :disabled="cargando"
                />
                <button type="button" class="btn-eye" :aria-label="show ? 'Ocultar' : 'Mostrar'" @click="show = !show">
                  <EyeOff v-if="show" class="size-5" />
                  <Eye v-else class="size-5" />
                </button>
              </div>
            </div>

            <div class="input-group">
              <label for="pass-conf">Confirmar</label>
              <input
                id="pass-conf"
                v-model="confirmar"
                type="password"
                autocomplete="new-password"
                required
                minlength="8"
                :disabled="cargando"
              />
            </div>

            <p v-if="error" class="login-error" role="alert">{{ error }}</p>

            <button type="submit" class="btn-primary ip-boton" :disabled="cargando">
              {{ cargando ? 'Guardando…' : 'Guardar contraseña' }}
            </button>
          </form>
        </template>
      </div>
    </main>
  </div>
</template>

<style src="../assets/Login.css"></style>
