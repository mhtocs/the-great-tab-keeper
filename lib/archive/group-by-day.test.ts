import { describe, expect, it } from 'vitest'
import type { ArchiveEntry } from '../storage/schema'
import { groupArchiveEntriesByDay } from './group-by-day'

function entry(archivedAt: number, id: string): ArchiveEntry {
  return {
    id,
    url: `https://example.com/${id}`,
    title: id,
    archivedAt,
    action: 'archive',
    ruleText: 'archive inactive>2h',
  }
}

describe('groupArchiveEntriesByDay', () => {
  const now = new Date('2026-05-23T15:00:00').getTime()
  const day = 24 * 60 * 60 * 1000

  it('groups entries by calendar day newest first', () => {
    const groups = groupArchiveEntriesByDay(
      [
        entry(now - 2 * day, 'old'),
        entry(now - 30 * 60_000, 'today-a'),
        entry(now - 60 * 60_000, 'today-b'),
        entry(now - day - 60 * 60_000, 'yesterday-a'),
      ],
      now,
    )

    expect(groups).toHaveLength(3)
    expect(groups[0]!.label).toBe('today')
    expect(groups[0]!.entries.map((e) => e.id)).toEqual(['today-a', 'today-b'])
    expect(groups[1]!.label).toBe('yesterday')
    expect(groups[2]!.label).not.toBe('today')
  })
})
