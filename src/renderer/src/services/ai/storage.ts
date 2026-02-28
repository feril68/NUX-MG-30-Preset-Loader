import { ref, type Ref } from 'vue'

export type AIProvider = 'gemini' | 'ollama'

export interface AISettings {
  provider: AIProvider
  geminiApiKey: string
  geminiModel: string
  ollamaModel: string
}

const AI_SETTINGS_STORAGE_KEY = 'mg30.ai.settings.v1'
const AI_ADDITIONAL_INFO_STORAGE_KEY = 'mg30.ai.additional-info.v1'
const AI_JSON_OUTPUT_STORAGE_KEY = 'mg30.ai.json-output.v1'

const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  ollamaModel: 'mg30-ai'
}

const additionalInfoRef = ref('')
const generatedJsonOutputRef = ref('')

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function normalizeSettings(candidate: unknown): AISettings {
  if (!candidate || typeof candidate !== 'object') {
    return { ...DEFAULT_AI_SETTINGS }
  }

  const data = candidate as Partial<Record<keyof AISettings, unknown>>

  return {
    provider: data.provider === 'ollama' ? 'ollama' : 'gemini',
    geminiApiKey: typeof data.geminiApiKey === 'string' ? data.geminiApiKey : '',
    geminiModel:
      typeof data.geminiModel === 'string' && data.geminiModel.trim()
        ? data.geminiModel
        : DEFAULT_AI_SETTINGS.geminiModel,
    ollamaModel:
      typeof data.ollamaModel === 'string' && data.ollamaModel.trim()
        ? data.ollamaModel
        : DEFAULT_AI_SETTINGS.ollamaModel
  }
}

export function loadAISettings(): AISettings {
  if (!canUseStorage()) {
    return { ...DEFAULT_AI_SETTINGS }
  }

  const raw = window.localStorage.getItem(AI_SETTINGS_STORAGE_KEY)
  if (!raw) {
    return { ...DEFAULT_AI_SETTINGS }
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    return normalizeSettings(parsed)
  } catch {
    return { ...DEFAULT_AI_SETTINGS }
  }
}

export function saveAISettings(settings: AISettings): AISettings {
  const normalized = normalizeSettings(settings)
  if (canUseStorage()) {
    window.localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(normalized))
  }
  return normalized
}

export function getDefaultAISettings(): AISettings {
  return { ...DEFAULT_AI_SETTINGS }
}

export function loadAdditionalInfo(): string {
  if (!canUseStorage()) {
    return ''
  }

  const raw = window.localStorage.getItem(AI_ADDITIONAL_INFO_STORAGE_KEY)
  return raw ?? ''
}

export function saveAdditionalInfo(value: string): void {
  const normalized = value ?? ''
  additionalInfoRef.value = normalized

  if (!canUseStorage()) return
  window.localStorage.setItem(AI_ADDITIONAL_INFO_STORAGE_KEY, normalized)
}

export function loadGeneratedJsonOutput(): string {
  if (!canUseStorage()) {
    return ''
  }

  const raw = window.localStorage.getItem(AI_JSON_OUTPUT_STORAGE_KEY)
  return raw ?? ''
}

export function saveGeneratedJsonOutput(value: string): void {
  const normalized = value ?? ''
  generatedJsonOutputRef.value = normalized

  if (!canUseStorage()) return
  window.localStorage.setItem(AI_JSON_OUTPUT_STORAGE_KEY, normalized)
}

export function useAdditionalInfoStorage(): {
  additionalInfo: Ref<string>
  generatedJsonOutput: Ref<string>
  refresh: () => void
  clear: () => void
} {
  const refresh = (): void => {
    additionalInfoRef.value = loadAdditionalInfo()
    generatedJsonOutputRef.value = loadGeneratedJsonOutput()
  }

  const clear = (): void => {
    additionalInfoRef.value = ''
    generatedJsonOutputRef.value = ''
    if (!canUseStorage()) return
    window.localStorage.removeItem(AI_ADDITIONAL_INFO_STORAGE_KEY)
    window.localStorage.removeItem(AI_JSON_OUTPUT_STORAGE_KEY)
  }

  return {
    additionalInfo: additionalInfoRef,
    generatedJsonOutput: generatedJsonOutputRef,
    refresh,
    clear
  }
}
