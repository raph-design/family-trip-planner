import { useState } from 'react'

export default function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password) return
    setChecking(true)
    setError(null)
    try {
      const res = await fetch('/api/workspace', {
        method: 'GET',
        headers: { Authorization: `Bearer ${password}` },
      })
      if (res.ok) {
        onUnlock(password)
        return
      }
      if (res.status === 401) {
        setError('wrong')
        setPassword('')
        return
      }
      const body = await res.json().catch(() => ({}))
      setError(body.error?.message || `Server error (${res.status})`)
    } catch (err) {
      setError(err.message || 'Network error — try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="password-gate">
      <div className="password-card">
        <div className="password-icon" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 24L44 6L36 46L22 30L4 24Z"/>
            <path d="M22 30L36 46"/>
            <path d="M22 30L44 6"/>
          </svg>
        </div>
        <h1 className="password-title">Family Trip Planner</h1>
        <p className="password-subtitle">Enter the family password to start packing.</p>
        <form onSubmit={handleSubmit} className={error === 'wrong' ? 'shake' : ''}>
          <input
            className="form-input large password-input"
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); if (error === 'wrong') setError(null) }}
            placeholder="Password"
            autoFocus
            autoComplete="current-password"
            disabled={checking}
          />
          {error && (
            <p className="password-error">
              {error === 'wrong' ? "That password isn't quite right — try again." : error}
            </p>
          )}
          <button type="submit" className="btn-primary full-width" disabled={!password || checking}>
            {checking ? 'Checking…' : "Let's go"}
          </button>
        </form>
      </div>
    </div>
  )
}
