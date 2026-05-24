import { describe, expect, it, vi } from 'vitest'
import { dispatchRuntimeMessage } from './messages'

describe('dispatchRuntimeMessage', () => {
  const runCycle = vi.fn().mockResolvedValue(undefined)
  const restoreArchive = vi.fn().mockResolvedValue({ ok: true, tabId: 1, entries: [] })
  const restoreSuspendedTab = vi.fn().mockResolvedValue({ ok: true })
  const rescheduleAlarm = vi.fn().mockResolvedValue(undefined)

  const deps = { runCycle, restoreArchive, restoreSuspendedTab, rescheduleAlarm }

  it('runs evaluation cycle', async () => {
    const result = await dispatchRuntimeMessage({ type: 'run-evaluation-cycle' }, deps)
    expect(result).toEqual({ ok: true })
    expect(runCycle).toHaveBeenCalledOnce()
  })

  it('restores archive entry', async () => {
    const result = await dispatchRuntimeMessage(
      { type: 'restore-archive', entryId: 'e1' },
      deps,
    )
    expect(restoreArchive).toHaveBeenCalledWith('e1')
    expect(result).toMatchObject({ ok: true })
  })

  it('reschedules evaluation alarm', async () => {
    const result = await dispatchRuntimeMessage({ type: 'reschedule-evaluation-alarm' }, deps)
    expect(result).toEqual({ ok: true })
    expect(rescheduleAlarm).toHaveBeenCalledOnce()
  })

  it('restores suspended tab', async () => {
    const result = await dispatchRuntimeMessage({ type: 'restore-suspended-tab', tabId: 8 }, deps)
    expect(restoreSuspendedTab).toHaveBeenCalledWith(8)
    expect(result).toEqual({ ok: true })
  })

  it('returns null for unknown messages', async () => {
    expect(await dispatchRuntimeMessage({ type: 'nope' }, deps)).toBe(null)
  })
})
