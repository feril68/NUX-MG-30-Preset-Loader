<script setup lang="ts">
import { ref } from 'vue'
import { useMG30 } from '../services/mg30/useMG30'
import { MG30FullConfig } from '../services/mg30/types/mg30'
import MG30PageLayout from '../components/MG30PageLayout.vue'

const { loadConfig } = useMG30()
const layoutRef = ref<InstanceType<typeof MG30PageLayout> | null>(null)

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

async function handleLoadToDevice(): Promise<void> {
  layoutRef.value!.appState = 'loading'
  layoutRef.value!.status = '📥 Sending data to MG-30...'

  try {
    const parsed = JSON.parse(jsonText.value) as MG30FullConfig

    // Artificial delay to make the loading transition smooth
    await new Promise((resolve) => setTimeout(resolve, 600))

    await loadConfig(parsed)

    layoutRef.value!.status = '✅ Configuration loaded successfully!'
    // Switch back to ready after a short delay so the user sees the success message
    setTimeout(() => {
      layoutRef.value!.appState = 'ready'
    }, 1500)
  } catch (err) {
    console.error(err)
    layoutRef.value!.appState = 'ready'
    layoutRef.value!.status = '❌ Error: Invalid JSON or Connection Lost'
  }
}
</script>

<template>
  <MG30PageLayout ref="layoutRef" title="MG-30 : JSON LOADER">
    <template #content>
      <div class="editor-container">
        <textarea v-model="jsonText" spellcheck="false" class="json-area"></textarea>
      </div>
    </template>

    <template #footer>
      <button class="load-btn" @click="handleLoadToDevice">LOAD TO DEVICE</button>
    </template>
  </MG30PageLayout>
</template>

<style scoped>
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
