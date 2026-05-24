import { groupGraveyardEntriesByDay } from '@/lib/graveyard/group-by-day'
import { effectiveGraveyardRetentionDays } from '@/lib/graveyard/store'
import type { GraveyardEntry } from '@/lib/storage/schema'
import { readGraveyard, readSettings } from '@/lib/storage/chrome-storage'
import { useLocalStorageKeys } from './use-local-storage'
import { computed, onMounted, ref } from 'vue'

type RestoreResult =
  | { ok: true; tabId: number; entries: GraveyardEntry[] }
  | { ok: false; error: string; entries: GraveyardEntry[] }

export function useGraveyard() {
  const entries = ref<GraveyardEntry[]>([])
  const retentionDays = ref(90)
  const loading = ref(true)
  const restoreError = ref<string | null>(null)

  const groupedEntries = computed(() => groupGraveyardEntriesByDay(entries.value))

  const hintLine = computed(() => {
    const kept = effectiveGraveyardRetentionDays(retentionDays.value)
    return `kept ${kept} days, click a tab to reopen`
  })

  async function load() {
    loading.value = true
    const [graveyard, settings] = await Promise.all([readGraveyard(), readSettings()])
    entries.value = [...graveyard].sort((a, b) => b.closedAt - a.closedAt)
    retentionDays.value = settings.graveyardRetentionDays
    loading.value = false
  }

  onMounted(() => {
    void load()
  })

  useLocalStorageKeys(['graveyard'], load)

  async function restoreEntry(entryId: string): Promise<boolean> {
    restoreError.value = null
    const result = (await chrome.runtime.sendMessage({
      type: 'restore-graveyard',
      entryId,
    })) as RestoreResult

    if (!result?.ok) {
      restoreError.value = result?.error ?? 'restore failed'
      return false
    }

    entries.value = [...result.entries].sort((a, b) => b.closedAt - a.closedAt)
    return true
  }

  return {
    groupedEntries,
    hintLine,
    loading,
    restoreError,
    restoreEntry,
  }
}
