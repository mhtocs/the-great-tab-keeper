import type { ActivityCache } from '../storage/schema'

export type TabLastAccessSource = {
  id?: number
  lastAccessed?: number
}

export function tabActivityKey(tabId: number): string {
  return String(tabId)
}

export function recordTabAccess(
  cache: ActivityCache,
  tabId: number,
  accessedAtMs: number,
): ActivityCache {
  return { ...cache, [tabActivityKey(tabId)]: accessedAtMs }
}

export function clearTabAccess(cache: ActivityCache, tabId: number): ActivityCache {
  const key = tabActivityKey(tabId)
  if (!(key in cache)) {
    return cache
  }
  const next = { ...cache }
  delete next[key]
  return next
}

// best known last-access time: max(chrome lastAccessed, shadow cache).
// unknown access defaults to nowMs so inactiveMs is 0 until we observe the tab.
export function lastAccessedMs(
  tab: TabLastAccessSource,
  cache: ActivityCache,
  nowMs: number,
): number {
  const fromChrome = tab.lastAccessed ?? 0
  const fromCache =
    tab.id !== undefined ? (cache[tabActivityKey(tab.id)] ?? 0) : 0
  const last = Math.max(fromChrome, fromCache)
  if (last <= 0) {
    return nowMs
  }
  return last
}

export function inactiveMsForTab(
  tab: TabLastAccessSource,
  cache: ActivityCache,
  nowMs: number,
  sleptAtMs?: number,
): number {
  const last = lastAccessedMs(tab, cache, nowMs)
  let inactive = Math.max(0, nowMs - last)
  // extension slept pages often lack chrome lastAccessed; use when tab was put to sleep
  if (sleptAtMs !== undefined && sleptAtMs > 0) {
    inactive = Math.max(inactive, nowMs - sleptAtMs)
  }
  return inactive
}
