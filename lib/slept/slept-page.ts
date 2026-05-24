import { SLEPT_PAGE_PATH } from './types'

export function isSleptPageUrl(url: string): boolean {
  return url.includes(`/${SLEPT_PAGE_PATH}`)
}

export function isSleepableUrl(url: string): boolean {
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return false
  }
  if (isSleptPageUrl(url)) {
    return false
  }
  return true
}

export function sleptPageUrl(tabId: number): string {
  return `${SLEPT_PAGE_PATH}?tabId=${tabId}`
}
