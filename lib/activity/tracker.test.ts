import { describe, expect, it } from 'vitest'
import {
  clearTabAccess,
  inactiveMsForTab,
  lastAccessedMs,
  recordTabAccess,
} from './tracker'

describe('activity tracker', () => {
  const now = 1_000_000_000

  it('records and clears tab access in cache', () => {
    let cache = recordTabAccess({}, 7, now - 5_000)
    expect(cache['7']).toBe(now - 5_000)
    cache = clearTabAccess(cache, 7)
    expect(cache['7']).toBeUndefined()
  })

  it('uses chrome lastAccessed when newer than cache', () => {
    const cache = recordTabAccess({}, 1, now - 60_000)
    expect(
      lastAccessedMs({ id: 1, lastAccessed: now - 1_000 }, cache, now),
    ).toBe(now - 1_000)
  })

  it('uses cache when chrome lastAccessed is missing', () => {
    const cache = recordTabAccess({}, 2, now - 30_000)
    expect(lastAccessedMs({ id: 2 }, cache, now)).toBe(now - 30_000)
  })

  it('returns zero inactive when access time is unknown', () => {
    expect(inactiveMsForTab({ id: 3 }, {}, now)).toBe(0)
  })

  it('computes inactive duration from last access', () => {
    const cache = recordTabAccess({}, 4, now - 12_000)
    expect(inactiveMsForTab({ id: 4 }, cache, now)).toBe(12_000)
  })
})
