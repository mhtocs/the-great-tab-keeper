import { describe, expect, it } from 'vitest'
import { toTabEvaluationInput } from './tab-snapshot'

describe('toTabEvaluationInput', () => {
  it('marks active tab and computes inactive from lastAccessed', () => {
    const now = 1_000_000
    const input = toTabEvaluationInput(
      {
        id: 5,
        url: 'https://example.com',
        title: 'ex',
        lastAccessed: now - 120_000,
      },
      5,
      {},
      now,
    )
    expect(input).toEqual({
      tabId: 5,
      url: 'https://example.com',
      title: 'ex',
      pinned: false,
      audible: false,
      active: true,
      discarded: false,
      inactiveMs: 120_000,
      lastAccessedMs: now - 120_000,
    })
  })

  it('returns null when url is missing', () => {
    expect(toTabEvaluationInput({ id: 1 }, undefined, {}, Date.now())).toBeNull()
  })
})
