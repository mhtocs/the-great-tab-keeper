import { describe, expect, it, vi } from 'vitest'
import type { Settings } from '../storage/schema'
import { runEvaluationCycle, type EvaluationCyclePorts } from './evaluation-cycle'

const THREE_HOURS_MS = 3 * 3_600_000

function baseSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    engineEnabled: true,
    evaluationIntervalMinutes: 5,
    graveyardRetentionDays: 90,
    rules: ['close inactive>2h'],
    ...overrides,
  }
}

function ports(overrides: Partial<EvaluationCyclePorts> = {}): EvaluationCyclePorts {
  const graveyard: import('../storage/schema').GraveyardEntry[] = []

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
    readGraveyard: async () => graveyard,
    writeGraveyard: async (entries) => {
      graveyard.length = 0
      graveyard.push(...entries)
    },
    writeLastRun: async () => {},
    removeTab: vi.fn().mockResolvedValue(undefined),
    sleepTab: vi.fn().mockResolvedValue(true),
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
      tabsClosed: 0,
      tabsRemoved: 0,
      tabsSlept: 0,
    })
    expect(removeTab).not.toHaveBeenCalled()
  })

  it('closes inactive tab and writes graveyard', async () => {
    const removeTab = vi.fn().mockResolvedValue(undefined)
    const p = ports({ removeTab })
    const result = await runEvaluationCycle(p)

    expect(result.skipped).toBe(false)
    expect(result.tabsEvaluated).toBe(1)
    expect(result.actionsTaken).toBe(1)
    expect(result.tabsClosed).toBe(1)
    expect(removeTab).toHaveBeenCalledWith(1)

    const graveyard = await p.readGraveyard()
    expect(graveyard).toHaveLength(1)
    expect(graveyard[0]!.url).toBe('https://example.com/page')
  })

  it('discards without graveyard entry', async () => {
    const removeTab = vi.fn().mockResolvedValue(undefined)
    const p = ports({
      readSettings: async () => baseSettings({ rules: ['discard inactive>2h'] }),
      removeTab,
    })
    const result = await runEvaluationCycle(p)

    expect(result.actionsTaken).toBe(1)
    expect(result.tabsRemoved).toBe(1)
    expect(await p.readGraveyard()).toHaveLength(0)
  })

  it('sleeps tab via sleep adapter without graveyard', async () => {
    const sleepTab = vi.fn().mockResolvedValue(true)
    const removeTab = vi.fn()
    const onActionMessage = vi.fn()
    const p = ports({
      readSettings: async () => baseSettings({ rules: ['sleep inactive>2h'] }),
      sleepTab,
      removeTab,
      onActionMessage,
    })
    const result = await runEvaluationCycle(p)

    expect(result.actionsTaken).toBe(1)
    expect(result.tabsSlept).toBe(1)
    expect(sleepTab).toHaveBeenCalledWith({
      tabId: 1,
      url: 'https://example.com/page',
      title: 'example',
      favicon: undefined,
    })
    expect(removeTab).not.toHaveBeenCalled()
    expect(await p.readGraveyard()).toHaveLength(0)
    expect(onActionMessage).toHaveBeenCalledWith('slept · example')
  })

  it('does not count sleep when sleep adapter returns false', async () => {
    const sleepTab = vi.fn().mockResolvedValue(false)
    const result = await runEvaluationCycle(
      ports({
        readSettings: async () => baseSettings({ rules: ['sleep inactive>2h'] }),
        sleepTab,
      }),
    )

    expect(result.actionsTaken).toBe(0)
    expect(result.tabsSlept).toBe(0)
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
})
