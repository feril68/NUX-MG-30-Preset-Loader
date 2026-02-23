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
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: PreloadApi
  }
}
