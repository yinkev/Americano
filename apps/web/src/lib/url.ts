export function getParam(
  sp: URLSearchParams | Readonly<URLSearchParams>,
  key: string,
  fallback = '',
): string {
  const v = sp.get(key)
  return v == null || v === '' ? fallback : v
}

export function setParams(
  sp: URLSearchParams | Readonly<URLSearchParams>,
  updates: Record<string, string | null | undefined>,
): string {
  const next = new URLSearchParams(sp.toString())
  for (const [k, v] of Object.entries(updates)) {
    if (v == null || v === '') next.delete(k)
    else next.set(k, v)
  }
  const s = next.toString()
  return s ? `?${s}` : ''
}
