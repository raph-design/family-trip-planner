export async function fetchWeatherForecast(destination, startDate, endDate) {
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`
    )
    const geoData = await geoRes.json()
    if (!geoData.results?.length) return null

    const { latitude, longitude, name, country } = geoData.results[0]

    const today = new Date().toISOString().split('T')[0]
    const maxDate = new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const start = startDate > today ? startDate : today
    const end = endDate < maxDate ? endDate : maxDate
    if (start > end) return null

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
      `&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto` +
      `&start_date=${start}&end_date=${end}`
    )
    const weatherData = await weatherRes.json()
    return { location: `${name}, ${country}`, ...weatherData }
  } catch {
    return null
  }
}

export function summarizeWeather(weatherData) {
  if (!weatherData?.daily?.temperature_2m_max?.length) return 'Weather forecast unavailable.'
  const { temperature_2m_max, temperature_2m_min, precipitation_sum } = weatherData.daily
  const avgHigh = Math.round(temperature_2m_max.reduce((a, b) => a + b, 0) / temperature_2m_max.length)
  const avgLow = Math.round(temperature_2m_min.reduce((a, b) => a + b, 0) / temperature_2m_min.length)
  const rainyDays = precipitation_sum.filter(p => p > 0.1).length
  const totalRain = precipitation_sum.reduce((a, b) => a + b, 0).toFixed(1)
  let summary = `${weatherData.location}: Highs around ${avgHigh}°F, lows around ${avgLow}°F.`
  summary += rainyDays > 0
    ? ` Rain expected on ${rainyDays} day(s) (total ~${totalRain}").`
    : ' No significant rain expected.'
  return summary
}
