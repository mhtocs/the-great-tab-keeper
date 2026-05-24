export type EvaluationIntervalMinutes = 1 | 5 | 15 | 30 | 60

export const EVALUATION_INTERVALS: readonly EvaluationIntervalMinutes[] = [
  1, 5, 15, 30, 60,
] as const

// close = remove + graveyard; discard = remove only; sleep = chrome discard; keep = no change
export type LifecycleAction = 'keep' | 'close' | 'discard' | 'sleep'

export type Settings = {
  engineEnabled: boolean
  evaluationIntervalMinutes: EvaluationIntervalMinutes
  graveyardRetentionDays: number
  rules: string[]
}

export type GraveyardEntry = {
  id: string
  url: string
  title: string
  favicon?: string
  closedAt: number
  action: 'close'
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
  graveyard: 'graveyard',
  activityCache: 'activityCache',
  devLog: 'devLog',
  lastRun: 'lastRun',
} as const
