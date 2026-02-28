import { MG30FullConfig } from '../mg30/types/mg30'
import { AISettings } from '../ai/storage'
import { MODEL_BASE_DICT, KNOB_SCALE } from '../mg30/constants'

type GeneratedAiPayload = {
  config: MG30FullConfig
  additionalInfo: string
}

type ParsedAiJson = Record<string, unknown>
let chatTemplateCache: string | null = null

function isRecord(value: unknown): value is ParsedAiJson {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function buildFallbackPrompt(
  songName: string,
  artistName: string,
  instrumentName: string,
  additionalInfo: string
): string {
  const artistLine = artistName.trim() ? `Artist: ${artistName.trim()}` : 'Artist: (not provided)'
  const additionalLine = additionalInfo.trim()
    ? `Additional info: ${additionalInfo.trim()}`
    : 'Additional info: (not provided)'

  return [
    'Create one NUX MG-30 preset JSON for this song profile.',
    'Return ONLY valid JSON with this shape:',
    '{',
    '  "additionalInfo": "Markdown explanation",',
    '  "chainOrder": [...],',
    '  "wah": {...},',
    '  "compressor": {...},',
    '  "efx": {...},',
    '  "amp": {...},',
    '  "eq": {...},',
    '  "noiseGate": {...},',
    '  "mod": {...},',
    '  "delay": {...},',
    '  "reverb": {...},',
    '  "ir": {...}',
    '}',
    'Do not wrap the JSON in markdown code fences.',
    '',
    `Song: ${songName.trim()}`,
    artistLine,
    `Instrument: ${instrumentName.trim()}`,
    additionalLine,
    ''
  ].join('\n')
}

function fillChatTemplate(
  template: string,
  songName: string,
  artistName: string,
  instrumentName: string,
  additionalInfo: string
): string {
  const resolvedSong = songName.trim() || '-'
  const resolvedArtist = artistName.trim() || '-'
  const resolvedInstrument = instrumentName.trim() || '-'
  const resolvedAdditional = additionalInfo.trim() || '-'

  return template
    .split('{song name}')
    .join(resolvedSong)
    .split('{artist name}')
    .join(resolvedArtist)
    .split('{instrument name}')
    .join(resolvedInstrument)
    .split('{additional information}')
    .join(resolvedAdditional)
}

function injectConstantsIntoTemplate(template: string): string {
  const modelBaseDictText = JSON.stringify(MODEL_BASE_DICT, null, 2)
  const knobScaleText = JSON.stringify(KNOB_SCALE, null, 2)

  if (template.includes('{MODEL_BASE_DICT}') || template.includes('{KNOB_SCALE}')) {
    return template
      .split('{MODEL_BASE_DICT}')
      .join(modelBaseDictText)
      .split('{KNOB_SCALE}')
      .join(knobScaleText)
  }

  const modelHeader = '- ONLY use models block found in this dict: MODEL_BASE_DICT = '
  const knobHeader = '- ONLY use values within the ranges in: KNOB_SCALE = '
  const nameRuleLine =
    '- `name` fields MUST be exact MODEL_BASE_DICT keys (case-sensitive), never display labels.'

  let normalized = template

  const modelSectionRegex =
    /- ONLY use models block found in this dict: MODEL_BASE_DICT =[\s\S]*?- ONLY use values within the ranges in: KNOB_SCALE =/m

  if (modelSectionRegex.test(normalized)) {
    normalized = normalized.replace(
      modelSectionRegex,
      `${modelHeader}${modelBaseDictText}\n${knobHeader}`
    )
  }

  const knobSectionRegex =
    /- ONLY use values within the ranges in: KNOB_SCALE =[\s\S]*?- `name` fields MUST be exact MODEL_BASE_DICT keys \(case-sensitive\), never display labels\./m

  if (knobSectionRegex.test(normalized)) {
    normalized = normalized.replace(
      knobSectionRegex,
      `${knobHeader}${knobScaleText}\n${nameRuleLine}`
    )
  }

  return normalized
}

async function buildPrompt(
  songName: string,
  artistName: string,
  instrumentName: string,
  additionalInfo: string
): Promise<string> {
  if (!chatTemplateCache) {
    try {
      const loadedTemplate = await window.api.ai.getChatTemplate()
      chatTemplateCache = injectConstantsIntoTemplate(loadedTemplate)
    } catch {
      chatTemplateCache = null
    }
  }

  if (!chatTemplateCache) {
    return buildFallbackPrompt(songName, artistName, instrumentName, additionalInfo)
  }

  return fillChatTemplate(chatTemplateCache, songName, artistName, instrumentName, additionalInfo)
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed
  }

  const firstBrace = trimmed.indexOf('{')
  if (firstBrace === -1) {
    throw new Error('No JSON object found in Ollama response')
  }

  let depth = 0
  let start = -1

  for (let i = firstBrace; i < trimmed.length; i++) {
    const char = trimmed[i]
    if (char === '{') {
      if (depth === 0) {
        start = i
      }
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0 && start >= 0) {
        return trimmed.slice(start, i + 1)
      }
    }
  }

  throw new Error('Invalid JSON object in Ollama response')
}

function normalizeGeneratedPayload(parsed: unknown): GeneratedAiPayload {
  if (!isRecord(parsed)) {
    throw new Error('Generated response is not a JSON object')
  }

  let additionalInfo = ''

  if (typeof parsed.additionalInfo === 'string') {
    additionalInfo = parsed.additionalInfo
  }

  const sourceConfig = isRecord(parsed.config) ? parsed.config : parsed
  const { additionalInfo: nestedAdditionalInfo, ...configWithoutAdditionalInfo } = sourceConfig

  if (!additionalInfo && typeof nestedAdditionalInfo === 'string') {
    additionalInfo = nestedAdditionalInfo
  }

  return {
    config: configWithoutAdditionalInfo as MG30FullConfig,
    additionalInfo
  }
}

export function useOllama(): {
  generateConfig: (
    songName: string,
    artistName: string,
    instrumentName: string,
    additionalInfo: string,
    settings: AISettings
  ) => Promise<GeneratedAiPayload>
} {
  async function generateConfig(
    songName: string,
    artistName: string,
    instrumentName: string,
    additionalInfo: string,
    settings: AISettings
  ): Promise<GeneratedAiPayload> {
    const prompt = await buildPrompt(songName, artistName, instrumentName, additionalInfo)
    const provider = settings.provider

    if (provider === 'gemini') {
      console.log('[AI][Gemini] Prompt sent to model:')
      console.log(prompt)
    }

    const result =
      provider === 'gemini'
        ? await window.api.gemini.generate({
            apiKey: settings.geminiApiKey,
            model: settings.geminiModel,
            prompt
          })
        : await window.api.ollama.generate({
            model: settings.ollamaModel,
            prompt,
            stream: false,
            format: 'json'
          })

    const jsonStr = extractJsonObject(result.response)
    const parsed = JSON.parse(jsonStr) as unknown

    return normalizeGeneratedPayload(parsed)
  }

  return {
    generateConfig
  }
}
