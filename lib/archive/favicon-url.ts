export function archiveFaviconSrc(entry: {
  url: string
  favicon?: string
}): string | undefined {
  if (entry.favicon) {
    return entry.favicon
  }
  try {
    const host = new URL(entry.url).hostname
    if (!host) {
      return undefined
    }
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`
  } catch {
    return undefined
  }
}
