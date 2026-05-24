import { describe, expect, it } from 'vitest'
import { isSuspendableUrl, isSuspendedPageUrl, suspendedPageUrl } from './suspended-page'

describe('suspended page helpers', () => {
  it('detects suspended placeholder url', () => {
    expect(isSuspendedPageUrl('chrome-extension://id/ui/suspended/index.html?tabId=3')).toBe(
      true,
    )
    expect(isSuspendedPageUrl('https://example.com')).toBe(false)
  })

  it('rejects extension and suspended urls for suspend action', () => {
    expect(isSuspendableUrl('https://example.com/page')).toBe(true)
    expect(isSuspendableUrl('chrome-extension://id/ui/dashboard/index.html')).toBe(
      false,
    )
    expect(isSuspendableUrl('chrome-extension://id/ui/suspended/index.html?tabId=1')).toBe(
      false,
    )
  })

  it('builds suspended page path with tab id', () => {
    expect(suspendedPageUrl(9)).toBe('ui/suspended/index.html?tabId=9')
  })
})
