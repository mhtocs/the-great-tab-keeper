import type { LifecycleAction } from '../storage/schema'
import { isDestructiveAction } from '../engine/safety'
import type { ParsedRule } from './types'
import { specificityScore } from './specificity'

// higher rank wins when specificity is tied (keep > close > sleep > discard)
const ACTION_RANK: Record<LifecycleAction, number> = {
  keep: 4,
  close: 3,
  sleep: 2,
  discard: 1,
}

// tab-state-only keeps (e.g. pinned=true) shield all close/discard; url/inactive keeps compete on score
export function urlPattern(rule: ParsedRule): string | undefined {
  for (const condition of rule.conditions) {
    if (condition.kind === 'url') {
      return condition.pattern.toLowerCase()
    }
  }
  return undefined
}

export function sameUrlPattern(a: ParsedRule, b: ParsedRule): boolean {
  const patternA = urlPattern(a)
  const patternB = urlPattern(b)
  return patternA !== undefined && patternA === patternB
}

export function isShieldKeep(rule: ParsedRule): boolean {
  if (rule.action !== 'keep') {
    return false
  }
  return !rule.conditions.some(
    (condition) => condition.kind === 'url' || condition.kind === 'inactive',
  )
}

export function resolveWinner(rules: ParsedRule[]): ParsedRule | null {
  if (rules.length === 0) {
    return null
  }

  const keeps = rules.filter((rule) => rule.action === 'keep')
  const shieldKeeps = keeps.filter(isShieldKeep)
  const competingKeeps = keeps.filter((rule) => !isShieldKeep(rule))

  if (shieldKeeps.length > 0 && competingKeeps.length === 0) {
    return pickHighestSpecificity(shieldKeeps)
  }

  const winner = pickHighestSpecificity(rules, pickByActionPrecedence)
  return preferKeepWhenSameUrlPattern(winner, rules)
}

// same url= on keep and close: keep wins; narrower url on close still beats broader keep
function preferKeepWhenSameUrlPattern(
  winner: ParsedRule,
  candidates: ParsedRule[],
): ParsedRule {
  if (!isDestructiveAction(winner.action)) {
    return winner
  }

  const sameUrlKeeps = candidates.filter(
    (rule) => rule.action === 'keep' && sameUrlPattern(rule, winner),
  )
  if (sameUrlKeeps.length === 0) {
    return winner
  }

  return pickHighestSpecificity(sameUrlKeeps)
}

function pickHighestSpecificity(
  rules: ParsedRule[],
  tieBreak: (a: ParsedRule, b: ParsedRule) => ParsedRule = pickByActionPrecedence,
): ParsedRule {
  let winner = rules[0]!
  for (let i = 1; i < rules.length; i++) {
    winner = pickBySpecificity(winner, rules[i]!, tieBreak)
  }
  return winner
}

function pickBySpecificity(
  a: ParsedRule,
  b: ParsedRule,
  tieBreak: (a: ParsedRule, b: ParsedRule) => ParsedRule,
): ParsedRule {
  const scoreA = specificityScore(a)
  const scoreB = specificityScore(b)

  if (scoreA > scoreB) {
    return a
  }
  if (scoreB > scoreA) {
    return b
  }

  return tieBreak(a, b)
}

// destructive rules only: specificity first, then keep > close > sleep > discard
export function pickWinner(a: ParsedRule, b: ParsedRule): ParsedRule {
  return pickBySpecificity(a, b, pickByActionPrecedence)
}

function pickByActionPrecedence(a: ParsedRule, b: ParsedRule): ParsedRule {
  return ACTION_RANK[a.action] >= ACTION_RANK[b.action] ? a : b
}

export type ResolutionReason =
  | 'single match'
  | 'higher specificity'
  | 'action precedence'
  | 'keep protection'
  | 'same url keep'

export function resolutionReason(
  winner: ParsedRule,
  candidates: ParsedRule[],
): ResolutionReason {
  if (candidates.length <= 1) {
    return 'single match'
  }

  const destructive = candidates.filter((rule) => rule.action !== 'keep')
  if (winner.action === 'keep' && destructive.length > 0) {
    const bestDestructive = pickHighestSpecificity(destructive)
    if (sameUrlPattern(winner, bestDestructive)) {
      return 'same url keep'
    }
    if (isShieldKeep(winner)) {
      return 'keep protection'
    }
  }

  const winnerScore = specificityScore(winner)
  const tiedByScore = candidates.filter(
    (rule) => specificityScore(rule) === winnerScore,
  )

  if (
    tiedByScore.length > 1 &&
    tiedByScore.some((rule) => rule.action !== winner.action)
  ) {
    return 'action precedence'
  }

  return 'higher specificity'
}
