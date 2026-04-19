import { useState, useRef, useEffect } from 'react'

export default function PackingItem({ item, onToggle, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.item)
  const inputRef = useRef()

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function handleSave() {
    const trimmed = draft.trim()
    if (trimmed) onUpdate(trimmed)
    else onDelete()
    setEditing(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') { setDraft(item.item); setEditing(false) }
  }

  return (
    <div className={`packing-item${item.checked ? ' checked' : ''}`}>
      <button className="check-btn" onClick={onToggle} aria-label={item.checked ? 'Uncheck' : 'Check'}>
        <div className={`check-circle${item.checked ? ' filled' : ''}`}>
          {item.checked && (
            <svg viewBox="0 0 10 8" width="10" height="8">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </button>

      {editing ? (
        <input
          ref={inputRef}
          className="item-edit-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <span className="item-label" onDoubleClick={() => { setDraft(item.item); setEditing(true) }}>
          {item.item}
        </span>
      )}

      <div className="item-actions">
        <button className="item-btn edit" onClick={() => { setDraft(item.item); setEditing(true) }} title="Edit">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="item-btn delete" onClick={onDelete} title="Delete">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 5H13M6 5V3H10V5M5 5L5.5 13H10.5L11 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
