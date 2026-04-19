function normalizeAlwaysPack(items) {
  return (items ?? []).filter(Boolean).map(item =>
    typeof item === 'string' ? { item, condition: '' } : item
  )
}

async function callAnthropic(body) {
  const res = await fetch('/api/anthropic/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Claude API error ${res.status}`)
  }

  const data = await res.json()
  if (data.stop_reason === 'max_tokens') {
    throw new Error("Claude's response was cut off before it could finish. Try again — or if it keeps happening, upload fewer files or a shorter document.")
  }
  return data
}

function stripJsonFence(raw) {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '')
    .trim()
}

export async function generatePackingList({ trip, travelers, familyRules, weatherSummary, pastDebriefs }) {
  const start = new Date(trip.startDate)
  const end = new Date(trip.endDate)
  const tripLength = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)

  const travelersText = travelers.length
    ? travelers.map(t => {
        const packs = normalizeAlwaysPack(t.alwaysPack)
        const packLines = packs.length
          ? '\n  Always pack:\n' + packs.map(p =>
              p.condition ? `    • ${p.item} (if ${p.condition})` : `    • ${p.item}`
            ).join('\n')
          : ''
        return `- ${t.name} (${t.role}, age ${t.age})${packLines}`
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

For always-pack items listed with a condition (e.g. "if beach trip" or "if 5+ days"), include the item only if the condition is met for this trip. For unconditional always-pack items, always include them.

Respond ONLY with a JSON object with exactly two top-level keys:

1. "summary" — EXACTLY two sentences of plain prose. Sentence one describes what weather to expect, drawing from the WEATHER FORECAST section above. If the forecast section says it is unavailable, phrase sentence one as "Weather info is unavailable, but it is typically [describe conditions]..." using the historical averages provided. Sentence two describes how the packing list covers that weather — mention the temperature range covered (e.g. "items for the mid-50s through upper-70s") and any weather-specific gear included (rain jackets, layers, sun protection, etc.). Do NOT list items. Keep it conversational.

2. "packingList" — an object whose keys are:
   - ONE key per traveler, using that traveler's EXACT name as it appears in the TRAVELERS section. Each value is an array of every item that person needs (clothing, toiletries, medications, entertainment, kid gear — anything personal). Include that traveler's always-pack items under their own key.
   - ONE additional key "Documents" — shared household travel documents (passports, tickets, itineraries, insurance, etc.). This is the only non-person key allowed.

Do NOT group packingList by category (no "Clothing", "Toiletries", "Misc", etc.). Group everything except Documents under the person who needs it. Each value is an array of item name strings.

Example format: {"summary": "Weather info is unavailable, but it is typically warm days and cool evenings in this area. This list covers weather ranges from the mid-50s through the upper-70s with layers for mornings and sun protection for afternoons.", "packingList": {"Raphael": ["Swimsuit", "Running shoes", "Sunscreen SPF 50"], "Vivien": ["Beach dress", "Kids Tylenol", "Stuffed bunny"], "Documents": ["Passports", "Flight confirmation"]}}`

  const data = await callAnthropic({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' }
      }
    ],
    messages: [{ role: 'user', content: userPrompt }]
  })

  const raw = data.content?.[0]?.text?.trim() ?? ''
  const parsed = JSON.parse(stripJsonFence(raw))
  const rawList = parsed.packingList ?? parsed
  const contextSummary = typeof parsed.summary === 'string' ? parsed.summary : ''

  const packingList = {}
  for (const [cat, items] of Object.entries(rawList)) {
    if (Array.isArray(items) && items.length > 0) {
      packingList[cat] = items.map(item => ({
        item: String(item),
        checked: false,
        addedBy: 'claude'
      }))
    }
  }
  return { packingList, contextSummary }
}

export async function extractTripDetails(files) {
  const contentBlocks = []

  for (const file of files) {
    if (file.kind === 'text') {
      contentBlocks.push({ type: 'text', text: `[File: ${file.name}]\n${file.content}` })
    } else if (file.kind === 'image') {
      contentBlocks.push({ type: 'image', source: { type: 'base64', media_type: file.mediaType, data: file.content } })
    } else {
      contentBlocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.content } })
    }
  }

  contentBlocks.push({
    type: 'text',
    text: `Extract trip details from the document(s) above. Return valid JSON only — no markdown, no extra text.

Fields:
- "destination": city or region name (string, or null if not found)
- "startDate": departure or check-in date in YYYY-MM-DD format (null if not found)
- "endDate": return or check-out date in YYYY-MM-DD format (null if not found)
- "tripType": one of "beach", "hiking", "city", "family visit", "other" — infer from context, or null
- "notes": 1–3 sentence summary of useful details (hotel name, flight info, special considerations) — null if nothing notable
- "summary": 1–2 sentence human-readable description of what was found

If multiple documents are provided, reconcile them into one coherent itinerary.
If a field cannot be determined confidently, use null — do not guess.
Today's date for context: ${new Date().toISOString().split('T')[0]}`
  })

  const data = await callAnthropic({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: contentBlocks }]
  })

  const raw = data.content?.[0]?.text?.trim() ?? ''
  return JSON.parse(stripJsonFence(raw))
}

export async function refinePackingList({ trip, conversationHistory, userMessage, currentPackingList }) {
  const listText = Object.entries(currentPackingList)
    .map(([cat, items]) => `${cat}: ${items.map(i => i.item).join(', ')}`)
    .join('\n')

  const systemPrompt = `You are a helpful family travel assistant refining a packing list through conversation.

Current packing list:
${listText}

The packing list is grouped per-person: each key is a traveler's name, plus one shared "Documents" key. Preserve this structure when responding — do NOT introduce category keys like "Clothing" or "Toiletries". Items specific to a person go under that person's name; shared travel documents go under "Documents".

When the user asks for changes, update the full list accordingly and briefly explain what you changed. Always respond with valid JSON only — no markdown, no explanation, no extra text.

Response format: {"message": "One or two sentences explaining changes.", "packingList": {"<TravelerName>": ["item1", "item2"], "Documents": ["Passports", "Tickets"]}}`

  const messages = [
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ]

  const data = await callAnthropic({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
    messages
  })

  const raw = data.content?.[0]?.text?.trim() ?? ''
  const { message, packingList: rawList } = JSON.parse(stripJsonFence(raw))

  const packingList = {}
  for (const [cat, items] of Object.entries(rawList)) {
    if (Array.isArray(items) && items.length > 0) {
      packingList[cat] = items.map(item => ({
        item: String(item),
        checked: false,
        addedBy: 'claude'
      }))
    }
  }

  return { message, packingList }
}
