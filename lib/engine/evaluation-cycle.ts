import { pruneGraveyardByRetention } from '../graveyard/store'
import {
  appendLifecycleLogEntry,
  logEntryFromEvaluation,
} from '../logs/lifecycle-log'
import { parseRules } from '../rules/parser'
import type {
  ActivityCache,
  GraveyardEntry,
  LastRunSummary,
  LifecycleLogEntry,
  Settings,
} from '../storage/schema'
import { createActionHandlers, executeAction } from './action-handlers'
import { evaluateTab } from './evaluator'
import { toTabEvaluationInput, type ChromeTabSnapshot } from './tab-snapshot'

export type EvaluationCyclePorts = {
  readSettings: () => Promise<Settings>
  queryTabs: () => Promise<ChromeTabSnapshot[]>
  getActiveTabId: () => Promise<number | undefined>
  readActivityCache: () => Promise<ActivityCache>
  readGraveyard: () => Promise<GraveyardEntry[]>
  writeGraveyard: (entries: GraveyardEntry[]) => Promise<void>
  readLifecycleLog: () => Promise<LifecycleLogEntry[]>
  writeLifecycleLog: (entries: LifecycleLogEntry[]) => Promise<void>
  writeLastRun: (summary: LastRunSummary) => Promise<void>
  removeTab: (tabId: number) => Promise<void>
  onTabError?: (tabId: number, error: unknown) => void
}

export type EvaluationCycleResult = {
  skipped: boolean
  tabsEvaluated: number
  actionsTaken: number
}

export async function runEvaluationCycle(
  ports: EvaluationCyclePorts,
  nowMs = Date.now(),
): Promise<EvaluationCycleResult> {
  const settings = await ports.readSettings()

  if (!settings.engineEnabled) {
    return { skipped: true, tabsEvaluated: 0, actionsTaken: 0 }
  }

  const parsedRules = parseRules(settings.rules)
  if (!parsedRules.ok) {
    ports.onTabError?.(0, new Error(parsedRules.error))
    return { skipped: false, tabsEvaluated: 0, actionsTaken: 0 }
  }

  const rules = parsedRules.rules
  const cache = await ports.readActivityCache()
  const tabs = await ports.queryTabs()
  const activeTabId = await ports.getActiveTabId()

  const handlers = createActionHandlers({
    removeTab: ports.removeTab,
    readGraveyard: ports.readGraveyard,
    writeGraveyard: ports.writeGraveyard,
  })

  let tabsEvaluated = 0
  let actionsTaken = 0
  let lifecycleLog = await ports.readLifecycleLog()

  for (const chromeTab of tabs) {
    const tabId = chromeTab.id
    if (tabId === undefined) {
      continue
    }

    try {
      const input = toTabEvaluationInput(chromeTab, activeTabId, cache, nowMs)
      if (!input) {
        continue
      }

      tabsEvaluated++
      const outcome = evaluateTab(rules, input)
      let executed = false

      if (outcome.executed && outcome.resolvedAction && outcome.winner) {
        await executeAction(handlers, outcome.resolvedAction, {
          tab: {
            tabId: input.tabId,
            url: input.url,
            title: input.title,
            favicon: chromeTab.favIconUrl,
          },
          ruleText: outcome.winner.source,
        })
        actionsTaken++
        executed = true
      }

      lifecycleLog = appendLifecycleLogEntry(
        lifecycleLog,
        logEntryFromEvaluation(input, outcome, nowMs, executed),
      )
    } catch (error) {
      ports.onTabError?.(tabId, error)
    }
  }

  await ports.writeLifecycleLog(lifecycleLog)

  const graveyard = await ports.readGraveyard()
  const pruned = pruneGraveyardByRetention(
    graveyard,
    settings.graveyardRetentionDays,
    nowMs,
  )
  if (pruned.length !== graveyard.length) {
    await ports.writeGraveyard(pruned)
  }

  await ports.writeLastRun({
    at: nowMs,
    tabsEvaluated,
    actionsTaken,
  })

  return { skipped: false, tabsEvaluated, actionsTaken }
}
