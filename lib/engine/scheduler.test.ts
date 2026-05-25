import { describe, expect, it, vi } from 'vitest'
import {
  EVALUATION_ALARM_NAME,
  syncEvaluationAlarm,
  syncEvaluationAlarmIfNeeded,
} from './scheduler'

function ports(overrides: Partial<Parameters<typeof syncEvaluationAlarm>[0]> = {}) {
  return {
    getAlarm: vi.fn().mockResolvedValue(undefined),
    clearAlarm: vi.fn().mockResolvedValue(true),
    createAlarm: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('syncEvaluationAlarm', () => {
  it('clears and recreates alarm with interval minutes', async () => {
    const p = ports()

    await syncEvaluationAlarm(p, 15)

    expect(p.clearAlarm).toHaveBeenCalledWith(EVALUATION_ALARM_NAME)
    expect(p.createAlarm).toHaveBeenCalledWith(EVALUATION_ALARM_NAME, 15)
  })
})

describe('syncEvaluationAlarmIfNeeded', () => {
  it('keeps alarm when period matches', async () => {
    const p = ports({
      getAlarm: vi.fn().mockResolvedValue({ periodInMinutes: 5 }),
    })

    await syncEvaluationAlarmIfNeeded(p, 5)

    expect(p.clearAlarm).not.toHaveBeenCalled()
    expect(p.createAlarm).not.toHaveBeenCalled()
  })

  it('recreates alarm when period changes', async () => {
    const p = ports({
      getAlarm: vi.fn().mockResolvedValue({ periodInMinutes: 15 }),
    })

    await syncEvaluationAlarmIfNeeded(p, 5)

    expect(p.clearAlarm).toHaveBeenCalled()
    expect(p.createAlarm).toHaveBeenCalledWith(EVALUATION_ALARM_NAME, 5)
  })
})
