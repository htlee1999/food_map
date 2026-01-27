/**
 * Migration Script: Backfill Region Data
 *
 * This script analyzes existing places in the database and assigns
 * regions based on their addresses (postal codes and area names).
 *
 * Usage:
 *   node backfill-regions.cjs
 *
 * Environment Variables Required:
 *   DATABASE_URL - PostgreSQL connection string (or reads from .env file)
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Region classification utilities (copied from frontend)
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

function extractPostalCode(address) {
  if (!address) return null
  const postalCodeMatch = address.match(/\b(\d{6})\b/)
  return postalCodeMatch ? postalCodeMatch[1] : null
}

function getRegionFromPostalCode(postalCode) {
  if (!postalCode || postalCode.length !== 6) return null
  const sector = postalCode.substring(0, 2)
  return POSTAL_SECTOR_TO_REGION[sector] || null
}

function detectRegionFromAreaName(address) {
  if (!address) return null
  const lowerAddress = address.toLowerCase()

  const centralKeywords = [
    'orchard', 'marina', 'raffles', 'downtown', 'cbd', 'chinatown', 'bugis',
    'dhoby ghaut', 'somerset', 'newton', 'novena', 'toa payoh', 'bishan',
    'bukit merah', 'tiong bahru', 'queenstown', 'redhill', 'macpherson',
    'geylang', 'kallang', 'lavender', 'central', 'clarke quay', 'boat quay'
  ]

  const eastKeywords = [
    'bedok', 'tampines', 'pasir ris', 'changi', 'simei', 'tanah merah',
    'kembangan', 'eunos', 'paya lebar', 'aljunied', 'katong', 'marine parade',
    'siglap', 'upper east coast'
  ]

  const westKeywords = [
    'jurong', 'clementi', 'bukit batok', 'choa chu kang', 'bukit panjang',
    'boon lay', 'pioneer', 'tuas', 'joo koon', 'lakeside', 'chinese garden',
    'bukit gombak', 'kranji', 'hillview', 'dover', 'commonwealth'
  ]

  const northKeywords = [
    'woodlands', 'yishun', 'sembawang', 'admiralty', 'marsiling', 'mandai',
    'canberra', 'causeway'
  ]

  const northEastKeywords = [
    'sengkang', 'punggol', 'hougang', 'serangoon', 'ang mo kio', 'kovan',
    'lorong chuan', 'bartley', 'compassvale', 'buangkok', 'soo teck'
  ]

  if (centralKeywords.some(keyword => lowerAddress.includes(keyword))) return 'Central'
  if (eastKeywords.some(keyword => lowerAddress.includes(keyword))) return 'East'
  if (westKeywords.some(keyword => lowerAddress.includes(keyword))) return 'West'
  if (northKeywords.some(keyword => lowerAddress.includes(keyword))) return 'North'
  if (northEastKeywords.some(keyword => lowerAddress.includes(keyword))) return 'North-East'

  return null
}

function classifyRegion(address) {
  // Try postal code first
  const postalCode = extractPostalCode(address)
  if (postalCode) {
    const region = getRegionFromPostalCode(postalCode)
    if (region) return region
  }

  // Fallback to area name detection
  return detectRegionFromAreaName(address)
}

async function backfillRegions() {
  console.log('Starting region backfill migration...\n')

  // Read DATABASE_URL from .env file
  let databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    try {
      const envPath = path.join(__dirname, '../../.env')
      const envContent = fs.readFileSync(envPath, 'utf8')
      const match = envContent.match(/^DATABASE_URL=(.+)$/m)
      if (match) {
        databaseUrl = match[1].trim()
      }
    } catch (err) {
      console.error('❌ ERROR: Could not read DATABASE_URL from .env file')
      process.exit(1)
    }
  }

  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL not found')
    console.error('Please set it in your .env file or as an environment variable')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: databaseUrl,
  })

  try {
    // Connect to database
    const client = await pool.connect()
    console.log('✅ Connected to database')

    // Fetch all places without regions
    const result = await client.query(
      'SELECT id, name, address, region FROM places ORDER BY id'
    )

    const places = result.rows
    console.log(`\n📊 Found ${places.length} total places\n`)

    let updatedCount = 0
    let skippedCount = 0
    let failedCount = 0
    const updates = []

    // Process each place
    for (const place of places) {
      const hasRegion = place.region && place.region.trim() !== ''

      if (hasRegion) {
        console.log(`⏭️  Skipped: ${place.name} (already has region: ${place.region})`)
        skippedCount++
        continue
      }

      const classifiedRegion = classifyRegion(place.address)

      if (classifiedRegion) {
        updates.push({ id: place.id, name: place.name, region: classifiedRegion, address: place.address })
        console.log(`✅ Classified: ${place.name} -> ${classifiedRegion}`)
      } else {
        console.log(`⚠️  Failed to classify: ${place.name}`)
        console.log(`   Address: ${place.address}`)
        failedCount++
      }
    }

    // Update database
    if (updates.length > 0) {
      console.log(`\n🔄 Updating ${updates.length} places...`)

      for (const update of updates) {
        await client.query(
          'UPDATE places SET region = $1 WHERE id = $2',
          [update.region, update.id]
        )
      }

      updatedCount = updates.length
      console.log(`✅ Successfully updated ${updatedCount} places`)
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('MIGRATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`Total places:        ${places.length}`)
    console.log(`Updated:             ${updatedCount}`)
    console.log(`Already had region:  ${skippedCount}`)
    console.log(`Failed to classify:  ${failedCount}`)
    console.log('='.repeat(60))

    if (failedCount > 0) {
      console.log('\n⚠️  Some places could not be classified automatically.')
      console.log('These will need manual region assignment through the admin interface.')
    }

    client.release()
    await pool.end()

    console.log('\n✅ Migration completed successfully!')

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error(error.stack)
    await pool.end()
    process.exit(1)
  }
}

// Run the migration
backfillRegions()
