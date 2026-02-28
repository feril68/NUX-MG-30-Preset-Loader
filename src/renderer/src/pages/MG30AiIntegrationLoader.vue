<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMG30 } from '../services/mg30/useMG30'
import { useBypassReset } from '../services/mg30/useBypassReset'
import { useDeviceLoadFlow } from '../services/mg30/useDeviceLoadFlow'
import { usePageLayoutBridge } from '../services/mg30/usePageLayoutBridge'
import { MG30_MESSAGES } from '../services/mg30/constants'
import { useOllama } from '../services/ollama/useOllama'
import {
  AIProvider,
  getDefaultAISettings,
  loadAISettings,
  saveAdditionalInfo,
  saveGeneratedJsonOutput,
  saveAISettings
} from '../services/ai/storage'
import MG30PageLayout from '../components/MG30PageLayout.vue'
import MG30FooterActions from '../components/MG30FooterActions.vue'

const router = useRouter()
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
const provider = ref<AIProvider>('gemini')
const geminiApiKey = ref('')
const geminiModel = ref('gemini-2.5-flash')
const ollamaModel = ref('mg30-ai')
const settingsSavedMessage = ref('')
const isSettingsOpen = ref(false)

const isGeminiSelected = computed(() => provider.value === 'gemini')
const disableGenerate = computed(() => isGeminiSelected.value && !geminiApiKey.value.trim())

function applySettingsFromStorage(): void {
  const settings = loadAISettings()
  provider.value = settings.provider
  geminiApiKey.value = settings.geminiApiKey
  geminiModel.value = settings.geminiModel
  ollamaModel.value = settings.ollamaModel
}

function persistSettings(): void {
  const fallback = getDefaultAISettings()
  const saved = saveAISettings({
    provider: provider.value,
    geminiApiKey: geminiApiKey.value.trim(),
    geminiModel: geminiModel.value.trim() || fallback.geminiModel,
    ollamaModel: ollamaModel.value.trim() || fallback.ollamaModel
  })

  provider.value = saved.provider
  geminiApiKey.value = saved.geminiApiKey
  geminiModel.value = saved.geminiModel
  ollamaModel.value = saved.ollamaModel

  settingsSavedMessage.value = 'Settings saved'
  const layout = getLayout()
  if (layout) {
    layout.status = '✅ AI settings saved'
  }
}

onMounted(() => {
  applySettingsFromStorage()
})

async function handleGenerateAndLoad(): Promise<void> {
  const layout = getLayout()
  if (!layout) return

  if (!songName.value.trim() || !instrumentName.value.trim()) {
    layout.status = MG30_MESSAGES.aiValidationError
    return
  }

  if (provider.value === 'gemini' && !geminiApiKey.value.trim()) {
    layout.status = '❌ Gemini API key is required'
    return
  }

  let generatedConfig: Awaited<ReturnType<typeof generateConfig>> | null = null
  persistSettings()

  await runDeviceLoadFlow({
    prepare: async () => {
      setLayoutStatus(MG30_MESSAGES.aiGenerateStart)
      generatedConfig = await generateConfig(
        songName.value,
        artistName.value,
        instrumentName.value,
        additionalInfo.value,
        {
          provider: provider.value,
          geminiApiKey: geminiApiKey.value,
          geminiModel: geminiModel.value,
          ollamaModel: ollamaModel.value
        }
      )
    },
    send: async () => {
      if (!generatedConfig) {
        throw new Error('Generated configuration is unavailable')
      }
      await loadConfig(generatedConfig.config)
    },
    sendingStatus: MG30_MESSAGES.sendingToDevice,
    successStatus: MG30_MESSAGES.loadSuccess,
    errorStatus: MG30_MESSAGES.aiLoadError,
    onSuccess: () => {
      const details = generatedConfig?.additionalInfo?.trim()
      saveAdditionalInfo(details || 'No additionalInfo was provided by AI.')
      if (generatedConfig) {
        saveGeneratedJsonOutput(
          JSON.stringify(
            {
              ...generatedConfig.config,
              additionalInfo: generatedConfig.additionalInfo
            },
            null,
            2
          )
        )
      }
      songName.value = ''
      artistName.value = ''
      instrumentName.value = ''
      additionalInfo.value = ''
      void router.push('/ai-info')
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

function toggleSettingsSection(): void {
  isSettingsOpen.value = !isSettingsOpen.value
}
</script>

<template>
  <MG30PageLayout ref="layoutRef" title="MG-30 : AI INTEGRATION LOADER">
    <template #content>
      <div class="form-container">
        <div class="settings-section">
          <button type="button" class="settings-header" @click="toggleSettingsSection">
            <span class="settings-title">AI SETTINGS</span>
            <span class="settings-toggle">{{ isSettingsOpen ? '▲' : '▼' }}</span>
          </button>

          <div v-if="isSettingsOpen" class="settings-content">
            <div class="field">
              <label>Provider</label>
              <select v-model="provider">
                <option value="gemini">Gemini API</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
            </div>

            <div v-if="isGeminiSelected" class="field">
              <label>Gemini API Key *</label>
              <input
                v-model="geminiApiKey"
                type="password"
                placeholder="Paste your Gemini API key"
              />
            </div>

            <div v-if="isGeminiSelected" class="field">
              <label>Gemini Model</label>
              <input v-model="geminiModel" type="text" placeholder="e.g. gemini-2.5-flash" />
            </div>

            <div v-if="!isGeminiSelected" class="field">
              <label>Ollama Model</label>
              <input v-model="ollamaModel" type="text" placeholder="e.g. mg30-ai" />
            </div>

            <div class="settings-actions">
              <button type="button" class="save-btn" @click="persistSettings">SAVE SETTINGS</button>
              <span class="saved-note">{{ settingsSavedMessage || '\u00A0' }}</span>
            </div>
          </div>
        </div>

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
        :disable-load="disableGenerate"
        @reset="handleResetAllBypass"
        @load="handleGenerateAndLoad"
      />
    </template>
  </MG30PageLayout>
</template>

<style scoped>
.form-container::-webkit-scrollbar {
  width: 8px;
}

.form-container::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.form-container::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 10px;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  overflow: auto;
  padding-right: 4px;
}

.settings-section {
  border: 1px solid #333;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 2px;
}

.settings-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}

.settings-title {
  color: #00ff9d;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.settings-toggle {
  color: #8f8f8f;
  font-size: 0.9rem;
}

.settings-content {
  margin-top: 10px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 15px;
}

.field-textarea {
  flex: 1;
}

label {
  color: #d4d4d4;
  font-size: 0.88rem;
  line-height: 1.25;
}

input,
select,
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
select:focus,
textarea:focus {
  border-color: #00ff9d;
}

.settings-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
}

.save-btn {
  background: #1e1e1e;
  color: #d4d4d4;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 8px 12px;
  font-weight: 700;
  cursor: pointer;
}

.save-btn:hover {
  border-color: #00ff9d;
  color: #00ff9d;
}

.saved-note {
  color: #8f8f8f;
  font-size: 0.8rem;
}
</style>
