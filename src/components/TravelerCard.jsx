import { useState } from 'react'

export default function TravelerCard({ traveler, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ ...traveler, alwaysPack: [...(traveler.alwaysPack ?? [])] })
  const [newPackItem, setNewPackItem] = useState('')

  const initials = traveler.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  function addPackItem(str) {
    const trimmed = (str ?? newPackItem).trim()
    if (trimmed) {
      setDraft(d => ({ ...d, alwaysPack: [...d.alwaysPack, trimmed] }))
      setNewPackItem('')
    }
  }

  function saveEdit() {
    if (draft.name.trim()) {
      onUpdate({ ...draft, name: draft.name.trim() })
      setEditing(false)
    }
  }

  function cancelEdit() {
    setDraft({ ...traveler, alwaysPack: [...(traveler.alwaysPack ?? [])] })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="traveler-card editing">
        <div className="form-group">
          <label>Name</label>
          <input className="form-input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} autoFocus />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Role</label>
            <select className="form-select" value={draft.role} onChange={e => setDraft(d => ({ ...d, role: e.target.value }))}>
              <option value="adult">Adult</option>
              <option value="child">Child</option>
            </select>
          </div>
          <div className="form-group">
            <label>Age</label>
            <input className="form-input" type="number" min="0" max="120" value={draft.age}
              onChange={e => setDraft(d => ({ ...d, age: Number(e.target.value) }))} />
          </div>
        </div>
        <div className="form-group">
          <label>Always pack</label>
          <div className="tag-list">
            {draft.alwaysPack.map((item, i) => (
              <span key={i} className="tag">
                {item}
                <button onClick={() => setDraft(d => ({ ...d, alwaysPack: d.alwaysPack.filter((_, j) => j !== i) }))}>×</button>
              </span>
            ))}
          </div>
          <div className="tag-add-row">
            <input
              className="form-input"
              placeholder="e.g. Migraine medication"
              value={newPackItem}
              onChange={e => setNewPackItem(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addPackItem() }}
            />
            <button className="btn-sm" onClick={() => addPackItem()}>Add</button>
          </div>
        </div>
        <div className="card-actions">
          <button className="btn-primary" onClick={saveEdit}>Save</button>
          <button className="btn-outline" onClick={cancelEdit}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="traveler-card">
      <div className="traveler-avatar">{initials}</div>
      <div className="traveler-info">
        <div className="traveler-name-row">
          <span className="traveler-name">{traveler.name}</span>
          <span className="traveler-badge">{traveler.role} · {traveler.age}y</span>
        </div>
        {traveler.alwaysPack?.filter(Boolean).length > 0 && (
          <div className="tag-list compact">
            {traveler.alwaysPack.filter(Boolean).map((item, i) => (
              <span key={i} className="tag readonly">{item}</span>
            ))}
          </div>
        )}
      </div>
      <div className="card-btn-group">
        <button className="icon-btn" onClick={() => { setDraft({ ...traveler, alwaysPack: [...(traveler.alwaysPack ?? [])] }); setEditing(true) }} title="Edit">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="icon-btn danger" onClick={onDelete} title="Delete">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5H13M6 5V3H10V5M5 5L5.5 13H10.5L11 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
