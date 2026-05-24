import {
  isRescheduleEvaluationAlarmMessage,
  isRestoreArchiveMessage,
  isRestoreSuspendedTabMessage,
  isRunEvaluationCycleMessage,
  type RescheduleEvaluationAlarmResponse,
  type RestoreSuspendedTabResponse,
  type RunEvaluationCycleResponse,
} from '../lib/messages'
import type { restoreFromArchive } from './archive-restore'
import type { rescheduleEvaluationAlarm } from './scheduler'
import type { restoreSuspendedTab } from './suspend-tab'

type RestoreResult = Awaited<ReturnType<typeof restoreFromArchive>>

export type RuntimeMessageDeps = {
  runCycle: () => Promise<unknown>
  restoreArchive: typeof restoreFromArchive
  restoreSuspendedTab: typeof restoreSuspendedTab
  rescheduleAlarm: typeof rescheduleEvaluationAlarm
}

export async function dispatchRuntimeMessage(
  message: unknown,
  deps: RuntimeMessageDeps,
): Promise<
  | RunEvaluationCycleResponse
  | RestoreResult
  | RestoreSuspendedTabResponse
  | RescheduleEvaluationAlarmResponse
  | null
> {
  if (isRunEvaluationCycleMessage(message)) {
    await deps.runCycle()
    return { ok: true }
  }

  if (isRestoreArchiveMessage(message)) {
    return deps.restoreArchive(message.entryId)
  }

  if (isRescheduleEvaluationAlarmMessage(message)) {
    await deps.rescheduleAlarm()
    return { ok: true }
  }

  if (isRestoreSuspendedTabMessage(message)) {
    return deps.restoreSuspendedTab(message.tabId)
  }

  return null
}

export function registerRuntimeMessageListener(deps: RuntimeMessageDeps): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    void dispatchRuntimeMessage(message, deps)
      .then((result) => {
        if (result === null) {
          return
        }
        sendResponse(result)
      })
      .catch((err: unknown) => {
        if (isRestoreArchiveMessage(message)) {
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : 'restore failed',
            entries: [],
          })
          return
        }
        if (isRunEvaluationCycleMessage(message)) {
          sendResponse({ ok: false })
          return
        }
        if (isRescheduleEvaluationAlarmMessage(message)) {
          sendResponse({ ok: false })
          return
        }
        if (isRestoreSuspendedTabMessage(message)) {
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : 'reload failed',
          })
        }
      })

    return (
      isRunEvaluationCycleMessage(message) ||
      isRestoreArchiveMessage(message) ||
      isRescheduleEvaluationAlarmMessage(message) ||
      isRestoreSuspendedTabMessage(message)
    )
  })
}
