export type SleptTabEntry = {
  url: string
  title: string
  favicon?: string
  sleptAt: number
  memoryFreedBytes?: number
}

export type SleptTabMap = Record<string, SleptTabEntry>

export const SLEPT_PAGE_PATH = 'ui/slept/index.html'
