import { ref, onMounted } from 'vue'
import type { Ref } from 'vue'
import { MG30Controller } from './MG30Controller'

const controller = new MG30Controller()

export function useMG30(): {
  isConnected: Ref<boolean>
  loadConfig: MG30Controller['loadConfig']
  setParam: MG30Controller['setParam']
  setBlockModel: MG30Controller['setBlockModel']
  resetAllBlocksToBypass: MG30Controller['resetAllBlocksToBypass']
} {
  const isConnected = ref(false)

  const updateStatus = (): void => {
    isConnected.value = controller.isConnected
  }

  onMounted(async () => {
    await controller.init(updateStatus)
    updateStatus()
  })

  return {
    isConnected,
    loadConfig: controller.loadConfig.bind(controller),
    setParam: controller.setParam.bind(controller),
    setBlockModel: controller.setBlockModel.bind(controller),
    resetAllBlocksToBypass: controller.resetAllBlocksToBypass.bind(controller)
  }
}
