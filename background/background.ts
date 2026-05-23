import { createEvaluationCyclePorts } from './evaluation-ports'
import { syncTabActivated, syncTabRemoved } from '../lib/activity/sync'
import { runEvaluationCycle } from '../lib/engine/evaluation-cycle'
import { initialSettings, shouldSeedSettings } from '../lib/defaults/seed'
import {
  readActivityCache,
  readSettingsRaw,
  writeActivityCache,
  writeSettings,
} from '../lib/storage/chrome-storage'

const activityPorts = {
  readCache: readActivityCache,
  writeCache: writeActivityCache,
}

export async function seedStorageIfEmpty(): Promise<void> {
  const stored = await readSettingsRaw()
  if (!shouldSeedSettings(stored)) {
    return
  }
  await writeSettings(initialSettings())
}

function registerActivityListeners(): void {
  chrome.tabs.onActivated.addListener((activeInfo) => {
    void syncTabActivated(activityPorts, activeInfo.tabId).catch((err: unknown) => {
      console.error('tab yard tab activated sync failed', err)
    })
  })

  chrome.tabs.onRemoved.addListener((tabId) => {
    void syncTabRemoved(activityPorts, tabId).catch((err: unknown) => {
      console.error('tab yard tab removed sync failed', err)
    })
  })
}

export async function runTabYardEvaluationCycle(): Promise<void> {
  const result = await runEvaluationCycle(createEvaluationCyclePorts())
  if (!result.skipped) {
    console.log('tab yard cycle finished', result)
  }
}

console.log('tabyard background loaded')

registerActivityListeners()

chrome.runtime.onInstalled.addListener(() => {
  void seedStorageIfEmpty().catch((err: unknown) => {
    console.error('tab yard install seed failed', err)
  })
})
