<script setup lang="ts">
import { ref } from 'vue'
import Login from './components/Login.vue'
import VistaNewCount from './components/VistaNewCount.vue'

const vistaActual = ref('login')
</script>

<template>

<Login 
    v-if="vistaActual === 'login'" 
    @irRegistro="vistaActual = 'registro'" 
  />

  <VistaNewCount 
    v-else 
    @irLogin="vistaActual = 'login'" 
  />
</template>