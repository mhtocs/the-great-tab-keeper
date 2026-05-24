import { isSuspendableUrl, suspendedPageUrl } from '../lib/suspended/suspended-page'
import {
  getSuspendedEntry,
  removeSuspendedEntry,
  setSuspendedEntry,
} from '../lib/suspended/store'
import type { SuspendedTabEntry } from '../lib/suspended/types'
import { readSuspendedTabs, writeSuspendedTabs } from '../lib/storage/chrome-session'
import { updateTabUrl } from './chrome-tabs'

export type SuspendTabInput = {
  tabId: number
  url: string
  title: string
  favicon?: string
}

export async function suspendTabById(input: SuspendTabInput): Promise<boolean> {
  if (!isSuspendableUrl(input.url)) {
    return false
  }

  const entry: SuspendedTabEntry = {
    url: input.url,
    title: input.title,
    favicon: input.favicon,
    suspendedAt: Date.now(),
  }
  const map = await readSuspendedTabs()
  await writeSuspendedTabs(setSuspendedEntry(map, input.tabId, entry))

  const target = chrome.runtime.getURL(suspendedPageUrl(input.tabId))
  await updateTabUrl(input.tabId, target)
  return true
}

export async function restoreSuspendedTab(
  tabId: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const map = await readSuspendedTabs()
  const entry = getSuspendedEntry(map, tabId)
  if (!entry) {
    return { ok: false, error: 'suspended tab not found' }
  }

  await writeSuspendedTabs(removeSuspendedEntry(map, tabId))
  await updateTabUrl(tabId, entry.url)
  return { ok: true }
}

export async function clearSuspendedTab(tabId: number): Promise<void> {
  const map = await readSuspendedTabs()
  if (!getSuspendedEntry(map, tabId)) {
    return
  }
  await writeSuspendedTabs(removeSuspendedEntry(map, tabId))
}
