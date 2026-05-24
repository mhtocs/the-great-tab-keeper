import { isSleepableUrl, sleptPageUrl } from '../lib/slept/slept-page'
import { getSleptEntry, removeSleptEntry, setSleptEntry } from '../lib/slept/store'
import type { SleptTabEntry } from '../lib/slept/types'
import { readSleptTabs, writeSleptTabs } from '../lib/storage/chrome-session'
import { updateTabUrl } from './chrome-tabs'

export type SleepTabInput = {
  tabId: number
  url: string
  title: string
  favicon?: string
}

export async function sleepTabById(input: SleepTabInput): Promise<boolean> {
  if (!isSleepableUrl(input.url)) {
    return false
  }

  const entry: SleptTabEntry = {
    url: input.url,
    title: input.title,
    favicon: input.favicon,
    sleptAt: Date.now(),
  }
  const map = await readSleptTabs()
  await writeSleptTabs(setSleptEntry(map, input.tabId, entry))

  const target = chrome.runtime.getURL(sleptPageUrl(input.tabId))
  await updateTabUrl(input.tabId, target)
  return true
}

export async function restoreSleptTab(
  tabId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const map = await readSleptTabs()
  const entry = getSleptEntry(map, tabId)
  if (!entry) {
    return { ok: false, error: 'slept tab not found' }
  }

  await writeSleptTabs(removeSleptEntry(map, tabId))
  await updateTabUrl(tabId, entry.url)
  return { ok: true }
}

export async function clearSleptTab(tabId: number): Promise<void> {
  const map = await readSleptTabs()
  if (!getSleptEntry(map, tabId)) {
    return
  }
  await writeSleptTabs(removeSleptEntry(map, tabId))
}
