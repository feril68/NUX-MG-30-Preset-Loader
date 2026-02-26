import { MG30Engine } from './core/midi-engine'
import { scaleToMidi } from './core/scaler'
import { CC_MAPPING_DICT, MODEL_BASE_DICT } from './constants'
import { EffectBlock, MG30FullConfig, MG30BlockConfig } from './types/mg30'

type SwappableBlock = 'compressor' | 'efx' | 'mod'
type SwapTargetMap = Record<SwappableBlock, EffectBlock>
type SwapRoute = `${SwappableBlock}->${EffectBlock}`

export class MG30Controller {
  private engine = new MG30Engine()
  private readonly stableReorderMode = 'stable'
  private readonly chainApplyDelayMs = 450
  private readonly chainStepDelayMs = 220
  private readonly chainVariantDelayMs = 90
  private readonly chainPassPauseMs = 250
  private readonly chainFinalVariantDelayMs = 120
  private readonly defaultProcessingOrder: EffectBlock[] = [
    'wah',
    'noiseGate',
    'compressor',
    'efx',
    'amp',
    'ir',
    'eq',
    'mod',
    'delay',
    'reverb'
  ]
  private readonly movableChainBlocks: EffectBlock[] = [
    'noiseGate',
    'compressor',
    'efx',
    'amp',
    'ir',
    'eq',
    'mod',
    'delay',
    'reverb'
  ]
  private readonly chainBlockCode: Record<EffectBlock, number> = {
    wah: 0x00,
    compressor: 0x01,
    efx: 0x02,
    amp: 0x03,
    eq: 0x04,
    noiseGate: 0x05,
    mod: 0x06,
    delay: 0x07,
    reverb: 0x08,
    ir: 0x09
  }
  private readonly chainSysExManufacturerPrefix: number[] = [0xf0, 0x43, 0x58, 0x70, 0x0d]
  private readonly chainSysExCommandCandidates: number[] = [0x02, 0x01, 0x03]
  private readonly chainSysExPage: number = 0x00
  private readonly chainSysExFixedTail: number[] = [0x0a, 0x0b, 0x00, 0xf7]
  private readonly bypassSelectSequence: Array<{ cc: number; value: number }> = [
    { cc: 1, value: 67 },
    { cc: 2, value: 66 },
    { cc: 3, value: 92 },
    { cc: 4, value: 65 },
    { cc: 5, value: 65 },
    { cc: 6, value: 67 },
    { cc: 7, value: 66 },
    { cc: 8, value: 65 },
    { cc: 9, value: 67 },
    { cc: 10, value: 65 }
  ]

  private readonly bypassSyncSysEx: number[] = [
    0xf0, 0x43, 0x58, 0x70, 0x0d, 0x02, 0x00, 0x05, 0x01, 0x02, 0x03, 0x09, 0x04, 0x06, 0x07, 0x08,
    0x0a, 0x0b, 0x00, 0xf7
  ]
  private readonly swapTargetByBlock: SwapTargetMap = {
    compressor: 'efx',
    efx: 'mod',
    mod: 'efx'
  }
  private readonly swapSelectValueByBlock: Record<SwappableBlock, number> = {
    compressor: 68,
    efx: 85,
    mod: 80
  }
  private readonly swapKnobValuesByBlock: Record<SwappableBlock, number[]> = {
    compressor: [90, 50, 0, 0],
    efx: [57, 50, 20, 6],
    mod: [90, 50, 0, 0]
  }
  private readonly swapSyncTailByBlock: Record<SwappableBlock, number> = {
    compressor: 0x08,
    efx: 0x10,
    mod: 0x20
  }
  private readonly swapSyncRepeatByBlock: Record<SwappableBlock, number> = {
    compressor: 1,
    efx: 2,
    mod: 6
  }
  private readonly swapModelSelectOffsetByRoute: Partial<Record<SwapRoute, number>> = {
    'compressor->efx': 3,
    'efx->mod': 20,
    'mod->efx': 15
  }

  async init(onChange: () => void): Promise<void> {
    await this.engine.setup(onChange)
  }

  get isConnected(): boolean {
    return this.engine.isConnected
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  setBlockModel(
    block: EffectBlock,
    modelName: string,
    modelSourceBlock: EffectBlock = block
  ): void {
    const blockData = MODEL_BASE_DICT[modelSourceBlock]
    if (!blockData) return

    const cc = CC_MAPPING_DICT.select[block]
    let models: string[] = []

    if (modelSourceBlock === 'ir') {
      const irData = MODEL_BASE_DICT.ir.irCabinet
      models = Object.keys(irData)
    } else {
      models = Object.keys(blockData)
    }

    const index = models.indexOf(modelName)
    if (cc !== undefined && index !== -1) {
      const selectValue = this.resolveModelSelectValue(block, modelSourceBlock, index)
      this.engine.sendCC(cc, selectValue)
      console.log(`MIDI -> Set ${block} to ${modelName} (source: ${modelSourceBlock})`)
    }
  }

  setParam(
    block: EffectBlock,
    model: string,
    param: string,
    rawValue: number | string,
    modelSourceBlock: EffectBlock = block
  ): void {
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
      const paramsList = (MODEL_BASE_DICT[modelSourceBlock] as Record<string, string[]>)[modelKey]
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
          `MIDI CC -> Block: ${block}, Param: ${param}, KnobIdx: ${knobIdx}, CC: ${cc}, Val: ${scaledValue}, Source: ${modelSourceBlock}`
        )
      }
    }
  }

  async resetAllBlocksToBypass(): Promise<void> {
    for (const { cc, value } of this.bypassSelectSequence) {
      this.engine.sendCC(cc, value)
      await this.wait(90)
    }

    await this.engine.sendSysEx(this.bypassSyncSysEx)
  }

  private isKnownBlock(key: string): key is EffectBlock {
    return key in MODEL_BASE_DICT
  }

  private isSwappableBlock(block: EffectBlock): block is SwappableBlock {
    return block === 'compressor' || block === 'efx' || block === 'mod'
  }

  private isSwapEnabled(data: MG30BlockConfig): boolean {
    return data.isSwap === true
  }

  private resolveModelSourceBlock(block: EffectBlock, data: MG30BlockConfig): EffectBlock {
    if (!this.isSwappableBlock(block) || !this.isSwapEnabled(data)) {
      return block
    }

    return this.swapTargetByBlock[block]
  }

  private resolveModelSelectValue(
    block: EffectBlock,
    modelSourceBlock: EffectBlock,
    modelIndex: number
  ): number {
    const baseSelectValue = modelIndex + 1

    if (!this.isSwappableBlock(block) || block === modelSourceBlock) {
      return baseSelectValue
    }

    const route = `${block}->${modelSourceBlock}` as SwapRoute
    const routeOffset = this.swapModelSelectOffsetByRoute[route]
    if (routeOffset === undefined) {
      return baseSelectValue
    }

    return baseSelectValue + routeOffset
  }

  private buildSwapSyncSysEx(tailValue: number): number[] {
    return [
      0xf0,
      0x43,
      0x58,
      0x70,
      0x0d,
      0x02,
      0x00,
      0x05,
      0x01,
      0x02,
      0x03,
      0x09,
      0x04,
      0x06,
      0x07,
      0x08,
      0x0a,
      0x0b,
      tailValue,
      0xf7
    ]
  }

  private async applySwapActivation(block: SwappableBlock): Promise<void> {
    const selectCc = CC_MAPPING_DICT.select[block]
    const selectValue = this.swapSelectValueByBlock[block]
    const knobValues = this.swapKnobValuesByBlock[block]
    const knobMap = CC_MAPPING_DICT.knob[block] as Record<number, number>

    this.engine.sendCC(selectCc, selectValue)
    await this.wait(80)

    knobValues.forEach((value, index) => {
      const cc = knobMap[index + 1]
      if (cc !== undefined) {
        this.engine.sendCC(cc, value)
      }
    })

    await this.wait(80)

    const syncTail = this.swapSyncTailByBlock[block]
    const syncRepeat = this.swapSyncRepeatByBlock[block]
    const syncBytes = this.buildSwapSyncSysEx(syncTail)

    for (let pass = 0; pass < syncRepeat; pass += 1) {
      await this.engine.sendSysEx(syncBytes)
      await this.wait(60)
    }

    console.log(`MIDI -> Activated swap for ${block}`)
  }

  private resolveChainOrder(config: MG30FullConfig): EffectBlock[] {
    const fromChainOrder = Array.isArray(config.chainOrder)
      ? config.chainOrder.filter((block): block is EffectBlock =>
          this.movableChainBlocks.includes(block)
        )
      : []

    if (fromChainOrder.length > 0) {
      const uniqueExplicitOrder = [...new Set(fromChainOrder)]
      return [
        ...uniqueExplicitOrder,
        ...this.movableChainBlocks.filter((block) => !uniqueExplicitOrder.includes(block))
      ]
    }

    const jsonChainOrder = Object.keys(config).filter(
      (key): key is EffectBlock =>
        this.isKnownBlock(key) && this.movableChainBlocks.includes(key as EffectBlock)
    )

    const uniqueJsonOrder = [...new Set(jsonChainOrder)]
    return [
      ...uniqueJsonOrder,
      ...this.movableChainBlocks.filter((block) => !uniqueJsonOrder.includes(block))
    ]
  }

  private buildChainSysExFromOrder(chainOrder: EffectBlock[], command: number = 0x02): number[] {
    const chainPayload = chainOrder.map((block) => this.chainBlockCode[block])
    return [
      ...this.chainSysExManufacturerPrefix,
      command,
      this.chainSysExPage,
      ...chainPayload,
      ...this.chainSysExFixedTail
    ]
  }

  private formatSysEx(bytes: number[]): string {
    return bytes.map((byte) => byte.toString(16).padStart(2, '0')).join(' ')
  }

  private buildChainSysExVariants(
    chainOrder: EffectBlock[]
  ): Array<{ command: number; bytes: number[] }> {
    return this.chainSysExCommandCandidates.map((command) => ({
      command,
      bytes: this.buildChainSysExFromOrder(chainOrder, command)
    }))
  }

  private buildStepwiseChainOrders(config: MG30FullConfig): EffectBlock[][] {
    const targetOrder = this.resolveChainOrder(config)
    const currentOrder = [...this.movableChainBlocks]
    const sequence: EffectBlock[][] = []

    for (let targetIndex = 0; targetIndex < targetOrder.length; targetIndex += 1) {
      const block = targetOrder[targetIndex]
      let currentIndex = currentOrder.indexOf(block)

      while (currentIndex > targetIndex) {
        const leftBlock = currentOrder[currentIndex - 1]
        currentOrder[currentIndex - 1] = currentOrder[currentIndex]
        currentOrder[currentIndex] = leftBlock
        currentIndex -= 1
        sequence.push([...currentOrder])
      }
    }

    if (sequence.length === 0) {
      sequence.push([...targetOrder])
    }

    return sequence
  }

  private resolveReorderMode(config: MG30FullConfig): 'stable' | 'fast' {
    if (config.reorderMode === 'fast') {
      return 'fast'
    }
    return this.stableReorderMode
  }

  private async sendChainOrderVariants(chainOrder: EffectBlock[], logLabel: string): Promise<void> {
    const variants = this.buildChainSysExVariants(chainOrder)
    for (const variant of variants) {
      console.log(
        `MIDI SysEx -> Chain order ${logLabel} cmd=${variant.command.toString(16).padStart(2, '0')}: ${this.formatSysEx(variant.bytes)}`
      )
      await this.engine.sendSysEx(variant.bytes)
      await this.wait(this.chainVariantDelayMs)
    }
  }

  private async applyChainOrderSequence(
    chainOrderSequence: EffectBlock[][],
    passLabel: string,
    stepDelayMs: number
  ): Promise<void> {
    for (const [index, chainOrder] of chainOrderSequence.entries()) {
      await this.sendChainOrderVariants(
        chainOrder,
        `${passLabel} [${index + 1}/${chainOrderSequence.length}]`
      )

      await this.wait(stepDelayMs)
    }
  }

  private async applyStableChainOrder(config: MG30FullConfig): Promise<void> {
    const chainOrderSequence = this.buildStepwiseChainOrders(config)

    await this.wait(this.chainApplyDelayMs)
    await this.applyChainOrderSequence(chainOrderSequence, 'apply', this.chainStepDelayMs)
    await this.applyChainOrderSequence(chainOrderSequence, 'final-pass-1', this.chainStepDelayMs)
    await this.wait(this.chainPassPauseMs)
    await this.applyChainOrderSequence(chainOrderSequence, 'final-pass-2', this.chainStepDelayMs)

    const finalChainOrder = this.resolveChainOrder(config)
    for (const variant of this.buildChainSysExVariants(finalChainOrder)) {
      console.log(
        `MIDI SysEx -> Chain order final-lock cmd=${variant.command.toString(16).padStart(2, '0')}: ${this.formatSysEx(variant.bytes)}`
      )
      await this.engine.sendSysEx(variant.bytes)
      await this.wait(this.chainFinalVariantDelayMs)
    }
  }

  private async applyFastChainOrder(config: MG30FullConfig): Promise<void> {
    const finalChainOrder = this.resolveChainOrder(config)
    await this.wait(this.chainApplyDelayMs)
    await this.sendChainOrderVariants(finalChainOrder, 'fast')
  }

  private hasSwapConfigured(config: MG30FullConfig): boolean {
    const swappableBlocks: SwappableBlock[] = ['compressor', 'efx', 'mod']
    return swappableBlocks.some((block) => {
      const data = config[block]
      return !!data && this.isSwapEnabled(data)
    })
  }

  private async applyConfiguredChainOrder(config: MG30FullConfig): Promise<void> {
    const reorderMode = this.resolveReorderMode(config)
    if (reorderMode === 'fast') {
      await this.applyFastChainOrder(config)
    } else {
      await this.applyStableChainOrder(config)
    }
  }

  private resolveSwapOccupancy(
    config: MG30FullConfig
  ): Partial<Record<EffectBlock, SwappableBlock>> {
    const occupancy: Partial<Record<EffectBlock, SwappableBlock>> = {}
    const swappableBlocks: SwappableBlock[] = ['compressor', 'efx', 'mod']

    for (const source of swappableBlocks) {
      const data = config[source]
      if (!data || !this.isSwapEnabled(data)) continue

      const target = this.swapTargetByBlock[source]
      occupancy[target] = source
    }

    return occupancy
  }

  private shouldSkipBlockBySwapOccupancy(
    block: EffectBlock,
    config: MG30FullConfig,
    occupancy: Partial<Record<EffectBlock, SwappableBlock>>
  ): boolean {
    const occupiedBy = occupancy[block]
    if (!occupiedBy) return false

    if (!this.isSwappableBlock(block)) {
      return false
    }

    const blockData = config[block]
    const blockIsSwapped = !!blockData && this.isSwapEnabled(blockData)

    if (blockIsSwapped) {
      return false
    }

    const sourceData = config[occupiedBy]
    if (!sourceData?.name || !blockData?.name) {
      return false
    }

    const sourceModelSource = this.resolveModelSourceBlock(occupiedBy, sourceData)
    if (sourceModelSource !== block) {
      return false
    }

    if (sourceData.name !== blockData.name) {
      return false
    }

    console.log(
      `MIDI -> Skip block ${block}: duplicate model '${blockData.name}' with swapped ${occupiedBy}`
    )
    return true
  }

  async loadConfig(config: MG30FullConfig): Promise<void> {
    const processingOrder = this.defaultProcessingOrder
    const hasSwapBlocks = this.hasSwapConfigured(config)
    const swapOccupancy = this.resolveSwapOccupancy(config)

    if (hasSwapBlocks) {
      await this.applyConfiguredChainOrder(config)
    }

    for (const blockKey of processingOrder) {
      if (this.shouldSkipBlockBySwapOccupancy(blockKey, config, swapOccupancy)) {
        continue
      }

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

    if (!hasSwapBlocks) {
      await this.applyConfiguredChainOrder(config)
    }
  }

  private async handleStandard(block: EffectBlock, data: MG30BlockConfig): Promise<void> {
    if (!data.name) return

    const modelSourceBlock = this.resolveModelSourceBlock(block, data)

    if (this.isSwappableBlock(block) && this.isSwapEnabled(data)) {
      await this.applySwapActivation(block)
      await this.wait(120)
    }

    this.setBlockModel(block, data.name, modelSourceBlock)
    await this.wait(200)

    if (data.parameter) {
      for (const [p, v] of Object.entries(data.parameter)) {
        this.setParam(block, data.name!, p, v, modelSourceBlock)
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
