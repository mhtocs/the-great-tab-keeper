import { restoreArchiveEntry } from '../lib/archive/restore'
import { appendDevLog, readArchive, writeArchive } from '../lib/storage/chrome-storage'

function openTab(url: string): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url, active: true }, (tab) => {
      const err = chrome.runtime.lastError
      if (err) {
        reject(new Error(err.message))
        return
      }
      resolve(tab?.id)
    })
  })
}

const restorePorts = { openTab }

export async function restoreFromArchive(entryId: string) {
  const entries = await readArchive()
  const entry = entries.find((item) => item.id === entryId)
  const result = await restoreArchiveEntry(restorePorts, entries, entryId)
  if (result.ok && entry) {
    await writeArchive(result.entries)
    await appendDevLog(`restored, ${entry.title || 'untitled'}, ${entry.url}`)
  }
  return result
}
