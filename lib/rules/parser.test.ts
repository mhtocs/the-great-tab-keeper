import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES } from '../defaults/rules'
import { inactiveDurationMs, parseRule, parseRules } from './parser'

describe('parseRule', () => {
  it('parses close with inactive duration', () => {
    const result = parseRule('close inactive>2h')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rule.action).toBe('close')
      expect(result.rule.conditions).toEqual([
        { kind: 'inactive', value: 2, unit: 'h' },
      ])
    }
  })

  it('parses keep with url condition', () => {
    const result = parseRule('keep url=*docs.google.com*')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rule.action).toBe('keep')
      expect(result.rule.conditions).toEqual([
        { kind: 'url', pattern: '*docs.google.com*' },
      ])
    }
  })

  it('parses sleep with inactive duration', () => {
    const result = parseRule('sleep inactive>2h')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rule.action).toBe('sleep')
      expect(result.rule.conditions).toEqual([
        { kind: 'inactive', value: 2, unit: 'h' },
      ])
    }
  })

  it('parses discard with url and inactive', () => {
    const result = parseRule('discard url=*example.com* inactive>7d')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rule.action).toBe('discard')
      expect(result.rule.conditions).toHaveLength(2)
    }
  })

  it('parses pinned audible active and slept booleans', () => {
    const result = parseRule(
      'close inactive>30d pinned=false audible=true active=false slept=true',
    )
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rule.conditions).toContainEqual({
        kind: 'pinned',
        value: false,
      })
      expect(result.rule.conditions).toContainEqual({
        kind: 'audible',
        value: true,
      })
      expect(result.rule.conditions).toContainEqual({
        kind: 'active',
        value: false,
      })
      expect(result.rule.conditions).toContainEqual({
        kind: 'slept',
        value: true,
      })
    }
  })

  it('parses url condition with wildcards', () => {
    const result = parseRule('close url=*reddit.com/r/* inactive>1h')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rule.conditions[0]).toEqual({
        kind: 'url',
        pattern: '*reddit.com/r/*',
      })
    }
  })

  it('rejects unknown action', () => {
    const result = parseRule('archive inactive>1d')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('unknown action')
    }
  })

  it('rejects invalid inactive unit', () => {
    const result = parseRule('close inactive>2w')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('unrecognized condition')
    }
  })

  it('rejects empty rule', () => {
    const result = parseRule('   ')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('rule cannot be empty')
    }
  })
})

describe('parseRules', () => {
  it('parses multiple lines and skips blanks', () => {
    const result = parseRules([
      'keep pinned=true',
      '',
      'close inactive>2h',
    ])
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.rules).toHaveLength(2)
    }
  })

  it('returns index when a line fails', () => {
    const result = parseRules(['close inactive>2h', 'bad-rule'])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.index).toBe(1)
    }
  })
})

describe('DEFAULT_RULES', () => {
  it('parses all shipped default rules', () => {
    for (const line of DEFAULT_RULES) {
      const result = parseRule(line)
      expect(result.ok, `expected valid: ${line}`).toBe(true)
    }
  })
})

describe('inactiveDurationMs', () => {
  it('converts minutes to milliseconds', () => {
    expect(inactiveDurationMs({ value: 15, unit: 'm' })).toBe(900_000)
  })

  it('converts hours to milliseconds', () => {
    expect(inactiveDurationMs({ value: 2, unit: 'h' })).toBe(7_200_000)
  })

  it('converts days to milliseconds', () => {
    expect(inactiveDurationMs({ value: 30, unit: 'd' })).toBe(2_592_000_000)
  })
})
