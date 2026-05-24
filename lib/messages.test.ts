import { describe, expect, it } from 'vitest'
import {
  isRescheduleEvaluationAlarmMessage,
  isRestoreGraveyardMessage,
  isRestoreSleptTabMessage,
  isRunEvaluationCycleMessage,
} from './messages'

describe('runtime message guards', () => {
  it('accepts run-evaluation-cycle', () => {
    expect(isRunEvaluationCycleMessage({ type: 'run-evaluation-cycle' })).toBe(true)
    expect(isRunEvaluationCycleMessage({ type: 'restore-graveyard' })).toBe(false)
  })

  it('accepts restore-graveyard with entry id', () => {
    expect(
      isRestoreGraveyardMessage({ type: 'restore-graveyard', entryId: 'abc' }),
    ).toBe(true)
    expect(isRestoreGraveyardMessage({ type: 'restore-graveyard' })).toBe(false)
  })

  it('accepts reschedule-evaluation-alarm', () => {
    expect(isRescheduleEvaluationAlarmMessage({ type: 'reschedule-evaluation-alarm' })).toBe(
      true,
    )
  })

  it('accepts restore-slept-tab with tab id', () => {
    expect(isRestoreSleptTabMessage({ type: 'restore-slept-tab', tabId: 4 })).toBe(true)
    expect(isRestoreSleptTabMessage({ type: 'restore-slept-tab' })).toBe(false)
  })
})
