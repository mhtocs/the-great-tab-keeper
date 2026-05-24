const UNITS = [
  { ms: 86_400_000, suffix: 'd' },
  { ms: 3_600_000, suffix: 'h' },
  { ms: 60_000, suffix: 'm' },
  { ms: 1_000, suffix: 's' },
] as const

// compact duration: 45s, 12m, 2h, 1d
export function formatDurationShort(ms: number): string {
  const safe = Math.max(0, ms)
  if (safe < 1_000) {
    return '0s'
  }
  for (const unit of UNITS) {
    if (safe >= unit.ms) {
      const amount = Math.floor(safe / unit.ms)
      return `${amount}${unit.suffix}`
    }
  }
  return '0s'
}

// human past time: just now, 2m ago, 1d ago
export function formatTimeAgo(atMs: number, nowMs = Date.now()): string {
  if (!Number.isFinite(atMs) || atMs <= 0) {
    return 'n/a'
  }
  const diff = nowMs - atMs
  if (diff < 15_000) {
    return 'just now'
  }
  return `${formatDurationShort(diff)} ago`
}

// human future time: now, in 45s, in 5m
export function formatTimeUntil(atMs: number | null | undefined, nowMs = Date.now()): string {
  if (atMs === undefined || atMs === null || !Number.isFinite(atMs) || atMs <= 0) {
    return 'n/a'
  }
  const diff = atMs - nowMs
  if (diff <= 0) {
    return 'now'
  }
  if (diff < 1_000) {
    return 'in 1s'
  }
  return `in ${formatDurationShort(diff)}`
}
