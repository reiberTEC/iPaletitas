<script setup lang="ts">
import { computed, ref } from 'vue'
import Home from './components/Home.vue'
import Login from './components/Login.vue'
import VistaNewCount from './components/VistaNewCount.vue'
import Planes from './components/Planes.vue'
import Activacion from './components/Activacion.vue'
import PanelCliente from './components/cliente/PanelCliente.vue'
import CuentaBloqueada from './components/cliente/CuentaBloqueada.vue'
import PanelAdmin from './components/admin/PanelAdmin.vue'
import TemaToggle from './components/ui/TemaToggle.vue'
import { bloqueo, cerrarSesion, estado, iniciarSesion } from './stores/negocio'
import { cerrarSesionAdmin, esCorreoAdmin, estado as admin, iniciarSesionAdmin } from './stores/admin'

type Vista = 'home' | 'login' | 'registro' | 'planes' | 'activacion' | 'cliente' | 'admin'

function vistaInicial(): Vista {
  if (admin.sesion) return 'admin'
  if (estado.sesion) return estado.licencia ? 'cliente' : 'planes'
  return 'home'
}

const vistaActual = ref<Vista>(vistaInicial())

const puedeVerAdmin = computed(() => Boolean(admin.sesion && esCorreoAdmin(admin.sesion.correo)))
const clienteConLicencia = computed(() => Boolean(estado.sesion && estado.licencia))

function ir(vista: Vista) {
  if (vista === 'admin' && !puedeVerAdmin.value) vista = 'login'
  vistaActual.value = vista
  window.scrollTo({ top: 0, behavior: 'instant' })
}

function registrarse(correo: string) {
  iniciarSesion(correo)
  ir('planes')
}

function ingresar(correo: string, comoAdmin: boolean) {
  if (comoAdmin) {
    iniciarSesionAdmin(correo)
    ir('admin')
    return
  }
  iniciarSesion(correo)
  ir(estado.licencia ? 'cliente' : 'planes')
}

function salirCliente() {
  cerrarSesion()
  ir('home')
}

function salirAdmin() {
  cerrarSesionAdmin()
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
    @volver="ir(clienteConLicencia ? 'cliente' : 'home')"
  />

  <Activacion v-else-if="vistaActual === 'activacion'" @listo="ir('cliente')" @volver="ir('planes')" />

  <PanelAdmin v-else-if="vistaActual === 'admin' && puedeVerAdmin" @salir="salirAdmin" />

  <template v-else-if="vistaActual === 'cliente' && clienteConLicencia">
    <CuentaBloqueada v-if="bloqueo" :motivo="bloqueo" @salir="salirCliente" @cambiarPlan="ir('planes')" />
    <PanelCliente v-else @salir="salirCliente" @cambiarPlan="ir('planes')" />
  </template>

  <Home v-else @irLogin="ir('login')" @irRegistro="ir('registro')" @irPlanes="ir('planes')" />

  <TemaToggle
    v-if="vistaActual === 'login' || vistaActual === 'registro'"
    class="fixed top-5 right-5 z-[10000] bg-white/90 shadow-lg ring-1 ring-slate-200 backdrop-blur"
  />
</template>
