import type { EvaluationCyclePorts } from '../lib/engine/evaluation-cycle'
import {
  readActivityCache,
  readGraveyard,
  readLifecycleLog,
  readSettings,
  writeGraveyard,
  writeLastRun,
  writeLifecycleLog,
} from '../lib/storage/chrome-storage'

function queryTabs(): Promise<chrome.tabs.Tab[]> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({}, (tabs) => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(new Error(err.message))
        return
      }
      resolve(tabs)
    })
  })
}

function getActiveTabId(): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(new Error(err.message))
        return
      }
      resolve(tabs[0]?.id)
    })
  })
}

function removeTab(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.tabs.remove(tabId, () => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(new Error(err.message))
        return
      }
      resolve()
    })
  })
}

export function createEvaluationCyclePorts(): EvaluationCyclePorts {
  return {
    readSettings,
    queryTabs,
    getActiveTabId,
    readActivityCache,
    readGraveyard,
    writeGraveyard,
    readLifecycleLog,
    writeLifecycleLog,
    writeLastRun,
    removeTab,
    onTabError(tabId, error) {
      console.error('tab yard cycle tab error', tabId, error)
    },
  }
}
