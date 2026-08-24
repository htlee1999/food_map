// Proximity ranking for the "Where are you headed?" nearby suggestions:
// distance maths plus the tier-weighted "top pick" heuristic.

// Only suggest places within this radius of the destination.
export const NEARBY_RADIUS_KM = 3

const EARTH_RADIUS_KM = 6371

// Relative desirability of each tier, used to weight the single "top pick" so a
// stellar spot slightly further out can beat a mediocre one next door.
const TIER_WEIGHT = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1 }

// How many tier points one kilometre of travel is worth. Tuned so that within
// the 3km radius tier dominates but distance breaks ties between equal tiers.
const DISTANCE_PENALTY_PER_KM = 1

const toRadians = (degrees) => (degrees * Math.PI) / 180

// Great-circle distance in kilometres between two { lat, lng } points.
export function haversineKm(from, to) {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

// Places within `radiusKm` of `anchor`, nearest first, each annotated with a
// `distanceKm` field. Places without coordinates are skipped.
export function rankByProximity(places, anchor, { radiusKm = NEARBY_RADIUS_KM } = {}) {
  if (!Array.isArray(places) || !anchor) return []

  return places
    .filter((place) => place.coords)
    .map((place) => ({ ...place, distanceKm: haversineKm(anchor, place.coords) }))
    .filter((place) => place.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
}

// The single recommended spot: best tier, with nearer places winning ties.
// Expects the output of rankByProximity (each place carries `distanceKm`).
// Returns null when there are no candidates.
export function pickTopPick(rankedPlaces) {
  if (!Array.isArray(rankedPlaces) || rankedPlaces.length === 0) return null

  const scoreOf = (place) =>
    (TIER_WEIGHT[place.tier] || 0) - place.distanceKm * DISTANCE_PENALTY_PER_KM

  return rankedPlaces.reduce((best, place) =>
    scoreOf(place) > scoreOf(best) ? place : best
  )
}

// Human-friendly distance: metres under 1km, otherwise one-decimal km.
export function formatDistance(distanceKm) {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`
  return `${distanceKm.toFixed(1)} km`
}
