import { EXTENSION_LOG_PREFIX } from '../lib/product-name'
import { EVALUATION_ALARM_NAME, syncEvaluationAlarm } from '../lib/engine/scheduler'
import type { Settings } from '../lib/storage/schema'
import { appendDevLog, readSettings } from '../lib/storage/chrome-storage'
import { initializeExtension } from './setup'
import { schedulerPorts } from './scheduler-ports'

export async function rescheduleEvaluationAlarm(): Promise<void> {
  const settings = await readSettings()
  await syncEvaluationAlarm(schedulerPorts, settings.evaluationIntervalMinutes)
}

export function registerSchedulerListeners(
  onEvaluate: () => Promise<unknown>,
): void {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== EVALUATION_ALARM_NAME) {
      return
    }
    void appendDevLog('alarm fired')
    void onEvaluate().catch((err: unknown) => {
      console.error(`${EXTENSION_LOG_PREFIX} evaluation cycle failed`, err)
    })
  })

  chrome.runtime.onStartup.addListener(() => {
    void initializeExtension({ runCycle: true }).catch((err: unknown) => {
      console.error(`${EXTENSION_LOG_PREFIX} startup init failed`, err)
    })
  })

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local' || !changes.settings) {
      return
    }
    const oldInterval = (changes.settings.oldValue as Settings | undefined)
      ?.evaluationIntervalMinutes
    const newInterval = (changes.settings.newValue as Settings | undefined)
      ?.evaluationIntervalMinutes
    if (oldInterval === newInterval) {
      return
    }
    void rescheduleEvaluationAlarm().catch((err: unknown) => {
      console.error(`${EXTENSION_LOG_PREFIX} settings alarm reschedule failed`, err)
    })
  })
}
