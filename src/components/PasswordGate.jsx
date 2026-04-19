import { useState } from 'react'

export default function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const correctPassword = import.meta.env.VITE_APP_PASSWORD ?? ''

  function handleSubmit(e) {
    e.preventDefault()
    if (!correctPassword) {
      setError('Password is not configured. Set VITE_APP_PASSWORD in .env and restart.')
      return
    }
    if (password === correctPassword) {
      onUnlock(password)
      return
    }
    setError('wrong')
    setPassword('')
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
          />
          {error && (
            <p className="password-error">
              {error === 'wrong' ? "That password isn't quite right — try again." : error}
            </p>
          )}
          <button type="submit" className="btn-primary full-width" disabled={!password}>
            Let's go
          </button>
        </form>
      </div>
    </div>
  )
}
