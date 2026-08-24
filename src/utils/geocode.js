// Address → coordinates via the Google Geocoding API. Shared by AddPlaceForm
// (adding a place) and NearbyModal (finding food near a destination) so the
// fallback strategy lives in one place.

import { classifyRegion } from './regionMapping'

const GEOCODE_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json'
const API_KEY_PLACEHOLDER = 'your_google_maps_api_key_here'

const getApiKey = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAP_API || API_KEY_PLACEHOLDER
  if (apiKey === API_KEY_PLACEHOLDER) {
    throw new Error(
      'Google Maps API key not configured. Please set VITE_GOOGLE_MAP_API in your environment variables.'
    )
  }
  return apiKey
}

const requestGeocode = async (query, apiKey) => {
  const response = await fetch(
    `${GEOCODE_ENDPOINT}?address=${encodeURIComponent(query)}&key=${apiKey}&region=sg`
  )
  return response.json()
}

// Progressive fallbacks, most precise first. A null query means the strategy
// doesn't apply to this address and is skipped.
const buildStrategies = (address) => {
  const addressWithoutUnit = address
    .replace(/#\d+-\d+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  const streetMatch = address.match(/(\d+\s+[^,]+)/)
  const buildingMatch = address.match(
    /([A-Za-z\s]+Plaza|[A-Za-z\s]+Building|[A-Za-z\s]+Centre|[A-Za-z\s]+Mall)/i
  )

  return [
    { query: address, confidence: 'high' },
    {
      query: addressWithoutUnit !== address ? addressWithoutUnit : null,
      confidence: 'medium',
    },
    {
      query:
        streetMatch && buildingMatch
          ? `${streetMatch[1]}, ${buildingMatch[1]}, Singapore`
          : null,
      confidence: 'low',
    },
    {
      query: streetMatch ? `${streetMatch[1]}, Singapore` : null,
      confidence: 'very-low',
    },
  ]
}

// Resolves an address to { lat, lng, confidence, formatted_address, region }.
// Returns null when the address genuinely can't be found (ZERO_RESULTS) so the
// caller can show its own guidance. Throws on configuration, quota, and network
// failures, which the user can act on differently.
export async function geocodeAddress(address) {
  const apiKey = getApiKey()
  let lastStatus = null

  try {
    for (const { query, confidence } of buildStrategies(address)) {
      if (!query) continue

      const data = await requestGeocode(query, apiKey)
      lastStatus = data.status

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0]
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          confidence,
          formatted_address: result.formatted_address,
          region: classifyRegion(query, result.formatted_address),
        }
      }
    }
  } catch {
    throw new Error(
      'Failed to geocode address. Please check your internet connection and try again.'
    )
  }

  if (lastStatus === 'OVER_QUERY_LIMIT') {
    throw new Error('Geocoding service temporarily unavailable. Please try again later.')
  }
  if (lastStatus === 'REQUEST_DENIED') {
    throw new Error('Geocoding service access denied. Please check your API key configuration.')
  }

  return null
}
