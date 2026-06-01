import { checkPassword, loadWorkspace, saveWorkspace } from '../lib/workspaceStore.js'

export default async function handler(req, res) {
  const auth = checkPassword(req.headers.authorization)
  if (!auth.ok) {
    res.status(auth.status).json({ error: { message: auth.message } })
    return
  }

  try {
    if (req.method === 'GET') {
      const workspace = await loadWorkspace()
      res.status(200).json(workspace)
      return
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const saved = await saveWorkspace(body)
      res.status(200).json(saved)
      return
    }

    res.status(405).json({ error: { message: 'Method not allowed' } })
  } catch (err) {
    res.status(500).json({ error: { message: err?.message || 'Workspace request failed' } })
  }
}

export const config = {
  maxDuration: 10,
}
