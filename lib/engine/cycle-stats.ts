import type { EvaluationIntervalMinutes, LastRunSummary, Settings } from '../storage/schema'
import { formatTimeAgo, formatTimeUntil } from '../time/relative'

function evaluationDueAtMs(
  lastRunAt: number,
  intervalMinutes: EvaluationIntervalMinutes,
): number {
  return lastRunAt + intervalMinutes * 60_000
}

export type CycleStatsInput = {
  settings: Settings
  lastRun: LastRunSummary | null
  graveyardCount: number
  nextAlarmAtMs?: number
  nowMs?: number
}

export function resolveNextRunAtMs(input: CycleStatsInput): number | null {
  if (!input.settings.engineEnabled) {
    return null
  }

  const now = input.nowMs ?? Date.now()
  const alarmAt = input.nextAlarmAtMs
  if (alarmAt !== undefined && alarmAt > now) {
    return alarmAt
  }

  if (input.lastRun) {
    return evaluationDueAtMs(
      input.lastRun.at,
      input.settings.evaluationIntervalMinutes,
    )
  }

  return null
}

export function formatDashboardStatLines(input: CycleStatsInput): string[] {
  const now = input.nowMs ?? Date.now()
  const lines: string[] = []

  lines.push(`engine ${input.settings.engineEnabled ? 'on' : 'off'}`)
  lines.push(`graveyard: ${input.graveyardCount}`)

  if (!input.settings.engineEnabled) {
    lines.push('next run: engine off')
  } else {
    const nextAt = resolveNextRunAtMs(input)
    lines.push(
      `next run: ${formatTimeUntil(nextAt, now)}, every ${input.settings.evaluationIntervalMinutes} min`,
    )
  }

  if (!input.lastRun) {
    lines.push('last run: no run yet')
  } else {
    lines.push(
      `last run: ${formatTimeAgo(input.lastRun.at, now)}, ` +
        `${input.lastRun.tabsEvaluated} evaluated, ` +
        `${input.lastRun.actionsTaken} closed`,
    )
  }

  return lines
}
