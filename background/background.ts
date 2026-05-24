import { runTabYardEvaluationCycle } from './evaluation-runner'
import { restoreFromGraveyard } from './graveyard-restore'
import { registerRuntimeMessageListener } from './messages'
import { registerSchedulerListeners, rescheduleEvaluationAlarm } from './scheduler'
import { clearSleptTab, restoreSleptTab } from './sleep-tab'
import { initializeExtension } from './setup'
import { syncTabActivated, syncTabRemoved } from '../lib/activity/sync'
import {
  readActivityCache,
  writeActivityCache,
} from '../lib/storage/chrome-storage'

const DASHBOARD_PATH = 'ui/dashboard/index.html'

const activityPorts = {
  readCache: readActivityCache,
  writeCache: writeActivityCache,
}

function registerOpenDashboardOnActionClick(): void {
  chrome.action.onClicked.addListener(() => {
    void chrome.tabs.create({ url: chrome.runtime.getURL(DASHBOARD_PATH) })
  })
}

function registerActivityListeners(): void {
  chrome.tabs.onActivated.addListener((activeInfo) => {
    void syncTabActivated(activityPorts, activeInfo.tabId).catch((err: unknown) => {
      console.error('tabcleaner tab activated sync failed', err)
    })
  })

  chrome.tabs.onRemoved.addListener((tabId) => {
    void clearSleptTab(tabId).catch((err: unknown) => {
      console.error('tabcleaner slept tab cleanup failed', err)
    })
    void syncTabRemoved(activityPorts, tabId).catch((err: unknown) => {
      console.error('tabcleaner tab removed sync failed', err)
    })
  })
}

registerOpenDashboardOnActionClick()
registerActivityListeners()
registerSchedulerListeners(runTabYardEvaluationCycle)
registerRuntimeMessageListener({
  runCycle: runTabYardEvaluationCycle,
  restoreGraveyard: restoreFromGraveyard,
  restoreSleptTab,
  rescheduleAlarm: rescheduleEvaluationAlarm,
})

chrome.runtime.onInstalled.addListener(() => {
  void initializeExtension({ runCycle: true }).catch((err: unknown) => {
    console.error('tabcleaner install setup failed', err)
  })
})

void initializeExtension().catch((err: unknown) => {
  console.error('tabcleaner background init failed', err)
})
