import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from './settings'
import {
  isEvaluationIntervalMinutes,
  mergeSettings,
  parseSettings,
} from './settings'

describe('parseSettings', () => {
  it('returns defaults when storage is empty', () => {
    const result = parseSettings(undefined)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.settings).toEqual(DEFAULT_SETTINGS)
    }
  })

  it('accepts valid settings', () => {
    const result = parseSettings({
      engineEnabled: false,
      evaluationIntervalMinutes: 15,
      graveyardRetentionDays: 30,
      rules: ['close inactive>2h', ''],
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.settings.engineEnabled).toBe(false)
      expect(result.settings.evaluationIntervalMinutes).toBe(15)
      expect(result.settings.graveyardRetentionDays).toBe(30)
      expect(result.settings.rules).toEqual(['close inactive>2h'])
    }
  })

  it('rejects invalid evaluation interval', () => {
    const result = parseSettings({
      engineEnabled: true,
      evaluationIntervalMinutes: 10,
      graveyardRetentionDays: 90,
      rules: [],
    })
    expect(result).toEqual({
      ok: false,
      error: 'evaluationIntervalMinutes must be 1, 5, 15, 30, or 60',
    })
  })

  it('rejects non-positive graveyard retention', () => {
    const result = parseSettings({
      engineEnabled: true,
      evaluationIntervalMinutes: 5,
      graveyardRetentionDays: 0,
      rules: [],
    })
    expect(result.ok).toBe(false)
  })
})

describe('isEvaluationIntervalMinutes', () => {
  it('allows idea.md intervals only', () => {
    expect(isEvaluationIntervalMinutes(1)).toBe(true)
    expect(isEvaluationIntervalMinutes(60)).toBe(true)
    expect(isEvaluationIntervalMinutes(2)).toBe(false)
  })
})

describe('mergeSettings', () => {
  it('fills missing fields from defaults', () => {
    expect(mergeSettings({ engineEnabled: false })).toMatchObject({
      engineEnabled: false,
      evaluationIntervalMinutes: 5,
      graveyardRetentionDays: 90,
    })
  })
})
