export function formatFreedMemory(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return ''
  }
  if (bytes < 1024) {
    return `${Math.round(bytes)} b`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} kb`
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} mb`
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} gb`
}
