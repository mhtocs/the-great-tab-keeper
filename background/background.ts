import { syncTabActivated, syncTabRemoved } from '../lib/activity/sync'
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

console.log('tabyard background loaded')

registerActivityListeners()

chrome.runtime.onInstalled.addListener(() => {
  void seedStorageIfEmpty().catch((err: unknown) => {
    console.error('tab yard install seed failed', err)
  })
})
