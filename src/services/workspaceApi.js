function getPassword() {
  try {
    return localStorage.getItem('ftp_unlock') ?? ''
  } catch {
    return ''
  }
}

async function request(method, body) {
  const res = await fetch('/api/workspace', {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getPassword()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message = err.error?.message || `Workspace ${method} failed (${res.status})`
    const error = new Error(message)
    error.status = res.status
    throw error
  }
  return res.json()
}

export function loadWorkspace() {
  return request('GET')
}

export function saveWorkspace(workspace) {
  return request('PUT', workspace)
}
