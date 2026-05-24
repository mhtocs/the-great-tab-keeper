import { describe, expect, it } from 'vitest'
import { parseRule } from './parser'
import { specificityScore } from './specificity'

describe('specificityScore', () => {
  // ac 8: idea.md example, 1 vs 1+3+2=6
  it('scores inactive-only rule as 1', () => {
    const parsed = parseRule('close inactive>2h')
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(specificityScore(parsed.rule)).toBe(1)
    }
  })

  it('sums weights for multiple conditions', () => {
    const parsed = parseRule('close inactive>30d url=*youtube.com* pinned=false')
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(specificityScore(parsed.rule)).toBe(7)
    }
  })

  it('scores url condition with weight 4', () => {
    const parsed = parseRule('close url=*youtube.com/*')
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(specificityScore(parsed.rule)).toBe(4)
    }
  })
})
