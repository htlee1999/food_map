/**
 * Helpers for building external map navigation URLs (Google Maps, Waze, Apple
 * Maps). Used by both ViewAllModal (Vue template) and MapContainer (raw HTML
 * popup), so the URL formats stay in sync.
 */

const NO_COORDS = '#'

export function getGoogleMapsUrl(place) {
  if (!place?.coords) return NO_COORDS
  const { lat, lng } = place.coords
  const encodedName = place.name ? encodeURIComponent(place.name) : ''
  const placeParam = encodedName ? `&destination_place_id=${encodedName}` : ''
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${placeParam}`
}

export function getWazeUrl(place) {
  if (!place?.coords) return NO_COORDS
  const { lat, lng } = place.coords
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
}

export function getAppleMapsUrl(place) {
  if (!place?.coords) return NO_COORDS
  const { lat, lng } = place.coords
  return `https://maps.apple.com/?daddr=${lat},${lng}`
}
