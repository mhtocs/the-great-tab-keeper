export function tabEditErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return String(error)
}

// chrome blocks tab updates while the user drags tabs; safe to skip until next cycle
export function isTransientTabEditError(error: unknown): boolean {
  const message = tabEditErrorMessage(error).toLowerCase()
  return (
    message.includes('cannot be edited right now') ||
    message.includes('user may be dragging')
  )
}
