async function geocode(destination) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`
  )
  const data = await res.json()
  if (!data.results?.length) return null
  const { latitude, longitude, name, country } = data.results[0]
  return { latitude, longitude, location: `${name}, ${country}` }
}

export async function fetchWeatherForecast(destination, startDate, endDate) {
  try {
    const geo = await geocode(destination)
    if (!geo) return null

    const today = new Date().toISOString().split('T')[0]
    const maxDate = new Date(Date.now() + 16 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const start = startDate > today ? startDate : today
    const end = endDate < maxDate ? endDate : maxDate
    if (start > end) return null

    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
      `&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto` +
      `&start_date=${start}&end_date=${end}`
    )
    const weatherData = await weatherRes.json()
    return { location: geo.location, source: 'forecast', ...weatherData }
  } catch {
    return null
  }
}

export async function fetchHistoricalClimate(destination, startDate, endDate) {
  try {
    const geo = await geocode(destination)
    if (!geo) return null

    const YEARS = 5
    const currentYear = new Date().getUTCFullYear()
    const requests = []
    for (let offset = 1; offset <= YEARS; offset++) {
      const year = currentYear - offset
      const start = `${year}-${startDate.slice(5)}`
      const end = `${year}-${endDate.slice(5)}`
      requests.push(fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${geo.latitude}&longitude=${geo.longitude}` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
        `&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto` +
        `&start_date=${start}&end_date=${end}`
      ).then(r => r.ok ? r.json() : null).catch(() => null))
    }

    const results = (await Promise.all(requests)).filter(Boolean)
    const allMax = results.flatMap(r => r.daily?.temperature_2m_max ?? []).filter(v => typeof v === 'number')
    const allMin = results.flatMap(r => r.daily?.temperature_2m_min ?? []).filter(v => typeof v === 'number')
    const allPrecip = results.flatMap(r => r.daily?.precipitation_sum ?? []).filter(v => typeof v === 'number')
    if (allMax.length === 0 || allMin.length === 0) return null

    const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length
    const percentile = (arr, p) => {
      const sorted = [...arr].sort((a, b) => a - b)
      return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)))]
    }

    return {
      location: geo.location,
      source: 'climate',
      yearsAveraged: results.length,
      typicalHigh: Math.round(avg(allMax)),
      typicalLow: Math.round(avg(allMin)),
      highLow: Math.round(percentile(allMax, 0.25)),
      highHigh: Math.round(percentile(allMax, 0.75)),
      lowLow: Math.round(percentile(allMin, 0.25)),
      lowHigh: Math.round(percentile(allMin, 0.75)),
      rainyDayFraction: allPrecip.length ? allPrecip.filter(p => p > 0.1).length / allPrecip.length : 0,
    }
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
  let summary = `Forecast for ${weatherData.location}: highs around ${avgHigh}°F, lows around ${avgLow}°F.`
  summary += rainyDays > 0
    ? ` Rain expected on ${rainyDays} day(s) (total ~${totalRain}").`
    : ' No significant rain expected.'
  return summary
}

export function summarizeClimate(climate) {
  if (!climate) return 'Weather forecast unavailable.'
  const rainPct = Math.round(climate.rainyDayFraction * 100)
  const rainSentence = rainPct >= 25
    ? ` Rain is common this time of year (~${rainPct}% of days historically).`
    : rainPct >= 5
      ? ` Occasional rain is possible (~${rainPct}% of days historically).`
      : ' Rain is uncommon this time of year.'
  return `Live forecast unavailable (trip is beyond the 16-day forecast window). Historical averages for ${climate.location} on these dates (past ${climate.yearsAveraged} years): typical highs ${climate.highLow}–${climate.highHigh}°F (avg ${climate.typicalHigh}°F), typical lows ${climate.lowLow}–${climate.lowHigh}°F (avg ${climate.typicalLow}°F).${rainSentence}`
}
