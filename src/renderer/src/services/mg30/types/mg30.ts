import { MODEL_BASE_DICT } from '../constants'

export type EffectBlock = keyof typeof MODEL_BASE_DICT

export interface ParameterMap {
  [paramName: string]: number
}

export interface MG30BlockConfig {
  name?: string
  isSwap?: boolean
  parameter?: Record<string, number>
  cabinetName?: string
  micConfig?: {
    micType?: string
    micPosition?: string
  }
  cabinetParameter?: Record<string, number>
}

export interface MG30FullConfig extends Partial<Record<EffectBlock, MG30BlockConfig>> {
  chainOrder?: EffectBlock[]
  reorderMode?: 'stable' | 'fast'
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'searching'
