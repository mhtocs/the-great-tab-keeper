import { inactiveDurationMs } from './parser'
import { globMatch } from './glob'
import type { ParsedRule, RuleCondition } from './types'

export type TabMatchContext = {
  url: string
  pinned: boolean
  audible: boolean
  active: boolean
  suspended: boolean
  // milliseconds since the tab was last active
  inactiveMs: number
}

export function ruleMatches(rule: ParsedRule, tab: TabMatchContext): boolean {
  if (rule.conditions.length === 0) {
    return true
  }
  return rule.conditions.every((condition) =>
    conditionMatches(condition, tab),
  )
}

export function matchRules(
  rules: ParsedRule[],
  tab: TabMatchContext,
): ParsedRule[] {
  return rules.filter((rule) => ruleMatches(rule, tab))
}

function conditionMatches(
  condition: RuleCondition,
  tab: TabMatchContext,
): boolean {
  switch (condition.kind) {
    case 'inactive':
      return (
        tab.inactiveMs >
        inactiveDurationMs({ value: condition.value, unit: condition.unit })
      )
    case 'pinned':
      return tab.pinned === condition.value
    case 'audible':
      return tab.audible === condition.value
    case 'active':
      return tab.active === condition.value
    case 'suspended':
      return tab.suspended === condition.value
    case 'url':
      return globMatch(condition.pattern, tab.url, { ignoreCase: true })
    default: {
      const _exhaustive: never = condition
      return _exhaustive
    }
  }
}
