import { useState, useRef, useEffect } from 'react'
import { refinePackingList } from '../services/claudeApi'

function mergeCheckedState(oldList, newList) {
  const result = {}
  for (const [cat, items] of Object.entries(newList)) {
    result[cat] = items.map(newItem => {
      for (const oldItems of Object.values(oldList)) {
        const match = oldItems.find(o => o.item.toLowerCase() === newItem.item.toLowerCase())
        if (match) return { ...newItem, checked: match.checked, addedBy: match.addedBy }
      }
      return newItem
    })
  }
  return result
}

export default function PackingChat({ trip, onUpdate }) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  const chatHistory = trip.chatHistory ?? []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, loading])

  async function handleSend() {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setLoading(true)
    setError('')

    const historyWithUser = [...chatHistory, { role: 'user', content: msg }]
    onUpdate({ ...trip, chatHistory: historyWithUser })

    try {
      const { message, packingList } = await refinePackingList({
        trip,
        conversationHistory: chatHistory,
        userMessage: msg,
        currentPackingList: trip.packingList ?? {}
      })
      const merged = mergeCheckedState(trip.packingList ?? {}, packingList)
      const finalHistory = [...historyWithUser, { role: 'assistant', content: message }]
      onUpdate({ ...trip, packingList: merged, chatHistory: finalHistory })
    } catch (err) {
      setError(err.message)
      onUpdate({ ...trip, chatHistory })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="packing-chat">
      <h3 className="packing-chat-title">Refine with Claude</h3>
      {chatHistory.length === 0 && !loading && (
        <p className="packing-chat-hint">
          Ask Claude to adjust the list — "add more beach items", "remove camping gear", "we're staying at a hotel".
        </p>
      )}
      {(chatHistory.length > 0 || loading) && (
        <div className="chat-messages">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              <p>{msg.content}</p>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble assistant">
              <div className="loading-dots"><span /><span /><span /></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
      {error && <p className="chat-error">{error}</p>}
      <div className="chat-input-row">
        <input
          className="form-input"
          placeholder="Ask Claude to change the list..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          disabled={loading}
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim() || loading}>
          Send
        </button>
      </div>
    </div>
  )
}
