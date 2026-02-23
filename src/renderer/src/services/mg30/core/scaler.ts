import { KNOB_SCALE } from '../constants/scales'

export const scaleToMidi = (parameterName: string, inputValue: number): number => {
  const rangeStr = KNOB_SCALE[parameterName] || '0-100'

  const match = rangeStr.match(/^(-?\d+\.?\d*)-(-?\d+\.?\d*)$/)

  let min = 0.0
  let max = 100.0

  if (match) {
    min = parseFloat(match[1])
    max = parseFloat(match[2])
  }

  if (parameterName.includes('Cut')) {
    const logMin = Math.log10(min === 0 ? 1 : min)
    const logMax = Math.log10(max)
    const logInput = Math.log10(Math.max(inputValue, min === 0 ? 1 : min))

    return Math.trunc(((logInput - logMin) / (logMax - logMin)) * 100)
  }

  const percentage = (inputValue - min) / (max - min)

  return Math.trunc(percentage * 100)
}
