import { isTransientTabEditError } from '../lib/engine/tab-edit-errors'
import { EXTENSION_LOG_PREFIX } from '../lib/product-name'
import { formatCycleResultMessage } from '../lib/logs/dev-log'
import type { EvaluationCycleResult } from '../lib/engine/evaluation-cycle'
import { runEvaluationCycle } from '../lib/engine/evaluation-cycle'
import {
  appendDevLog,
  readActivityCache,
  readArchive,
  readSettings,
  writeArchive,
  writeLastRun,
} from '../lib/storage/chrome-storage'
import { queryActiveTabId, queryAllTabs, removeTabById } from './chrome-tabs'
import { readSuspendedTabs } from '../lib/storage/chrome-session'
import { suspendTabById } from './suspend-tab'
import { whenExtensionReady } from './setup'

let cycleTail: Promise<EvaluationCycleResult | void> = Promise.resolve()

export function runTabYardEvaluationCycle(): Promise<EvaluationCycleResult> {
  const run = async (): Promise<EvaluationCycleResult> => {
    await whenExtensionReady()
    const result = await runEvaluationCycle({
      readSettings,
      queryTabs: queryAllTabs,
      getActiveTabId: queryActiveTabId,
      readActivityCache,
      readSuspendedTabs,
      readArchive,
      writeArchive,
      writeLastRun,
      removeTab: removeTabById,
      suspendTab: suspendTabById,
      async onActionMessage(message) {
        await appendDevLog(message)
      },
      onTabError(tabId, error) {
        if (isTransientTabEditError(error)) {
          return
        }
        console.error(`${EXTENSION_LOG_PREFIX} cycle tab error`, tabId, error)
      },
    })
    await appendDevLog(formatCycleResultMessage(result))
    return result
  }

  const next = cycleTail.then(run, run)
  cycleTail = next.then(
    () => undefined,
    () => undefined,
  )
  return next
}
