import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES } from './rules'
import { initialSettings } from './seed'

describe('DEFAULT_RULES', () => {
  it('includes keep and archive system defaults', () => {
    expect(DEFAULT_RULES).toEqual([
      'keep pinned=true',
      'archive inactive>2h',
      'archive inactive>30d',
    ])
  })
})

describe('initialSettings', () => {
  it('merges default rules with default settings', () => {
    const settings = initialSettings()
    expect(settings.rules).toEqual([...DEFAULT_RULES])
    expect(settings.engineEnabled).toBe(true)
    expect(settings.evaluationIntervalMinutes).toBe(5)
    expect(settings.archiveRetentionDays).toBe(90)
  })
})

