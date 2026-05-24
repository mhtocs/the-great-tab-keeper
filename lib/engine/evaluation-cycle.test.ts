import { describe, expect, it, vi } from 'vitest'
import type { Settings } from '../storage/schema'
import { runEvaluationCycle, type EvaluationCyclePorts } from './evaluation-cycle'

const THREE_HOURS_MS = 3 * 3_600_000

function baseSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    engineEnabled: true,
    evaluationIntervalMinutes: 5,
    archiveRetentionDays: 90,
    rules: ['archive inactive>2h'],
    ...overrides,
  }
}

function ports(overrides: Partial<EvaluationCyclePorts> = {}): EvaluationCyclePorts {
  const archive: import('../storage/schema').ArchiveEntry[] = []

  return {
    readSettings: async () => baseSettings(),
    queryTabs: async () => [
      {
        id: 1,
        url: 'https://example.com/page',
        title: 'example',
        pinned: false,
        audible: false,
        lastAccessed: Date.now() - THREE_HOURS_MS,
      },
    ],
    getActiveTabId: async () => undefined,
    readActivityCache: async () => ({}),
    readSuspendedTabs: async () => ({}),
    readArchive: async () => archive,
    writeArchive: async (entries) => {
      archive.length = 0
      archive.push(...entries)
    },
    writeLastRun: async () => {},
    removeTab: vi.fn().mockResolvedValue(undefined),
    suspendTab: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
}

describe('runEvaluationCycle', () => {
  it('skips entire cycle when engine is disabled', async () => {
    const removeTab = vi.fn()
    const result = await runEvaluationCycle(
      ports({
        readSettings: async () => baseSettings({ engineEnabled: false }),
        removeTab,
      }),
    )
    expect(result).toEqual({
      skipped: true,
      skipReason: 'engine_off',
      tabsEvaluated: 0,
      actionsTaken: 0,
      tabsArchived: 0,
      tabsRemoved: 0,
      tabsSuspended: 0,
    })
    expect(removeTab).not.toHaveBeenCalled()
  })

  it('archives inactive tab and writes archive', async () => {
    const removeTab = vi.fn().mockResolvedValue(undefined)
    const p = ports({ removeTab })
    const result = await runEvaluationCycle(p)

    expect(result.skipped).toBe(false)
    expect(result.tabsEvaluated).toBe(1)
    expect(result.actionsTaken).toBe(1)
    expect(result.tabsArchived).toBe(1)
    expect(removeTab).toHaveBeenCalledWith(1)

    const archive = await p.readArchive()
    expect(archive).toHaveLength(1)
    expect(archive[0]!.url).toBe('https://example.com/page')
  })

  it('discards without archive entry', async () => {
    const removeTab = vi.fn().mockResolvedValue(undefined)
    const p = ports({
      readSettings: async () => baseSettings({ rules: ['discard inactive>2h'] }),
      removeTab,
    })
    const result = await runEvaluationCycle(p)

    expect(result.actionsTaken).toBe(1)
    expect(result.tabsRemoved).toBe(1)
    expect(await p.readArchive()).toHaveLength(0)
  })

  it('suspends tab via suspend adapter without archive', async () => {
    const suspendTab = vi.fn().mockResolvedValue(true)
    const removeTab = vi.fn()
    const onActionMessage = vi.fn()
    const p = ports({
      readSettings: async () => baseSettings({ rules: ['suspend inactive>2h'] }),
      suspendTab,
      removeTab,
      onActionMessage,
    })
    const result = await runEvaluationCycle(p)

    expect(result.actionsTaken).toBe(1)
    expect(result.tabsSuspended).toBe(1)
    expect(suspendTab).toHaveBeenCalledWith({
      tabId: 1,
      url: 'https://example.com/page',
      title: 'example',
      favicon: undefined,
    })
    expect(removeTab).not.toHaveBeenCalled()
    expect(await p.readArchive()).toHaveLength(0)
    expect(onActionMessage).toHaveBeenCalledWith('suspended, example')
  })

  it('does not count suspend when suspend adapter returns false', async () => {
    const suspendTab = vi.fn().mockResolvedValue(false)
    const result = await runEvaluationCycle(
      ports({
        readSettings: async () => baseSettings({ rules: ['suspend inactive>2h'] }),
        suspendTab,
      }),
    )

    expect(result.actionsTaken).toBe(0)
    expect(result.tabsSuspended).toBe(0)
  })

  it('continues cycle when one tab throws', async () => {
    const removeTab = vi.fn().mockResolvedValue(undefined)
    const onTabError = vi.fn()

    const result = await runEvaluationCycle(
      ports({
        removeTab,
        onTabError,
        queryTabs: async () => [
          { id: 1, url: 'https://a.com', title: 'a', lastAccessed: Date.now() - THREE_HOURS_MS },
          { id: 2, url: 'https://b.com', title: 'b', lastAccessed: Date.now() - THREE_HOURS_MS },
        ],
      }),
    )

    expect(result.tabsEvaluated).toBe(2)
    expect(result.actionsTaken).toBe(2)
    expect(onTabError).not.toHaveBeenCalled()
  })

  it('does not archive suspended tab without suspended=true condition', async () => {
    const removeTab = vi.fn().mockResolvedValue(undefined)
    const result = await runEvaluationCycle(
      ports({
        removeTab,
        queryTabs: async () => [
          {
            id: 7,
            url: 'chrome-extension://id/ui/suspended/index.html?tabId=7',
            title: 'suspended tab',
            lastAccessed: Date.now() - THREE_HOURS_MS,
          },
        ],
      }),
    )
    expect(result.tabsEvaluated).toBe(1)
    expect(result.actionsTaken).toBe(0)
    expect(removeTab).not.toHaveBeenCalled()
  })

  it('archives suspended tab when rule requires suspended=true', async () => {
    const removeTab = vi.fn().mockResolvedValue(undefined)
    const now = Date.now()
    const p = ports({
      readSettings: async () =>
        baseSettings({ rules: ['archive suspended=true inactive>2h'] }),
      removeTab,
      readSuspendedTabs: async () => ({
        '8': {
          url: 'https://example.com/original',
          title: 'original title',
          suspendedAt: now - THREE_HOURS_MS,
        },
      }),
      queryTabs: async () => [
        {
          id: 8,
          url: 'chrome-extension://id/ui/suspended/index.html?tabId=8',
          title: 'suspended tab',
        },
      ],
    })
    const result = await runEvaluationCycle(p, now)
    expect(result.tabsEvaluated).toBe(1)
    expect(result.actionsTaken).toBe(1)
    expect(result.tabsArchived).toBe(1)
    expect(removeTab).toHaveBeenCalledWith(8)

    const archive = await p.readArchive()
    expect(archive[0]?.url).toBe('https://example.com/original')
  })

  it('archives old suspended tab without chrome lastAccessed using suspendedAt', async () => {
    const removeTab = vi.fn().mockResolvedValue(undefined)
    const now = Date.now()
    const p = ports({
      readSettings: async () =>
        baseSettings({ rules: ['archive suspended=true inactive>2m'] }),
      removeTab,
      readSuspendedTabs: async () => ({
        '8': {
          url: 'https://example.com/old',
          title: 'old',
          suspendedAt: now - THREE_HOURS_MS,
        },
      }),
      queryTabs: async () => [
        {
          id: 8,
          url: 'chrome-extension://idekaaaflogbdjllgdfhpiamkhfofenh/ui/suspended/index.html?tabId=8',
          title: 'suspended',
        },
      ],
    })
    const result = await runEvaluationCycle(p, now)
    expect(result.tabsArchived).toBe(1)
    expect(removeTab).toHaveBeenCalledWith(8)
  })
})
