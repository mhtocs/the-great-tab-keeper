import type { SleptTabMap } from '../slept/types'

const SLEPT_TABS_KEY = 'sleptTabs'

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

export async function readSleptTabs(): Promise<SleptTabMap> {
  const result = await sessionGet<SleptTabMap>(SLEPT_TABS_KEY)
  return result[SLEPT_TABS_KEY] ?? {}
}

export async function writeSleptTabs(map: SleptTabMap): Promise<void> {
  await sessionSet({ [SLEPT_TABS_KEY]: map })
}
