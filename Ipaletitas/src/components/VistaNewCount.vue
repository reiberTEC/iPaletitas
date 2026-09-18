<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleRegister = () => {
  console.log('Registrando cuenta:', email.value, password.value)
}

// Evento para regresar al Login
defineEmits(['irLogin'])
</script>

<template>
  <div class="login-container">
    
    <!-- PANEL IZQUIERDO -->
    <div class="left-panel">
      <div class="brand">
        <svg class="logo-icon paleta-animada" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.5 17H13.5V21C13.5 21.5523 13.0523 22 12.5 22H11.5C10.9477 22 10.5 21.5523 10.5 21V17Z" fill="#FCD34D"/>
          <path d="M7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V16C17 16.5523 16.5523 17 16 17H8C7.44772 17 7 16.5523 7 16V8Z" fill="white" fill-opacity="0.2"/>
          <path d="M8 8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V16C16 16.5523 15.5523 17 15 17H9C8.44772 17 8 16.5523 8 16V8Z" fill="white"/>
          <rect x="10.5" y="6" width="3" height="8" rx="1.5" fill="#2563EB" fill-opacity="0.1"/>
        </svg>
        <h1>iPaletitas</h1>
      </div>
    </div>

    <!-- PANEL DERECHO -->
    <div class="right-panel">
      <div class="form-wrapper">
        
        <h2 class="title" style="display: flex; justify-content: center; align-items: center; gap: 8px;">
          Crear Cuenta nueva
          <svg class="logo-icon paleta-animada" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 17H13.5V21C13.5 21.5523 13.0523 22 12.5 22H11.5C10.9477 22 10.5 21.5523 10.5 21V17Z" fill="#FCD34D"/>
            <path d="M7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8V16C17 16.5523 16.5523 17 16 17H8C7.44772 17 7 16.5523 7 16V8Z" fill="#10B981" fill-opacity="0.1"/>
            <path d="M8 8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V16C16 16.5523 15.5523 17 15 17H9C8.44772 17 8 16.5523 8 16V8Z" fill="#10B981"/>
          </svg>
        </h2>
        <p class="subtitle">Regístrate y vincula tu número de usuario.</p>

        <form @submit.prevent="handleRegister" class="login-form">
          <div class="input-group">
            <label for="email">Correo electrónico</label>
            <input id="email" v-model="email" type="email" placeholder="ejemplo@correo.com" required />
          </div>

          <div class="input-group">
            <label for="password">Contraseña</label>
            <div class="password-input-wrapper">
              <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Crea una contraseña" required />
              <button type="button" class="btn-eye" @click="togglePassword">
                <svg v-if="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              </button>
            </div>
          </div>

          <button type="submit" class="btn-primary">Crear cuenta</button>
        </form>

        <div class="links">
          <p class="link-register">¿Ya tienes una cuenta? <a href="#" @click.prevent="$emit('irLogin')">Inicia sesión</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="../assets/Login.css"></style>