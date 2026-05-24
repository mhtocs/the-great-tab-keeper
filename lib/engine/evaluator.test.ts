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
  it('does not execute close on pinned tab with default rules', () => {
    const outcome = evaluateTab(rulesFrom([...DEFAULT_RULES]), tab({ pinned: true }))
    expect(outcome.resolvedAction).toBe('keep')
    expect(outcome.executed).toBe(false)
  })

  // ac 6
  it('does not execute when audible safety blocks', () => {
    const outcome = evaluateTab(rulesFrom(['close inactive>2h']), tab({ audible: true }))
    expect(outcome.resolvedAction).toBe('close')
    expect(outcome.executed).toBe(false)
    expect(outcome.blockReason).toBe('audible')
  })

  // ac 7
  it('executes close when rule declares audible=true', () => {
    const outcome = evaluateTab(
      rulesFrom(['close inactive>2h audible=true']),
      tab({ audible: true, inactiveMs: THREE_HOURS_MS }),
    )
    expect(outcome.resolvedAction).toBe('close')
    expect(outcome.executed).toBe(true)
  })

  // ac 10
  it('does not execute keep on matching tab', () => {
    const outcome = evaluateTab(
      rulesFrom(['keep url=docs.google.com', 'close inactive>2h']),
      tab({ url: 'https://docs.google.com/doc', inactiveMs: THREE_HOURS_MS }),
    )
    expect(outcome.resolvedAction).toBe('keep')
    expect(outcome.executed).toBe(false)
  })

  it('executes close for inactive background tab with matching rule', () => {
    const outcome = evaluateTab(rulesFrom(['close inactive>2h']), tab())
    expect(outcome.resolvedAction).toBe('close')
    expect(outcome.executed).toBe(true)
  })

  it('does not execute sleep when tab is already discarded', () => {
    const outcome = evaluateTab(
      rulesFrom(['sleep inactive>2h']),
      tab({ discarded: true }),
    )
    expect(outcome.resolvedAction).toBe('sleep')
    expect(outcome.executed).toBe(false)
    expect(outcome.blockReason).toBe('discarded')
  })

  it('does not execute sleep on active tab without active=true', () => {
    const outcome = evaluateTab(
      rulesFrom(['sleep inactive>1h']),
      tab({ active: true, inactiveMs: THREE_HOURS_MS }),
    )
    expect(outcome.resolvedAction).toBe('sleep')
    expect(outcome.executed).toBe(false)
    expect(outcome.blockReason).toBe('active')
  })

  it('executes sleep for inactive background tab', () => {
    const outcome = evaluateTab(rulesFrom(['sleep inactive>2h']), tab())
    expect(outcome.resolvedAction).toBe('sleep')
    expect(outcome.executed).toBe(true)
  })

  it('closes docs when keep google and close docs both match', () => {
    const outcome = evaluateTab(
      rulesFrom([
        'keep url=google.com',
        'close inactive>10m url=docs.google.com',
      ]),
      tab({
        url: 'https://docs.google.com/spreadsheets/d/1',
        inactiveMs: ELEVEN_MINUTES_MS,
      }),
    )
    expect(outcome.resolvedAction).toBe('close')
    expect(outcome.executed).toBe(true)
  })
})
