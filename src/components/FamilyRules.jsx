import { useState } from 'react'
import { v4 as uuid } from 'uuid'

export default function FamilyRules({ rules, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [newRule, setNewRule] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')

  function addRule() {
    const prose = newRule.trim()
    if (!prose) return
    onUpdate([...rules, { id: uuid(), prose }])
    setNewRule('')
    setShowForm(false)
  }

  function saveEdit(id) {
    const prose = editDraft.trim()
    if (prose) onUpdate(rules.map(r => r.id === id ? { ...r, prose } : r))
    setEditingId(null)
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>Family Rules</h2>
        <button className="btn-primary small" onClick={() => showForm ? setShowForm(false) : setShowForm(true)}>
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      <p className="section-description">
        Claude follows these rules when generating every packing list. Write them in plain English.
      </p>

      {showForm && (
        <div className="card form-card">
          <div className="form-group">
            <label>Rule</label>
            <textarea
              className="form-textarea"
              placeholder={`e.g. "If the trip involves flights, kids may bring their iPads. Otherwise no screens."`}
              value={newRule}
              onChange={e => setNewRule(e.target.value)}
              rows={3}
              autoFocus
            />
          </div>
          <button className="btn-primary" onClick={addRule} disabled={!newRule.trim()}>
            Add Rule
          </button>
        </div>
      )}

      {rules.length === 0 && !showForm && (
        <div className="empty-state">
          <p>Rules help Claude understand your family's preferences and constraints.</p>
          <p className="hint">Example: "We always rent beach gear on arrival — don't pack towels or chairs."</p>
        </div>
      )}

      {rules.map(r => (
        <div key={r.id} className="rule-card card">
          {editingId === r.id ? (
            <>
              <textarea
                className="form-textarea"
                value={editDraft}
                onChange={e => setEditDraft(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="card-actions">
                <button className="btn-primary" onClick={() => saveEdit(r.id)}>Save</button>
                <button className="btn-outline" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            </>
          ) : (
            <div className="rule-content">
              <p className="rule-prose">{r.prose}</p>
              <div className="card-btn-group">
                <button className="icon-btn" onClick={() => { setEditDraft(r.prose); setEditingId(r.id) }} title="Edit">
                  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button className="icon-btn danger" onClick={() => onUpdate(rules.filter(rule => rule.id !== r.id))} title="Delete">
                  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 5H13M6 5V3H10V5M5 5L5.5 13H10.5L11 5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
