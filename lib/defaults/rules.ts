export const DEFAULT_RULES = [
  'keep pinned=true',
  'close inactive>2h',
  'close inactive>30d',
] as const

export type DefaultRule = (typeof DEFAULT_RULES)[number]
