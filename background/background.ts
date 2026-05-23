import { initialSettings, shouldSeedSettings } from '../lib/defaults/seed'
import { readSettingsRaw, writeSettings } from '../lib/storage/chrome-storage'

export async function seedStorageIfEmpty(): Promise<void> {
  const stored = await readSettingsRaw()
  if (!shouldSeedSettings(stored)) {
    return
  }
  await writeSettings(initialSettings())
}

console.log('tabyard background loaded')

chrome.runtime.onInstalled.addListener(() => {
  void seedStorageIfEmpty().catch((err: unknown) => {
    console.error('tab yard install seed failed', err)
  })
})
