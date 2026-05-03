function primaryLocation(destination) {
  const d = destination.trim()
  if (!d) return d
  const parts = d.split(/\s+and\s+|\s*[;/|&+]\s*|\s*(?:→|->)\s*/i)
  let primary = parts[0].trim()
  const commaParts = primary.split(',').map(s => s.trim()).filter(Boolean)
  if (commaParts.length >= 3) primary = commaParts[0]
  return primary || d
}

function buildQueryCandidates(destination) {
  const primary = primaryLocation(destination)
  const candidates = [`${primary} travel landscape`, primary]
  const commaParts = primary.split(',').map(s => s.trim()).filter(Boolean)
  if (commaParts.length >= 2) {
    const region = commaParts[commaParts.length - 1]
    candidates.push(`${region} landscape`, region)
  }
  return [...new Set(candidates.filter(Boolean))]
}

export async function fetchDestinationPhoto(destination) {
  const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
  if (!key) {
    console.warn('[unsplash] VITE_UNSPLASH_ACCESS_KEY is not set — skipping photo fetch')
    return null
  }
  const queries = buildQueryCandidates(destination)
  for (const query of queries) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`,
        { headers: { Authorization: `Client-ID ${key}` } }
      )
      if (res.status === 404) {
        console.info(`[unsplash] no results for "${query}" — trying broader query`)
        continue
      }
      if (!res.ok) {
        console.warn(`[unsplash] request failed: ${res.status} ${res.statusText} for "${query}"`)
        return null
      }
      const data = await res.json()
      const url = data.urls?.regular
      if (url) return url
    } catch (err) {
      console.warn('[unsplash] fetch threw:', err)
      return null
    }
  }
  console.warn(`[unsplash] no photos found for "${destination}" after trying ${queries.length} queries`)
  return null
}
