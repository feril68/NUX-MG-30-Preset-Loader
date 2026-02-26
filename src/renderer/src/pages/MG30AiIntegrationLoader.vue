<script setup lang="ts">
import { ref } from 'vue'
import { useMG30 } from '../services/mg30/useMG30'
import { useBypassReset } from '../services/mg30/useBypassReset'
import { useDeviceLoadFlow } from '../services/mg30/useDeviceLoadFlow'
import { usePageLayoutBridge } from '../services/mg30/usePageLayoutBridge'
import { MG30_MESSAGES } from '../services/mg30/constants'
import { useOllama } from '../services/ollama/useOllama'
import MG30PageLayout from '../components/MG30PageLayout.vue'
import MG30FooterActions from '../components/MG30FooterActions.vue'

const { loadConfig } = useMG30()
const { generateConfig } = useOllama()
const layoutRef = ref<InstanceType<typeof MG30PageLayout> | null>(null)
const { getLayout, setLayoutStatus, setLayoutState, setReadyWithConnectedStatus } =
  usePageLayoutBridge(layoutRef)
const { isResettingBypass, resetAllBypass } = useBypassReset({
  isConnected: () => !!getLayout()?.isConnected,
  isReady: () => getLayout()?.appState === 'ready',
  setStatus: setLayoutStatus
})
const { runDeviceLoadFlow } = useDeviceLoadFlow({
  resetAllBypass,
  setLayoutState,
  setLayoutStatus,
  setReadyWithConnectedStatus
})

const songName = ref('')
const artistName = ref('')
const instrumentName = ref('')
const additionalInfo = ref('')

async function handleGenerateAndLoad(): Promise<void> {
  const layout = getLayout()
  if (!layout) return

  if (!songName.value.trim() || !instrumentName.value.trim()) {
    layout.status = MG30_MESSAGES.aiValidationError
    return
  }

  let generatedConfig: Awaited<ReturnType<typeof generateConfig>> | null = null

  await runDeviceLoadFlow({
    prepare: async () => {
      setLayoutStatus(MG30_MESSAGES.aiGenerateStart)
      generatedConfig = await generateConfig(
        songName.value,
        artistName.value,
        instrumentName.value,
        additionalInfo.value
      )
    },
    send: async () => {
      if (!generatedConfig) {
        throw new Error('Generated configuration is unavailable')
      }
      await loadConfig(generatedConfig)
    },
    sendingStatus: MG30_MESSAGES.sendingToDevice,
    successStatus: MG30_MESSAGES.loadSuccess,
    errorStatus: MG30_MESSAGES.aiLoadError,
    onSuccess: () => {
      songName.value = ''
      artistName.value = ''
      instrumentName.value = ''
      additionalInfo.value = ''
    },
    transition: {
      mode: 'connected-status',
      delayMs: 1200
    }
  })
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
