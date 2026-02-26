import type { MG30FullConfig } from './types/mg30'

const MG30_REQUIRED_TOP_LEVEL_KEYS = [
  'chainOrder',
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
] as const

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isNumberRecord(value: unknown): boolean {
  if (!isPlainObject(value)) return false
  return Object.values(value).every((item) => typeof item === 'number')
}

export function getMissingMG30TopLevelKeys(parsed: unknown): string[] {
  if (!parsed || typeof parsed !== 'object') {
    return [...MG30_REQUIRED_TOP_LEVEL_KEYS]
  }

  const candidate = parsed as Record<string, unknown>
  return MG30_REQUIRED_TOP_LEVEL_KEYS.filter((key) => !(key in candidate))
}

export function getMG30ValidationIssues(parsed: unknown): string[] {
  const issues: string[] = []

  const missingTopLevelKeys = getMissingMG30TopLevelKeys(parsed)
  if (missingTopLevelKeys.length > 0) {
    issues.push(`missing top-level keys: ${missingTopLevelKeys.join(', ')}`)
    return issues
  }

  if (!isPlainObject(parsed)) {
    issues.push('root must be an object')
    return issues
  }

  const candidate = parsed as Record<string, unknown>

  if (!Array.isArray(candidate.chainOrder)) {
    issues.push('chainOrder must be an array')
  } else if (!candidate.chainOrder.every((item) => typeof item === 'string')) {
    issues.push('chainOrder must contain only strings')
  }

  for (const key of MG30_REQUIRED_TOP_LEVEL_KEYS) {
    if (key === 'chainOrder') continue

    const block = candidate[key]
    if (!isPlainObject(block)) {
      issues.push(`${key} must be an object`)
      continue
    }

    if ('name' in block && typeof block.name !== 'string') {
      issues.push(`${key}.name must be a string`)
    }

    if ('isSwap' in block && typeof block.isSwap !== 'boolean') {
      issues.push(`${key}.isSwap must be a boolean`)
    }

    if ('is_swap' in block && typeof block.is_swap !== 'boolean') {
      issues.push(`${key}.is_swap must be a boolean`)
    }

    if ('parameter' in block && !isNumberRecord(block.parameter)) {
      issues.push(`${key}.parameter must be an object with numeric values`)
    }

    if ('cabinetName' in block && typeof block.cabinetName !== 'string') {
      issues.push(`${key}.cabinetName must be a string`)
    }

    if ('cabinetParameter' in block && !isNumberRecord(block.cabinetParameter)) {
      issues.push(`${key}.cabinetParameter must be an object with numeric values`)
    }

    if ('micConfig' in block && !isPlainObject(block.micConfig)) {
      issues.push(`${key}.micConfig must be an object`)
    }
  }

  return issues
}

export function isMG30FullConfigLike(parsed: unknown): parsed is MG30FullConfig {
  return getMG30ValidationIssues(parsed).length === 0
}

export function formatValidationIssuesForDisplay(issues: string[], maxItems = 3): string {
  if (issues.length <= maxItems) return issues.join('; ')

  const visible = issues.slice(0, maxItems)
  const remainingCount = issues.length - maxItems
  return `${visible.join('; ')}; and ${remainingCount} more`
}
