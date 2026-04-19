import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import TravelerCard from './TravelerCard'

const defaultNew = () => ({ name: '', role: 'adult', age: 30, alwaysPack: [] })

export default function TravelerProfiles({ travelers, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultNew())
  const [newPackItem, setNewPackItem] = useState('')

  function addPackItem() {
    const trimmed = newPackItem.trim()
    if (trimmed) {
      setForm(f => ({ ...f, alwaysPack: [...f.alwaysPack, trimmed] }))
      setNewPackItem('')
    }
  }

  function addTraveler() {
    if (!form.name.trim()) return
    onUpdate([...travelers, { ...form, name: form.name.trim(), id: uuid() }])
    setForm(defaultNew())
    setNewPackItem('')
    setShowForm(false)
  }

  function cancelForm() {
    setForm(defaultNew())
    setNewPackItem('')
    setShowForm(false)
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>Our Family</h2>
        <button className="btn-primary small" onClick={() => showForm ? cancelForm() : setShowForm(true)}>
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="form-group">
            <label>Name</label>
            <input
              className="form-input"
              placeholder="Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && addTraveler()}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="adult">Adult</option>
                <option value="child">Child</option>
              </select>
            </div>
            <div className="form-group">
              <label>Age</label>
              <input
                className="form-input"
                type="number"
                min="0"
                max="120"
                value={form.age}
                onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Always pack</label>
            {form.alwaysPack.length > 0 && (
              <div className="tag-list" style={{ marginBottom: 8 }}>
                {form.alwaysPack.map((item, i) => (
                  <span key={i} className="tag">
                    {item}
                    <button onClick={() => setForm(f => ({ ...f, alwaysPack: f.alwaysPack.filter((_, j) => j !== i) }))}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div className="tag-add-row">
              <input
                className="form-input"
                placeholder="e.g. Favorite stuffed animal"
                value={newPackItem}
                onChange={e => setNewPackItem(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addPackItem() }}
              />
              <button className="btn-sm" onClick={addPackItem}>Add</button>
            </div>
          </div>
          <button className="btn-primary full-width" onClick={addTraveler} disabled={!form.name.trim()}>
            Add to Family
          </button>
        </div>
      )}

      {travelers.length === 0 && !showForm && (
        <div className="empty-state">
          <p>Add your family members so Claude can personalize packing lists for each person.</p>
        </div>
      )}

      {travelers.map(t => (
        <TravelerCard
          key={t.id}
          traveler={t}
          onUpdate={updated => onUpdate(travelers.map(tr => tr.id === updated.id ? updated : tr))}
          onDelete={() => onUpdate(travelers.filter(tr => tr.id !== t.id))}
        />
      ))}
    </div>
  )
}
