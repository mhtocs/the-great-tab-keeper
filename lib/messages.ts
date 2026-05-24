// runtime messages between dashboard ui and mv3 background

export type RunEvaluationCycleMessage = { type: 'run-evaluation-cycle' }
export type RestoreGraveyardMessage = { type: 'restore-graveyard'; entryId: string }
export type RescheduleEvaluationAlarmMessage = { type: 'reschedule-evaluation-alarm' }
export type RestoreSleptTabMessage = { type: 'restore-slept-tab'; tabId: number }

export type RuntimeMessage =
  | RunEvaluationCycleMessage
  | RestoreGraveyardMessage
  | RescheduleEvaluationAlarmMessage
  | RestoreSleptTabMessage

export type RunEvaluationCycleResponse = { ok: boolean }
export type RescheduleEvaluationAlarmResponse = { ok: boolean }
export type RestoreSleptTabResponse = { ok: boolean; error?: string }

export function isRunEvaluationCycleMessage(
  message: unknown,
): message is RunEvaluationCycleMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as RunEvaluationCycleMessage).type === 'run-evaluation-cycle'
  )
}

export function isRestoreGraveyardMessage(
  message: unknown,
): message is RestoreGraveyardMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as RestoreGraveyardMessage).type === 'restore-graveyard' &&
    typeof (message as RestoreGraveyardMessage).entryId === 'string'
  )
}

export function isRescheduleEvaluationAlarmMessage(
  message: unknown,
): message is RescheduleEvaluationAlarmMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as RescheduleEvaluationAlarmMessage).type === 'reschedule-evaluation-alarm'
  )
}

export function isRestoreSleptTabMessage(
  message: unknown,
): message is RestoreSleptTabMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as RestoreSleptTabMessage).type === 'restore-slept-tab' &&
    typeof (message as RestoreSleptTabMessage).tabId === 'number'
  )
}
