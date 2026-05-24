import type { LifecycleAction } from '../storage/schema'
import {
  DURATION_UNITS,
  type DurationUnit,
  type ParseRuleResult,
  type ParsedRule,
  type RuleCondition,
} from './types'

const ACTIONS: readonly LifecycleAction[] = ['keep', 'close', 'discard', 'sleep']

const INACTIVE_RE = /^inactive>(\d+)(m|h|d)$/i
const BOOLEAN_CONDITION_RE = /^(pinned|audible|active|slept)=(true|false)$/i
const URL_RE = /^url=(.+)$/i

export function parseRule(line: string): ParseRuleResult {
  const source = line.trim()
  if (source.length === 0) {
    return { ok: false, error: 'rule cannot be empty', source: line }
  }

  const tokens = source.split(/\s+/)
  const actionToken = tokens[0]?.toLowerCase()

  if (!actionToken || !isLifecycleAction(actionToken)) {
    return {
      ok: false,
      error: `unknown action "${tokens[0] ?? ''}", use keep, close, or discard`,
      source,
    }
  }

  const conditions: RuleCondition[] = []

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i]!
    const parsed = parseConditionToken(token)
    if (!parsed.ok) {
      return { ok: false, error: parsed.error, source }
    }
    conditions.push(parsed.condition)
  }

  return {
    ok: true,
    rule: {
      action: actionToken,
      conditions,
      source,
    },
  }
}

export function parseRules(lines: string[]): {
  ok: true
  rules: ParsedRule[]
} | {
  ok: false
  error: string
  source: string
  index: number
} {
  const rules: ParsedRule[] = []

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!
    const trimmed = line.trim()
    if (trimmed.length === 0) {
      continue
    }

    const result = parseRule(line)
    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        source: result.source,
        index,
      }
    }
    rules.push(result.rule)
  }

  return { ok: true, rules }
}

export function inactiveDurationMs(condition: {
  value: number
  unit: DurationUnit
}): number {
  const { value, unit } = condition
  switch (unit) {
    case 'm':
      return value * 60_000
    case 'h':
      return value * 3_600_000
    case 'd':
      return value * 86_400_000
    default: {
      const _exhaustive: never = unit
      throw new Error(`unsupported duration unit "${String(_exhaustive)}"`)
    }
  }
}

function isLifecycleAction(value: string): value is LifecycleAction {
  return (ACTIONS as readonly string[]).includes(value)
}

function isDurationUnit(value: string): value is DurationUnit {
  return (DURATION_UNITS as readonly string[]).includes(value)
}

function parseConditionToken(
  token: string,
):
  | { ok: true; condition: RuleCondition }
  | { ok: false; error: string } {
  const inactiveMatch = INACTIVE_RE.exec(token)
  if (inactiveMatch) {
    const value = Number(inactiveMatch[1])
    const unitRaw = inactiveMatch[2]!.toLowerCase()
    if (!isDurationUnit(unitRaw)) {
      return {
        ok: false,
        error: 'inactive duration unit must be m, h, or d',
      }
    }
    if (!Number.isInteger(value) || value < 1) {
      return { ok: false, error: 'inactive duration must be a positive integer' }
    }
    const unit = unitRaw
    return {
      ok: true,
      condition: { kind: 'inactive', value, unit },
    }
  }

  const booleanMatch = BOOLEAN_CONDITION_RE.exec(token)
  if (booleanMatch) {
    const kind = booleanMatch[1]!.toLowerCase() as
      | 'pinned'
      | 'audible'
      | 'active'
      | 'slept'
    const value = booleanMatch[2] === 'true'
    return { ok: true, condition: { kind, value } }
  }

  const urlMatch = URL_RE.exec(token)
  if (urlMatch) {
    const pattern = urlMatch[1]!.trim()
    if (pattern.length === 0) {
      return { ok: false, error: 'url pattern cannot be empty' }
    }
    return { ok: true, condition: { kind: 'url', pattern } }
  }

  return {
    ok: false,
    error: `unrecognized condition "${token}"`,
  }
}
