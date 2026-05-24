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
    suspended: false,
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
    const generic = parseRule('archive inactive>2h')
    const specific = parseRule('archive inactive>30d url=*youtube.com* pinned=false')
    expect(generic.ok && specific.ok).toBe(true)
    if (generic.ok && specific.ok) {
      const winner = resolveWinner([generic.rule, specific.rule])
      expect(winner?.source).toBe(specific.rule.source)
      expect(specificityScore(specific.rule)).toBe(7)
      expect(specificityScore(generic.rule)).toBe(1)
    }
  })

  it('picks archive over suspend when specificity is equal', () => {
    const suspendRule = parseRule('suspend inactive>2h url=*youtube.com*')
    const archiveRule = parseRule('archive inactive>2h url=*youtube.com*')
    expect(suspendRule.ok && archiveRule.ok).toBe(true)
    if (suspendRule.ok && archiveRule.ok) {
      const winner = resolveWinner([suspendRule.rule, archiveRule.rule])
      expect(winner?.action).toBe('archive')
    }
  })

  it('picks suspend over discard when specificity is equal', () => {
    const suspendRule = parseRule('suspend inactive>2h url=*youtube.com*')
    const discardRule = parseRule('discard inactive>2h url=*youtube.com*')
    expect(suspendRule.ok && discardRule.ok).toBe(true)
    if (suspendRule.ok && discardRule.ok) {
      const winner = resolveWinner([suspendRule.rule, discardRule.rule])
      expect(winner?.action).toBe('suspend')
    }
  })

  // ac 9
  it('picks archive over discard when specificity is equal', () => {
    const discardRule = parseRule('discard inactive>2h url=*youtube.com*')
    const archiveRule = parseRule('archive inactive>2h url=*youtube.com*')
    expect(discardRule.ok && archiveRule.ok).toBe(true)
    if (discardRule.ok && archiveRule.ok) {
      expect(specificityScore(discardRule.rule)).toBe(
        specificityScore(archiveRule.rule),
      )
      const winner = resolveWinner([discardRule.rule, archiveRule.rule])
      expect(winner?.action).toBe('archive')
    }
  })

  it('picks keep over archive when specificity is equal', () => {
    const archiveRule = parseRule('archive url=*docs.google.com*')
    const keepRule = parseRule('keep url=*docs.google.com*')
    expect(archiveRule.ok && keepRule.ok).toBe(true)
    if (archiveRule.ok && keepRule.ok) {
      const winner = pickWinner(keepRule.rule, archiveRule.rule)
      expect(winner.action).toBe('keep')
    }
  })

  it('picks shield keep over more specific archive when both match', () => {
    const keep = parseRule('keep pinned=true')
    const archive = parseRule('archive inactive>10m pinned=true')
    expect(keep.ok && archive.ok).toBe(true)
    if (keep.ok && archive.ok) {
      expect(specificityScore(archive.rule)).toBeGreaterThan(specificityScore(keep.rule))
      const winner = resolveWinner([keep.rule, archive.rule])
      expect(winner?.action).toBe('keep')
      expect(resolutionReason(winner!, [keep.rule, archive.rule])).toBe('keep protection')
    }
  })

  it('picks more specific archive over keep url when both match', () => {
    const keep = parseRule('keep url=google.com')
    const archive = parseRule('archive inactive>10m url=docs.google.com')
    expect(keep.ok && archive.ok).toBe(true)
    if (keep.ok && archive.ok) {
      const winner = resolveWinner([keep.rule, archive.rule])
      expect(winner?.action).toBe('archive')
      expect(resolutionReason(winner!, [keep.rule, archive.rule])).toBe('higher specificity')
    }
  })
})

describe('winner after matchRules', () => {
  const keepGoogle = 'keep url=google.com'
  const closeDocs = 'archive inactive>10m url=docs.google.com'
  const closeGoogle = 'archive inactive>10m url=google.com'
  const closeGoogleGlob = 'archive inactive>10m url=*.google.com'

  it('archive docs beats keep google on docs tab when inactive', () => {
    const ctx = tab({
      url: 'https://docs.google.com/spreadsheets/d/abc/edit',
      inactiveMs: ELEVEN_MINUTES_MS,
    })
    const result = winnerAfterMatch([keepGoogle, closeDocs], ctx)
    expect(result.matchedCount).toBe(2)
    expect(result.action).toBe('archive')
    expect(result.reason).toBe('higher specificity')
  })

  it('keep google protects mail when archive only targets docs', () => {
    const ctx = tab({
      url: 'https://mail.google.com/mail/u/0/#inbox',
      inactiveMs: ELEVEN_MINUTES_MS,
    })
    const result = winnerAfterMatch([keepGoogle, closeDocs], ctx)
    expect(result.matchedCount).toBe(1)
    expect(result.action).toBe('keep')
  })

  it('keep google beats archive google on mail when both use same url pattern', () => {
    const ctx = tab({
      url: 'https://mail.google.com/mail/u/0/#inbox',
      inactiveMs: ELEVEN_MINUTES_MS,
    })
    const result = winnerAfterMatch([keepGoogle, closeGoogle], ctx)
    expect(result.matchedCount).toBe(2)
    expect(result.action).toBe('keep')
    expect(result.reason).toBe('same url keep')
  })

  it('keep google matches mail when glob archive does not', () => {
    const ctx = tab({ url: 'https://mail.google.com/mail/u/0/' })
    const result = winnerAfterMatch([keepGoogle, closeGoogleGlob], ctx)
    expect(result.matchedCount).toBe(1)
    expect(result.action).toBe('keep')
  })

  // ac 4: default rules, pinned inactive tab resolves to keep, not archive
  it('pinned tab with default rules resolves to keep', () => {
    const ctx = tab({ pinned: true, inactiveMs: 5 * 3_600_000 })
    const result = winnerAfterMatch([...DEFAULT_RULES], ctx)
    expect(result.matchedCount).toBeGreaterThanOrEqual(2)
    expect(result.action).toBe('keep')
  })

  it('pinned tab blocked when generic archive wins resolution', () => {
    const ctx = tab({ pinned: true, inactiveMs: 5 * 3_600_000 })
    const result = winnerAfterMatch(['archive inactive>2h'], ctx)
    expect(result.action).toBe('archive')
    const winner = parseRule('archive inactive>2h')
    if (!winner.ok) {
      return
    }
    expect(checkDestructiveSafety(ctx, winner.rule)).toEqual({
      allowed: false,
      reason: 'pinned',
    })
  })

  it('pinned tab allowed when archive rule declares pinned=true', () => {
    const ctx = tab({ pinned: true, inactiveMs: 3 * 24 * 3_600_000 })
    const result = winnerAfterMatch(['archive inactive>2d pinned=true'], ctx)
    expect(result.action).toBe('archive')
    const winner = parseRule('archive inactive>2d pinned=true')
    if (!winner.ok) {
      return
    }
    expect(checkDestructiveSafety(ctx, winner.rule)).toEqual({ allowed: true })
  })
})

describe('resolutionReason', () => {
  it('reports higher specificity when scores differ', () => {
    const a = parseRule('archive inactive>2h')
    const b = parseRule('archive inactive>30d url=*youtube.com* pinned=false')
    if (a.ok && b.ok) {
      const winner = resolveWinner([a.rule, b.rule])!
      expect(resolutionReason(winner, [a.rule, b.rule])).toBe('higher specificity')
    }
  })

  it('reports action precedence when scores tie on action', () => {
    const discardRule = parseRule('discard inactive>2h')
    const archiveRule = parseRule('archive inactive>2h')
    if (discardRule.ok && archiveRule.ok) {
      const winner = resolveWinner([discardRule.rule, archiveRule.rule])!
      expect(resolutionReason(winner, [discardRule.rule, archiveRule.rule])).toBe(
        'action precedence',
      )
    }
  })
})
