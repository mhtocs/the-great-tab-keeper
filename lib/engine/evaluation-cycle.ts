import { pruneGraveyardByRetention } from '../graveyard/store'
import { parseRules } from '../rules/parser'
import type {
  ActivityCache,
  GraveyardEntry,
  LastRunSummary,
  LifecycleAction,
  Settings,
} from '../storage/schema'
import { createActionHandlers, type SleepTabInput } from './action-handlers'
import type { ActionResult } from './actions'
import { evaluateTab } from './evaluator'
import { isSleptPageUrl } from '../slept/slept-page'
import { toTabEvaluationInput, type ChromeTabSnapshot } from './tab-snapshot'

export type EvaluationCyclePorts = {
  readSettings: () => Promise<Settings>
  queryTabs: () => Promise<ChromeTabSnapshot[]>
  getActiveTabId: () => Promise<number | undefined>
  readActivityCache: () => Promise<ActivityCache>
  readGraveyard: () => Promise<GraveyardEntry[]>
  writeGraveyard: (entries: GraveyardEntry[]) => Promise<void>
  writeLastRun: (summary: LastRunSummary) => Promise<void>
  removeTab: (tabId: number) => Promise<void>
  sleepTab: (input: SleepTabInput) => Promise<boolean>
  onActionMessage?: (message: string) => void | Promise<void>
  onTabError?: (tabId: number, error: unknown) => void
}

export type EvaluationCycleResult = {
  skipped: boolean
  skipReason?: 'engine_off'
  rulesError?: string
  tabsEvaluated: number
  actionsTaken: number
  tabsClosed: number
  tabsRemoved: number
  tabsSlept: number
}

export async function runEvaluationCycle(
  ports: EvaluationCyclePorts,
  nowMs = Date.now(),
): Promise<EvaluationCycleResult> {
  const emptyCounts = {
    tabsEvaluated: 0,
    actionsTaken: 0,
    tabsClosed: 0,
    tabsRemoved: 0,
    tabsSlept: 0,
  }

  const settings = await ports.readSettings()

  if (!settings.engineEnabled) {
    return {
      skipped: true,
      skipReason: 'engine_off',
      ...emptyCounts,
    }
  }

  const parsedRules = parseRules(settings.rules)
  if (!parsedRules.ok) {
    ports.onTabError?.(0, new Error(parsedRules.error))
    return {
      skipped: false,
      rulesError: parsedRules.error,
      ...emptyCounts,
    }
  }

  const rules = parsedRules.rules
  const cache = await ports.readActivityCache()
  const tabs = await ports.queryTabs()
  const activeTabId = await ports.getActiveTabId()

  const handlers = createActionHandlers({
    removeTab: ports.removeTab,
    sleepTab: ports.sleepTab,
    readGraveyard: ports.readGraveyard,
    writeGraveyard: ports.writeGraveyard,
  })

  let tabsEvaluated = 0
  let tabsClosed = 0
  let tabsRemoved = 0
  let tabsSlept = 0

  for (const chromeTab of tabs) {
    const tabId = chromeTab.id
    if (tabId === undefined) {
      continue
    }

    try {
      if (chromeTab.url && isSleptPageUrl(chromeTab.url)) {
        continue
      }

      const input = toTabEvaluationInput(chromeTab, activeTabId, cache, nowMs)
      if (!input) {
        continue
      }

      tabsEvaluated++
      const outcome = evaluateTab(rules, input)

      if (outcome.executed && outcome.resolvedAction && outcome.winner) {
        const result = await handlers[outcome.resolvedAction]({
          tab: {
            tabId: input.tabId,
            url: input.url,
            title: input.title,
            favicon: chromeTab.favIconUrl,
          },
          ruleText: outcome.winner.source,
        })
        recordAction(
          outcome.resolvedAction,
          result,
          input.title,
          ports,
          (counts) => {
            if (counts.closed) {
              tabsClosed++
            }
            if (counts.removed) {
              tabsRemoved++
            }
            if (counts.slept) {
              tabsSlept++
            }
          },
        )
      }
    } catch (error) {
      ports.onTabError?.(tabId, error)
    }
  }

  const graveyard = await ports.readGraveyard()
  const pruned = pruneGraveyardByRetention(
    graveyard,
    settings.graveyardRetentionDays,
    nowMs,
  )
  if (pruned.length !== graveyard.length) {
    await ports.writeGraveyard(pruned)
  }

  const actionsTaken = tabsClosed + tabsRemoved + tabsSlept

  await ports.writeLastRun({
    at: nowMs,
    tabsEvaluated,
    actionsTaken,
  })

  return {
    skipped: false,
    tabsEvaluated,
    actionsTaken,
    tabsClosed,
    tabsRemoved,
    tabsSlept,
  }
}

function recordAction(
  action: LifecycleAction,
  result: ActionResult,
  title: string,
  ports: EvaluationCyclePorts,
  onSuccess: (counts: { closed?: boolean; removed?: boolean; slept?: boolean }) => void,
): void {
  if (action === 'close' && result.tabRemoved) {
    onSuccess({ closed: true })
    return
  }
  if (action === 'discard' && result.tabRemoved) {
    onSuccess({ removed: true })
    return
  }
  if (action === 'sleep' && result.tabDiscarded) {
    onSuccess({ slept: true })
    void ports.onActionMessage?.(`slept · ${title || 'untitled'}`)
  }
}
