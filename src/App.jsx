import { useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import TravelerProfiles from './components/TravelerProfiles'
import FamilyRules from './components/FamilyRules'
import TripForm from './components/TripForm'
import TripView from './components/TripView'
import './App.css'

export default function App() {
  const [travelers, setTravelers] = useLocalStorage('ftp_travelers', [])
  const [familyRules, setFamilyRules] = useLocalStorage('ftp_rules', [])
  const [trips, setTrips] = useLocalStorage('ftp_trips', [])
  const [view, setView] = useState({ type: 'trips' })

  function saveTrip(newTrip) {
    setTrips(ts => [...ts, newTrip])
    setView({ type: 'trip', tripId: newTrip.id })
  }

  function updateTrip(updatedTrip) {
    setTrips(ts => ts.map(t => t.id === updatedTrip.id ? updatedTrip : t))
  }

  const activeTrip = view.type === 'trip' ? trips.find(t => t.id === view.tripId) : null
  const activeTab = ['travelers', 'rules'].includes(view.type) ? view.type : 'trips'

  const upcomingTrips = trips
    .filter(t => new Date(t.endDate + 'T23:59:59') >= new Date())
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))

  const pastTrips = trips
    .filter(t => new Date(t.endDate + 'T23:59:59') < new Date())
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))

  // Full-screen views without bottom nav
  if (view.type === 'trip' && activeTrip) {
    return (
      <TripView
        trip={activeTrip}
        travelers={travelers}
        familyRules={familyRules}
        trips={trips}
        onUpdate={updateTrip}
        onBack={() => setView({ type: 'trips' })}
      />
    )
  }

  if (view.type === 'new-trip') {
    return (
      <div className="app-shell">
        <div className="main-content">
          <TripForm
            travelers={travelers}
            familyRules={familyRules}
            trips={trips}
            onSave={saveTrip}
            onCancel={() => setView({ type: 'trips' })}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="main-content">
        {activeTab === 'trips' && (
          <div className="section">
            <div className="section-header">
              <h2>Trips</h2>
              <button className="btn-primary small" onClick={() => setView({ type: 'new-trip' })}>
                + Plan Trip
              </button>
            </div>

            {trips.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">✈</div>
                <p>No trips yet. Plan your first trip and Claude will build a personalized packing list for your family.</p>
              </div>
            )}

            {upcomingTrips.length > 0 && (
              <div className="trip-group">
                <h3 className="trip-group-label">Upcoming</h3>
                {upcomingTrips.map(t => (
                  <TripCard key={t.id} trip={t} onClick={() => setView({ type: 'trip', tripId: t.id })} />
                ))}
              </div>
            )}

            {pastTrips.length > 0 && (
              <div className="trip-group">
                <h3 className="trip-group-label">Past</h3>
                {pastTrips.map(t => (
                  <TripCard key={t.id} trip={t} onClick={() => setView({ type: 'trip', tripId: t.id })} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'travelers' && (
          <TravelerProfiles travelers={travelers} onUpdate={setTravelers} />
        )}

        {activeTab === 'rules' && (
          <FamilyRules rules={familyRules} onUpdate={setFamilyRules} />
        )}
      </div>

      <nav className="bottom-nav">
        <button
          className={`nav-btn${activeTab === 'trips' ? ' active' : ''}`}
          onClick={() => setView({ type: 'trips' })}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2"/>
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
            <line x1="12" y1="12" x2="12" y2="12.01" strokeWidth="2.5"/>
          </svg>
          <span>Trips</span>
        </button>

        <button
          className={`nav-btn${activeTab === 'travelers' ? ' active' : ''}`}
          onClick={() => setView({ type: 'travelers' })}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <span>Family</span>
        </button>

        <button
          className={`nav-btn${activeTab === 'rules' ? ' active' : ''}`}
          onClick={() => setView({ type: 'rules' })}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <circle cx="3" cy="6" r="1" fill="currentColor"/>
            <circle cx="3" cy="12" r="1" fill="currentColor"/>
            <circle cx="3" cy="18" r="1" fill="currentColor"/>
          </svg>
          <span>Rules</span>
        </button>
      </nav>
    </div>
  )
}

function TripCard({ trip, onClick }) {
  const fmt = d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const dateRange = `${fmt(trip.startDate)} – ${fmt(trip.endDate)}`
  const allItems = Object.values(trip.packingList ?? {}).flat()
  const checkedCount = allItems.filter(i => i.checked).length

  return (
    <div
      className="trip-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      style={trip.backgroundPhotoUrl ? { backgroundImage: `url(${trip.backgroundPhotoUrl})` } : undefined}
    >
      <div className="trip-card-overlay" />
      <div className="trip-card-content">
        <div className="trip-card-main">
          <h3 className="trip-card-dest">{trip.destination}</h3>
          <p className="trip-card-dates">{dateRange} · {trip.tripType}</p>
        </div>
        {allItems.length > 0 && (
          <div className="trip-card-progress">
            {checkedCount}/{allItems.length}
          </div>
        )}
      </div>
    </div>
  )
}
