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
  if (!key) return null
  try {
    const query = primaryLocation(destination)
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query + ' travel landscape')}&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${key}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.urls?.regular ?? null
  } catch {
    return null
  }
}
