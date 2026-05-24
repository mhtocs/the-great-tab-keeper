import { describe, expect, it } from 'vitest'
import { formatDashboardStatLines, resolveNextRunAtMs } from './cycle-stats'
import type { Settings } from '../storage/schema'

const settings: Settings = {
  engineEnabled: true,
  evaluationIntervalMinutes: 5,
  archiveRetentionDays: 90,
  rules: [],
}

describe('cycle stats', () => {
  const now = 1_000_000_000_000

  it('prefers chrome alarm time for next run when available', () => {
    const next = resolveNextRunAtMs({
      settings,
      lastRun: { at: now - 60_000, tabsEvaluated: 10, actionsTaken: 1 },
      archiveCount: 3,
      nextAlarmAtMs: now + 120_000,
      nowMs: now,
    })
    expect(next).toBe(now + 120_000)
  })

  it('estimates next run from last run and interval', () => {
    const lastAt = now - 120_000
    const next = resolveNextRunAtMs({
      settings,
      lastRun: { at: lastAt, tabsEvaluated: 5, actionsTaken: 0 },
      archiveCount: 0,
      nowMs: now,
    })
    expect(next).toBe(lastAt + 5 * 60_000)
  })

  it('returns null next run when engine is off', () => {
    expect(
      resolveNextRunAtMs({
        settings: { ...settings, engineEnabled: false },
        lastRun: null,
        archiveCount: 0,
        nowMs: now,
      }),
    ).toBeNull()
  })

  it('formats dashboard stat lines', () => {
    const lines = formatDashboardStatLines({
      settings,
      lastRun: { at: now - 120_000, tabsEvaluated: 12, actionsTaken: 2 },
      archiveCount: 4,
      nextAlarmAtMs: now + 300_000,
      nowMs: now,
    })
    expect(lines).toEqual([
      'engine on',
      'archive: 4',
      'next run: in 5m, every 5 min',
      'last run: 2m ago, 12 evaluated, 2 actions',
    ])
  })
})
