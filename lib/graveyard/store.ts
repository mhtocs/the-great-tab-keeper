import type { GraveyardEntry } from '../storage/schema'

const MS_PER_DAY = 24 * 60 * 60 * 1000

export const MIN_GRAVEYARD_RETENTION_DAYS = 10

export function effectiveGraveyardRetentionDays(retentionDays: number): number {
  if (!Number.isFinite(retentionDays) || retentionDays < MIN_GRAVEYARD_RETENTION_DAYS) {
    return MIN_GRAVEYARD_RETENTION_DAYS
  }
  return retentionDays
}

// ac 13: drop entries older than retention window (minimum 10 days)
export function pruneGraveyardByRetention(
  entries: GraveyardEntry[],
  retentionDays: number,
  nowMs = Date.now(),
): GraveyardEntry[] {
  const days = effectiveGraveyardRetentionDays(retentionDays)
  const cutoff = nowMs - days * MS_PER_DAY
  return entries.filter((entry) => entry.closedAt >= cutoff)
}
