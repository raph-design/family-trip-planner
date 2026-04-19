import { useState } from 'react'

export default function TripDebrief({ debrief, onSave }) {
  const parseTags = str => str.split(',').map(s => s.trim()).filter(Boolean)
  const joinTags = arr => (arr ?? []).join(', ')

  const [forgot, setForgot] = useState(joinTags(debrief?.forgotToPack))
  const [shouldnt, setShouldnt] = useState(joinTags(debrief?.shouldntHavePacked))
  const [notes, setNotes] = useState(debrief?.freeformNotes ?? '')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    onSave({
      forgotToPack: parseTags(forgot),
      shouldntHavePacked: parseTags(shouldnt),
      freeformNotes: notes
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="trip-debrief">
      <p className="debrief-intro">
        How did the packing go? Your notes help Claude do better on future trips.
      </p>

      <div className="form-group">
        <label>What did you forget to pack?</label>
        <input
          className="form-input"
          placeholder="Sunscreen, water shoes, ... (comma-separated)"
          value={forgot}
          onChange={e => setForgot(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>What did you over-pack?</label>
        <input
          className="form-input"
          placeholder="Rain jacket, formal shoes, ... (comma-separated)"
          value={shouldnt}
          onChange={e => setShouldnt(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Other notes</label>
        <textarea
          className="form-textarea"
          placeholder="Anything else Claude should know for next time..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <button className="btn-primary full-width" onClick={handleSave}>
        {saved ? 'Saved!' : 'Save Debrief'}
      </button>

      {debrief?.forgotToPack?.length > 0 && (
        <div className="debrief-tip">
          Tip: Add recurring items you forget to your Family Rules so Claude always includes them.
        </div>
      )}
    </div>
  )
}
