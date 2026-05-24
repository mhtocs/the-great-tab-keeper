import { SUSPENDED_PAGE_PATH } from './types'

export function isSuspendedPageUrl(url: string): boolean {
  return url.includes(`/${SUSPENDED_PAGE_PATH}`)
}

export function isSuspendableUrl(url: string): boolean {
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return false
  }
  if (isSuspendedPageUrl(url)) {
    return false
  }
  return true
}

export function suspendedPageUrl(tabId: number): string {
  return `${SUSPENDED_PAGE_PATH}?tabId=${tabId}`
}
