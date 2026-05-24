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
      slept: false,
      discarded: false,
      inactiveMs: 120_000,
      lastAccessedMs: now - 120_000,
    })
  })

  it('marks slept=true for slept placeholder url', () => {
    const input = toTabEvaluationInput(
      {
        id: 9,
        url: 'chrome-extension://id/ui/slept/index.html?tabId=9',
      },
      undefined,
      {},
      Date.now(),
    )
    expect(input?.slept).toBe(true)
  })

  it('uses sleptAt for inactive when chrome lastAccessed is missing', () => {
    const now = 1_000_000
    const input = toTabEvaluationInput(
      {
        id: 9,
        url: 'chrome-extension://id/ui/slept/index.html?tabId=9',
      },
      undefined,
      {},
      now,
      now - 180_000,
    )
    expect(input?.inactiveMs).toBe(180_000)
  })

  it('returns null when url is missing', () => {
    expect(toTabEvaluationInput({ id: 1 }, undefined, {}, Date.now())).toBeNull()
  })
})
