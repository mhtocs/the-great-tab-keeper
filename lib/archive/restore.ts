import type { ArchiveEntry } from '../storage/schema'

export type RestorePorts = {
  openTab: (url: string) => Promise<number | undefined>
}

export type RestoreArchiveResult =
  | { ok: true; tabId: number; entries: ArchiveEntry[] }
  | { ok: false; error: string; entries: ArchiveEntry[] }

// ac 3: open tab at saved url and remove entry from archive
export async function restoreArchiveEntry(
  ports: RestorePorts,
  entries: ArchiveEntry[],
  entryId: string,
): Promise<RestoreArchiveResult> {
  const entry = entries.find((item) => item.id === entryId)
  if (!entry) {
    return { ok: false, error: 'archive entry not found', entries }
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
