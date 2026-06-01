import express from 'express'
import 'dotenv/config'
import { forwardToAnthropic } from './lib/anthropicProxy.js'
import { checkPassword, loadWorkspace, saveWorkspace } from './lib/workspaceStore.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json({ limit: '25mb' }))

app.post('/api/anthropic/messages', async (req, res) => {
  const { status, contentType, body } = await forwardToAnthropic(req.body)
  res.status(status).setHeader('Content-Type', contentType).send(body)
})

app.get('/api/workspace', async (req, res) => {
  const auth = checkPassword(req.headers.authorization)
  if (!auth.ok) {
    res.status(auth.status).json({ error: { message: auth.message } })
    return
  }
  try {
    const workspace = await loadWorkspace()
    res.json(workspace)
  } catch (err) {
    res.status(500).json({ error: { message: err?.message || 'Workspace load failed' } })
  }
})

app.put('/api/workspace', async (req, res) => {
  const auth = checkPassword(req.headers.authorization)
  if (!auth.ok) {
    res.status(auth.status).json({ error: { message: auth.message } })
    return
  }
  try {
    const saved = await saveWorkspace(req.body)
    res.json(saved)
  } catch (err) {
    res.status(500).json({ error: { message: err?.message || 'Workspace save failed' } })
  }
})

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`)
})
