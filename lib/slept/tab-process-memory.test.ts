import { describe, expect, it } from 'vitest'
import { measureTabMemoryBytes } from './tab-process-memory'

describe('measureTabMemoryBytes', () => {
  it('reads private memory for tab process', async () => {
    const bytes = await measureTabMemoryBytes(7, {
      getProcessIdForTab: async () => 42,
      getProcessInfo: async () => ({
        '42': { privateMemory: 12_000_000, jsMemoryAllocated: 1_000_000 },
      }),
    })
    expect(bytes).toBe(12_000_000)
  })

  it('returns undefined when process info is missing', async () => {
    const bytes = await measureTabMemoryBytes(7, {
      getProcessIdForTab: async () => 42,
      getProcessInfo: async () => ({}),
    })
    expect(bytes).toBeUndefined()
  })
})
