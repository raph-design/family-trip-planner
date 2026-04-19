import { forwardToAnthropic } from '../../lib/anthropicProxy.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } })
    return
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { status, contentType, body: respBody } = await forwardToAnthropic(body)
  res.status(status).setHeader('Content-Type', contentType).send(respBody)
}

export const config = {
  maxDuration: 60,
}
