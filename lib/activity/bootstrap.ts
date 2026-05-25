import type { ActivityCache } from '../storage/schema'
import { recordTabAccess, tabActivityKey, type TabLastAccessSource } from './tracker'

// merge chrome lastAccessed into cache without overwriting newer cache entries
export function mergeTabLastAccessedIntoCache(
  cache: ActivityCache,
  tabs: TabLastAccessSource[],
): ActivityCache {
  let next = cache
  for (const tab of tabs) {
    if (tab.id === undefined) {
      continue
    }
    const chromeLast = tab.lastAccessed ?? 0
    if (chromeLast <= 0) {
      continue
    }
    const existing = next[tabActivityKey(tab.id)] ?? 0
    if (chromeLast > existing) {
      next = recordTabAccess(next, tab.id, chromeLast)
    }
  }
  return next
}
