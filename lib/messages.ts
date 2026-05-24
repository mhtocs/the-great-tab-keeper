// runtime messages between dashboard ui and mv3 background

export type RunEvaluationCycleMessage = { type: 'run-evaluation-cycle' }
export type RestoreArchiveMessage = { type: 'restore-archive'; entryId: string }
export type RescheduleEvaluationAlarmMessage = { type: 'reschedule-evaluation-alarm' }
export type RestoreSuspendedTabMessage = { type: 'restore-suspended-tab'; tabId: number }

export type RuntimeMessage =
  | RunEvaluationCycleMessage
  | RestoreArchiveMessage
  | RescheduleEvaluationAlarmMessage
  | RestoreSuspendedTabMessage

export type RunEvaluationCycleResponse = { ok: boolean }
export type RescheduleEvaluationAlarmResponse = { ok: boolean }
export type RestoreSuspendedTabResponse = { ok: boolean; error?: string }

export function isRunEvaluationCycleMessage(
  message: unknown,
): message is RunEvaluationCycleMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as RunEvaluationCycleMessage).type === 'run-evaluation-cycle'
  )
}

export function isRestoreArchiveMessage(
  message: unknown,
): message is RestoreArchiveMessage {
  if (typeof message !== 'object' || message === null) {
    return false
  }
  const type = (message as RestoreArchiveMessage).type
  return (
    (type === 'restore-archive' || type === 'restore-archive') &&
    typeof (message as RestoreArchiveMessage).entryId === 'string'
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

export function isRestoreSuspendedTabMessage(
  message: unknown,
): message is RestoreSuspendedTabMessage {
  if (typeof message !== 'object' || message === null) {
    return false
  }
  const type = (message as RestoreSuspendedTabMessage).type
  return (
    (type === 'restore-suspended-tab' || type === 'restore-suspended-tab') &&
    typeof (message as RestoreSuspendedTabMessage).tabId === 'number'
  )
}
