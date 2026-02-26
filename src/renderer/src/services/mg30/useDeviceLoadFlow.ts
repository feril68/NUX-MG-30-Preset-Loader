import type { MG30LayoutAppState } from './usePageLayoutBridge'

interface ResetBypassOptions {
  showStartStatus?: boolean
  showSuccessStatus?: boolean
  restoreConnectedStatus?: boolean
}

interface DeviceLoadFlowTransition {
  mode: 'none' | 'ready-only' | 'connected-status'
  delayMs?: number
}

interface DeviceLoadFlowRequest {
  prepare?: () => Promise<void>
  send: () => Promise<void>
  sendingStatus: string
  successStatus: string
  errorStatus: string
  beforeSendDelayMs?: number
  onSuccess?: () => void
  transition?: DeviceLoadFlowTransition
  resetOptions?: ResetBypassOptions
}

interface DeviceLoadFlowDeps {
  resetAllBypass: (options?: ResetBypassOptions) => Promise<boolean>
  setLayoutState: (state: MG30LayoutAppState) => void
  setLayoutStatus: (message: string) => void
  setReadyWithConnectedStatus: (delayMs?: number) => void
}

const DEFAULT_RESET_OPTIONS: ResetBypassOptions = {
  showStartStatus: true,
  showSuccessStatus: false,
  restoreConnectedStatus: false
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useDeviceLoadFlow(deps: DeviceLoadFlowDeps): {
  runDeviceLoadFlow: (request: DeviceLoadFlowRequest) => Promise<boolean>
} {
  async function runDeviceLoadFlow(request: DeviceLoadFlowRequest): Promise<boolean> {
    deps.setLayoutState('loading')

    try {
      if (request.prepare) {
        await request.prepare()
      }

      const resetDone = await deps.resetAllBypass(request.resetOptions ?? DEFAULT_RESET_OPTIONS)
      if (!resetDone) {
        deps.setLayoutState('ready')
        return false
      }

      deps.setLayoutStatus(request.sendingStatus)

      if (request.beforeSendDelayMs && request.beforeSendDelayMs > 0) {
        await wait(request.beforeSendDelayMs)
      }

      await request.send()

      deps.setLayoutStatus(request.successStatus)
      request.onSuccess?.()

      const transition = request.transition ?? { mode: 'none' }
      const delayMs = transition.delayMs ?? 0

      if (transition.mode === 'ready-only') {
        setTimeout(() => {
          deps.setLayoutState('ready')
        }, delayMs)
      } else if (transition.mode === 'connected-status') {
        deps.setReadyWithConnectedStatus(delayMs)
      }

      return true
    } catch (error) {
      console.error(error)
      deps.setLayoutState('ready')
      deps.setLayoutStatus(request.errorStatus)
      return false
    }
  }

  return {
    runDeviceLoadFlow
  }
}
