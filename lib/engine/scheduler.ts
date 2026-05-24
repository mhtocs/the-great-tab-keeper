import type { EvaluationIntervalMinutes } from '../storage/schema'

export const EVALUATION_ALARM_NAME = 'tab-yard-evaluate'

export type SchedulerAlarm = {
  periodInMinutes?: number
}

export type SchedulerPorts = {
  getAlarm: (name: string) => Promise<SchedulerAlarm | undefined>
  clearAlarm: (name: string) => Promise<boolean>
  createAlarm: (name: string, periodInMinutes: EvaluationIntervalMinutes) => Promise<void>
}

// replace existing alarm so period changes take effect (ac 12, 19)
export async function syncEvaluationAlarm(
  ports: SchedulerPorts,
  periodInMinutes: EvaluationIntervalMinutes,
): Promise<void> {
  await ports.clearAlarm(EVALUATION_ALARM_NAME)
  await ports.createAlarm(EVALUATION_ALARM_NAME, periodInMinutes)
}

// keep existing alarm when interval unchanged; avoids resetting the timer on every sw wake
export async function syncEvaluationAlarmIfNeeded(
  ports: SchedulerPorts,
  periodInMinutes: EvaluationIntervalMinutes,
): Promise<void> {
  const existing = await ports.getAlarm(EVALUATION_ALARM_NAME)
  if (existing?.periodInMinutes === periodInMinutes) {
    return
  }
  await syncEvaluationAlarm(ports, periodInMinutes)
}
