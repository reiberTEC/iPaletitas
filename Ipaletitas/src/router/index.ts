import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import VistaNewCount from '../components/VistaNewCount.vue'
import VistaPanel from '../components/VistaPanel.vue'
import VistaInicio from '../components/VistaInicio.vue'
import VistaProducts from '../components/VistaProducts.vue'
import VistaSales from '../components/VistaSales.vue'
import VistaEmployees from '../components/VistaEmployees.vue'
import VistaNosotros from '../components/VistaNosotros.vue'
import VistaEnConstruccion from '../components/VistaEnConstruccion.vue'
import VistaSuscripciones from '../components/VistaSuscripciones.vue'
import VistaPuntoVenta from '../components/VistaPuntoVenta.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: Login },
    { path: '/registro', name: 'registro', component: VistaNewCount },
    {
      path: '/panel',
      component: VistaPanel,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: { name: 'inicio' } },
        { path: 'nosotros', name: 'nosotros', component: VistaNosotros },
        { path: 'inicio', name: 'inicio', component: VistaInicio },
        { path: 'productos', name: 'productos', component: VistaProducts },
        { path: 'inventario', name: 'inventario', component: VistaProducts },
        { path: 'ventas', name: 'ventas', component: VistaSales },
        { path: 'punto-de-venta', name: 'punto-de-venta', component: VistaPuntoVenta },
        { path: 'empleados', name: 'empleados', component: VistaEmployees },
        { path: 'suscripciones', name: 'suscripciones', component: VistaSuscripciones },
        {
          path: 'reportes',
          name: 'reportes',
          component: VistaEnConstruccion,
          props: { titulo: 'Reportes' },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const autenticado = !!localStorage.getItem('token')
  if (to.matched.some((ruta) => ruta.meta.requiresAuth) && !autenticado) {
    return { name: 'login' }
  }
})

export default router
