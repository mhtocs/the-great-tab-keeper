import { describe, expect, it } from 'vitest'
import { checkDestructiveSafety } from '../engine/safety'
import { DEFAULT_RULES } from '../defaults/rules'
import { matchRules, type TabMatchContext } from './matcher'
import { parseRule } from './parser'
import { pickWinner, resolutionReason, resolveWinner } from './precedence'
import { specificityScore } from './specificity'

const ELEVEN_MINUTES_MS = 11 * 60 * 1000

function tab(overrides: Partial<TabMatchContext> = {}): TabMatchContext {
  return {
    url: 'https://example.com/',
    pinned: false,
    audible: false,
    active: false,
    inactiveMs: ELEVEN_MINUTES_MS,
    ...overrides,
  }
}

function winnerAfterMatch(ruleLines: string[], ctx: TabMatchContext) {
  const rules = ruleLines
    .map((line) => parseRule(line))
    .filter((r) => r.ok)
    .map((r) => r.rule)
  const matched = matchRules(rules, ctx)
  const winner = resolveWinner(matched)
  return {
    action: winner?.action,
    reason: winner ? resolutionReason(winner, matched) : undefined,
    matchedCount: matched.length,
  }
}

describe('resolveWinner', () => {
  // ac 8
  it('picks rule with higher specificity score', () => {
    const generic = parseRule('close inactive>2h')
    const specific = parseRule('close inactive>30d url=*youtube.com* pinned=false')
    expect(generic.ok && specific.ok).toBe(true)
    if (generic.ok && specific.ok) {
      const winner = resolveWinner([generic.rule, specific.rule])
      expect(winner?.source).toBe(specific.rule.source)
      expect(specificityScore(specific.rule)).toBe(7)
      expect(specificityScore(generic.rule)).toBe(1)
    }
  })

  it('picks close over sleep when specificity is equal', () => {
    const sleepRule = parseRule('sleep inactive>2h url=*youtube.com*')
    const closeRule = parseRule('close inactive>2h url=*youtube.com*')
    expect(sleepRule.ok && closeRule.ok).toBe(true)
    if (sleepRule.ok && closeRule.ok) {
      const winner = resolveWinner([sleepRule.rule, closeRule.rule])
      expect(winner?.action).toBe('close')
    }
  })

  it('picks sleep over discard when specificity is equal', () => {
    const sleepRule = parseRule('sleep inactive>2h url=*youtube.com*')
    const discardRule = parseRule('discard inactive>2h url=*youtube.com*')
    expect(sleepRule.ok && discardRule.ok).toBe(true)
    if (sleepRule.ok && discardRule.ok) {
      const winner = resolveWinner([sleepRule.rule, discardRule.rule])
      expect(winner?.action).toBe('sleep')
    }
  })

  // ac 9
  it('picks close over discard when specificity is equal', () => {
    const discardRule = parseRule('discard inactive>2h url=*youtube.com*')
    const closeRule = parseRule('close inactive>2h url=*youtube.com*')
    expect(discardRule.ok && closeRule.ok).toBe(true)
    if (discardRule.ok && closeRule.ok) {
      expect(specificityScore(discardRule.rule)).toBe(
        specificityScore(closeRule.rule),
      )
      const winner = resolveWinner([discardRule.rule, closeRule.rule])
      expect(winner?.action).toBe('close')
    }
  })

  it('picks keep over close when specificity is equal', () => {
    const closeRule = parseRule('close url=*docs.google.com*')
    const keepRule = parseRule('keep url=*docs.google.com*')
    expect(closeRule.ok && keepRule.ok).toBe(true)
    if (closeRule.ok && keepRule.ok) {
      const winner = pickWinner(keepRule.rule, closeRule.rule)
      expect(winner.action).toBe('keep')
    }
  })

  it('picks shield keep over more specific close when both match', () => {
    const keep = parseRule('keep pinned=true')
    const close = parseRule('close inactive>10m pinned=true')
    expect(keep.ok && close.ok).toBe(true)
    if (keep.ok && close.ok) {
      expect(specificityScore(close.rule)).toBeGreaterThan(specificityScore(keep.rule))
      const winner = resolveWinner([keep.rule, close.rule])
      expect(winner?.action).toBe('keep')
      expect(resolutionReason(winner!, [keep.rule, close.rule])).toBe('keep protection')
    }
  })

  it('picks more specific close over keep url when both match', () => {
    const keep = parseRule('keep url=google.com')
    const close = parseRule('close inactive>10m url=docs.google.com')
    expect(keep.ok && close.ok).toBe(true)
    if (keep.ok && close.ok) {
      const winner = resolveWinner([keep.rule, close.rule])
      expect(winner?.action).toBe('close')
      expect(resolutionReason(winner!, [keep.rule, close.rule])).toBe('higher specificity')
    }
  })
})

describe('winner after matchRules', () => {
  const keepGoogle = 'keep url=google.com'
  const closeDocs = 'close inactive>10m url=docs.google.com'
  const closeGoogle = 'close inactive>10m url=google.com'
  const closeGoogleGlob = 'close inactive>10m url=*.google.com'

  it('close docs beats keep google on docs tab when inactive', () => {
    const ctx = tab({
      url: 'https://docs.google.com/spreadsheets/d/abc/edit',
      inactiveMs: ELEVEN_MINUTES_MS,
    })
    const result = winnerAfterMatch([keepGoogle, closeDocs], ctx)
    expect(result.matchedCount).toBe(2)
    expect(result.action).toBe('close')
    expect(result.reason).toBe('higher specificity')
  })

  it('keep google protects mail when close only targets docs', () => {
    const ctx = tab({
      url: 'https://mail.google.com/mail/u/0/#inbox',
      inactiveMs: ELEVEN_MINUTES_MS,
    })
    const result = winnerAfterMatch([keepGoogle, closeDocs], ctx)
    expect(result.matchedCount).toBe(1)
    expect(result.action).toBe('keep')
  })

  it('keep google beats close google on mail when both use same url pattern', () => {
    const ctx = tab({
      url: 'https://mail.google.com/mail/u/0/#inbox',
      inactiveMs: ELEVEN_MINUTES_MS,
    })
    const result = winnerAfterMatch([keepGoogle, closeGoogle], ctx)
    expect(result.matchedCount).toBe(2)
    expect(result.action).toBe('keep')
    expect(result.reason).toBe('same url keep')
  })

  it('keep google matches mail when glob close does not', () => {
    const ctx = tab({ url: 'https://mail.google.com/mail/u/0/' })
    const result = winnerAfterMatch([keepGoogle, closeGoogleGlob], ctx)
    expect(result.matchedCount).toBe(1)
    expect(result.action).toBe('keep')
  })

  // ac 4 — default rules: pinned inactive tab resolves to keep, not close
  it('pinned tab with default rules resolves to keep', () => {
    const ctx = tab({ pinned: true, inactiveMs: 5 * 3_600_000 })
    const result = winnerAfterMatch([...DEFAULT_RULES], ctx)
    expect(result.matchedCount).toBeGreaterThanOrEqual(2)
    expect(result.action).toBe('keep')
  })

  it('pinned tab blocked when generic close wins resolution', () => {
    const ctx = tab({ pinned: true, inactiveMs: 5 * 3_600_000 })
    const result = winnerAfterMatch(['close inactive>2h'], ctx)
    expect(result.action).toBe('close')
    const winner = parseRule('close inactive>2h')
    if (!winner.ok) {
      return
    }
    expect(checkDestructiveSafety(ctx, winner.rule)).toEqual({
      allowed: false,
      reason: 'pinned',
    })
  })

  it('pinned tab allowed when close rule declares pinned=true', () => {
    const ctx = tab({ pinned: true, inactiveMs: 3 * 24 * 3_600_000 })
    const result = winnerAfterMatch(['close inactive>2d pinned=true'], ctx)
    expect(result.action).toBe('close')
    const winner = parseRule('close inactive>2d pinned=true')
    if (!winner.ok) {
      return
    }
    expect(checkDestructiveSafety(ctx, winner.rule)).toEqual({ allowed: true })
  })
})

describe('resolutionReason', () => {
  it('reports higher specificity when scores differ', () => {
    const a = parseRule('close inactive>2h')
    const b = parseRule('close inactive>30d url=*youtube.com* pinned=false')
    if (a.ok && b.ok) {
      const winner = resolveWinner([a.rule, b.rule])!
      expect(resolutionReason(winner, [a.rule, b.rule])).toBe('higher specificity')
    }
  })

  it('reports action precedence when scores tie on action', () => {
    const discardRule = parseRule('discard inactive>2h')
    const closeRule = parseRule('close inactive>2h')
    if (discardRule.ok && closeRule.ok) {
      const winner = resolveWinner([discardRule.rule, closeRule.rule])!
      expect(resolutionReason(winner, [discardRule.rule, closeRule.rule])).toBe(
        'action precedence',
      )
    }
  })
})
