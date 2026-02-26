<script setup lang="ts">
import { ref, watch, computed, Ref } from 'vue'
import { useMG30 } from '../services/mg30/useMG30'
import { MG30_MESSAGES } from '../services/mg30/constants'

interface Props {
  title: string
}

defineProps<Props>()

const { isConnected } = useMG30()

const appState: Ref<'initializing' | 'ready' | 'loading'> = ref('initializing')
const status: Ref<string> = ref(MG30_MESSAGES.searching)

const isInitializingOrLoading = computed(
  () => appState.value === 'initializing' || appState.value === 'loading'
)

watch(
  isConnected,
  (connected) => {
    if (connected) {
      appState.value = 'ready'
      status.value = MG30_MESSAGES.connected
      return
    }

    appState.value = 'initializing'
    status.value = MG30_MESSAGES.searching
  },
  { immediate: true }
)

defineExpose({
  appState,
  status,
  isConnected
})
</script>

<template>
  <div class="app-wrapper">
    <div v-if="isInitializingOrLoading" class="overlay">
      <div class="loader-content">
        <div class="spinner"></div>
        <p class="status-text">{{ status }}</p>
        <p v-if="appState === 'initializing'" class="sub-text">
          Please ensure your NUX MG-30 is connected via USB.
        </p>
      </div>
    </div>

    <div v-else class="container">
      <header>
        <h1>{{ title }}</h1>
        <div class="header-right">
          <nav class="nav-switch">
            <router-link to="/" class="nav-link">JSON Loader</router-link>
            <router-link to="/ai-loader" class="nav-link">AI Loader</router-link>
          </nav>
          <div class="status-badge" :class="{ connected: isConnected }">
            {{ status }}
          </div>
        </div>
      </header>

      <slot name="content" />

      <footer>
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<style>
/* Global Electron window overrides */
html,
body {
  margin: 0 !important;
  padding: 0 !important;
  width: 900px;
  height: 670px;
  background-color: #121212;
  overflow: hidden !important;
}
</style>

<style scoped>
.app-wrapper {
  width: 885px;
  height: 670px;
  background-color: #121212;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: radial-gradient(circle, #1a1a1a 0%, #000000 100%);
}

.loader-content {
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #333;
  border-top: 5px solid #00ff9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.container {
  display: flex;
  flex-direction: column;
  height: 95%;
  padding: 20px;
  box-sizing: border-box;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-switch {
  display: flex;
  gap: 8px;
}

.nav-link {
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 0.8rem;
  text-decoration: none;
}

.nav-link.router-link-active {
  border-color: #00ff9d;
  color: #00ff9d;
}

h1 {
  font-size: 1.2rem;
  letter-spacing: 2px;
  color: #00ff9d;
  margin: 0;
}

.status-badge {
  background: #1e1e1e;
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: white;
  border: 1px solid #333;
}

.status-badge.connected {
  border-color: #00ff9d;
  color: #00ff9d;
}

.status-text {
  color: white;
  margin: 0;
}

.sub-text {
  color: #666;
  font-size: 0.8rem;
  margin-top: 10px;
}

footer {
  margin-top: 15px;
  text-align: right;
}
</style>
