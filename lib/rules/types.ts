import type { LifecycleAction } from '../storage/schema'

export const DURATION_UNITS = ['m', 'h', 'd'] as const

export type DurationUnit = (typeof DURATION_UNITS)[number]

export type InactiveCondition = {
  kind: 'inactive'
  value: number
  unit: DurationUnit
}

export type BooleanTabCondition = {
  kind: 'pinned' | 'audible' | 'active' | 'slept'
  value: boolean
}

export type UrlCondition = {
  kind: 'url'
  pattern: string
}

export type RuleCondition =
  | InactiveCondition
  | BooleanTabCondition
  | UrlCondition

export type ParsedRule = {
  action: LifecycleAction
  conditions: RuleCondition[]
  source: string
}

export type ParseRuleSuccess = {
  ok: true
  rule: ParsedRule
}

export type ParseRuleFailure = {
  ok: false
  error: string
  source: string
}

export type ParseRuleResult = ParseRuleSuccess | ParseRuleFailure
