import { MODEL_BASE_DICT } from '../constants'

export type EffectBlock = keyof typeof MODEL_BASE_DICT

export interface ParameterMap {
  [paramName: string]: number
}

export interface MG30BlockConfig {
  name?: string
  parameter?: Record<string, number>
  cabinetName?: string
  micConfig?: {
    micType?: string
    micPosition?: string
  }
  cabinetParameter?: Record<string, number>
}

export interface MG30FullConfig {
  [key: string]: MG30BlockConfig
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'searching'
