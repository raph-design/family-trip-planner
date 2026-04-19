import { useState } from 'react'
import BackgroundPhoto from './BackgroundPhoto'
import PackingList from './PackingList'
import TripDebrief from './TripDebrief'
import { generatePackingList } from '../services/claudeApi'

export default function TripView({ trip, travelers, familyRules, trips, onUpdate, onBack }) {
  const [activeTab, setActiveTab] = useState('packing')
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState('')

  const isPast = new Date(trip.endDate + 'T23:59:59') < new Date()
  const tripTravelers = travelers.filter(t => trip.travelers?.includes(t.id))

  const dateRange = (() => {
    const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${fmt(trip.startDate)} – ${fmt(trip.endDate)}`
  })()

  async function handleRegenerate() {
    if (!confirm('Regenerate packing list? Your edits and check marks will be lost.')) return
    setIsRegenerating(true)
    setError('')
    try {
      const pastDebriefs = trips.filter(t =>
        t.id !== trip.id && t.debrief && (
          t.destination.toLowerCase().includes(trip.destination.toLowerCase().split(',')[0].trim()) ||
          t.tripType === trip.tripType
        )
      ).slice(-3)

      const packingList = await generatePackingList({
        trip,
        travelers: tripTravelers,
        familyRules,
        weatherSummary: trip.weatherSummary ?? 'Weather data unavailable.',
        pastDebriefs
      })
      onUpdate({ ...trip, packingList })
    } catch (err) {
      setError(err.message)
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className="trip-view">
      <BackgroundPhoto
        photoUrl={trip.backgroundPhotoUrl}
        destination={trip.destination}
        dateRange={`${dateRange} · ${trip.tripType}`}
        weatherSummary={trip.weatherSummary}
      />

      <div className="trip-content">
        <div className="trip-nav-bar">
          <button className="back-btn" onClick={onBack}>
            <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 4L6 8L10 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Trips
          </button>
          {isPast && (
            <div className="trip-tabs">
              <button
                className={`tab-btn${activeTab === 'packing' ? ' active' : ''}`}
                onClick={() => setActiveTab('packing')}
              >
                Packing
              </button>
              <button
                className={`tab-btn${activeTab === 'debrief' ? ' active' : ''}`}
                onClick={() => setActiveTab('debrief')}
              >
                Debrief{trip.debrief ? ' ✓' : ''}
              </button>
            </div>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}

        {isRegenerating ? (
          <div className="generating-screen mini">
            <div className="generating-content">
              <div className="generating-spinner" />
              <p className="generating-step">Regenerating packing list...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'packing' && trip.packingList && (
              <PackingList
                packingList={trip.packingList}
                onUpdate={pl => onUpdate({ ...trip, packingList: pl })}
                onRegenerate={handleRegenerate}
              />
            )}
            {activeTab === 'debrief' && (
              <TripDebrief
                debrief={trip.debrief}
                onSave={debrief => onUpdate({ ...trip, debrief })}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
