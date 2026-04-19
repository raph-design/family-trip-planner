import express from 'express'
import 'dotenv/config'
import { forwardToAnthropic } from './lib/anthropicProxy.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json({ limit: '25mb' }))

app.post('/api/anthropic/messages', async (req, res) => {
  const { status, contentType, body } = await forwardToAnthropic(req.body)
  res.status(status).setHeader('Content-Type', contentType).send(body)
})

app.listen(PORT, () => {
  console.log(`Anthropic API proxy listening on http://localhost:${PORT}`)
})
