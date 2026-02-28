import { ElectronAPI } from '@electron-toolkit/preload'

interface NativeMidiPorts {
  inputs: string[]
  outputs: string[]
}

interface NativeMidiConnectResult extends NativeMidiPorts {
  connected: boolean
  selectedOutput: string | null
}

interface PreloadApi {
  midi: {
    list: () => Promise<NativeMidiPorts>
    connect: (targetName: string) => Promise<NativeMidiConnectResult>
    send: (data: number[]) => void
  }
  ollama: {
    generate: (payload: {
      model: string
      prompt: string
      stream?: boolean
      format?: 'json'
    }) => Promise<{ response: string }>
  }
  gemini: {
    generate: (payload: {
      apiKey: string
      model: string
      prompt: string
    }) => Promise<{ response: string }>
  }
  ai: {
    getChatTemplate: () => Promise<string>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: PreloadApi
  }
}
