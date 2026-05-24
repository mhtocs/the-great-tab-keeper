export const DEFAULT_RULES = [
  'keep pinned=true',
  'archive inactive>2h',
  'archive inactive>30d',
] as const

export type DefaultRule = (typeof DEFAULT_RULES)[number]
