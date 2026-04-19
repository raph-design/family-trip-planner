export async function forwardToAnthropic(body) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { message: 'ANTHROPIC_API_KEY is not set on the server.' },
      }),
    }
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    return {
      status: upstream.status,
      contentType: upstream.headers.get('content-type') || 'application/json',
      body: await upstream.text(),
    }
  } catch (err) {
    return {
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { message: err?.message || 'Upstream request to Anthropic failed' },
      }),
    }
  }
}
