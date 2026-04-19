export async function fetchDestinationPhoto(destination) {
  const key = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
  if (!key) return null
  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(destination + ' travel landscape')}&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${key}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.urls?.regular ?? null
  } catch {
    return null
  }
}
