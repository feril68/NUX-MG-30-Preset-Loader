import { MG30FullConfig } from '../mg30/types/mg30'

const OLLAMA_MODEL = 'mg30-ai'

function buildPrompt(
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
    'Create one NUX MG-30 preset JSON for this song profile:',
    `Song: ${songName.trim()}`,
    artistLine,
    `Instrument: ${instrumentName.trim()}`,
    additionalLine,
    ''
  ].join('\n')
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

export function useOllama(): {
  generateConfig: (
    songName: string,
    artistName: string,
    instrumentName: string,
    additionalInfo: string
  ) => Promise<MG30FullConfig>
} {
  async function generateConfig(
    songName: string,
    artistName: string,
    instrumentName: string,
    additionalInfo: string
  ): Promise<MG30FullConfig> {
    const prompt = buildPrompt(songName, artistName, instrumentName, additionalInfo)
    console.log('Ollama prompt:', prompt)

    const result = await window.api.ollama.generate({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: 'json'
    })

    const jsonStr = extractJsonObject(result.response)
    console.log('Ollama raw response:', result.response)
    const config = JSON.parse(jsonStr) as MG30FullConfig

    return config
  }

  return {
    generateConfig
  }
}
