export default function BackgroundPhoto({ photoUrl, destination, dateRange, weatherSummary }) {
  return (
    <div
      className="bg-photo-container"
      style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}
    >
      <div className="bg-photo-overlay" />
      <div className="bg-photo-content">
        <h1 className="trip-destination">{destination}</h1>
        <p className="trip-dates">{dateRange}</p>
        {weatherSummary && <p className="trip-weather">{weatherSummary}</p>}
      </div>
    </div>
  )
}
