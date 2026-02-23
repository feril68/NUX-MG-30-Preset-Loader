<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useMG30 } from '../services/mg30/useMG30'
import { MG30FullConfig } from '../services/mg30/types/mg30'

// 1. Use the new service logic
const { isConnected, loadConfig } = useMG30()

// 2. States matching your preferred style
const appState = ref<'initializing' | 'ready' | 'loading'>('initializing')
const status = ref('Searching for MG-30...')

const defaultJson: MG30FullConfig = {
  wah: {},
  compressor: {
    name: 'studioComp',
    parameter: { threshold: 42, ratio: 65, gain: 65, release: 40 }
  },
  efx: {},
  amp: {
    name: 'starlift',
    parameter: { bass: 50, middle: 65, mFreq: 65, treble: 72, contour: 35, volume: 75, level: 65 }
  },
  eq: {
    name: '6BandEq',
    parameter: { '100': 0, '220': 1, '500': 3, '1200': 5, '2600': 5, '6400': 3, levelEq: 0 }
  },
  noiseGate: {
    name: 'noiseGate',
    parameter: { sens: 30, decay: 40 }
  },
  mod: {
    name: 'stChorus',
    parameter: { inten: 20, width: 60, rate: 30, subD: 40 }
  },
  delay: {},
  reverb: {
    name: 'room',
    parameter: { decay: 12, tone: 55, level: 8 }
  },
  ir: {
    cabinetName: 'ampSv410',
    cabinetParameter: { levelIr: 0, lowCut: 50, highCut: 8000 },
    micConfig: {}
  }
}

const jsonText = ref(JSON.stringify(defaultJson, null, 4))

// 3. Sync Connection Status with appState
watch(
  isConnected,
  (connected) => {
    if (connected) {
      appState.value = 'ready'
      status.value = '🟢 MG-30 Connected'
    } else {
      appState.value = 'initializing'
      status.value = 'Searching for MG-30...'
    }
  },
  { immediate: true }
)

async function handleLoadToDevice(): Promise<void> {
  appState.value = 'loading'
  status.value = '📤 Sending data to MG-30...'

  try {
    const parsed = JSON.parse(jsonText.value) as MG30FullConfig

    // Artificial delay to make the loading transition smooth
    await new Promise((resolve) => setTimeout(resolve, 600))

    await loadConfig(parsed)

    status.value = '✅ Configuration loaded successfully!'
    // Switch back to ready after a short delay so the user sees the success message
    setTimeout(() => {
      appState.value = 'ready'
    }, 1500)
  } catch (err) {
    console.error(err)
    appState.value = 'ready'
    status.value = '❌ Error: Invalid JSON or Connection Lost'
  }
}
</script>

<template>
  <div class="app-wrapper">
    <div v-if="appState === 'initializing' || appState === 'loading'" class="overlay">
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
        <h1>MG-30 : JSON LOADER</h1>
        <div class="status-badge" :class="{ connected: isConnected }">
          {{ status }}
        </div>
      </header>

      <div class="editor-container">
        <textarea v-model="jsonText" spellcheck="false" class="json-area"></textarea>
      </div>

      <footer>
        <button class="load-btn" @click="handleLoadToDevice">LOAD TO DEVICE</button>
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

textarea::-webkit-scrollbar {
  width: 8px;
}
textarea::-webkit-scrollbar-track {
  background: #1e1e1e;
}
textarea::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 10px;
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

.editor-container {
  flex: 1;
  min-height: 0;
  margin-bottom: 10px;
}

.json-area {
  width: 100%;
  height: 100%;
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 15px;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  resize: none;
  box-sizing: border-box;
  outline: none;
}

.json-area:focus {
  border-color: #00ff9d;
}

footer {
  margin-top: 15px;
  text-align: right;
}

.load-btn {
  background: #00ff9d;
  color: #000;
  border: none;
  padding: 12px 30px;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  transition:
    transform 0.1s,
    background 0.2s;
}

.load-btn:hover {
  background: #00cc7e;
}
.load-btn:active {
  transform: scale(0.98);
}
</style>
