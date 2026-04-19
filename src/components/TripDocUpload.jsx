import { useState, useRef } from 'react'
import { extractTripDetails } from '../services/claudeApi'

const ACCEPT = '.pdf,.html,.htm,.ics,.txt,.eml,.md,.csv,.json,.jpg,.jpeg,.png,.webp,.gif'

const TEXT_EXTS = new Set(['html', 'htm', 'txt', 'ics', 'eml', 'md', 'csv', 'json', 'tsv', 'log', 'xml'])
const IMAGE_EXTS = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }

function readFileData(file) {
  return new Promise((resolve, reject) => {
    const name = file.name
    const ext = name.split('.').pop()?.toLowerCase() ?? ''
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Failed to read ${name}`))

    if (ext === 'pdf') {
      reader.onload = e => resolve({ kind: 'pdf', name, mediaType: 'application/pdf', content: e.target.result.split(',')[1] })
      reader.readAsDataURL(file)
    } else if (IMAGE_EXTS[ext]) {
      reader.onload = e => resolve({ kind: 'image', name, mediaType: IMAGE_EXTS[ext], content: e.target.result.split(',')[1] })
      reader.readAsDataURL(file)
    } else if (TEXT_EXTS.has(ext) || file.type.startsWith('text/')) {
      reader.onload = e => resolve({ kind: 'text', name, content: e.target.result })
      reader.readAsText(file)
    } else {
      reject(new Error(`Unsupported file type: ${name}`))
    }
  })
}

function formatDate(d) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TripDocUpload({ onApply }) {
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extracted, setExtracted] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  function addFiles(incoming) {
    const arr = Array.from(incoming)
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...arr.filter(f => !existing.has(f.name))]
    })
    setExtracted(null)
    setError('')
  }

  function removeFile(name) {
    setFiles(f => f.filter(x => x.name !== name))
    setExtracted(null)
    setError('')
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  async function handleExtract() {
    if (!files.length) return
    setIsExtracting(true)
    setError('')
    try {
      const fileData = await Promise.all(files.map(readFileData))
      const result = await extractTripDetails(fileData)
      setExtracted(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsExtracting(false)
    }
  }

  function handleApply() {
    if (!extracted) return
    onApply({
      destination: extracted.destination ?? null,
      startDate: extracted.startDate ?? null,
      endDate: extracted.endDate ?? null,
      tripType: extracted.tripType ?? null,
      notes: extracted.notes ?? null,
    })
    setFiles([])
    setExtracted(null)
  }

  if (isExtracting) {
    return (
      <div className="doc-upload extracting">
        <div className="doc-upload-spinner" />
        <span>Reading your documents...</span>
      </div>
    )
  }

  if (extracted) {
    const rows = [
      extracted.destination && { label: 'Destination', value: extracted.destination },
      (extracted.startDate || extracted.endDate) && {
        label: 'Dates',
        value: [extracted.startDate && formatDate(extracted.startDate), extracted.endDate && formatDate(extracted.endDate)]
          .filter(Boolean).join(' – ')
      },
      extracted.tripType && { label: 'Trip type', value: extracted.tripType },
      extracted.notes && { label: 'Notes', value: extracted.notes },
    ].filter(Boolean)

    return (
      <div className="doc-upload preview">
        <div className="doc-extract-header">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3 8.5L6.5 12L13 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Found trip details</span>
        </div>
        {extracted.summary && <p className="doc-extract-summary">{extracted.summary}</p>}
        <div className="doc-extract-fields">
          {rows.length > 0
            ? rows.map(r => (
                <div key={r.label} className="doc-extract-row">
                  <span className="doc-extract-label">{r.label}</span>
                  <span className="doc-extract-value">{r.value}</span>
                </div>
              ))
            : <p className="doc-extract-empty">No trip details could be confidently extracted.</p>
          }
        </div>
        <div className="doc-extract-actions">
          <button type="button" className="btn-primary" onClick={handleApply} disabled={rows.length === 0}>
            Apply to form
          </button>
          <button type="button" className="btn-outline" onClick={() => setExtracted(null)}>
            Discard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="doc-upload-section">
      <div
        className={`doc-dropzone${isDragging ? ' dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          style={{ display: 'none' }}
          onChange={e => { addFiles(e.target.files); e.target.value = '' }}
        />
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="doc-dropzone-label">
          {files.length > 0 ? 'Drop more files' : 'Drop booking confirmations here'}
        </p>
        <p className="doc-dropzone-hint">PDF, HTML, image, .ics, .txt · click to browse</p>
      </div>

      {files.length > 0 && (
        <>
          <div className="doc-file-list">
            {files.map(f => (
              <span key={f.name} className="file-chip">
                <span className="file-chip-name">{f.name}</span>
                <button type="button" className="file-chip-remove" onClick={e => { e.stopPropagation(); removeFile(f.name) }}>×</button>
              </span>
            ))}
          </div>
          {error && <p className="doc-error">{error}</p>}
          <button type="button" className="btn-primary full-width" onClick={handleExtract}>
            Extract trip details
          </button>
        </>
      )}
      {error && files.length === 0 && <p className="doc-error">{error}</p>}
    </div>
  )
}
