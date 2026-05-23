import { EVALUATION_ALARM_NAME, syncEvaluationAlarm } from '../lib/engine/scheduler'
import { readSettings } from '../lib/storage/chrome-storage'
import { schedulerPorts } from './scheduler-ports'

export async function rescheduleEvaluationAlarm(): Promise<void> {
  const settings = await readSettings()
  await syncEvaluationAlarm(schedulerPorts, settings.evaluationIntervalMinutes)
}

export function registerSchedulerListeners(
  onEvaluate: () => Promise<void>,
): void {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== EVALUATION_ALARM_NAME) {
      return
    }
    void onEvaluate().catch((err: unknown) => {
      console.error('tab yard evaluation cycle failed', err)
    })
  })

  chrome.runtime.onStartup.addListener(() => {
    void rescheduleEvaluationAlarm().catch((err: unknown) => {
      console.error('tab yard startup alarm schedule failed', err)
    })
  })

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes.settings) {
      return
    }
    void rescheduleEvaluationAlarm().catch((err: unknown) => {
      console.error('tab yard settings alarm reschedule failed', err)
    })
  })
}
