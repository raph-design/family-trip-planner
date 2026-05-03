function primaryLocation(destination) {
  const d = destination.trim()
  if (!d) return d
  const parts = d.split(/\s+and\s+|\s*[;/|&+]\s*|\s*(?:→|->)\s*/i)
  let primary = parts[0].trim()
  const commaParts = primary.split(',').map(s => s.trim()).filter(Boolean)
  if (commaParts.length >= 3) primary = commaParts[0]
  return primary || d
}

export async function fetchDestinationPhoto(destination) {
  const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
  if (!key) {
    console.warn('[unsplash] VITE_UNSPLASH_ACCESS_KEY is not set — skipping photo fetch')
    return null
  }
  try {
    const query = primaryLocation(destination)
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query + ' travel landscape')}&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${key}` } }
    )
    if (!res.ok) {
      console.warn(`[unsplash] request failed: ${res.status} ${res.statusText} for "${destination}"`)
      return null
    }
    const data = await res.json()
    return data.urls?.regular ?? null
  } catch (err) {
    console.warn('[unsplash] fetch threw:', err)
    return null
  }
}
