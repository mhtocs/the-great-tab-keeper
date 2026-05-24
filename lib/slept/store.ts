import type { SleptTabEntry, SleptTabMap } from './types'

export function sleptTabKey(tabId: number): string {
  return String(tabId)
}

export function getSleptEntry(
  map: SleptTabMap,
  tabId: number,
): SleptTabEntry | undefined {
  return map[sleptTabKey(tabId)]
}

export function setSleptEntry(
  map: SleptTabMap,
  tabId: number,
  entry: SleptTabEntry,
): SleptTabMap {
  return { ...map, [sleptTabKey(tabId)]: entry }
}

export function removeSleptEntry(map: SleptTabMap, tabId: number): SleptTabMap {
  const key = sleptTabKey(tabId)
  if (!(key in map)) {
    return map
  }
  const next = { ...map }
  delete next[key]
  return next
}
