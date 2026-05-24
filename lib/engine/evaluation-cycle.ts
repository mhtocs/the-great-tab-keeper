import { pruneArchiveByRetention } from '../archive/store'
import { getSuspendedEntry } from '../suspended/store'
import type { SuspendedTabMap } from '../suspended/types'
import { parseRules } from '../rules/parser'
import type {
  ActivityCache,
  ArchiveEntry,
  LastRunSummary,
  LifecycleAction,
  Settings,
} from '../storage/schema'
import { createActionHandlers, type SuspendTabInput } from './action-handlers'
import type { ActionResult } from './actions'
import { evaluateTab } from './evaluator'
import { toTabEvaluationInput, type ChromeTabSnapshot } from './tab-snapshot'

export type EvaluationCyclePorts = {
  readSettings: () => Promise<Settings>
  queryTabs: () => Promise<ChromeTabSnapshot[]>
  getActiveTabId: () => Promise<number | undefined>
  readActivityCache: () => Promise<ActivityCache>
  readSuspendedTabs: () => Promise<SuspendedTabMap>
  readArchive: () => Promise<ArchiveEntry[]>
  writeArchive: (entries: ArchiveEntry[]) => Promise<void>
  writeLastRun: (summary: LastRunSummary) => Promise<void>
  removeTab: (tabId: number) => Promise<void>
  suspendTab: (input: SuspendTabInput) => Promise<boolean>
  onActionMessage?: (message: string) => void | Promise<void>
  onTabError?: (tabId: number, error: unknown) => void
}

export type EvaluationCycleResult = {
  skipped: boolean
  skipReason?: 'engine_off'
  rulesError?: string
  tabsEvaluated: number
  actionsTaken: number
  tabsArchived: number
  tabsRemoved: number
  tabsSuspended: number
}

export async function runEvaluationCycle(
  ports: EvaluationCyclePorts,
  nowMs = Date.now(),
): Promise<EvaluationCycleResult> {
  const emptyCounts = {
    tabsEvaluated: 0,
    actionsTaken: 0,
    tabsArchived: 0,
    tabsRemoved: 0,
    tabsSuspended: 0,
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
  const suspendedTabs = await ports.readSuspendedTabs()
  const tabs = await ports.queryTabs()
  const activeTabId = await ports.getActiveTabId()

  const handlers = createActionHandlers({
    removeTab: ports.removeTab,
    suspendTab: ports.suspendTab,
    readArchive: ports.readArchive,
    writeArchive: ports.writeArchive,
  })

  let tabsEvaluated = 0
  let tabsArchived = 0
  let tabsRemoved = 0
  let tabsSuspended = 0

  for (const chromeTab of tabs) {
    const tabId = chromeTab.id
    if (tabId === undefined) {
      continue
    }

    try {
      const suspendedEntry = getSuspendedEntry(suspendedTabs, tabId)
      const input = toTabEvaluationInput(
        chromeTab,
        activeTabId,
        cache,
        nowMs,
        suspendedEntry?.suspendedAt,
      )
      if (!input) {
        continue
      }

      tabsEvaluated++
      const outcome = evaluateTab(rules, input)

      if (outcome.executed && outcome.resolvedAction && outcome.winner) {
        const tabForAction =
          input.suspended && suspendedEntry
            ? {
                tabId: input.tabId,
                url: suspendedEntry.url,
                title: suspendedEntry.title,
                favicon: suspendedEntry.favicon ?? chromeTab.favIconUrl,
              }
            : {
                tabId: input.tabId,
                url: input.url,
                title: input.title,
                favicon: chromeTab.favIconUrl,
              }
        const result = await handlers[outcome.resolvedAction]({
          tab: tabForAction,
          ruleText: outcome.winner.source,
        })
        recordAction(
          outcome.resolvedAction,
          result,
          input.title,
          ports,
          (counts) => {
            if (counts.archived) {
              tabsArchived++
            }
            if (counts.removed) {
              tabsRemoved++
            }
            if (counts.suspended) {
              tabsSuspended++
            }
          },
        )
      }
    } catch (error) {
      ports.onTabError?.(tabId, error)
    }
  }

  const archive = await ports.readArchive()
  const pruned = pruneArchiveByRetention(
    archive,
    settings.archiveRetentionDays,
    nowMs,
  )
  if (pruned.length !== archive.length) {
    await ports.writeArchive(pruned)
  }

  const actionsTaken = tabsArchived + tabsRemoved + tabsSuspended

  await ports.writeLastRun({
    at: nowMs,
    tabsEvaluated,
    actionsTaken,
  })

  return {
    skipped: false,
    tabsEvaluated,
    actionsTaken,
    tabsArchived,
    tabsRemoved,
    tabsSuspended,
  }
}

function recordAction(
  action: LifecycleAction,
  result: ActionResult,
  title: string,
  ports: EvaluationCyclePorts,
  onSuccess: (counts: {
    archived?: boolean
    removed?: boolean
    suspended?: boolean
  }) => void,
): void {
  if (action === 'archive' && result.tabRemoved) {
    onSuccess({ archived: true })
    return
  }
  if (action === 'discard' && result.tabRemoved) {
    onSuccess({ removed: true })
    return
  }
  if (action === 'suspend' && result.tabDiscarded) {
    onSuccess({ suspended: true })
    void ports.onActionMessage?.(`suspended, ${title || 'untitled'}`)
  }
}
