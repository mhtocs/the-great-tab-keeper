import { describe, expect, it } from 'vitest'
import type { ArchiveEntry } from '../storage/schema'
import { pruneArchiveByRetention } from './store'

describe('pruneArchiveByRetention', () => {
  // ac 13
  it('drops entries older than retention days', () => {
    const now = 10_000_000_000
    const day = 24 * 60 * 60 * 1000
    const entries: ArchiveEntry[] = [
      {
        id: 'old',
        url: 'https://old',
        title: 'old',
        archivedAt: now - 100 * day,
        action: 'archive',
        ruleText: 'r',
      },
      {
        id: 'fresh',
        url: 'https://fresh',
        title: 'fresh',
        archivedAt: now - 1 * day,
        action: 'archive',
        ruleText: 'r',
      },
    ]
    const pruned = pruneArchiveByRetention(entries, 90, now)
    expect(pruned.map((e) => e.id)).toEqual(['fresh'])
  })

  it('enforces minimum 10 day retention when setting is lower', () => {
    const now = 10_000_000_000
    const day = 24 * 60 * 60 * 1000
    const entries: ArchiveEntry[] = [
      {
        id: 'eleven-days',
        url: 'https://x',
        title: 'x',
        archivedAt: now - 11 * day,
        action: 'archive',
        ruleText: 'r',
      },
      {
        id: 'five-days',
        url: 'https://y',
        title: 'y',
        archivedAt: now - 5 * day,
        action: 'archive',
        ruleText: 'r',
      },
    ]
    const pruned = pruneArchiveByRetention(entries, 1, now)
    expect(pruned.map((e) => e.id)).toEqual(['five-days'])
  })
})
