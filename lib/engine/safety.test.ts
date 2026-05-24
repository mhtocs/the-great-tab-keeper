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
    slept: false,
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

  it('blocks close on pinned tab when rule omits pinned=true', () => {
    const rule = parseRule('close inactive>2h')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ pinned: true }), rule.rule)).toEqual({
      allowed: false,
      reason: 'pinned',
    })
  })

  it('allows close on pinned tab when rule includes pinned=true', () => {
    const rule = parseRule('close inactive>2d pinned=true')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ pinned: true }), rule.rule)).toEqual({
      allowed: true,
    })
  })

  it('blocks close on audible tab when rule omits audible=true', () => {
    const rule = parseRule('close inactive>2h')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ audible: true }), rule.rule)).toEqual({
      allowed: false,
      reason: 'audible',
    })
  })

  it('allows close on audible tab when rule includes audible=true', () => {
    const rule = parseRule('close inactive>2h audible=true')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ audible: true }), rule.rule)).toEqual({
      allowed: true,
    })
  })

  it('blocks close on foreground tab when rule omits active=true', () => {
    const rule = parseRule('close inactive>2h')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ active: true }), rule.rule)).toEqual({
      allowed: false,
      reason: 'active',
    })
  })

  it('allows close on foreground tab when rule includes active=true', () => {
    const rule = parseRule('close inactive>2h active=true')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ active: true }), rule.rule)).toEqual({
      allowed: true,
    })
  })

  it('blocks sleep on pinned tab when rule omits pinned=true', () => {
    const rule = parseRule('sleep inactive>2h')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ pinned: true }), rule.rule)).toEqual({
      allowed: false,
      reason: 'pinned',
    })
  })

  it('blocks close on slept tab when rule omits slept=true', () => {
    const rule = parseRule('close inactive>2h')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ slept: true }), rule.rule)).toEqual({
      allowed: false,
      reason: 'slept',
    })
  })

  it('allows close on slept tab when rule includes slept=true', () => {
    const rule = parseRule('close inactive>2h slept=true')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab({ slept: true }), rule.rule)).toEqual({
      allowed: true,
    })
  })

  it('allows close on plain inactive background tab', () => {
    const rule = parseRule('close inactive>2h')
    expect(rule.ok).toBe(true)
    if (!rule.ok) {
      return
    }
    expect(checkDestructiveSafety(tab(), rule.rule)).toEqual({ allowed: true })
  })
})
