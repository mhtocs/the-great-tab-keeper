import { describe, expect, it } from 'vitest'
import {
  appendDevLogEntry,
  DEV_LOG_MAX_ENTRIES,
  formatCycleResultMessage,
  formatDevLogText,
} from './dev-log'

describe('dev log', () => {
  it('caps log at max entries newest first', () => {
    let log = appendDevLogEntry([], 'first', 0)
    for (let i = 1; i < DEV_LOG_MAX_ENTRIES + 5; i++) {
      log = appendDevLogEntry(log, `line ${i}`, i)
    }
    expect(log).toHaveLength(DEV_LOG_MAX_ENTRIES)
    expect(log[0]!.message).toBe(`line ${DEV_LOG_MAX_ENTRIES + 4}`)
  })

  it('formats cycle finished message', () => {
    expect(
      formatCycleResultMessage({
        skipped: false,
        tabsEvaluated: 13,
        actionsTaken: 10,
        tabsClosed: 8,
        tabsSlept: 2,
        tabsRemoved: 0,
      }),
    ).toBe('cycle finished, 13 evaluated, 8 closed, 2 slept')

    expect(
      formatCycleResultMessage({
        skipped: false,
        tabsEvaluated: 3,
        actionsTaken: 0,
        tabsClosed: 0,
        tabsSlept: 0,
        tabsRemoved: 0,
      }),
    ).toBe('cycle finished, 3 evaluated, no actions')

    expect(
      formatCycleResultMessage({
        skipped: true,
        skipReason: 'engine_off',
        tabsEvaluated: 0,
        actionsTaken: 0,
        tabsClosed: 0,
        tabsSlept: 0,
        tabsRemoved: 0,
      }),
    ).toBe('cycle skipped, engine off')
  })

  it('renders oldest first in text output', () => {
    const text = formatDevLogText([
      { id: 'b', at: 2, message: 'second' },
      { id: 'a', at: 1, message: 'first' },
    ])
    expect(text.indexOf('first')).toBeLessThan(text.indexOf('second'))
  })
})
