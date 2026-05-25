export type EvaluationIntervalMinutes = 1 | 5 | 15 | 30 | 60

export const EVALUATION_INTERVALS: readonly EvaluationIntervalMinutes[] = [
  1, 5, 15, 30, 60,
] as const

// archive = remove + archive store; discard = remove only; suspend = placeholder page; keep = no change
export type LifecycleAction = 'keep' | 'archive' | 'discard' | 'suspend'

export type Settings = {
  engineEnabled: boolean
  evaluationIntervalMinutes: EvaluationIntervalMinutes
  archiveRetentionDays: number
  rules: string[]
}

export type ArchiveEntry = {
  id: string
  url: string
  title: string
  favicon?: string
  archivedAt: number
  action: 'archive'
  ruleText: string
}

export type ActivityCache = Record<string, number>

// plain-text dev log line stored in chrome.storage
export type DevLogEntry = {
  id: string
  at: number
  message: string
}

export type LastRunSummary = {
  at: number
  tabsEvaluated: number
  actionsTaken: number
}

export const STORAGE_KEYS = {
  settings: 'settings',
  archive: 'archive',
  activityCache: 'activityCache',
  devLog: 'devLog',
  lastRun: 'lastRun',
} as const
