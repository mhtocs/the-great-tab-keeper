import { checkDestructiveSafety } from './safety'
import { matchRules, type TabMatchContext } from '../rules/matcher'
import { resolutionReason, resolveWinner } from '../rules/precedence'
import type { ParsedRule } from '../rules/types'
import type { LifecycleAction } from '../storage/schema'

export type TabEvaluationInput = TabMatchContext & {
  tabId: number
  url: string
  title: string
  discarded: boolean
  // epoch ms, best known last time tab was active
  lastAccessedMs: number
}

export type TabEvaluationOutcome = {
  matchedRules: ParsedRule[]
  winner: ParsedRule | null
  resolvedAction: LifecycleAction | null
  resolutionReason: string
  executed: boolean
  blockReason?: string
}

export function evaluateTab(
  rules: ParsedRule[],
  tab: TabEvaluationInput,
): TabEvaluationOutcome {
  const matchedRules = matchRules(rules, tab)
  const winner = resolveWinner(matchedRules)

  if (!winner) {
    return {
      matchedRules,
      winner: null,
      resolvedAction: null,
      resolutionReason: 'no matching rules',
      executed: false,
    }
  }

  const reason = resolutionReason(winner, matchedRules)
  const resolvedAction = winner.action

  if (resolvedAction === 'keep') {
    return {
      matchedRules,
      winner,
      resolvedAction,
      resolutionReason: reason,
      executed: false,
    }
  }

  const safety = checkDestructiveSafety(tab, winner)
  if (!safety.allowed) {
    return {
      matchedRules,
      winner,
      resolvedAction,
      resolutionReason: reason,
      executed: false,
      blockReason: safety.reason,
    }
  }

  if (resolvedAction === 'sleep' && tab.discarded) {
    return {
      matchedRules,
      winner,
      resolvedAction,
      resolutionReason: reason,
      executed: false,
      blockReason: 'discarded',
    }
  }

  if (resolvedAction === 'sleep' && tab.slept) {
    return {
      matchedRules,
      winner,
      resolvedAction,
      resolutionReason: reason,
      executed: false,
      blockReason: 'slept',
    }
  }

  return {
    matchedRules,
    winner,
    resolvedAction,
    resolutionReason: reason,
    executed: true,
  }
}
