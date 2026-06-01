const GIST_FILENAME = 'workspace.json'

function gistHeaders() {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('GITHUB_TOKEN is not configured on the server.')
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

async function getOrCreateGistId() {
  const id = process.env.GITHUB_GIST_ID
  if (id) return id

  // Auto-create a private gist on first use if no ID is configured
  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: gistHeaders(),
    body: JSON.stringify({
      description: 'family-trip-planner workspace',
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify({ trips: [], travelers: [], rules: [] }) } },
    }),
  })
  if (!res.ok) throw new Error(`GitHub Gist create failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  console.log(`[gist] Created new gist. Set GITHUB_GIST_ID=${data.id} in your env to reuse it.`)
  return data.id
}

export function checkPassword(authHeader) {
  const expected = process.env.APP_PASSWORD
  if (!expected) {
    return { ok: false, status: 500, message: 'APP_PASSWORD is not set on the server.' }
  }
  const provided = (authHeader ?? '').replace(/^Bearer\s+/i, '').trim()
  if (!provided || provided !== expected) {
    return { ok: false, status: 401, message: 'Unauthorized' }
  }
  return { ok: true }
}

export async function loadWorkspace() {
  const gistId = await getOrCreateGistId()
  const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers: gistHeaders() })
  if (!res.ok) throw new Error(`GitHub Gist fetch failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  const raw = data.files?.[GIST_FILENAME]?.content
  if (!raw) return { trips: [], travelers: [], rules: [] }
  try {
    return JSON.parse(raw)
  } catch {
    return { trips: [], travelers: [], rules: [] }
  }
}

export async function saveWorkspace(workspace) {
  const clean = {
    trips: Array.isArray(workspace?.trips) ? workspace.trips : [],
    travelers: Array.isArray(workspace?.travelers) ? workspace.travelers : [],
    rules: Array.isArray(workspace?.rules) ? workspace.rules : [],
    updatedAt: new Date().toISOString(),
  }
  const gistId = await getOrCreateGistId()
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: gistHeaders(),
    body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify(clean) } } }),
  })
  if (!res.ok) throw new Error(`GitHub Gist save failed: ${res.status} ${await res.text()}`)
  return clean
}
