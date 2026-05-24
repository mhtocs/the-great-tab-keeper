import { describe, expect, it } from 'vitest'
import { formatFreedMemory } from './format-memory'

describe('formatFreedMemory', () => {
  it('returns empty for non-positive values', () => {
    expect(formatFreedMemory(0)).toBe('')
    expect(formatFreedMemory(-1)).toBe('')
  })

  it('formats kilobytes and megabytes in lowercase', () => {
    expect(formatFreedMemory(2048)).toBe('2.0 kb')
    expect(formatFreedMemory(12_500_000)).toBe('11.9 mb')
  })
})
