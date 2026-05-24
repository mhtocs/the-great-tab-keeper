import { formatDashboardStatLines } from '@/lib/engine/cycle-stats'
import { EVALUATION_ALARM_NAME } from '@/lib/engine/scheduler'
import { readArchive, readLastRun, readSettings } from '@/lib/storage/chrome-storage'
import { useLocalStorageKeys } from './use-local-storage'
import { computed, onMounted, onUnmounted, ref } from 'vue'

function readNextAlarmAtMs(): Promise<number | undefined> {
  return new Promise((resolve) => {
    chrome.alarms.get(EVALUATION_ALARM_NAME, (alarm) => {
      if (chrome.runtime.lastError) {
        resolve(undefined)
        return
      }
      resolve(alarm?.scheduledTime)
    })
  })
}

export function useCycleStats() {
  const nowMs = ref(Date.now())
  const settings = ref<Awaited<ReturnType<typeof readSettings>> | null>(null)
  const lastRun = ref<Awaited<ReturnType<typeof readLastRun>>>(null)
  const archiveCount = ref(0)
  const nextAlarmAtMs = ref<number | undefined>(undefined)
  const loading = ref(true)

  const statLines = computed(() => {
    if (!settings.value) {
      return []
    }
    return formatDashboardStatLines({
      settings: settings.value,
      lastRun: lastRun.value,
      archiveCount: archiveCount.value,
      nextAlarmAtMs: nextAlarmAtMs.value,
      nowMs: nowMs.value,
    })
  })

  async function load() {
    loading.value = true
    const [archive, storedSettings, storedLastRun, alarmAt] = await Promise.all([
      readArchive(),
      readSettings(),
      readLastRun(),
      readNextAlarmAtMs(),
    ])
    archiveCount.value = archive.length
    settings.value = storedSettings
    lastRun.value = storedLastRun
    nextAlarmAtMs.value = alarmAt
    loading.value = false
  }

  let clock: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    void load()
    clock = setInterval(() => {
      nowMs.value = Date.now()
    }, 1_000)
  })

  onUnmounted(() => {
    if (clock !== undefined) {
      clearInterval(clock)
    }
  })

  useLocalStorageKeys(['archive', 'archive', 'settings', 'lastRun'], load)

  return { statLines, loading }
}
