import { createRouter, createWebHashHistory } from 'vue-router'
import MG30JsonLoader from '../pages/MG30JsonLoader.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MG30JsonLoader
    }
  ]
})

export default router
