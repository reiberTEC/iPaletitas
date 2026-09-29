<script setup lang="ts">
import { ref } from 'vue'
import Home from './components/Home.vue'
import Login from './components/Login.vue'
import VistaNewCount from './components/VistaNewCount.vue'
import Planes from './components/Planes.vue'
import Activacion from './components/Activacion.vue'
import Sistema from './components/sistema/Sistema.vue'
import { cerrarSesion, estado, iniciarSesion } from './stores/negocio'

type Vista = 'home' | 'login' | 'registro' | 'planes' | 'activacion' | 'sistema'

const vistaActual = ref<Vista>(estado.sesion ? (estado.licencia ? 'sistema' : 'planes') : 'home')

function ir(vista: Vista) {
  vistaActual.value = vista
  window.scrollTo({ top: 0, behavior: 'instant' })
}

function registrarse(correo: string) {
  iniciarSesion(correo)
  ir('planes')
}

function ingresar(correo: string) {
  iniciarSesion(correo)
  ir(estado.licencia ? 'sistema' : 'planes')
}

function salir() {
  cerrarSesion()
  ir('home')
}
</script>

<template>
  <Home
    v-if="vistaActual === 'home'"
    @irLogin="ir('login')"
    @irRegistro="ir('registro')"
    @irPlanes="ir('planes')"
  />

  <Login
    v-else-if="vistaActual === 'login'"
    @irRegistro="ir('registro')"
    @irHome="ir('home')"
    @ingresar="ingresar"
  />

  <VistaNewCount
    v-else-if="vistaActual === 'registro'"
    @irLogin="ir('login')"
    @irHome="ir('home')"
    @registrado="registrarse"
  />

  <Planes
    v-else-if="vistaActual === 'planes'"
    @elegido="ir(estado.sesion ? 'activacion' : 'registro')"
    @volver="ir(estado.sesion && estado.licencia ? 'sistema' : 'home')"
  />

  <Activacion v-else-if="vistaActual === 'activacion'" @listo="ir('sistema')" @volver="ir('planes')" />

  <Sistema v-else @salir="salir" @cambiarPlan="ir('planes')" />
</template>
