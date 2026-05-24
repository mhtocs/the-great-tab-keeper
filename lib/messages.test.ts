import { describe, expect, it } from 'vitest'
import {
  isRescheduleEvaluationAlarmMessage,
  isRestoreArchiveMessage,
  isRestoreSuspendedTabMessage,
  isRunEvaluationCycleMessage,
} from './messages'

describe('runtime message guards', () => {
  it('accepts run-evaluation-cycle', () => {
    expect(isRunEvaluationCycleMessage({ type: 'run-evaluation-cycle' })).toBe(true)
    expect(isRunEvaluationCycleMessage({ type: 'restore-archive' })).toBe(false)
  })

  it('accepts restore-archive with entry id', () => {
    expect(
      isRestoreArchiveMessage({ type: 'restore-archive', entryId: 'abc' }),
    ).toBe(true)
    expect(isRestoreArchiveMessage({ type: 'restore-archive' })).toBe(false)
  })

  it('accepts reschedule-evaluation-alarm', () => {
    expect(isRescheduleEvaluationAlarmMessage({ type: 'reschedule-evaluation-alarm' })).toBe(
      true,
    )
  })

  it('accepts restore-suspended-tab with tab id', () => {
    expect(isRestoreSuspendedTabMessage({ type: 'restore-suspended-tab', tabId: 4 })).toBe(true)
    expect(isRestoreSuspendedTabMessage({ type: 'restore-suspended-tab' })).toBe(false)
  })
})
