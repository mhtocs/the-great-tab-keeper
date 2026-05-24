import { describe, expect, it } from 'vitest'
import { getSleptEntry, removeSleptEntry, setSleptEntry } from './store'

describe('slept tab store', () => {
  it('sets and reads entry by tab id', () => {
    const map = setSleptEntry({}, 7, {
      url: 'https://example.com',
      title: 'example',
      sleptAt: 100,
    })
    expect(getSleptEntry(map, 7)?.url).toBe('https://example.com')
    expect(getSleptEntry(map, 8)).toBeUndefined()
  })

  it('removes entry without mutating other keys', () => {
    let map = setSleptEntry({}, 1, {
      url: 'https://a.com',
      title: 'a',
      sleptAt: 1,
    })
    map = setSleptEntry(map, 2, {
      url: 'https://b.com',
      title: 'b',
      sleptAt: 2,
    })
    const next = removeSleptEntry(map, 1)
    expect(getSleptEntry(next, 1)).toBeUndefined()
    expect(getSleptEntry(next, 2)?.url).toBe('https://b.com')
  })
})
