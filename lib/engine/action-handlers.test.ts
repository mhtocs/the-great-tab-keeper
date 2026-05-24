import { describe, expect, it, vi } from 'vitest'
import { createActionHandlers } from './action-handlers'

describe('action handlers', () => {
  const tab = { tabId: 42, url: 'https://example.com', title: 'example' }

  it('keep does not remove tab or write archive', async () => {
    const removeTab = vi.fn()
    const writeArchive = vi.fn()
    const handlers = createActionHandlers({
      removeTab,
      suspendTab: vi.fn(),
      readArchive: async () => [],
      writeArchive,
    })

    const result = await handlers.keep({
      tab,
      ruleText: 'keep pinned=true',
    })

    expect(result).toEqual({ tabRemoved: false })
    expect(removeTab).not.toHaveBeenCalled()
    expect(writeArchive).not.toHaveBeenCalled()
  })

  // ac 2
  it('archive removes tab and appends archive entry', async () => {
    const removeTab = vi.fn().mockResolvedValue(undefined)
    const writeArchive = vi.fn().mockResolvedValue(undefined)
    const handlers = createActionHandlers({
      removeTab,
      suspendTab: vi.fn(),
      readArchive: async () => [],
      writeArchive,
    })

    const result = await handlers.archive({
      tab,
      ruleText: 'archive inactive>30d',
    })

    expect(result.tabRemoved).toBe(true)
    expect(result.archiveEntryId).toBeDefined()
    expect(removeTab).toHaveBeenCalledWith(42)
    expect(writeArchive).toHaveBeenCalledOnce()
    const saved = writeArchive.mock.calls[0]![0] as { url: string; ruleText: string }[]
    expect(saved).toHaveLength(1)
    expect(saved[0]!.url).toBe('https://example.com')
    expect(saved[0]!.ruleText).toBe('archive inactive>30d')
  })

  // ac 15
  it('discard removes tab without archive write', async () => {
    const removeTab = vi.fn().mockResolvedValue(undefined)
    const writeArchive = vi.fn()
    const handlers = createActionHandlers({
      removeTab,
      suspendTab: vi.fn(),
      readArchive: async () => [],
      writeArchive,
    })

    const result = await handlers.discard({
      tab,
      ruleText: 'discard inactive>7d',
    })

    expect(result).toEqual({ tabRemoved: true })
    expect(removeTab).toHaveBeenCalledWith(42)
    expect(writeArchive).not.toHaveBeenCalled()
  })

  it('suspend shows suspended page without archive write', async () => {
    const removeTab = vi.fn()
    const suspendTab = vi.fn().mockResolvedValue(true)
    const writeArchive = vi.fn()
    const handlers = createActionHandlers({
      removeTab,
      suspendTab,
      readArchive: async () => [],
      writeArchive,
    })

    const result = await handlers.suspend({
      tab,
      ruleText: 'suspend inactive>2h',
    })

    expect(result).toEqual({ tabRemoved: false, tabDiscarded: true })
    expect(suspendTab).toHaveBeenCalledWith({
      tabId: 42,
      url: 'https://example.com',
      title: 'example',
      favicon: undefined,
    })
    expect(removeTab).not.toHaveBeenCalled()
    expect(writeArchive).not.toHaveBeenCalled()
  })
})
