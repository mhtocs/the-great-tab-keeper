import { DEFAULT_RULES } from './rules'
import { DEFAULT_SETTINGS } from '../storage/settings'
import type { Settings } from '../storage/schema'

export function initialSettings(): Settings {
  return {
    ...DEFAULT_SETTINGS,
    rules: [...DEFAULT_RULES],
  }
}

export function shouldSeedSettings(storedRaw: unknown): boolean {
  return storedRaw === undefined || storedRaw === null
}
