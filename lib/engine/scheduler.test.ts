import { describe, expect, it, vi } from 'vitest'
import { EVALUATION_ALARM_NAME, syncEvaluationAlarm } from './scheduler'

describe('syncEvaluationAlarm', () => {
  it('clears and recreates alarm with interval minutes', async () => {
    const clearAlarm = vi.fn().mockResolvedValue(true)
    const createAlarm = vi.fn().mockResolvedValue(undefined)

    await syncEvaluationAlarm({ clearAlarm, createAlarm }, 15)

    expect(clearAlarm).toHaveBeenCalledWith(EVALUATION_ALARM_NAME)
    expect(createAlarm).toHaveBeenCalledWith(EVALUATION_ALARM_NAME, 15)
  })
})
