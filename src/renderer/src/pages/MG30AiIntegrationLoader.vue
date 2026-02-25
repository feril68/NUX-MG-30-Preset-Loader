<script setup lang="ts">
import { ref } from 'vue'
import { useMG30 } from '../services/mg30/useMG30'
import { useBypassReset } from '../services/mg30/useBypassReset'
import { useOllama } from '../services/ollama/useOllama'
import MG30PageLayout from '../components/MG30PageLayout.vue'
import MG30FooterActions from '../components/MG30FooterActions.vue'

const { loadConfig } = useMG30()
const { generateConfig } = useOllama()
const layoutRef = ref<InstanceType<typeof MG30PageLayout> | null>(null)
const { isResettingBypass, resetAllBypass } = useBypassReset({
  isConnected: () => !!layoutRef.value?.isConnected,
  isReady: () => layoutRef.value?.appState === 'ready',
  setStatus: (message: string) => {
    if (layoutRef.value) {
      layoutRef.value.status = message
    }
  }
})

const songName = ref('')
const artistName = ref('')
const instrumentName = ref('')
const additionalInfo = ref('')

async function handleGenerateAndLoad(): Promise<void> {
  if (!songName.value.trim() || !instrumentName.value.trim()) {
    layoutRef.value!.status = '❌ Song name and instrument name are required'
    return
  }

  layoutRef.value!.appState = 'loading'
  layoutRef.value!.status = '✨ Generating MG-30 configuration from Ollama...'

  try {
    const config = await generateConfig(
      songName.value,
      artistName.value,
      instrumentName.value,
      additionalInfo.value
    )

    const resetDone = await resetAllBypass({
      showStartStatus: true,
      showSuccessStatus: false,
      restoreConnectedStatus: false
    })

    if (!resetDone) {
      layoutRef.value!.appState = 'ready'
      return
    }

    layoutRef.value!.status = '📥 Sending data to MG-30...'
    await loadConfig(config)

    layoutRef.value!.status = '✅ Configuration loaded successfully!'

    songName.value = ''
    artistName.value = ''
    instrumentName.value = ''
    additionalInfo.value = ''

    setTimeout(() => {
      layoutRef.value!.appState = 'ready'
      if (layoutRef.value!.isConnected) {
        layoutRef.value!.status = '🟢 MG-30 Connected'
      }
    }, 1200)
  } catch (error) {
    console.error(error)
    layoutRef.value!.appState = 'ready'
    layoutRef.value!.status = '❌ Error: Failed to generate or load configuration'
  }
}

async function handleResetAllBypass(): Promise<void> {
  await resetAllBypass()
}
</script>

<template>
  <MG30PageLayout ref="layoutRef" title="MG-30 : AI INTEGRATION LOADER">
    <template #content>
      <div class="form-container">
        <div class="field">
          <label>Song Name *</label>
          <input v-model="songName" type="text" placeholder="e.g. Enter Sandman" />
        </div>

        <div class="field">
          <label>Artist Name</label>
          <input v-model="artistName" type="text" placeholder="e.g. Metallica" />
        </div>

        <div class="field">
          <label>Instrument Name *</label>
          <input v-model="instrumentName" type="text" placeholder="e.g. Electric Guitar" />
        </div>

        <div class="field field-textarea">
          <label>Additional Info</label>
          <textarea
            v-model="additionalInfo"
            rows="6"
            spellcheck="false"
            placeholder="Describe tone preference, pickup position, amp character, etc."
          ></textarea>
        </div>
      </div>
    </template>

    <template #footer>
      <MG30FooterActions
        load-label="GENERATE & LOAD TO DEVICE"
        :disable-reset="!layoutRef?.isConnected || isResettingBypass"
        @reset="handleResetAllBypass"
        @load="handleGenerateAndLoad"
      />
    </template>
  </MG30PageLayout>
</template>

<style scoped>
.form-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-textarea {
  flex: 1;
}

label {
  color: #d4d4d4;
  font-size: 0.9rem;
}

input,
textarea {
  width: 100%;
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  box-sizing: border-box;
  outline: none;
}

textarea {
  min-height: 120px;
  resize: none;
}

input:focus,
textarea:focus {
  border-color: #00ff9d;
}
</style>
