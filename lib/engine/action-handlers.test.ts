import { describe, expect, it, vi } from 'vitest'
import { createActionHandlers } from './action-handlers'

describe('action handlers', () => {
  const tab = { tabId: 42, url: 'https://example.com', title: 'example' }

  it('keep does not remove tab or write graveyard', async () => {
    const removeTab = vi.fn()
    const writeGraveyard = vi.fn()
    const handlers = createActionHandlers({
      removeTab,
      sleepTab: vi.fn(),
      readGraveyard: async () => [],
      writeGraveyard,
    })

    const result = await handlers.keep({
      tab,
      ruleText: 'keep pinned=true',
    })

    expect(result).toEqual({ tabRemoved: false })
    expect(removeTab).not.toHaveBeenCalled()
    expect(writeGraveyard).not.toHaveBeenCalled()
  })

  // ac 2
  it('close removes tab and appends graveyard entry', async () => {
    const removeTab = vi.fn().mockResolvedValue(undefined)
    const writeGraveyard = vi.fn().mockResolvedValue(undefined)
    const handlers = createActionHandlers({
      removeTab,
      sleepTab: vi.fn(),
      readGraveyard: async () => [],
      writeGraveyard,
    })

    const result = await handlers.close({
      tab,
      ruleText: 'close inactive>30d',
    })

    expect(result.tabRemoved).toBe(true)
    expect(result.graveyardEntryId).toBeDefined()
    expect(removeTab).toHaveBeenCalledWith(42)
    expect(writeGraveyard).toHaveBeenCalledOnce()
    const saved = writeGraveyard.mock.calls[0]![0] as { url: string; ruleText: string }[]
    expect(saved).toHaveLength(1)
    expect(saved[0]!.url).toBe('https://example.com')
    expect(saved[0]!.ruleText).toBe('close inactive>30d')
  })

  // ac 15
  it('discard removes tab without graveyard write', async () => {
    const removeTab = vi.fn().mockResolvedValue(undefined)
    const writeGraveyard = vi.fn()
    const handlers = createActionHandlers({
      removeTab,
      sleepTab: vi.fn(),
      readGraveyard: async () => [],
      writeGraveyard,
    })

    const result = await handlers.discard({
      tab,
      ruleText: 'discard inactive>7d',
    })

    expect(result).toEqual({ tabRemoved: true })
    expect(removeTab).toHaveBeenCalledWith(42)
    expect(writeGraveyard).not.toHaveBeenCalled()
  })

  it('sleep shows slept page without graveyard write', async () => {
    const removeTab = vi.fn()
    const sleepTab = vi.fn().mockResolvedValue(true)
    const writeGraveyard = vi.fn()
    const handlers = createActionHandlers({
      removeTab,
      sleepTab,
      readGraveyard: async () => [],
      writeGraveyard,
    })

    const result = await handlers.sleep({
      tab,
      ruleText: 'sleep inactive>2h',
    })

    expect(result).toEqual({ tabRemoved: false, tabDiscarded: true })
    expect(sleepTab).toHaveBeenCalledWith({
      tabId: 42,
      url: 'https://example.com',
      title: 'example',
      favicon: undefined,
    })
    expect(removeTab).not.toHaveBeenCalled()
    expect(writeGraveyard).not.toHaveBeenCalled()
  })
})
