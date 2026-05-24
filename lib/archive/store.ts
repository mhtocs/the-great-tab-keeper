import type { ArchiveEntry } from '../storage/schema'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export const MIN_ARCHIVE_RETENTION_DAYS = 10

export const ARCHIVE_PAGE_SIZE = 15

export function effectiveArchiveRetentionDays(retentionDays: number): number {
  if (!Number.isFinite(retentionDays) || retentionDays < MIN_ARCHIVE_RETENTION_DAYS) {
    return MIN_ARCHIVE_RETENTION_DAYS
  }
  return retentionDays
}

// ac 13: drop entries older than retention window (minimum 10 days)
export function pruneArchiveByRetention(
  entries: ArchiveEntry[],
  retentionDays: number,
  nowMs = Date.now(),
): ArchiveEntry[] {
  const days = effectiveArchiveRetentionDays(retentionDays)
  const cutoff = nowMs - days * MS_PER_DAY
  return entries.filter((entry) => entry.archivedAt >= cutoff)
}
