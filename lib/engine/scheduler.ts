import type { EvaluationIntervalMinutes } from '../storage/schema'

export const EVALUATION_ALARM_NAME = 'tab-yard-evaluate'

export type SchedulerPorts = {
  clearAlarm: (name: string) => Promise<boolean>
  createAlarm: (name: string, periodInMinutes: EvaluationIntervalMinutes) => Promise<void>
}

/** replace existing alarm so period changes take effect (ac 12, 19) */
export async function syncEvaluationAlarm(
  ports: SchedulerPorts,
  periodInMinutes: EvaluationIntervalMinutes,
): Promise<void> {
  await ports.clearAlarm(EVALUATION_ALARM_NAME)
  await ports.createAlarm(EVALUATION_ALARM_NAME, periodInMinutes)
}

export function isEvaluationAlarm(name: string): boolean {
  return name === EVALUATION_ALARM_NAME
}
