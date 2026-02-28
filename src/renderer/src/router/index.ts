import { createRouter, createWebHashHistory } from 'vue-router'
import MG30JsonLoader from '../pages/MG30JsonLoader.vue'
import MG30AiIntegrationLoader from '../pages/MG30AiIntegrationLoader.vue'
import MG30AiAdditionalInfo from '../pages/MG30AiAdditionalInfo.vue'

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
    },
    {
      path: '/ai-info',
      name: 'ai-info',
      component: MG30AiAdditionalInfo
    }
  ]
})

export default router
