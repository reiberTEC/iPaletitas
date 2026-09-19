import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import Login from '../components/Login.vue'
import Inicio from '../views/Inicio.vue'
import VistaNewCount from '../components/VistaNewCount.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: Login
  },
  {
    path: '/registro',
    name: 'registro',
    component: VistaNewCount
  },
  {
    path: '/inicio',
    name: 'inicio',
    component: Inicio,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const isAuth = !!localStorage.getItem('token')
  if (to.meta.requiresAuth && !isAuth) {
    next({ name: 'login' })
  } else {
    next()
  }
})

export default router