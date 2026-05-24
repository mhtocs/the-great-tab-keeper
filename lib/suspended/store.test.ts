import { describe, expect, it } from 'vitest'
import { getSuspendedEntry, removeSuspendedEntry, setSuspendedEntry } from './store'

describe('suspended tab store', () => {
  it('sets and reads entry by tab id', () => {
    const map = setSuspendedEntry({}, 7, {
      url: 'https://example.com',
      title: 'example',
      suspendedAt: 100,
    })
    expect(getSuspendedEntry(map, 7)?.url).toBe('https://example.com')
    expect(getSuspendedEntry(map, 8)).toBeUndefined()
  })

  it('removes entry without mutating other keys', () => {
    let map = setSuspendedEntry({}, 1, {
      url: 'https://a.com',
      title: 'a',
      suspendedAt: 1,
    })
    map = setSuspendedEntry(map, 2, {
      url: 'https://b.com',
      title: 'b',
      suspendedAt: 2,
    })
    const next = removeSuspendedEntry(map, 1)
    expect(getSuspendedEntry(next, 1)).toBeUndefined()
    expect(getSuspendedEntry(next, 2)?.url).toBe('https://b.com')
  })
})
