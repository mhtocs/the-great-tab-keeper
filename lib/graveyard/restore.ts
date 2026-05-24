import type { GraveyardEntry } from '../storage/schema'

export type RestorePorts = {
  openTab: (url: string) => Promise<number | undefined>
}

export type RestoreGraveyardResult =
  | { ok: true; tabId: number; entries: GraveyardEntry[] }
  | { ok: false; error: string; entries: GraveyardEntry[] }

// ac 3: open tab at saved url and remove entry from graveyard
export async function restoreGraveyardEntry(
  ports: RestorePorts,
  entries: GraveyardEntry[],
  entryId: string,
): Promise<RestoreGraveyardResult> {
  const entry = entries.find((item) => item.id === entryId)
  if (!entry) {
    return { ok: false, error: 'graveyard entry not found', entries }
  }

  if (entry.url.length === 0) {
    return { ok: false, error: 'entry has no url', entries }
  }

  const tabId = await ports.openTab(entry.url)
  if (tabId === undefined) {
    return { ok: false, error: 'could not open tab', entries }
  }

  return {
    ok: true,
    tabId,
    entries: entries.filter((item) => item.id !== entryId),
  }
}
