import type { Ref } from 'vue'
import { MG30_MESSAGES } from './constants'

export type MG30LayoutAppState = 'initializing' | 'ready' | 'loading'

export interface MG30PageLayoutState {
  appState: MG30LayoutAppState
  status: string
  isConnected: boolean
}

export function usePageLayoutBridge(layoutRef: Ref<MG30PageLayoutState | null>): {
  getLayout: () => MG30PageLayoutState | null
  setLayoutStatus: (message: string) => void
  setLayoutState: (state: MG30LayoutAppState) => void
  setReadyWithConnectedStatus: (delayMs?: number) => void
} {
  const getLayout = (): MG30PageLayoutState | null => layoutRef.value

  const setLayoutStatus = (message: string): void => {
    const layout = getLayout()
    if (layout) {
      layout.status = message
    }
  }

  const setLayoutState = (state: MG30LayoutAppState): void => {
    const layout = getLayout()
    if (layout) {
      layout.appState = state
    }
  }

  const setReadyWithConnectedStatus = (delayMs: number = 1200): void => {
    setTimeout(() => {
      const layout = getLayout()
      if (!layout) {
        return
      }

      layout.appState = 'ready'
      if (layout.isConnected) {
        layout.status = MG30_MESSAGES.connected
      }
    }, delayMs)
  }

  return {
    getLayout,
    setLayoutStatus,
    setLayoutState,
    setReadyWithConnectedStatus
  }
}
