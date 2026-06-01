import { useCallback, useEffect, useRef, useState } from 'react'
import { loadWorkspace, saveWorkspace } from '../services/workspaceApi'

const CACHE_KEY = 'ftp_workspace_cache'
const LEGACY_KEYS = { trips: 'ftp_trips', travelers: 'ftp_travelers', rules: 'ftp_rules' }
const SAVE_DEBOUNCE_MS = 700

const EMPTY = { trips: [], travelers: [], rules: [] }

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) return { ...EMPTY, ...JSON.parse(raw) }
  } catch { /* ignore */ }

  const legacy = { ...EMPTY }
  let found = false
  for (const [k, storageKey] of Object.entries(LEGACY_KEYS)) {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          legacy[k] = parsed
          found = true
        }
      }
    } catch { /* ignore */ }
  }
  return found ? legacy : EMPTY
}

function writeCache(workspace) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(workspace))
  } catch { /* ignore quota */ }
}

function isEmpty(workspace) {
  return !workspace.trips?.length && !workspace.travelers?.length && !workspace.rules?.length
}

export function useWorkspace() {
  const [workspace, setWorkspace] = useState(readCache)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const skipNextSaveRef = useRef(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const remote = await loadWorkspace()
        if (cancelled) return
        setWorkspace(local => {
          if (isEmpty(remote) && !isEmpty(local)) {
            skipNextSaveRef.current = false
            return local
          }
          skipNextSaveRef.current = true
          return {
            trips: remote.trips ?? [],
            travelers: remote.travelers ?? [],
            rules: remote.rules ?? [],
          }
        })
        setStatus('ready')
      } catch (err) {
        if (cancelled) return
        setError(err.message)
        setStatus(err.status === 401 ? 'unauthorized' : 'offline')
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    writeCache(workspace)
    if (status !== 'ready') return
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      return
    }
    const timer = setTimeout(async () => {
      try {
        await saveWorkspace(workspace)
        setError('')
      } catch (err) {
        setError(err.message)
      }
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [workspace, status])

  const setTrips = useCallback((updater) => {
    setWorkspace(prev => {
      const next = typeof updater === 'function' ? updater(prev.trips ?? []) : updater
      return { ...prev, trips: next }
    })
  }, [])

  const setTravelers = useCallback((updater) => {
    setWorkspace(prev => {
      const next = typeof updater === 'function' ? updater(prev.travelers ?? []) : updater
      return { ...prev, travelers: next }
    })
  }, [])

  const setRules = useCallback((updater) => {
    setWorkspace(prev => {
      const next = typeof updater === 'function' ? updater(prev.rules ?? []) : updater
      return { ...prev, rules: next }
    })
  }, [])

  return {
    trips: workspace.trips,
    travelers: workspace.travelers,
    rules: workspace.rules,
    setTrips,
    setTravelers,
    setRules,
    status,
    error,
  }
}
