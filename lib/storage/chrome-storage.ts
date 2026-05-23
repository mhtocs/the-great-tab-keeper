import type {
  ActivityCache,
  GraveyardEntry,
  LastRunSummary,
  LifecycleLogEntry,
  Settings,
} from './schema'
import { STORAGE_KEYS } from './schema'
import { DEFAULT_SETTINGS, parseSettings } from './settings'

function storageGet<T>(keys: string | string[]): Promise<Record<string, T>> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(new Error(err.message))
        return
      }
      resolve(result as Record<string, T>)
    })
  })
}

function storageSet(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(new Error(err.message))
        return
      }
      resolve()
    })
  })
}

export async function readSettingsRaw(): Promise<unknown> {
  const result = await storageGet<unknown>(STORAGE_KEYS.settings)
  return result[STORAGE_KEYS.settings]
}

export async function readSettings(): Promise<Settings> {
  const result = await storageGet<unknown>(STORAGE_KEYS.settings)
  const parsed = parseSettings(result[STORAGE_KEYS.settings])
  if (!parsed.ok) {
    return { ...DEFAULT_SETTINGS }
  }
  return parsed.settings
}

export async function writeSettings(settings: Settings): Promise<void> {
  const parsed = parseSettings(settings)
  if (!parsed.ok) {
    throw new Error(parsed.error)
  }
  await storageSet({ [STORAGE_KEYS.settings]: parsed.settings })
}

export async function readGraveyard(): Promise<GraveyardEntry[]> {
  const result = await storageGet<GraveyardEntry[]>(STORAGE_KEYS.graveyard)
  const entries = result[STORAGE_KEYS.graveyard]
  return Array.isArray(entries) ? entries : []
}

export async function writeGraveyard(entries: GraveyardEntry[]): Promise<void> {
  await storageSet({ [STORAGE_KEYS.graveyard]: entries })
}

export async function readActivityCache(): Promise<ActivityCache> {
  const result = await storageGet<ActivityCache>(STORAGE_KEYS.activityCache)
  const cache = result[STORAGE_KEYS.activityCache]
  if (!cache || typeof cache !== 'object' || Array.isArray(cache)) {
    return {}
  }
  return cache
}

export async function writeActivityCache(cache: ActivityCache): Promise<void> {
  await storageSet({ [STORAGE_KEYS.activityCache]: cache })
}

export async function readLifecycleLog(): Promise<LifecycleLogEntry[]> {
  const result = await storageGet<LifecycleLogEntry[]>(STORAGE_KEYS.lifecycleLog)
  const log = result[STORAGE_KEYS.lifecycleLog]
  return Array.isArray(log) ? log : []
}

export async function writeLifecycleLog(
  entries: LifecycleLogEntry[],
): Promise<void> {
  await storageSet({ [STORAGE_KEYS.lifecycleLog]: entries })
}

export async function readLastRun(): Promise<LastRunSummary | null> {
  const result = await storageGet<LastRunSummary>(STORAGE_KEYS.lastRun)
  const summary = result[STORAGE_KEYS.lastRun]
  if (!summary || typeof summary !== 'object') {
    return null
  }
  return summary
}

export async function writeLastRun(summary: LastRunSummary): Promise<void> {
  await storageSet({ [STORAGE_KEYS.lastRun]: summary })
}
