import { useState } from 'react'
import PackingCategory from './PackingCategory'

export default function PackingList({ packingList, onUpdate, onRegenerate }) {
  const [newCategory, setNewCategory] = useState('')
  const [showAddCat, setShowAddCat] = useState(false)

  const allItems = Object.values(packingList).flat()
  const checkedCount = allItems.filter(i => i.checked).length
  const progress = allItems.length > 0 ? Math.round((checkedCount / allItems.length) * 100) : 0

  function addCategory() {
    const name = newCategory.trim()
    if (name && !packingList[name]) {
      onUpdate({ ...packingList, [name]: [] })
      setNewCategory('')
      setShowAddCat(false)
    }
  }

  return (
    <div className="packing-list">
      <div className="packing-progress">
        <div className="progress-header">
          <span className="progress-label">{checkedCount} of {allItems.length} packed</span>
          <span className="progress-pct">{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {Object.entries(packingList).map(([cat, items]) => (
        <PackingCategory
          key={cat}
          name={cat}
          items={items}
          onUpdateItems={newItems => {
            const updated = { ...packingList }
            if (newItems.length === 0) delete updated[cat]
            else updated[cat] = newItems
            onUpdate(updated)
          }}
        />
      ))}

      {showAddCat ? (
        <div className="add-category-row">
          <input
            autoFocus
            className="add-item-input"
            placeholder="Category name..."
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') addCategory()
              if (e.key === 'Escape') setShowAddCat(false)
            }}
          />
          <button className="btn-sm" onClick={addCategory}>Add</button>
          <button className="btn-sm secondary" onClick={() => setShowAddCat(false)}>Cancel</button>
        </div>
      ) : (
        <button className="add-category-btn" onClick={() => setShowAddCat(true)}>
          + Add Category
        </button>
      )}

      <div className="packing-footer">
        <button className="btn-outline" onClick={onRegenerate}>
          Regenerate with Claude
        </button>
      </div>
    </div>
  )
}
