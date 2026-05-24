import { inactiveMsForTab, lastAccessedMs } from '../activity/tracker'
import type { ActivityCache } from '../storage/schema'
import { isSleptPageUrl } from '../slept/slept-page'
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
  sleptAtMs?: number,
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
    slept: isSleptPageUrl(tab.url),
    discarded: tab.discarded ?? false,
    inactiveMs: inactiveMsForTab(tab, cache, nowMs, sleptAtMs),
    lastAccessedMs: lastAccessedMs(tab, cache, nowMs),
  }
}
