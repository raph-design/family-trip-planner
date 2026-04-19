export async function generatePackingList({ trip, travelers, familyRules, weatherSummary, pastDebriefs }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Missing VITE_ANTHROPIC_API_KEY in .env')

  const start = new Date(trip.startDate)
  const end = new Date(trip.endDate)
  const tripLength = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)

  const travelersText = travelers.length
    ? travelers.map(t => {
        const packs = (t.alwaysPack ?? []).filter(Boolean)
        return `- ${t.name} (${t.role}, age ${t.age})${packs.length ? `\n  Always pack: ${packs.join(', ')}` : ''}`
      }).join('\n')
    : 'No specific travelers provided.'

  const rulesText = familyRules.length
    ? familyRules.map(r => `- ${r.prose}`).join('\n')
    : 'No family rules specified.'

  const debriefsText = pastDebriefs.length
    ? pastDebriefs.map(d => {
        const lines = [`${d.destination} (${d.tripType}):`]
        if (d.debrief?.forgotToPack?.length) lines.push(`  Previously forgot: ${d.debrief.forgotToPack.join(', ')}`)
        if (d.debrief?.shouldntHavePacked?.length) lines.push(`  Previously overpacked: ${d.debrief.shouldntHavePacked.join(', ')}`)
        return lines.join('\n')
      }).join('\n\n')
    : 'No past trip data.'

  const systemPrompt = `You are a helpful family travel assistant. Generate smart, personalized packing lists. Always respond with valid JSON only — no markdown, no explanation, no extra text before or after the JSON.`

  const userPrompt = `Generate a packing list for this family trip.

TRIP DETAILS:
- Destination: ${trip.destination}
- Trip type: ${trip.tripType}
- Dates: ${trip.startDate} to ${trip.endDate} (${tripLength} day${tripLength !== 1 ? 's' : ''})
- Trip notes: ${trip.notes || 'None'}

WEATHER FORECAST:
${weatherSummary}

TRAVELERS:
${travelersText}

FAMILY RULES (follow these exactly):
${rulesText}

PAST TRIP INSIGHTS (use to improve this list):
${debriefsText}

Respond ONLY with a JSON object. Include only relevant categories from: Clothing, Toiletries, Medications, Kids, Entertainment, Documents, Misc. Each value is an array of item name strings. Be specific and include always-pack items from traveler profiles.

Example format: {"Clothing": ["Swimsuit", "Sun hat"], "Toiletries": ["Sunscreen SPF 50"]}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' }
        }
      ],
      messages: [{ role: 'user', content: userPrompt }]
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Claude API error ${res.status}`)
  }

  const data = await res.json()
  const raw = data.content?.[0]?.text?.trim() ?? ''

  // Strip markdown code fences if present
  const jsonText = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim()

  const categories = JSON.parse(jsonText)

  const packingList = {}
  for (const [cat, items] of Object.entries(categories)) {
    if (Array.isArray(items) && items.length > 0) {
      packingList[cat] = items.map(item => ({
        item: String(item),
        checked: false,
        addedBy: 'claude'
      }))
    }
  }
  return packingList
}
