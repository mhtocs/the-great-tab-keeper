import { inactiveMsForTab, lastAccessedMs } from '../activity/tracker'
import type { ActivityCache } from '../storage/schema'
import { isSuspendedPageUrl } from '../suspended/suspended-page'
import type { TabEvaluationInput } from './evaluator'

export type ChromeTabSnapshot = {
  id?: number
  url?: string
  title?: string
  favIconUrl?: string
  pinned?: boolean
  audible?: boolean
  discarded?: boolean
  lastAccessed?: number
}

export function toTabEvaluationInput(
  tab: ChromeTabSnapshot,
  activeTabId: number | undefined,
  cache: ActivityCache,
  nowMs: number,
  suspendedAtMs?: number,
): TabEvaluationInput | null {
  if (tab.id === undefined || !tab.url) {
    return null
  }

  return {
    tabId: tab.id,
    url: tab.url,
    title: tab.title ?? '',
    pinned: tab.pinned ?? false,
    audible: tab.audible ?? false,
    active: tab.id === activeTabId,
    suspended: isSuspendedPageUrl(tab.url),
    discarded: tab.discarded ?? false,
    inactiveMs: inactiveMsForTab(tab, cache, nowMs, suspendedAtMs),
    lastAccessedMs: lastAccessedMs(tab, cache, nowMs),
  }
}
