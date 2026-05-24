import { describe, expect, it } from 'vitest'
import { parseRule } from './parser'
import { matchRules, ruleMatches, type TabMatchContext } from './matcher'

function tab(overrides: Partial<TabMatchContext> = {}): TabMatchContext {
  return {
    url: 'https://example.com/page',
    pinned: false,
    audible: false,
    active: false,
    suspended: false,
    inactiveMs: 3 * 3_600_000,
    ...overrides,
  }
}

describe('ruleMatches inactive', () => {
  it('matches when tab inactive longer than threshold', () => {
    const rule = parseRule('archive inactive>2h')
    expect(rule.ok && ruleMatches(rule.rule, tab({ inactiveMs: 3 * 3_600_000 }))).toBe(
      true,
    )
  })

  it('does not match when tab inactive shorter than threshold', () => {
    const rule = parseRule('archive inactive>2h')
    expect(rule.ok && ruleMatches(rule.rule, tab({ inactiveMs: 3_600_000 }))).toBe(
      false,
    )
  })
})

describe('ruleMatches url', () => {
  // ac 16: glob on full url, case-insensitive
  it('matches youtube url pattern', () => {
    const rule = parseRule('archive url=*youtube.com* inactive>1h')
    expect(
      rule.ok &&
        ruleMatches(rule.rule, tab({ url: 'https://music.youtube.com/watch?v=1' })),
    ).toBe(true)
  })

  it('does not match unrelated url', () => {
    const rule = parseRule('archive url=*youtube.com* inactive>1h')
    expect(
      rule.ok && ruleMatches(rule.rule, tab({ url: 'https://example.com/' })),
    ).toBe(false)
  })

  // ac 17
  it('matches plain url substring without wildcards', () => {
    const rule = parseRule('archive url=reddit.com/r/cats inactive>1h')
    expect(
      rule.ok &&
        ruleMatches(rule.rule, tab({ url: 'https://www.reddit.com/r/cats/comments/1' })),
    ).toBe(true)
    expect(
      rule.ok && ruleMatches(rule.rule, tab({ url: 'https://www.reddit.com/r/dogs' })),
    ).toBe(false)
  })

  it('matches path glob on full url', () => {
    const rule = parseRule('archive url=*reddit.com/r/* inactive>1h')
    expect(
      rule.ok &&
        ruleMatches(
          rule.rule,
          tab({ url: 'https://www.reddit.com/r/programming/comments/abc' }),
        ),
    ).toBe(true)
  })

  it('does not match anchored *.google.com when url has a path', () => {
    const rule = parseRule('archive url=*.google.com inactive>10m')
    expect(
      rule.ok &&
        ruleMatches(rule.rule, tab({ url: 'https://mail.google.com/mail/u/0/' })),
    ).toBe(false)
  })

  it('matches anchored *.google.com when url ends at host', () => {
    const rule = parseRule('archive url=*.google.com inactive>10m')
    expect(
      rule.ok &&
        ruleMatches(rule.rule, tab({ url: 'https://calendar.google.com' })),
    ).toBe(true)
  })
})

describe('ruleMatches tab state', () => {
  // ac 18
  it('matches active=true only for foreground tab', () => {
    const rule = parseRule('keep active=true')
    expect(rule.ok && ruleMatches(rule.rule, tab({ active: true }))).toBe(true)
    expect(rule.ok && ruleMatches(rule.rule, tab({ active: false }))).toBe(false)
  })

  it('matches pinned=true against chrome pinned flag', () => {
    const rule = parseRule('keep pinned=true')
    expect(rule.ok && ruleMatches(rule.rule, tab({ pinned: true }))).toBe(true)
    expect(rule.ok && ruleMatches(rule.rule, tab({ pinned: false }))).toBe(false)
  })

  it('matches suspended=true only for suspended placeholder tabs', () => {
    const rule = parseRule('archive suspended=true inactive>2h')
    expect(rule.ok && ruleMatches(rule.rule, tab({ suspended: true }))).toBe(true)
    expect(rule.ok && ruleMatches(rule.rule, tab({ suspended: false }))).toBe(false)
  })
})

describe('matchRules', () => {
  it('returns all rules that match the tab', () => {
    const rules = [
      parseRule('keep pinned=true'),
      parseRule('archive inactive>2h'),
    ]
      .filter((r) => r.ok)
      .map((r) => r.rule)

    const matched = matchRules(rules, tab({ pinned: false, inactiveMs: 9_000_000 }))
    expect(matched.map((r) => r.source)).toEqual(['archive inactive>2h'])
  })
})
