import { groupArchiveEntriesByDay } from '@/lib/archive/group-by-day'
import { ARCHIVE_PAGE_SIZE, effectiveArchiveRetentionDays } from '@/lib/archive/store'
import type { ArchiveEntry } from '@/lib/storage/schema'
import { readArchive, readSettings } from '@/lib/storage/chrome-storage'
import { useLocalStorageKeys } from './use-local-storage'
import { computed, onMounted, ref, watch } from 'vue'

type RestoreResult =
  | { ok: true; tabId: number; entries: ArchiveEntry[] }
  | { ok: false; error: string; entries: ArchiveEntry[] }

export function useArchive() {
  const entries = ref<ArchiveEntry[]>([])
  const retentionDays = ref(90)
  const loading = ref(true)
  const restoreError = ref<string | null>(null)
  const page = ref(1)

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(entries.value.length / ARCHIVE_PAGE_SIZE)),
  )

  const groupedEntries = computed(() => {
    const start = (page.value - 1) * ARCHIVE_PAGE_SIZE
    const slice = entries.value.slice(start, start + ARCHIVE_PAGE_SIZE)
    return groupArchiveEntriesByDay(slice)
  })

  const hintLine = computed(() => {
    const kept = effectiveArchiveRetentionDays(retentionDays.value)
    const total = entries.value.length
    if (total === 0) {
      return `kept ${kept} days, click a tab to reopen`
    }
    const start = (page.value - 1) * ARCHIVE_PAGE_SIZE + 1
    const end = Math.min(page.value * ARCHIVE_PAGE_SIZE, total)
    return `kept ${kept} days, showing ${start}-${end} of ${total}, click a tab to reopen`
  })

  function clampPage() {
    if (page.value > totalPages.value) {
      page.value = totalPages.value
    }
    if (page.value < 1) {
      page.value = 1
    }
  }

  watch(totalPages, clampPage)

  async function load() {
    loading.value = true
    const [archive, settings] = await Promise.all([readArchive(), readSettings()])
    entries.value = [...archive].sort((a, b) => b.archivedAt - a.archivedAt)
    retentionDays.value = settings.archiveRetentionDays
    clampPage()
    loading.value = false
  }

  onMounted(() => {
    void load()
  })

  useLocalStorageKeys(['archive', 'graveyard'], load)

  function goToPage(next: number) {
    page.value = Math.min(Math.max(1, next), totalPages.value)
  }

  async function restoreEntry(entryId: string): Promise<boolean> {
    restoreError.value = null
    const result = (await chrome.runtime.sendMessage({
      type: 'restore-archive',
      entryId,
    })) as RestoreResult

    if (!result?.ok) {
      restoreError.value = result?.error ?? 'restore failed'
      return false
    }

    entries.value = [...result.entries].sort((a, b) => b.archivedAt - a.archivedAt)
    clampPage()
    return true
  }

  return {
    groupedEntries,
    hintLine,
    loading,
    restoreError,
    restoreEntry,
    page,
    totalPages,
    goToPage,
    pageSize: ARCHIVE_PAGE_SIZE,
  }
}
