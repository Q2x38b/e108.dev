// Editors often type a bare domain ("noirzen.e108.dev"). Used as an href
// as-is, the browser treats it as a path on this site and lands on
// e108.dev/noirzen.e108.dev, so anything that looks like a domain gets a scheme.
export function normalizeUrl(raw: string): string {
  const url = raw.trim()
  if (!url) return url
  // Already absolute (https:, mailto:, tel:) or deliberately on-site (/path, #, ?q)
  if (/^[a-z][a-z\d+.-]*:/i.test(url) || /^[/#?]/.test(url)) {
    return url.startsWith('//') ? `https:${url}` : url
  }
  if (/^[^\s/]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(url)) return `https://${url}`
  return url
}

export function isExternalUrl(raw: string | null | undefined): raw is string {
  return !!raw && /^https?:\/\//i.test(normalizeUrl(raw))
}
