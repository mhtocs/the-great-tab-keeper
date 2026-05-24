import { describe, expect, it } from 'vitest'
import { isSleepableUrl, isSleptPageUrl, sleptPageUrl } from './slept-page'

describe('slept page helpers', () => {
  it('detects slept placeholder url', () => {
    expect(isSleptPageUrl('chrome-extension://id/ui/slept/index.html?tabId=3')).toBe(
      true,
    )
    expect(isSleptPageUrl('https://example.com')).toBe(false)
  })

  it('rejects extension and slept urls for sleep action', () => {
    expect(isSleepableUrl('https://example.com/page')).toBe(true)
    expect(isSleepableUrl('chrome-extension://id/ui/dashboard/index.html')).toBe(
      false,
    )
    expect(isSleepableUrl('chrome-extension://id/ui/slept/index.html?tabId=1')).toBe(
      false,
    )
  })

  it('builds slept page path with tab id', () => {
    expect(sleptPageUrl(9)).toBe('ui/slept/index.html?tabId=9')
  })
})
