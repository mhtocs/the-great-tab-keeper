import { describe, expect, it, vi } from 'vitest'
import type { ArchiveEntry } from '../storage/schema'
import { restoreArchiveEntry } from './restore'

describe('restoreArchiveEntry', () => {
  const entries: ArchiveEntry[] = [
    {
      id: 'g1',
      url: 'https://example.com/page',
      title: 'example',
      archivedAt: 1,
      action: 'archive',
      ruleText: 'archive inactive>2h',
    },
  ]

  // ac 3
  it('opens tab and removes entry from archive', async () => {
    const openTab = vi.fn().mockResolvedValue(99)
    const result = await restoreArchiveEntry({ openTab }, entries, 'g1')

    expect(openTab).toHaveBeenCalledWith('https://example.com/page')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.tabId).toBe(99)
      expect(result.entries).toHaveLength(0)
    }
  })

  it('returns error when entry is missing', async () => {
    const result = await restoreArchiveEntry(
      { openTab: vi.fn() },
      entries,
      'missing',
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('archive entry not found')
      expect(result.entries).toHaveLength(1)
    }
  })
})
