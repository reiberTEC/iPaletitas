<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Home from './components/Home.vue'
import Login from './components/Login.vue'
import VistaNewCount from './components/VistaNewCount.vue'
import Planes from './components/Planes.vue'
import Activacion from './components/Activacion.vue'
import PanelCliente from './components/cliente/PanelCliente.vue'
import CuentaBloqueada from './components/cliente/CuentaBloqueada.vue'
import PanelAdmin from './components/admin/PanelAdmin.vue'
import TemaToggle from './components/ui/TemaToggle.vue'
import { guardarToken, leerToken } from './lib/api'
import { bloqueo, cerrarSesion, estado, iniciarSesion, sincronizarDesdeApi } from './stores/negocio'
import { cerrarSesionAdmin, esCorreoAdmin, estado as admin, iniciarSesionAdmin } from './stores/admin'

type Vista = 'home' | 'login' | 'registro' | 'planes' | 'activacion' | 'cliente' | 'admin'

function vistaInicial(): Vista {
  if (admin.sesion) return 'admin'
  if (estado.sesion) return estado.licencia ? 'cliente' : 'planes'
  return 'home'
}

const vistaActual = ref<Vista>(vistaInicial())
const cargandoSesion = ref(false)

const puedeVerAdmin = computed(() => Boolean(admin.sesion && esCorreoAdmin(admin.sesion.correo)))
const clienteConLicencia = computed(() => Boolean(estado.sesion && estado.licencia))

function ir(vista: Vista) {
  if (vista === 'admin' && !puedeVerAdmin.value) vista = 'login'
  if ((vista === 'planes' || vista === 'activacion') && !estado.sesion) vista = 'login'
  vistaActual.value = vista
  window.scrollTo({ top: 0, behavior: 'instant' })
}

function registrarse() {
  ir('planes')
}

async function ingresar(correo: string, comoAdmin: boolean) {
  if (comoAdmin) {
    iniciarSesionAdmin(correo)
    ir('admin')
    return
  }
  iniciarSesion(correo)
  cargandoSesion.value = true
  try {
    await sincronizarDesdeApi()
  } catch {
    // Si la API falla, se queda con lo local.
  } finally {
    cargandoSesion.value = false
  }
  ir(estado.licencia ? 'cliente' : 'planes')
}

function salirCliente() {
  guardarToken(null)
  cerrarSesion()
  ir('home')
}

function cambiarCuenta() {
  guardarToken(null)
  cerrarSesion()
  ir('login')
}

function salirAdmin() {
  guardarToken(null)
  cerrarSesionAdmin()
  ir('home')
}

onMounted(async () => {
  if (!leerToken() || admin.sesion) return
  cargandoSesion.value = true
  try {
    await sincronizarDesdeApi()
    if (estado.sesion) ir(estado.licencia ? 'cliente' : 'planes')
  } catch {
    guardarToken(null)
  } finally {
    cargandoSesion.value = false
  }
})
</script>

<template>
  <div
    v-if="cargandoSesion"
    class="fixed inset-0 z-[100] grid place-items-center bg-slate-950/40 text-white backdrop-blur-sm"
  >
    <p class="font-display text-lg font-semibold">Cargando tu negocio…</p>
  </div>

  <Home v-if="vistaActual === 'home'" @irLogin="ir('login')" @irRegistro="ir('registro')" />

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
    v-else-if="vistaActual === 'planes' && estado.sesion"
    @elegido="ir('activacion')"
    @volver="ir(clienteConLicencia ? 'cliente' : 'home')"
  />

  <Activacion
    v-else-if="vistaActual === 'activacion' && estado.sesion"
    @listo="ir('cliente')"
    @volver="ir('planes')"
    @cambiarCuenta="cambiarCuenta"
  />

  <PanelAdmin v-else-if="vistaActual === 'admin' && puedeVerAdmin" @salir="salirAdmin" />

  <template v-else-if="vistaActual === 'cliente' && clienteConLicencia">
    <CuentaBloqueada v-if="bloqueo" :motivo="bloqueo" @salir="salirCliente" @contratar="ir('planes')" />
    <PanelCliente v-else @salir="salirCliente" />
  </template>

  <Home v-else @irLogin="ir('login')" @irRegistro="ir('registro')" />

  <TemaToggle
    v-if="vistaActual === 'login' || vistaActual === 'registro'"
    class="fixed top-[max(1.25rem,env(safe-area-inset-top))] right-[max(1.25rem,env(safe-area-inset-right))] z-50 bg-white ring-1 ring-slate-200"
  />
</template>
