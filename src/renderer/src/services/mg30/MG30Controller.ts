import { MG30Engine } from './core/midi-engine'
import { scaleToMidi } from './core/scaler'
import { CC_MAPPING_DICT, MODEL_BASE_DICT } from './constants'
import { EffectBlock, MG30FullConfig, MG30BlockConfig } from './types/mg30'

export class MG30Controller {
  private engine = new MG30Engine()

  async init(onChange: () => void): Promise<void> {
    await this.engine.setup(onChange)
  }

  get isConnected(): boolean {
    return this.engine.isConnected
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  setBlockModel(block: EffectBlock, modelName: string): void {
    const blockData = MODEL_BASE_DICT[block]
    if (!blockData) return

    const cc = CC_MAPPING_DICT.select[block]
    let models: string[] = []

    if (block === 'ir') {
      const irData = MODEL_BASE_DICT.ir.irCabinet
      models = Object.keys(irData)
    } else {
      models = Object.keys(blockData)
    }

    const index = models.indexOf(modelName)
    if (cc !== undefined && index !== -1) {
      this.engine.sendCC(cc, index + 1)
      console.log(`MIDI -> Set ${block} to ${modelName}`)
    }
  }

  setParam(block: EffectBlock, model: string, param: string, rawValue: number | string): void {
    let scaledValue: number

    if (typeof rawValue === 'number') {
      scaledValue = scaleToMidi(param, rawValue)
    } else {
      const irLookup = MODEL_BASE_DICT.ir as Record<string, any>
      const listKey = `ir${param.charAt(0).toUpperCase() + param.slice(1)}`
      const list = irLookup[listKey]
      scaledValue = list ? Object.keys(list).indexOf(rawValue) : 0
    }

    const modelKey = model.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
    let knobIdx: number = -1

    if (block === 'ir') {
      if (param === 'micType') {
        knobIdx = 1
      } else if (param === 'micPosition') {
        knobIdx = 2
      } else {
        const cabinet = (MODEL_BASE_DICT.ir.irCabinet as Record<string, any>)[modelKey]
        const paramsList = cabinet?.parameter as string[] | undefined
        if (paramsList) {
          const pIdx = paramsList.indexOf(param)
          if (pIdx !== -1) knobIdx = pIdx + 3
        }
      }
    } else {
      const paramsList = (MODEL_BASE_DICT[block] as Record<string, string[]>)[modelKey]
      if (paramsList) {
        knobIdx = paramsList.indexOf(param) + 1
      }
    }

    if (knobIdx !== -1) {
      const blockKnobs = CC_MAPPING_DICT.knob[block] as Record<number, number>
      const cc = blockKnobs?.[knobIdx]

      if (cc !== undefined) {
        this.engine.sendCC(cc, scaledValue)
        console.log(
          `MIDI CC -> Block: ${block}, Param: ${param}, KnobIdx: ${knobIdx}, CC: ${cc}, Val: ${scaledValue}`
        )
      }
    }
  }

  async loadConfig(config: MG30FullConfig): Promise<void> {
    const blockOrder: (keyof MG30FullConfig)[] = [
      'wah',
      'compressor',
      'efx',
      'amp',
      'eq',
      'noiseGate',
      'mod',
      'delay',
      'reverb',
      'ir'
    ]

    for (const blockKey of blockOrder) {
      const data = config[blockKey]
      if (!data || Object.keys(data).length === 0) continue

      console.log(`--- Processing Block: ${blockKey} ---`)

      if (blockKey === 'ir') {
        await this.handleIR(data)
      } else {
        await this.handleStandard(blockKey as EffectBlock, data)
      }

      await this.wait(200)
    }
  }

  private async handleStandard(block: EffectBlock, data: MG30BlockConfig): Promise<void> {
    if (!data.name) return

    this.setBlockModel(block, data.name)
    await this.wait(200)

    if (data.parameter) {
      for (const [p, v] of Object.entries(data.parameter)) {
        this.setParam(block, data.name!, p, v)
        await this.wait(200)
      }
    }
  }

  private async handleIR(data: MG30BlockConfig): Promise<void> {
    const name = data.cabinetName
    if (!name) return

    this.setBlockModel('ir', name)
    await this.wait(200)

    if (data.micConfig) {
      if (data.micConfig.micType) {
        this.setParam('ir', name, 'micType', data.micConfig.micType)
        await this.wait(200)
      }
      if (data.micConfig.micPosition) {
        this.setParam('ir', name, 'micPosition', data.micConfig.micPosition)
        await this.wait(200)
      }
    }

    if (data.cabinetParameter) {
      for (const [p, v] of Object.entries(data.cabinetParameter)) {
        this.setParam('ir', name, p, v)
        await this.wait(200)
      }
    }
  }
}
