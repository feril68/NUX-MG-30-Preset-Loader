import { ref, type Ref } from 'vue'
import { useMG30 } from './useMG30'
import { MG30_MESSAGES } from './constants'

interface ResetStatusBridge {
  isConnected: () => boolean
  isReady: () => boolean
  setStatus: (message: string) => void
}

interface ResetBypassOptions {
  showStartStatus?: boolean
  showSuccessStatus?: boolean
  restoreConnectedStatus?: boolean
}

interface UseBypassResetResult {
  isResettingBypass: Ref<boolean>
  resetAllBypass: (options?: ResetBypassOptions) => Promise<boolean>
}

export function useBypassReset(statusBridge: ResetStatusBridge): UseBypassResetResult {
  const { resetAllBlocksToBypass } = useMG30()
  const isResettingBypass = ref(false)

  async function resetAllBypass(options: ResetBypassOptions = {}): Promise<boolean> {
    const {
      showStartStatus = true,
      showSuccessStatus = true,
      restoreConnectedStatus = true
    } = options

    if (!statusBridge.isConnected() || isResettingBypass.value) {
      return false
    }

    isResettingBypass.value = true

    if (showStartStatus) {
      statusBridge.setStatus(MG30_MESSAGES.resettingBypass)
    }

    try {
      await resetAllBlocksToBypass()

      if (showSuccessStatus) {
        statusBridge.setStatus('✅ All blocks reset to bypass')
      }

      if (showSuccessStatus && restoreConnectedStatus) {
        setTimeout(() => {
          if (statusBridge.isConnected() && statusBridge.isReady()) {
            statusBridge.setStatus(MG30_MESSAGES.connected)
          }
        }, 1200)
      }

      return true
    } catch (error) {
      console.error(error)
      statusBridge.setStatus(MG30_MESSAGES.resetBypassFailed)
      return false
    } finally {
      isResettingBypass.value = false
    }
  }

  return {
    isResettingBypass,
    resetAllBypass
  }
}
