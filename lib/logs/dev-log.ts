import type { DevLogEntry } from '../storage/schema'
import type { EvaluationCycleResult } from '../engine/evaluation-cycle'

export const DEV_LOG_MAX_ENTRIES = 1000

export function appendDevLogEntry(
  entries: DevLogEntry[],
  message: string,
  atMs = Date.now(),
): DevLogEntry[] {
  const entry: DevLogEntry = {
    id: crypto.randomUUID(),
    at: atMs,
    message,
  }
  return [...entries, entry]
    .sort((a, b) => b.at - a.at)
    .slice(0, DEV_LOG_MAX_ENTRIES)
}

export function formatCycleResultMessage(result: EvaluationCycleResult): string {
  if (result.skipped && result.skipReason === 'engine_off') {
    return 'cycle skipped, engine off'
  }
  if (result.rulesError) {
    return `cycle error, ${result.rulesError}`
  }

  const base = `cycle finished, ${result.tabsEvaluated} evaluated`
  const parts: string[] = []
  if (result.tabsClosed > 0) {
    parts.push(`${result.tabsClosed} closed`)
  }
  if (result.tabsSlept > 0) {
    parts.push(`${result.tabsSlept} slept`)
  }
  if (result.tabsRemoved > 0) {
    parts.push(`${result.tabsRemoved} removed`)
  }
  if (parts.length > 0) {
    return `${base}, ${parts.join(', ')}`
  }
  return `${base}, no actions`
}

export function formatDevLogText(entries: DevLogEntry[]): string {
  return [...entries]
    .sort((a, b) => a.at - b.at)
    .map((entry) => `${new Date(entry.at).toISOString()}  ${entry.message}`)
    .join('\n')
}
