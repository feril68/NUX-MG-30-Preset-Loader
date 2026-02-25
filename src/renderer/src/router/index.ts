import { createRouter, createWebHashHistory } from 'vue-router'
import MG30JsonLoader from '../pages/MG30JsonLoader.vue'
import MG30AiIntegrationLoader from '../pages/MG30AiIntegrationLoader.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: MG30JsonLoader
    },
    {
      path: '/ai-loader',
      name: 'ai-loader',
      component: MG30AiIntegrationLoader
    }
  ]
})

export default router
