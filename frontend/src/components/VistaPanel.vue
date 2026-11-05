<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TransicionBillete from './TransicionBillete.vue'

const router = useRouter()
const route = useRoute()

const opcionesSuperiores = [
  { nombre: 'inicio', texto: 'Inicio' },
  { nombre: 'productos', texto: 'Productos' },
  { nombre: 'suscripciones', texto: 'Suscripciones' },
  { nombre: 'nosotros', texto: 'Nosotros' },
]

const opciones = [
  { nombre: 'ventas', texto: 'Ventas', icono: '📈' },
  { nombre: 'inventario', texto: 'Inventario', icono: '📦' },
  { nombre: 'empleados', texto: 'Empleados', icono: '👥' },
  { nombre: 'suscripciones', texto: 'Suscripciones', icono: '💳' },
  { nombre: 'reportes', texto: 'Reportes', icono: '📊' },
]

const menuAbierto = ref(false)
const perfilAbierto = ref(false)
const perfil = ref<HTMLElement | null>(null)

const correoUsuario = localStorage.getItem('token') ?? ''
const inicialUsuario = (correoUsuario.charAt(0) || '?').toUpperCase()

const alternarMenu = () => {
  menuAbierto.value = !menuAbierto.value
}

const cerrarMenu = () => {
  menuAbierto.value = false
  perfilAbierto.value = false
}

const cerrarConEscape = (evento: KeyboardEvent) => {
  if (evento.key === 'Escape') cerrarMenu()
}

const cerrarPerfilAlClicFuera = (evento: MouseEvent) => {
  if (perfil.value && !perfil.value.contains(evento.target as Node)) perfilAbierto.value = false
}

watch(() => route.fullPath, cerrarMenu)
onMounted(() => {
  window.addEventListener('keydown', cerrarConEscape)
  window.addEventListener('click', cerrarPerfilAlClicFuera)
})
onUnmounted(() => {
  window.removeEventListener('keydown', cerrarConEscape)
  window.removeEventListener('click', cerrarPerfilAlClicFuera)
})

const cerrarSesion = () => {
  localStorage.removeItem('token')
  router.push({ name: 'login' })
}

const transicion = ref<InstanceType<typeof TransicionBillete> | null>(null)
let vendiendo = false

const irAVender = async () => {
  if (vendiendo) return
  cerrarMenu()

  const sinAnimacion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (sinAnimacion || !transicion.value) {
    await router.push({ name: 'punto-de-venta' })
    return
  }

  vendiendo = true
  try {
    await transicion.value.cubrir()
    await router.push({ name: 'punto-de-venta' })
    await new Promise((resolve) => setTimeout(resolve, 150))
    await transicion.value.descubrir()
  } finally {
    vendiendo = false
  }
}
</script>

<template>
  <div class="panel">
    <header class="topbar">
      <button
        class="btn-hamburguesa"
        :class="{ abierto: menuAbierto }"
        :aria-expanded="menuAbierto"
        aria-controls="menu-lateral"
        aria-label="Abrir o cerrar menú"
        @click="alternarMenu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div class="brand">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10.5 17H13.5V21C13.5 21.5523 13.0523 22 12.5 22H11.5C10.9477 22 10.5 21.5523 10.5 21V17Z" fill="#FCD34D"/>
          <path d="M8 8C8 5.79086 9.79086 4 12 4C14.2091 4 16 5.79086 16 8V16C16 16.5523 15.5523 17 15 17H9C8.44772 17 8 16.5523 8 16V8Z" fill="#2563EB"/>
        </svg>
        <span>iPaletitas</span>
      </div>

      <nav class="menu-superior">
        <RouterLink
          v-for="opcion in opcionesSuperiores"
          :key="opcion.nombre"
          :to="{ name: opcion.nombre }"
          class="menu-superior-item"
          active-class="activo"
        >
          {{ opcion.texto }}
        </RouterLink>
      </nav>

      <div ref="perfil" class="perfil">
        <button
          class="btn-perfil"
          :aria-expanded="perfilAbierto"
          aria-label="Opciones de la cuenta"
          @click="perfilAbierto = !perfilAbierto"
        >
          <span class="avatar">{{ inicialUsuario }}</span>
          <svg class="chevron" :class="{ girado: perfilAbierto }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div v-if="perfilAbierto" class="perfil-menu">
          <p class="perfil-correo">{{ correoUsuario }}</p>
          <button class="perfil-salir" @click="cerrarSesion">⎋ Cerrar sesión</button>
        </div>
      </div>
    </header>

    <Transition name="fade">
      <div v-if="menuAbierto" class="overlay" @click="cerrarMenu"></div>
    </Transition>

    <aside id="menu-lateral" class="sidebar" :class="{ abierto: menuAbierto }">
      <nav class="menu">
        <button
          type="button"
          class="btn-vender"
          :class="{ activo: route.name === 'punto-de-venta' }"
          @click="irAVender"
        >
          <span class="btn-vender-icono" aria-hidden="true">💵</span>
          Vender
        </button>

        <RouterLink
          v-for="opcion in opciones"
          :key="opcion.nombre"
          :to="{ name: opcion.nombre }"
          class="menu-item"
          active-class="activo"
        >
          <span class="menu-icono">{{ opcion.icono }}</span>
          {{ opcion.texto }}
        </RouterLink>
      </nav>

      <button class="btn-logout" @click="cerrarSesion">
        <span class="menu-icono">⎋</span>
        Cerrar sesión
      </button>
    </aside>

    <main class="contenido">
      <RouterView />
    </main>

    <TransicionBillete ref="transicion" />
  </div>
</template>

<style scoped>
.panel {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #eef2f9;
  font-family: Arial, Helvetica, sans-serif;
}

/* Barra superior con el botón hamburguesa */
.topbar {
  height: 68px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 1.5rem;
  background: white;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
  z-index: 40;
}

.btn-hamburguesa {
  width: 44px;
  height: 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  border: none;
  border-radius: 12px;
  background: #2563eb;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-hamburguesa:hover {
  background: #1d4ed8;
}

.btn-hamburguesa span {
  width: 22px;
  height: 2.5px;
  border-radius: 2px;
  background: white;
  transition: transform 0.3s, opacity 0.2s;
}

.btn-hamburguesa.abierto span:nth-child(1) {
  transform: translateY(7.5px) rotate(45deg);
}

.btn-hamburguesa.abierto span:nth-child(2) {
  opacity: 0;
}

.btn-hamburguesa.abierto span:nth-child(3) {
  transform: translateY(-7.5px) rotate(-45deg);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}

.logo-icon {
  width: 36px;
  height: 36px;
}

.menu-superior {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
  overflow-x: auto;
}

.menu-superior-item {
  padding: 0.6rem 1.2rem;
  border-radius: 25px;
  color: #64748b;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s;
}

.menu-superior-item:hover {
  background: #eff6ff;
  color: #2563eb;
}

.menu-superior-item.activo {
  background: linear-gradient(to bottom, #1269da, #3d96ef);
  color: white;
  box-shadow: 0 4px 10px rgba(18, 105, 218, 0.3);
}

/* Avatar y menú de la cuenta */
.perfil {
  position: relative;
  margin-left: 0.8rem;
  flex-shrink: 0;
}

.btn-perfil {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem;
  border: none;
  border-radius: 30px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #f97316, #ec4899);
  color: white;
  font-weight: 800;
  font-size: 1.1rem;
  box-shadow: 0 0 0 3px #e0e7ff;
}

.chevron {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.chevron.girado {
  transform: rotate(180deg);
}

.perfil-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 220px;
  padding: 0.8rem;
  border-radius: 14px;
  background: white;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.15);
}

.perfil-correo {
  padding: 0.3rem 0.5rem 0.7rem;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 0.5rem;
  color: #334155;
  font-size: 0.9rem;
  word-break: break-all;
}

.perfil-salir {
  width: 100%;
  padding: 0.6rem 0.5rem;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #e11d48;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.perfil-salir:hover {
  background: #fff1f2;
}

/* Menú lateral deslizable */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 20;
}

.sidebar {
  position: fixed;
  top: 68px;
  left: 0;
  bottom: 0;
  width: 260px;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.2rem;
  background: linear-gradient(to bottom, #1f62e7, #3d96ef);
  color: white;
  box-shadow: 4px 0 20px rgba(31, 98, 231, 0.25);
  transform: translateX(-100%);
  visibility: hidden;
  transition: transform 0.3s ease, visibility 0s linear 0.3s;
  z-index: 30;
}

.sidebar.abierto {
  transform: translateX(0);
  visibility: visible;
  transition: transform 0.3s ease;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.menu-item,
.btn-logout {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.85rem 1rem;
  border-radius: 14px;
  color: #dbeafe;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s, color 0.2s;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.menu-item.activo {
  background: white;
  color: #1f62e7;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.menu-icono {
  width: 1.4rem;
  text-align: center;
}

.btn-vender {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;
  margin-bottom: 0.8rem;
  padding: 1rem;
  overflow: hidden;
  border: 3px solid #fef08a;
  border-radius: 18px;
  background: linear-gradient(135deg, #fde047, #f59e0b 55%, #f97316);
  color: #3b1d03;
  font-family: inherit;
  font-size: 1.9rem;
  font-weight: 900;
  letter-spacing: 3px;
  text-transform: uppercase;
  text-shadow: 0 2px 0 rgba(255, 255, 255, 0.5);
  cursor: pointer;
  animation: vender-pulso 2.4s ease-in-out infinite;
  transition: transform 0.2s, box-shadow 0.2s, text-shadow 0.2s;
}

/* Destello que cruza el botón al pasar el cursor */
.btn-vender::after {
  content: '';
  position: absolute;
  top: -20%;
  left: 0;
  width: 45%;
  height: 140%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
  transform: translateX(-160%) skewX(-20deg);
  pointer-events: none;
}

.btn-vender:hover,
.btn-vender:focus-visible {
  transform: translateY(-2px) scale(1.04);
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.4),
    0 0 28px 6px rgba(253, 224, 71, 0.85),
    0 10px 24px rgba(0, 0, 0, 0.25);
  text-shadow:
    0 0 10px rgba(255, 255, 255, 0.95),
    0 0 22px rgba(254, 240, 138, 0.9);
  animation: none;
  outline: none;
}

.btn-vender:hover::after,
.btn-vender:focus-visible::after {
  animation: vender-destello 0.9s ease-out;
}

.btn-vender:active {
  transform: scale(0.97);
}

.btn-vender.activo {
  border-color: white;
}

.btn-vender-icono {
  font-size: 1.7rem;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.25));
}

.btn-vender:hover .btn-vender-icono {
  animation: vender-billete 0.6s ease-in-out;
}

@keyframes vender-pulso {
  0%,
  100% {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 0 0 0 rgba(253, 224, 71, 0.6);
  }
  50% {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2), 0 0 18px 4px rgba(253, 224, 71, 0.55);
  }
}

@keyframes vender-destello {
  to {
    transform: translateX(320%) skewX(-20deg);
  }
}

@keyframes vender-billete {
  0%,
  100% {
    transform: rotate(0);
  }
  25% {
    transform: rotate(-15deg);
  }
  75% {
    transform: rotate(15deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .btn-vender,
  .btn-vender:hover::after,
  .btn-vender:hover .btn-vender-icono {
    animation: none;
  }
}

.btn-logout {
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.btn-logout:hover {
  background: rgba(225, 29, 72, 0.85);
  color: white;
}

.contenido {
  flex: 1;
  overflow-y: auto;
  padding: 2.5rem 3rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 700px) {
  .topbar {
    padding: 0 1rem;
  }

  .topbar .brand span {
    display: none;
  }

  .menu-superior-item {
    padding: 0.5rem 0.8rem;
    font-size: 0.85rem;
  }

  .contenido {
    padding: 1.5rem 1rem;
  }
}
</style>
