/**
 * Singapore Region Classification Utility
 *
 * Maps postal codes and addresses to Singapore's 5 main regions:
 * - Central: CBD, Orchard, Marina, Bukit Merah, Toa Payoh, Bishan, etc.
 * - East: Bedok, Tampines, Pasir Ris, Changi
 * - West: Jurong, Clementi, Bukit Batok, Choa Chu Kang
 * - North: Woodlands, Yishun, Sembawang, Mandai
 * - North-East: Sengkang, Punggol, Hougang, Serangoon, Ang Mo Kio
 *
 * Based on Singapore postal sector codes:
 * https://www.ura.gov.sg/Corporate/Guidelines/Development-Control/gross-floor-area/GFA/Basements
 */

// Postal sector to region mapping
// Singapore postal codes: First 2 digits indicate the sector
const POSTAL_SECTOR_TO_REGION = {
  // Central Region (01-20, 22-27, 29-42)
  '01': 'Central', '02': 'Central', '03': 'Central', '04': 'Central', '05': 'Central', '06': 'Central',
  '07': 'Central', '08': 'Central', '09': 'Central', '10': 'Central', '11': 'Central', '12': 'Central',
  '13': 'Central', '14': 'Central', '15': 'Central', '16': 'Central', '17': 'Central', '18': 'Central',
  '20': 'Central', '21': 'Central', '22': 'Central', '23': 'Central', '24': 'Central', '25': 'Central',
  '26': 'Central', '27': 'Central', '29': 'Central', '30': 'Central', '31': 'Central', '32': 'Central',
  '33': 'Central', '34': 'Central', '35': 'Central', '36': 'Central', '37': 'Central', '38': 'Central',
  '39': 'Central', '40': 'Central', '41': 'Central', '42': 'Central',

  // North-East Region (19, 28, 53-57, 79-80, 82)
  '19': 'North-East', '28': 'North-East',
  '53': 'North-East', '54': 'North-East', '55': 'North-East', '56': 'North-East', '57': 'North-East',
  '79': 'North-East', '80': 'North-East', '82': 'North-East',

  // East Region (43-52, 81)
  '43': 'East', '44': 'East', '45': 'East', '46': 'East', '47': 'East', '48': 'East',
  '49': 'East', '50': 'East', '51': 'East', '52': 'East', '81': 'East',

  // West Region (58-71)
  '58': 'West', '59': 'West', '60': 'West', '61': 'West', '62': 'West', '63': 'West',
  '64': 'West', '65': 'West', '66': 'West', '67': 'West', '68': 'West', '69': 'West',
  '70': 'West', '71': 'West',

  // North Region (72-78, 83)
  '72': 'North', '73': 'North', '75': 'North', '76': 'North', '77': 'North', '78': 'North', '83': 'North',
}

/**
 * Extract postal code from Singapore address
 * @param {string} address - Full address string
 * @returns {string|null} - 6-digit postal code or null if not found
 */
function extractPostalCode(address) {
  if (!address) return null

  // Singapore postal codes are 6 digits
  // Common formats: "Singapore 123456", "S123456", "123456"
  const postalCodeMatch = address.match(/\b(\d{6})\b/)

  return postalCodeMatch ? postalCodeMatch[1] : null
}

/**
 * Get region from postal code
 * @param {string} postalCode - 6-digit postal code
 * @returns {string|null} - Region name or null if cannot determine
 */
function getRegionFromPostalCode(postalCode) {
  if (!postalCode || postalCode.length !== 6) return null

  // Get first 2 digits (postal sector)
  const sector = postalCode.substring(0, 2)

  return POSTAL_SECTOR_TO_REGION[sector] || null
}

/**
 * Classify address to Singapore region
 * @param {string} address - Full address string
 * @param {string} formattedAddress - Google Maps formatted address (optional)
 * @returns {string|null} - Region name or null if cannot determine
 */
export function classifyRegion(address, formattedAddress = null) {
  // Try primary address first
  let postalCode = extractPostalCode(address)

  // If not found, try formatted address from Google
  if (!postalCode && formattedAddress) {
    postalCode = extractPostalCode(formattedAddress)
  }

  if (postalCode) {
    return getRegionFromPostalCode(postalCode)
  }

  // Fallback: Try to detect from well-known area names in address
  return detectRegionFromAreaName(address) || detectRegionFromAreaName(formattedAddress || '')
}

/**
 * Fallback method: Detect region from well-known area/district names
 * @param {string} address - Address string
 * @returns {string|null} - Region name or null
 */
function detectRegionFromAreaName(address) {
  if (!address) return null

  const lowerAddress = address.toLowerCase()

  // Central Region keywords
  const centralKeywords = [
    'orchard', 'marina', 'raffles', 'downtown', 'cbd', 'chinatown', 'bugis',
    'dhoby ghaut', 'somerset', 'newton', 'novena', 'toa payoh', 'bishan',
    'bukit merah', 'tiong bahru', 'queenstown', 'redhill', 'macpherson',
    'geylang', 'kallang', 'lavender', 'central', 'clarke quay', 'boat quay'
  ]

  // East Region keywords
  const eastKeywords = [
    'bedok', 'tampines', 'pasir ris', 'changi', 'simei', 'tanah merah',
    'kembangan', 'eunos', 'paya lebar', 'aljunied', 'katong', 'marine parade',
    'siglap', 'upper east coast'
  ]

  // West Region keywords
  const westKeywords = [
    'jurong', 'clementi', 'bukit batok', 'choa chu kang', 'bukit panjang',
    'boon lay', 'pioneer', 'tuas', 'joo koon', 'lakeside', 'chinese garden',
    'bukit gombak', 'kranji', 'hillview', 'dover', 'commonwealth'
  ]

  // North Region keywords
  const northKeywords = [
    'woodlands', 'yishun', 'sembawang', 'admiralty', 'marsiling', 'mandai',
    'canberra', 'causeway'
  ]

  // North-East Region keywords
  const northEastKeywords = [
    'sengkang', 'punggol', 'hougang', 'serangoon', 'ang mo kio', 'kovan',
    'lorong chuan', 'bartley', 'compassvale', 'buangkok', 'soo teck'
  ]

  // Check each region's keywords
  if (centralKeywords.some(keyword => lowerAddress.includes(keyword))) {
    return 'Central'
  }
  if (eastKeywords.some(keyword => lowerAddress.includes(keyword))) {
    return 'East'
  }
  if (westKeywords.some(keyword => lowerAddress.includes(keyword))) {
    return 'West'
  }
  if (northKeywords.some(keyword => lowerAddress.includes(keyword))) {
    return 'North'
  }
  if (northEastKeywords.some(keyword => lowerAddress.includes(keyword))) {
    return 'North-East'
  }

  return null
}

/**
 * Get all available regions
 * @returns {Array<string>} - List of region names
 */
export function getAvailableRegions() {
  return ['Central', 'East', 'West', 'North', 'North-East']
}

