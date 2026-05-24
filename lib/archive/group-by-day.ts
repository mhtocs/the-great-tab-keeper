import type { ArchiveEntry } from '../storage/schema'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export type ArchiveDayGroup = {
  dayKey: string
  label: string
  entries: ArchiveEntry[]
}

function archiveDayKey(archivedAtMs: number): string {
  const date = new Date(archivedAtMs)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function archiveDayLabel(dayKey: string, nowMs: number): string {
  const todayKey = archiveDayKey(nowMs)
  const yesterdayKey = archiveDayKey(nowMs - MS_PER_DAY)
  if (dayKey === todayKey) {
    return 'today'
  }
  if (dayKey === yesterdayKey) {
    return 'yesterday'
  }
  const [y, m, d] = dayKey.split('-').map(Number)
  return new Date(y!, m! - 1, d!).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function groupArchiveEntriesByDay(
  entries: ArchiveEntry[],
  nowMs = Date.now(),
): ArchiveDayGroup[] {
  const byDay = new Map<string, ArchiveEntry[]>()

  for (const entry of entries) {
    const key = archiveDayKey(entry.archivedAt)
    const bucket = byDay.get(key)
    if (bucket) {
      bucket.push(entry)
    } else {
      byDay.set(key, [entry])
    }
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dayKey, dayEntries]) => ({
      dayKey,
      label: archiveDayLabel(dayKey, nowMs),
      entries: [...dayEntries].sort((a, b) => b.archivedAt - a.archivedAt),
    }))
}
