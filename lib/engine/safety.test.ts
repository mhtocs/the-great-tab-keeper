import { describe, expect, it } from 'vitest'
import type { TabMatchContext } from '../rules/matcher'
import { parseRule } from '../rules/parser'
import { checkDestructiveSafety } from './safety'

function tab(overrides: Partial<TabMatchContext> = {}): TabMatchContext {
  return {
    url: 'https://example.com/',
    pinned: false,
    audible: false,
    active: false,
    suspended: false,
    inactiveMs: 5 * 3_600_000,
    ...overrides,
  }
}

describe('checkDestructiveSafety', () => {
  it('allows keep without checks', () => {
    const rule = parseRule('keep pinned=true')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ pinned: true }), rule.rule)).toEqual({
      allowed: true,
    })
  })

  it('blocks archive on pinned tab when rule omits pinned=true', () => {
    const rule = parseRule('archive inactive>2h')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ pinned: true }), rule.rule)).toEqual({
      allowed: false,
      reason: 'pinned',
    })
  })

  it('allows archive on pinned tab when rule includes pinned=true', () => {
    const rule = parseRule('archive inactive>2d pinned=true')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ pinned: true }), rule.rule)).toEqual({
      allowed: true,
    })
  })

  it('blocks archive on audible tab when rule omits audible=true', () => {
    const rule = parseRule('archive inactive>2h')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ audible: true }), rule.rule)).toEqual({
      allowed: false,
      reason: 'audible',
    })
  })

  it('allows archive on audible tab when rule includes audible=true', () => {
    const rule = parseRule('archive inactive>2h audible=true')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ audible: true }), rule.rule)).toEqual({
      allowed: true,
    })
  })

  it('blocks archive on foreground tab when rule omits active=true', () => {
    const rule = parseRule('archive inactive>2h')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ active: true }), rule.rule)).toEqual({
      allowed: false,
      reason: 'active',
    })
  })

  it('allows archive on foreground tab when rule includes active=true', () => {
    const rule = parseRule('archive inactive>2h active=true')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ active: true }), rule.rule)).toEqual({
      allowed: true,
    })
  })

  it('blocks suspend on pinned tab when rule omits pinned=true', () => {
    const rule = parseRule('suspend inactive>2h')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ pinned: true }), rule.rule)).toEqual({
      allowed: false,
      reason: 'pinned',
    })
  })

  it('blocks archive on suspended tab when rule omits suspended=true', () => {
    const rule = parseRule('archive inactive>2h')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ suspended: true }), rule.rule)).toEqual({
      allowed: false,
      reason: 'suspended',
    })
  })

  it('allows archive on suspended tab when rule includes suspended=true', () => {
    const rule = parseRule('archive inactive>2h suspended=true')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ suspended: true }), rule.rule)).toEqual({
      allowed: true,
    })
  })

  it('allows archive on plain inactive background tab', () => {
    const rule = parseRule('archive inactive>2h')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab(), rule.rule)).toEqual({ allowed: true })
  })
})
