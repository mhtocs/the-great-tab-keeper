import { describe, expect, it } from 'vitest'
import { DEFAULT_RULES } from '../defaults/rules'
import { parseRules } from '../rules/parser'
import { evaluateTab } from './evaluator'

const THREE_HOURS_MS = 3 * 3_600_000
const ELEVEN_MINUTES_MS = 11 * 60 * 1000

function tab(overrides: Record<string, unknown> = {}) {
  return {
    tabId: 1,
    url: 'https://example.com/',
    title: 'example',
    pinned: false,
    audible: false,
    active: false,
    suspended: false,
    inactiveMs: THREE_HOURS_MS,
    lastAccessedMs: Date.now() - THREE_HOURS_MS,
    discarded: false,
    ...overrides,
  }
}

function rulesFrom(lines: string[]) {
  const parsed = parseRules(lines)
  if (!parsed.ok) {
    throw new Error(parsed.error)
  }
  return parsed.rules
}

describe('evaluateTab', () => {
  // ac 4
  it('does not execute archive on pinned tab with default rules', () => {
    const outcome = evaluateTab(rulesFrom([...DEFAULT_RULES]), tab({ pinned: true }))
    expect(outcome.resolvedAction).toBe('keep')
    expect(outcome.executed).toBe(false)
  })

  // ac 6
  it('does not execute when audible safety blocks', () => {
    const outcome = evaluateTab(rulesFrom(['archive inactive>2h']), tab({ audible: true }))
    expect(outcome.resolvedAction).toBe('archive')
    expect(outcome.executed).toBe(false)
    expect(outcome.blockReason).toBe('audible')
  })

  // ac 7
  it('executes archive when rule declares audible=true', () => {
    const outcome = evaluateTab(
      rulesFrom(['archive inactive>2h audible=true']),
      tab({ audible: true, inactiveMs: THREE_HOURS_MS }),
    )
    expect(outcome.resolvedAction).toBe('archive')
    expect(outcome.executed).toBe(true)
  })

  // ac 10
  it('does not execute keep on matching tab', () => {
    const outcome = evaluateTab(
      rulesFrom(['keep url=docs.google.com', 'archive inactive>2h']),
      tab({ url: 'https://docs.google.com/doc', inactiveMs: THREE_HOURS_MS }),
    )
    expect(outcome.resolvedAction).toBe('keep')
    expect(outcome.executed).toBe(false)
  })

  it('executes archive for inactive background tab with matching rule', () => {
    const outcome = evaluateTab(rulesFrom(['archive inactive>2h']), tab())
    expect(outcome.resolvedAction).toBe('archive')
    expect(outcome.executed).toBe(true)
  })

  it('does not execute suspend when tab is already discarded', () => {
    const outcome = evaluateTab(
      rulesFrom(['suspend inactive>2h']),
      tab({ discarded: true }),
    )
    expect(outcome.resolvedAction).toBe('suspend')
    expect(outcome.executed).toBe(false)
    expect(outcome.blockReason).toBe('discarded')
  })

  it('does not execute suspend on active tab without active=true', () => {
    const outcome = evaluateTab(
      rulesFrom(['suspend inactive>1h']),
      tab({ active: true, inactiveMs: THREE_HOURS_MS }),
    )
    expect(outcome.resolvedAction).toBe('suspend')
    expect(outcome.executed).toBe(false)
    expect(outcome.blockReason).toBe('active')
  })

  it('executes suspend for inactive background tab', () => {
    const outcome = evaluateTab(rulesFrom(['suspend inactive>2h']), tab())
    expect(outcome.resolvedAction).toBe('suspend')
    expect(outcome.executed).toBe(true)
  })

  it('executes archive for suspended tab when rule declares suspended=true', () => {
    const outcome = evaluateTab(
      rulesFrom(['archive suspended=true inactive>2h']),
      tab({ suspended: true }),
    )
    expect(outcome.resolvedAction).toBe('archive')
    expect(outcome.executed).toBe(true)
  })

  it('does not execute suspend when tab is already suspended', () => {
    const outcome = evaluateTab(
      rulesFrom(['suspend suspended=true inactive>2h']),
      tab({ suspended: true }),
    )
    expect(outcome.resolvedAction).toBe('suspend')
    expect(outcome.executed).toBe(false)
    expect(outcome.blockReason).toBe('suspended')
  })

  it('archives docs when keep google and archive docs both match', () => {
    const outcome = evaluateTab(
      rulesFrom([
        'keep url=google.com',
        'archive inactive>10m url=docs.google.com',
      ]),
      tab({
        url: 'https://docs.google.com/spreadsheets/d/1',
        inactiveMs: ELEVEN_MINUTES_MS,
      }),
    )
    expect(outcome.resolvedAction).toBe('archive')
    expect(outcome.executed).toBe(true)
  })
})
