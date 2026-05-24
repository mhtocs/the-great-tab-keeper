import { appendDevLogEntry, normalizeDevLogEntries } from '../logs/dev-log'
import type {
  ActivityCache,
  ArchiveEntry,
  DevLogEntry,
  LastRunSummary,
  Settings,
} from './schema'
import { LEGACY_STORAGE_KEYS, STORAGE_KEYS } from './schema'
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

function normalizeArchiveEntry(raw: unknown): ArchiveEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const entry = raw as Record<string, unknown>
  const id = entry.id
  const url = entry.url
  const title = entry.title
  const archivedAt = entry.archivedAt ?? entry.archivedAt
  const action = entry.action === 'archive' || entry.action === 'archive' ? 'archive' : null
  const ruleText = entry.ruleText
  if (
    typeof id !== 'string' ||
    typeof url !== 'string' ||
    typeof title !== 'string' ||
    typeof archivedAt !== 'number' ||
    action !== 'archive' ||
    typeof ruleText !== 'string'
  ) {
    return null
  }
  const favicon = entry.favicon
  return {
    id,
    url,
    title,
    ...(typeof favicon === 'string' ? { favicon } : {}),
    archivedAt,
    action,
    ruleText,
  }
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

export async function readArchive(): Promise<ArchiveEntry[]> {
  const result = await storageGet<unknown>([
    STORAGE_KEYS.archive,
    LEGACY_STORAGE_KEYS.archive,
  ])
  const raw =
    result[STORAGE_KEYS.archive] ?? result[LEGACY_STORAGE_KEYS.archive]
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .map(normalizeArchiveEntry)
    .filter((entry): entry is ArchiveEntry => entry !== null)
}

export async function writeArchive(entries: ArchiveEntry[]): Promise<void> {
  await storageSet({ [STORAGE_KEYS.archive]: entries })
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

function isDevLogEntry(value: unknown): value is DevLogEntry {
  if (!value || typeof value !== 'object') {
    return false
  }
  const entry = value as DevLogEntry
  return (
    typeof entry.id === 'string' &&
    typeof entry.at === 'number' &&
    typeof entry.message === 'string'
  )
}

export async function readDevLog(): Promise<DevLogEntry[]> {
  const result = await storageGet<unknown>(STORAGE_KEYS.devLog)
  const log = result[STORAGE_KEYS.devLog]
  if (!Array.isArray(log)) {
    return []
  }
  const entries = log.filter(isDevLogEntry)
  const normalized = normalizeDevLogEntries(entries)
  if (normalized.length < entries.length) {
    await writeDevLog(normalized)
  }
  return normalized
}

export async function writeDevLog(entries: DevLogEntry[]): Promise<void> {
  await storageSet({ [STORAGE_KEYS.devLog]: entries })
}

export async function appendDevLog(message: string, atMs = Date.now()): Promise<void> {
  const log = await readDevLog()
  await writeDevLog(appendDevLogEntry(log, message, atMs))
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
