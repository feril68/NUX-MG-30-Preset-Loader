<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMG30 } from '../services/mg30/useMG30'
import { useBypassReset } from '../services/mg30/useBypassReset'
import { useDeviceLoadFlow } from '../services/mg30/useDeviceLoadFlow'
import { usePageLayoutBridge } from '../services/mg30/usePageLayoutBridge'
import { MG30_MESSAGES } from '../services/mg30/constants'
import { MG30FullConfig } from '../services/mg30/types/mg30'
import { formatPastedJsonIf } from '../services/json/paste'
import {
  formatValidationIssuesForDisplay,
  getMG30ValidationIssues,
  isMG30FullConfigLike
} from '../services/mg30/mg30JsonValidation'
import MG30PageLayout from '../components/MG30PageLayout.vue'
import MG30FooterActions from '../components/MG30FooterActions.vue'

const { loadConfig } = useMG30()
const layoutRef = ref<InstanceType<typeof MG30PageLayout> | null>(null)
const { getLayout, setLayoutStatus, setLayoutState } = usePageLayoutBridge(layoutRef)
const { isResettingBypass, resetAllBypass } = useBypassReset({
  isConnected: () => !!getLayout()?.isConnected,
  isReady: () => getLayout()?.appState === 'ready',
  setStatus: setLayoutStatus
})
const { runDeviceLoadFlow } = useDeviceLoadFlow({
  resetAllBypass,
  setLayoutState,
  setLayoutStatus,
  setReadyWithConnectedStatus: () => {
    setLayoutState('ready')
  }
})

const defaultJson: MG30FullConfig = {
  reorderMode: 'fast',
  chainOrder: ['noiseGate', 'compressor', 'efx', 'amp', 'ir', 'eq', 'mod', 'delay', 'reverb'],
  wah: {},
  compressor: {
    isSwap: false,
    name: 'studioComp',
    parameter: { threshold: 42, ratio: 65, gain: 65, release: 40 }
  },
  efx: {
    isSwap: false
  },
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
    isSwap: false,
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

type JsonEditorWarningState = {
  message: string | null
  level: 'error' | 'warning' | null
}

const jsonText = ref(JSON.stringify(defaultJson, null, 4))
const jsonEditorWarning = computed<JsonEditorWarningState>(() => {
  const source = jsonText.value.trim()
  if (!source) {
    return { message: null, level: null }
  }

  try {
    const parsed = JSON.parse(source) as unknown
    const issues = getMG30ValidationIssues(parsed)
    if (issues.length > 0) {
      return {
        message: `JSON is valid, but MG-30 config has issues: ${formatValidationIssuesForDisplay(issues)}.`,
        level: 'warning'
      }
    }
  } catch {
    return {
      message: 'Invalid JSON format. Continue editing until this warning disappears.',
      level: 'error'
    }
  }

  return { message: null, level: null }
})

async function handleLoadToDevice(): Promise<void> {
  const layout = getLayout()
  if (!layout) return

  let parsedConfig: MG30FullConfig | null = null

  await runDeviceLoadFlow({
    prepare: async () => {
      parsedConfig = JSON.parse(jsonText.value) as MG30FullConfig
    },
    send: async () => {
      if (!parsedConfig) {
        throw new Error('Parsed configuration is unavailable')
      }

      await loadConfig(parsedConfig)
    },
    sendingStatus: MG30_MESSAGES.sendingToDevice,
    successStatus: MG30_MESSAGES.loadSuccess,
    errorStatus: MG30_MESSAGES.jsonLoadError,
    beforeSendDelayMs: 600,
    transition: {
      mode: 'ready-only',
      delayMs: 1500
    }
  })
}

async function handleResetAllBypass(): Promise<void> {
  await resetAllBypass()
}

function tryFormatEditorJson(): void {
  const formatted = formatPastedJsonIf(jsonText.value, isMG30FullConfigLike)
  if (!formatted) return

  jsonText.value = formatted
}

function handleEditorKeydown(event: KeyboardEvent): void {
  const isFormatShortcut =
    (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'f'
  if (!isFormatShortcut) return

  event.preventDefault()
  tryFormatEditorJson()
}

function handlePaste(event: ClipboardEvent): void {
  const pastedText = event.clipboardData?.getData('text')
  if (!pastedText) {
    setTimeout(tryFormatEditorJson, 0)
    return
  }

  const formatted = formatPastedJsonIf(pastedText, isMG30FullConfigLike)
  if (formatted) {
    jsonText.value = formatted
    event.preventDefault()
    return
  }

  setTimeout(tryFormatEditorJson, 0)
}
</script>

<template>
  <MG30PageLayout ref="layoutRef" title="MG-30 : JSON LOADER">
    <template #content>
      <div class="editor-container">
        <textarea
          v-model="jsonText"
          spellcheck="false"
          class="json-area"
          @paste="handlePaste"
          @blur="tryFormatEditorJson"
          @keydown="handleEditorKeydown"
        ></textarea>
        <div class="editor-meta">
          <div
            class="editor-warning"
            :class="{
              'is-visible': !!jsonEditorWarning.message,
              'is-error': jsonEditorWarning.level === 'error',
              'is-warning': jsonEditorWarning.level === 'warning'
            }"
          >
            <span v-if="jsonEditorWarning.level === 'error'">⛔ </span>
            <span v-else-if="jsonEditorWarning.level === 'warning'">⚠ </span>
            {{ jsonEditorWarning.message || '\u00A0' }}
          </div>
          <div class="editor-hint">Format: Ctrl/Cmd + Shift + F</div>
        </div>
      </div>
    </template>

    <template #footer>
      <MG30FooterActions
        load-label="LOAD TO DEVICE"
        :disable-reset="!layoutRef?.isConnected || isResettingBypass"
        @reset="handleResetAllBypass"
        @load="handleLoadToDevice"
      />
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
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  margin-bottom: 10px;
}

.json-area {
  width: 100%;
  flex: 1;
  min-height: 0;
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

.editor-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  min-height: 16px;
}

.editor-hint {
  font-size: 11px;
  color: #8f8f8f;
  text-align: right;
  white-space: nowrap;
}

.editor-warning {
  font-size: 11px;
  color: #8f8f8f;
  text-align: left;
  visibility: hidden;
}

.editor-warning.is-visible {
  visibility: visible;
}

.editor-warning.is-error {
  color: #d4d4d4;
  font-weight: 600;
}

.editor-warning.is-warning {
  color: #ffe600;
}
</style>
