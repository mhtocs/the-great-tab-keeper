import type { ParsedRule, RuleCondition } from '../rules/types'
import type { TabMatchContext } from '../rules/matcher'
import type { LifecycleAction } from '../storage/schema'

export type SafetyBlockReason = 'pinned' | 'audible' | 'active'

export type DestructiveSafetyResult =
  | { allowed: true }
  | { allowed: false; reason: SafetyBlockReason }

const DESTRUCTIVE_ACTIONS: LifecycleAction[] = ['close', 'discard', 'sleep']

export function isDestructiveAction(action: LifecycleAction): boolean {
  return DESTRUCTIVE_ACTIONS.includes(action)
}

function ruleDeclares(
  rule: ParsedRule,
  kind: Extract<RuleCondition['kind'], 'pinned' | 'audible' | 'active'>,
  value: boolean,
): boolean {
  return rule.conditions.some(
    (condition) => condition.kind === kind && condition.value === value,
  )
}

// hard stops before close/discard execute. runs after rule resolution.
// pinned/audible/active: block unless the winning rule declares that flag true.
export function checkDestructiveSafety(
  tab: TabMatchContext,
  winner: ParsedRule | null,
): DestructiveSafetyResult {
  if (!winner || !isDestructiveAction(winner.action)) {
    return { allowed: true }
  }

  if (tab.pinned && !ruleDeclares(winner, 'pinned', true)) {
    return { allowed: false, reason: 'pinned' }
  }

  if (tab.audible && !ruleDeclares(winner, 'audible', true)) {
    return { allowed: false, reason: 'audible' }
  }

  if (tab.active && !ruleDeclares(winner, 'active', true)) {
    return { allowed: false, reason: 'active' }
  }

  return { allowed: true }
}
