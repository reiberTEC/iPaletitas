<script setup lang="ts">
import { ref } from 'vue'
import Login from './components/Login.vue'
import VistaNewCount from './components/VistaNewCount.vue'

// Controla qué pantalla se está mostrando ('login' o 'registro')
const vistaActual = ref('login')
</script>

<template>
  <!-- Si vistaActual es login, muestra Login. Si emite irRegistro, cambia a registro -->
  <Login 
    v-if="vistaActual === 'login'" 
    @irRegistro="vistaActual = 'registro'" 
  />

  <!-- Si vistaActual no es login, muestra VistaNewCount. Si emite irLogin, regresa a login -->
  <VistaNewCount 
    v-else 
    @irLogin="vistaActual = 'login'" 
  />
</template>