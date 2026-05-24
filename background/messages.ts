import {
  isRescheduleEvaluationAlarmMessage,
  isRestoreGraveyardMessage,
  isRestoreSleptTabMessage,
  isRunEvaluationCycleMessage,
  type RescheduleEvaluationAlarmResponse,
  type RestoreSleptTabResponse,
  type RunEvaluationCycleResponse,
} from '../lib/messages'
import type { restoreFromGraveyard } from './graveyard-restore'
import type { rescheduleEvaluationAlarm } from './scheduler'
import type { restoreSleptTab } from './sleep-tab'

type RestoreResult = Awaited<ReturnType<typeof restoreFromGraveyard>>

export type RuntimeMessageDeps = {
  runCycle: () => Promise<unknown>
  restoreGraveyard: typeof restoreFromGraveyard
  restoreSleptTab: typeof restoreSleptTab
  rescheduleAlarm: typeof rescheduleEvaluationAlarm
}

export async function dispatchRuntimeMessage(
  message: unknown,
  deps: RuntimeMessageDeps,
): Promise<
  | RunEvaluationCycleResponse
  | RestoreResult
  | RestoreSleptTabResponse
  | RescheduleEvaluationAlarmResponse
  | null
> {
  if (isRunEvaluationCycleMessage(message)) {
    await deps.runCycle()
    return { ok: true }
  }

  if (isRestoreGraveyardMessage(message)) {
    return deps.restoreGraveyard(message.entryId)
  }

  if (isRescheduleEvaluationAlarmMessage(message)) {
    await deps.rescheduleAlarm()
    return { ok: true }
  }

  if (isRestoreSleptTabMessage(message)) {
    return deps.restoreSleptTab(message.tabId)
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
        if (isRestoreGraveyardMessage(message)) {
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
        if (isRestoreSleptTabMessage(message)) {
          sendResponse({
            ok: false,
            error: err instanceof Error ? err.message : 'reload failed',
          })
        }
      })

    return (
      isRunEvaluationCycleMessage(message) ||
      isRestoreGraveyardMessage(message) ||
      isRescheduleEvaluationAlarmMessage(message) ||
      isRestoreSleptTabMessage(message)
    )
  })
}
