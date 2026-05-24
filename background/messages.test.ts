import { describe, expect, it, vi } from 'vitest'
import { dispatchRuntimeMessage } from './messages'

describe('dispatchRuntimeMessage', () => {
  const runCycle = vi.fn().mockResolvedValue(undefined)
  const restoreGraveyard = vi.fn().mockResolvedValue({ ok: true, tabId: 1, entries: [] })
  const restoreSleptTab = vi.fn().mockResolvedValue({ ok: true })
  const rescheduleAlarm = vi.fn().mockResolvedValue(undefined)

  const deps = { runCycle, restoreGraveyard, restoreSleptTab, rescheduleAlarm }

  it('runs evaluation cycle', async () => {
    const result = await dispatchRuntimeMessage({ type: 'run-evaluation-cycle' }, deps)
    expect(result).toEqual({ ok: true })
    expect(runCycle).toHaveBeenCalledOnce()
  })

  it('restores graveyard entry', async () => {
    const result = await dispatchRuntimeMessage(
      { type: 'restore-graveyard', entryId: 'e1' },
      deps,
    )
    expect(restoreGraveyard).toHaveBeenCalledWith('e1')
    expect(result).toMatchObject({ ok: true })
  })

  it('reschedules evaluation alarm', async () => {
    const result = await dispatchRuntimeMessage({ type: 'reschedule-evaluation-alarm' }, deps)
    expect(result).toEqual({ ok: true })
    expect(rescheduleAlarm).toHaveBeenCalledOnce()
  })

  it('restores slept tab', async () => {
    const result = await dispatchRuntimeMessage({ type: 'restore-slept-tab', tabId: 8 }, deps)
    expect(restoreSleptTab).toHaveBeenCalledWith(8)
    expect(result).toEqual({ ok: true })
  })

  it('returns null for unknown messages', async () => {
    expect(await dispatchRuntimeMessage({ type: 'nope' }, deps)).toBe(null)
  })
})
