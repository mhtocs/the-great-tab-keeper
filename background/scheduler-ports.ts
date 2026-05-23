import type { EvaluationIntervalMinutes } from '../lib/storage/schema'
import type { SchedulerPorts } from '../lib/engine/scheduler'

function clearAlarm(name: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    chrome.alarms.clear(name, (wasCleared) => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(new Error(err.message))
        return
      }
      resolve(wasCleared)
    })
  })
}

function createAlarm(name: string, periodInMinutes: EvaluationIntervalMinutes): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.alarms.create(name, { periodInMinutes }, () => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(new Error(err.message))
        return
      }
      resolve()
    })
  })
}

export const schedulerPorts: SchedulerPorts = {
  clearAlarm,
  createAlarm,
}
