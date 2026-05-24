import { EXTENSION_LOG_PREFIX } from '../lib/product-name'
import { runTabYardEvaluationCycle } from './evaluation-runner'
import { restoreFromArchive } from './archive-restore'
import { registerRuntimeMessageListener } from './messages'
import { registerSchedulerListeners, rescheduleEvaluationAlarm } from './scheduler'
import { clearSuspendedTab, restoreSuspendedTab } from './suspend-tab'
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
      console.error(`${EXTENSION_LOG_PREFIX} tab activated sync failed`, err)
    })
  })

  chrome.tabs.onRemoved.addListener((tabId) => {
    void clearSuspendedTab(tabId).catch((err: unknown) => {
      console.error(`${EXTENSION_LOG_PREFIX} suspended tab cleanup failed`, err)
    })
    void syncTabRemoved(activityPorts, tabId).catch((err: unknown) => {
      console.error(`${EXTENSION_LOG_PREFIX} tab removed sync failed`, err)
    })
  })
}

registerOpenDashboardOnActionClick()
registerActivityListeners()
registerSchedulerListeners(runTabYardEvaluationCycle)
registerRuntimeMessageListener({
  runCycle: runTabYardEvaluationCycle,
  restoreArchive: restoreFromArchive,
  restoreSuspendedTab,
  rescheduleAlarm: rescheduleEvaluationAlarm,
})

chrome.runtime.onInstalled.addListener(() => {
  void initializeExtension({ runCycle: true }).catch((err: unknown) => {
    console.error(`${EXTENSION_LOG_PREFIX} install setup failed`, err)
  })
})

void initializeExtension().catch((err: unknown) => {
  console.error(`${EXTENSION_LOG_PREFIX} background init failed`, err)
})
