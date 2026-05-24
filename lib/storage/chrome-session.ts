import type { SuspendedTabEntry, SuspendedTabMap } from '../suspended/types'

const SUSPENDED_TABS_KEY = 'suspendedTabs'
const LEGACY_SLEPT_TABS_KEY = 'sleptTabs'

function sessionGet<T>(keys: string | string[]): Promise<Record<string, T>> {
  return new Promise((resolve, reject) => {
    chrome.storage.session.get(keys, (result) => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(new Error(err.message))
        return
      }
      resolve(result as Record<string, T>)
    })
  })
}

function sessionSet(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.session.set(items, () => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(new Error(err.message))
        return
      }
      resolve()
    })
  })
}

function normalizeSuspendedEntry(raw: unknown): SuspendedTabEntry | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const entry = raw as Record<string, unknown>
  const url = entry.url
  const title = entry.title
  const suspendedAt = entry.suspendedAt ?? entry.sleptAt
  if (typeof url !== 'string' || typeof title !== 'string' || typeof suspendedAt !== 'number') {
    return null
  }
  const favicon = entry.favicon
  return {
    url,
    title,
    ...(typeof favicon === 'string' ? { favicon } : {}),
    suspendedAt,
  }
}

function normalizeSuspendedMap(raw: unknown): SuspendedTabMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }
  const map: SuspendedTabMap = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const entry = normalizeSuspendedEntry(value)
    if (entry) {
      map[key] = entry
    }
  }
  return map
}

export async function readSuspendedTabs(): Promise<SuspendedTabMap> {
  const result = await sessionGet<unknown>([SUSPENDED_TABS_KEY, LEGACY_SLEPT_TABS_KEY])
  const raw = result[SUSPENDED_TABS_KEY] ?? result[LEGACY_SLEPT_TABS_KEY]
  return normalizeSuspendedMap(raw)
}

export async function writeSuspendedTabs(map: SuspendedTabMap): Promise<void> {
  await sessionSet({ [SUSPENDED_TABS_KEY]: map })
}
