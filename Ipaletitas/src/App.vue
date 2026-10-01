<script setup lang="ts">
import { ref } from 'vue'
import Login from './components/Login.vue'
import VistaNewCount from './components/VistaNewCount.vue'

// Importaciones de tus nuevas vistas
import VistaInicio from './components/VIstaInicio.vue'
import VistaProducts from './components/VistaProducts.vue'
import VistaSales from './components/VistaSales.vue'
import VistaEmployees from './components/VistaEmployees.vue'

// Controla qué pantalla se está mostrando ('login', 'registro', 'inicio', etc.)
const vistaActual = ref('login')
</script>

<template>
  <!-- 1. Pantalla de Login -->
  <Login
    v-if="vistaActual === 'login'"
    @irRegistro="vistaActual = 'registro'"
    @irInicio="vistaActual = 'inicio'"
  />

  <!-- 2. Pantalla de Registro -->
  <VistaNewCount
    v-else-if="vistaActual === 'registro'"
    @irLogin="vistaActual = 'login'"
  />

  <!-- 3. Pantalla de Inicio (Menú Principal) -->
  <VistaInicio
    v-else-if="vistaActual === 'inicio'"
    @irProductos="vistaActual = 'productos'"
    @irVentas="vistaActual = 'ventas'"
    @irEmpleados="vistaActual = 'empleados'"
    @cerrarSesion="vistaActual = 'login'"
  />

  <!-- 4. Pantalla de Productos -->
  <VistaProducts
    v-else-if="vistaActual === 'productos'"
    @volver="vistaActual = 'inicio'"
  />

  <!-- 5. Pantalla de Ventas -->
  <VistaSales
    v-else-if="vistaActual === 'ventas'"
    @volver="vistaActual = 'inicio'"
  />

  <!-- 6. Pantalla de Empleados -->
  <VistaEmployees
    v-else-if="vistaActual === 'empleados'"
    @volver="vistaActual = 'inicio'"
  />
</template>