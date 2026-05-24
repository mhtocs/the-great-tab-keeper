import type { SuspendedTabEntry, SuspendedTabMap } from './types'

export function suspendedTabKey(tabId: number): string {
  return String(tabId)
}

export function getSuspendedEntry(
  map: SuspendedTabMap,
  tabId: number,
): SuspendedTabEntry | undefined {
  return map[suspendedTabKey(tabId)]
}

export function setSuspendedEntry(
  map: SuspendedTabMap,
  tabId: number,
  entry: SuspendedTabEntry,
): SuspendedTabMap {
  return { ...map, [suspendedTabKey(tabId)]: entry }
}

export function removeSuspendedEntry(map: SuspendedTabMap, tabId: number): SuspendedTabMap {
  const key = suspendedTabKey(tabId)
  if (!(key in map)) {
    return map
  }
  const next = { ...map }
  delete next[key]
  return next
}
