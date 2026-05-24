import { describe, expect, it } from 'vitest'
import { archiveFaviconSrc } from './favicon-url'

describe('archiveFaviconSrc', () => {
  it('returns stored favicon when present', () => {
    expect(
      archiveFaviconSrc({
        url: 'https://example.com/',
        favicon: 'https://example.com/icon.png',
      }),
    ).toBe('https://example.com/icon.png')
  })

  it('falls back to host favicon service from url', () => {
    expect(archiveFaviconSrc({ url: 'https://docs.google.com/doc' })).toBe(
      'https://www.google.com/s2/favicons?domain=docs.google.com&sz=32',
    )
  })
})
