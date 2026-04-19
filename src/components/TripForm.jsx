import { useState } from 'react'
import { v4 as uuid } from 'uuid'
import { fetchWeatherForecast, fetchHistoricalClimate, summarizeWeather, summarizeClimate } from '../services/weather'
import { fetchDestinationPhoto } from '../services/unsplash'
import { generatePackingList } from '../services/claudeApi'
import TripDocUpload from './TripDocUpload'

const TRIP_TYPES = ['beach', 'hiking', 'city', 'family visit', 'other']
const STEPS = ['Getting weather forecast...', 'Finding a destination photo...', 'Asking Claude to pack your bags...']

export default function TripForm({ travelers, familyRules, trips, onSave, onCancel }) {
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [tripType, setTripType] = useState('beach')
  const [selectedTravelers, setSelectedTravelers] = useState(travelers.map(t => t.id))
  const [notes, setNotes] = useState('')
  const [docFilled, setDocFilled] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatingStep, setGeneratingStep] = useState('')
  const [error, setError] = useState('')

  function toggleTraveler(id) {
    setSelectedTravelers(sel => sel.includes(id) ? sel.filter(s => s !== id) : [...sel, id])
  }

  function handleDocApply({ destination: d, startDate: s, endDate: e, tripType: t, notes: n }) {
    if (d) setDestination(d)
    if (s) setStartDate(s)
    if (e) setEndDate(e)
    if (t && TRIP_TYPES.includes(t)) setTripType(t)
    if (n) setNotes(prev => prev ? `${prev}\n\n${n}` : n)
    setDocFilled(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!destination.trim() || !startDate || !endDate) return

    setIsGenerating(true)
    setError('')

    try {
      const tripTravelers = travelers.filter(t => selectedTravelers.includes(t.id))
      const pastDebriefs = trips
        .filter(t => t.debrief && (
          t.destination.toLowerCase().includes(destination.toLowerCase().split(',')[0].trim()) ||
          t.tripType === tripType
        ))
        .slice(-3)

      setGeneratingStep(STEPS[0])
      const forecast = await fetchWeatherForecast(destination, startDate, endDate)
      let weatherSummary
      if (forecast?.daily?.temperature_2m_max?.length) {
        weatherSummary = summarizeWeather(forecast)
      } else {
        const climate = await fetchHistoricalClimate(destination, startDate, endDate)
        weatherSummary = climate ? summarizeClimate(climate) : 'Weather forecast unavailable.'
      }

      setGeneratingStep(STEPS[1])
      const backgroundPhotoUrl = await fetchDestinationPhoto(destination)

      setGeneratingStep(STEPS[2])
      const tripParams = { destination, startDate, endDate, tripType, notes }
      const { packingList, contextSummary } = await generatePackingList({
        trip: tripParams,
        travelers: tripTravelers,
        familyRules,
        weatherSummary,
        pastDebriefs
      })

      onSave({
        id: uuid(),
        destination,
        startDate,
        endDate,
        tripType,
        travelers: selectedTravelers,
        notes,
        backgroundPhotoUrl,
        weatherSummary,
        contextSummary,
        packingList,
        debrief: null,
        createdAt: new Date().toISOString()
      })
    } catch (err) {
      setError(err.message || 'Something went wrong. Check your API key and try again.')
    } finally {
      setIsGenerating(false)
      setGeneratingStep('')
    }
  }

  if (isGenerating) {
    return (
      <div className="generating-screen">
        <div className="generating-content">
          <div className="generating-spinner" />
          <p className="generating-step">{generatingStep}</p>
          <p className="generating-dest">{destination}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="section">
      <div className="section-header">
        <h2>Plan a Trip</h2>
        <button className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {docFilled ? (
        <div className="doc-filled-banner">
          <span>Auto-filled from your documents — review and edit below</span>
          <button type="button" onClick={() => setDocFilled(false)}>Upload more</button>
        </div>
      ) : (
        <TripDocUpload onApply={handleDocApply} />
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Destination</label>
          <input
            className="form-input large"
            placeholder="e.g. Sonoma Coast, CA"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start date</label>
            <input
              className="form-input"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>End date</label>
            <input
              className="form-input"
              type="date"
              min={startDate}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Trip type</label>
          <div className="trip-type-grid">
            {TRIP_TYPES.map(type => (
              <button
                key={type}
                type="button"
                className={`trip-type-btn${tripType === type ? ' active' : ''}`}
                onClick={() => setTripType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Who's coming?</label>
          {travelers.length === 0 ? (
            <p className="hint">Add family members in the Family tab to include them here.</p>
          ) : (
            <div className="traveler-select-list">
              {travelers.map(t => (
                <label key={t.id} className="traveler-select-item">
                  <input
                    type="checkbox"
                    checked={selectedTravelers.includes(t.id)}
                    onChange={() => toggleTraveler(t.id)}
                  />
                  <span>{t.name}</span>
                  <span className="traveler-select-meta">{t.role}, {t.age}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Notes for Claude</label>
          <textarea
            className="form-textarea"
            placeholder="e.g. Renting a house with full kitchen. No need for beach towels."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <button
          className="btn-primary full-width"
          type="submit"
          disabled={!destination.trim() || !startDate || !endDate}
        >
          Generate Packing List
        </button>
      </form>
    </div>
  )
}
