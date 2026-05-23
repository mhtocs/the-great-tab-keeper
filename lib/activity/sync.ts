import { clearTabAccess, recordTabAccess } from './tracker'
import type { ActivityCache } from '../storage/schema'

export type ActivityCachePorts = {
  readCache: () => Promise<ActivityCache>
  writeCache: (cache: ActivityCache) => Promise<void>
}

export async function syncTabActivated(
  ports: ActivityCachePorts,
  tabId: number,
  accessedAtMs = Date.now(),
): Promise<void> {
  const cache = await ports.readCache()
  await ports.writeCache(recordTabAccess(cache, tabId, accessedAtMs))
}

export async function syncTabRemoved(
  ports: ActivityCachePorts,
  tabId: number,
): Promise<void> {
  const cache = await ports.readCache()
  await ports.writeCache(clearTabAccess(cache, tabId))
}
