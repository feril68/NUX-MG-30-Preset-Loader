function tryParseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return { ok: false }
  }
}

function normalizePastedText(text: string): string {
  return text.replace(/^\uFEFF/, '').trim()
}

function unwrapCodeFence(text: string): string {
  const match = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return match?.[1]?.trim() ?? text
}

function extractJsonEnvelope(text: string): string {
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1)
  }

  const firstBracket = text.indexOf('[')
  const lastBracket = text.lastIndexOf(']')
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return text.slice(firstBracket, lastBracket + 1)
  }

  return text
}

function parsePastedJson(text: string): unknown | null {
  const normalized = normalizePastedText(text)

  const direct = tryParseJson(normalized)
  if (direct.ok) return direct.value

  const unwrapped = unwrapCodeFence(normalized)
  const unwrappedParsed = tryParseJson(unwrapped)
  if (unwrappedParsed.ok) return unwrappedParsed.value

  const extracted = extractJsonEnvelope(unwrapped)
  const extractedParsed = tryParseJson(extracted)
  if (extractedParsed.ok) return extractedParsed.value

  return null
}

export function formatPastedJsonIf(
  pastedText: string,
  shouldFormat: (parsed: unknown) => boolean
): string | null {
  const parsed = parsePastedJson(pastedText)
  if (parsed === null) return null
  if (!shouldFormat(parsed)) return null
  return JSON.stringify(parsed, null, 4)
}
