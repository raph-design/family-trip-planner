import { useState } from 'react'
import PackingItem from './PackingItem'

export default function PackingCategory({ name, items, onUpdateItems }) {
  const [collapsed, setCollapsed] = useState(false)
  const [newItem, setNewItem] = useState('')

  const checkedCount = items.filter(i => i.checked).length

  function addItem() {
    const trimmed = newItem.trim()
    if (trimmed) {
      onUpdateItems([...items, { item: trimmed, checked: false, addedBy: 'user' }])
      setNewItem('')
    }
  }

  return (
    <div className="packing-category">
      <button className="category-header" onClick={() => setCollapsed(c => !c)}>
        <span className="category-name">{name}</span>
        <span className="category-meta">
          {checkedCount > 0
            ? <span className="checked-count">{checkedCount}/{items.length}</span>
            : <span>{items.length}</span>
          }
        </span>
        <svg className={`chevron${collapsed ? '' : ' open'}`} viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6L8 10L12 6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {!collapsed && (
        <div className="category-body">
          {items.map((item, idx) => (
            <PackingItem
              key={idx}
              item={item}
              onToggle={() => onUpdateItems(items.map((it, i) => i === idx ? { ...it, checked: !it.checked } : it))}
              onUpdate={text => onUpdateItems(items.map((it, i) => i === idx ? { ...it, item: text } : it))}
              onDelete={() => onUpdateItems(items.filter((_, i) => i !== idx))}
            />
          ))}
          <div className="add-item-row">
            <input
              className="add-item-input"
              placeholder="Add item..."
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            <button className="add-item-btn" onClick={addItem} disabled={!newItem.trim()}>+</button>
          </div>
        </div>
      )}
    </div>
  )
}
