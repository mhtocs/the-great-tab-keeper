import { formatCycleResultMessage } from '../lib/logs/dev-log'
import type { EvaluationCycleResult } from '../lib/engine/evaluation-cycle'
import { runEvaluationCycle } from '../lib/engine/evaluation-cycle'
import {
  appendDevLog,
  readActivityCache,
  readGraveyard,
  readSettings,
  writeGraveyard,
  writeLastRun,
} from '../lib/storage/chrome-storage'
import { queryActiveTabId, queryAllTabs, removeTabById } from './chrome-tabs'
import { sleepTabById } from './sleep-tab'
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
      readGraveyard,
      writeGraveyard,
      writeLastRun,
      removeTab: removeTabById,
      sleepTab: sleepTabById,
      async onActionMessage(message) {
        await appendDevLog(message)
      },
      onTabError(tabId, error) {
        console.error('tabcleaner cycle tab error', tabId, error)
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
