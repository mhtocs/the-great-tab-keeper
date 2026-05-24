export type SuspendedTabEntry = {
  url: string
  title: string
  favicon?: string
  suspendedAt: number
}

export type SuspendedTabMap = Record<string, SuspendedTabEntry>

export const SUSPENDED_PAGE_PATH = 'ui/suspended/index.html'
