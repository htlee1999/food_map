
import { ref, computed } from 'vue'
import Papa from 'papaparse'
import { placesApi, preferencesApi, healthApi } from '../services/api'

export function useFoodTracker() {
  const places = ref([])
  const visitedPlaces = ref(new Set())
  const wantToVisitPlaces = ref(new Set())
  const searchQuery = ref('')
  const loading = ref(false)

  // Computed properties
  const filteredPlaces = computed(() => {
    if (!searchQuery.value) return places.value
    const query = searchQuery.value.toLowerCase()
    return places.value.filter(place => 
      place.name.toLowerCase().includes(query) || 
      place.address.toLowerCase().includes(query)
    )
  })

  const visitedCount = computed(() => visitedPlaces.value.size)
  const wantToVisitCount = computed(() => wantToVisitPlaces.value.size)

  // Load saved data from API and localStorage fallback
  const loadSavedData = async () => {
    try {
      // Check if backend is available
      const health = await healthApi.check()
      
      if (health) {
        // Load from API
        const [placesData, preferencesData] = await Promise.all([
          placesApi.getAll(),
          preferencesApi.get()
        ])
        
        places.value = placesData
        visitedPlaces.value = new Set(preferencesData.visited || [])
        wantToVisitPlaces.value = new Set(preferencesData.wantToVisit || [])
        
        console.log('✅ Data loaded from backend API')
      } else {
        // Fallback to localStorage
        loadFromLocalStorage()
        console.log('⚠️ Backend unavailable, using localStorage')
      }
    } catch (error) {
      console.error('Error loading data from API:', error)
      // Fallback to localStorage
      loadFromLocalStorage()
    }
  }

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    const saved = localStorage.getItem('foodTrackerData')
    if (saved) {
      const data = JSON.parse(saved)
      visitedPlaces.value = new Set(data.visited || [])
      wantToVisitPlaces.value = new Set(data.wantToVisit || [])
    }
  }

  // Save data to API and localStorage
  const saveData = async () => {
    const data = {
      visited: Array.from(visitedPlaces.value),
      wantToVisit: Array.from(wantToVisitPlaces.value)
    }
    
    // Always save to localStorage as backup
    localStorage.setItem('foodTrackerData', JSON.stringify(data))
    
    try {
      // Try to save to API
      await preferencesApi.save(data)
      console.log('✅ Preferences saved to backend')
    } catch (error) {
      console.error('Failed to save preferences to backend:', error)
    }
  }

  // Geocode address using OneMap API with retry logic
  const geocodeAddress = async (address, retries = 2) => {
    if (!address || address.trim() === '') {
      console.log('❌ Empty address provided for geocoding')
      return null
    }

    const cleanAddress = address.trim()
    console.log(`🌍 Geocoding: "${cleanAddress}"`)
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(cleanAddress)}&returnGeom=Y&getAddrDetails=Y`)
        
        if (!response.ok) {
          console.log(`⚠️ Geocoding API returned ${response.status} on attempt ${attempt}`)
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }
          return null
        }
        
        const data = await response.json()
        console.log(`📍 Geocoding response for "${cleanAddress}": found ${data.found} results`)
        
        if (data.found > 0) {
          const result = data.results[0]
          const coords = {
            lat: parseFloat(result.LATITUDE),
            lng: parseFloat(result.LONGITUDE)
          }
          // Validate coordinates are reasonable for Singapore
          if (coords.lat >= 1.0 && coords.lat <= 2.0 && coords.lng >= 103.0 && coords.lng <= 105.0) {
            console.log(`✅ Geocoding successful: ${cleanAddress} -> ${coords.lat}, ${coords.lng}`)
            return coords
          } else {
            console.log(`⚠️ Invalid coordinates from geocoding: ${coords.lat}, ${coords.lng}`)
            return null
          }
        } else {
          console.log(`❌ No results found for: ${cleanAddress}`)
          // Try with a shorter address (remove last part)
          if (attempt < retries && cleanAddress.includes(',')) {
            const shorterAddress = cleanAddress.split(',').slice(0, -1).join(',').trim()
            console.log(`🔄 Trying shorter address: "${shorterAddress}"`)
            return await geocodeAddress(shorterAddress, retries - attempt)
          }
        }
      } catch (error) {
        console.error(`💥 Geocoding error on attempt ${attempt}:`, error)
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }
    
    console.log(`❌ Failed to geocode after ${retries} attempts: ${cleanAddress}`)
    return null
  }

  // Fix invalid coordinates in existing places
  const fixInvalidCoordinates = async () => {
    console.log('🔧 Starting to fix invalid coordinates...')
    const invalidPlaces = places.value.filter(place => 
      place.coords.lat === 1024 && place.coords.lng === 768
    )
    
    console.log(`📍 Found ${invalidPlaces.length} places with invalid coordinates`)
    
    for (let i = 0; i < invalidPlaces.length; i++) {
      const place = invalidPlaces[i]
      console.log(`🔧 Fixing coordinates for: ${place.name}`)
      
      // Try to geocode the place name
      let coords = await geocodeAddress(place.name)
      
      // If that fails, try with the address
      if (!coords && place.address && place.address !== 'Location from Google Maps') {
        coords = await geocodeAddress(place.address)
      }
      
      // If still no coordinates, try with common Singapore areas
      if (!coords) {
        const singaporeAreas = ['Marina Bay', 'Orchard', 'Chinatown', 'Little India', 'Clarke Quay', 'Sentosa', 'Jurong', 'Tampines', 'Woodlands', 'Ang Mo Kio']
        for (const area of singaporeAreas) {
          coords = await geocodeAddress(`${place.name}, ${area}, Singapore`)
          if (coords) break
        }
      }
      
      if (coords) {
        place.coords = coords
        place.source = 'fixed_coordinates'
        console.log(`✅ Fixed coordinates for ${place.name}: ${coords.lat}, ${coords.lng}`)
      } else {
        console.log(`❌ Could not fix coordinates for ${place.name}`)
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Save the fixed places
    try {
      const result = await placesApi.addBatch(places.value)
      console.log(`✅ Fixed coordinates saved to backend`)
    } catch (error) {
      console.error('Failed to save fixed coordinates to backend:', error)
    }
    
    console.log('🎉 Finished fixing invalid coordinates')
  }

  // Extract coordinates by actually visiting the Google Maps URL
  const extractLocationFromGoogleMapsUrl = async (url) => {
    try {
      // Check if URL is empty or invalid
      if (!url || url.trim() === '') {
        console.log(`❌ Empty URL provided`)
        return null
      }
      
      console.log(`🔗 Fetching webpage content from: ${url}`)
      
      // First try URL parsing for direct coordinates (faster)
      const urlObj = new URL(url)
      
      // Try multiple URL patterns for coordinates
      const urlPatterns = [
        // Pattern 1: @lat,lng format
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        // Pattern 2: !3dlat!4dlng format
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
        // Pattern 3: /@lat,lng,zoom format
        /@(-?\d+\.?\d*),(-?\d+\.?\d*),\d+z/,
        // Pattern 4: data=!4m2!3m1!1s format (Google Place ID)
        /data=!4m2!3m1!1s([a-zA-Z0-9_-]+)/
      ]
      
      for (let i = 0; i < urlPatterns.length; i++) {
        const match = urlObj.pathname.match(urlPatterns[i])
        if (match) {
          if (i === 3) {
            // This is a Google Place ID, we'll need to fetch the page
            console.log(`📍 Found Google Place ID in URL: ${match[1]}`)
            break
          } else {
            const coords = {
              lat: parseFloat(match[1]),
              lng: parseFloat(match[2])
            }
            // Validate coordinates are reasonable for Singapore
            if (coords.lat >= 1.0 && coords.lat <= 2.0 && coords.lng >= 103.0 && coords.lng <= 105.0) {
              console.log(`📍 Found coordinates in URL: ${coords.lat}, ${coords.lng}`)
              return { type: 'coordinates', data: coords }
            } else {
              console.log(`⚠️ Invalid coordinates in URL: ${coords.lat}, ${coords.lng}`)
            }
          }
        }
      }
      
      // If no coordinates in URL, fetch the webpage via backend proxy (to bypass CORS)
      console.log(`🌐 Fetching webpage content via proxy...`)
      const proxyUrl = `http://localhost:3001/api/proxy/google-maps?url=${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl)
      
      if (!response.ok) {
        console.log(`❌ Failed to fetch webpage via proxy: ${response.status}`)
        return null
      }
      
      const data = await response.json()
      if (!data.success) {
        console.log(`❌ Proxy error: ${data.error}`)
        return null
      }
      
      const html = data.html
      console.log(`📄 Fetched ${html.length} characters of HTML via proxy`)
      
      // Extract coordinates from various patterns in the HTML
      const coordPatterns = [
        // Pattern 1: "center": [lat, lng]
        /"center":\s*\[(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\]/,
        // Pattern 2: "lat": lat, "lng": lng
        /"lat":\s*(-?\d+\.?\d*),\s*"lng":\s*(-?\d+\.?\d*)/,
        // Pattern 3: data-lat and data-lng attributes
        /data-lat="(-?\d+\.?\d*)"[^>]*data-lng="(-?\d+\.?\d*)"/,
        // Pattern 4: window.APP_INITIALIZATION_STATE
        /window\.APP_INITIALIZATION_STATE.*?\[(-?\d+\.?\d*),(-?\d+\.?\d*)\]/,
        // Pattern 5: Google Maps specific patterns
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
        // Pattern 6: Coordinates in script tags
        /\[(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\].*?zoom/,
        // Pattern 7: More specific Google Maps patterns
        /"@(-?\d+\.?\d*),(-?\d+\.?\d*),\d+z"/,
        // Pattern 8: Coordinates in meta tags
        /<meta[^>]*content="(-?\d+\.?\d*),(-?\d+\.?\d*)"[^>]*name="geo\.position"/,
        // Pattern 9: Coordinates in JSON-LD
        /"geo":\s*{\s*"latitude":\s*(-?\d+\.?\d*),\s*"longitude":\s*(-?\d+\.?\d*)\s*}/,
        // Pattern 10: Coordinates in microdata
        /itemprop="latitude"[^>]*content="(-?\d+\.?\d*)"[^>]*itemprop="longitude"[^>]*content="(-?\d+\.?\d*)"/
      ]
      
      for (let i = 0; i < coordPatterns.length; i++) {
        const match = html.match(coordPatterns[i])
        if (match) {
          const coords = {
            lat: parseFloat(match[1]),
            lng: parseFloat(match[2])
          }
          // Validate coordinates are reasonable for Singapore
          if (coords.lat >= 1.0 && coords.lat <= 2.0 && coords.lng >= 103.0 && coords.lng <= 105.0) {
            console.log(`📍 Extracted coordinates from HTML pattern ${i + 1}: ${coords.lat}, ${coords.lng}`)
            return { type: 'coordinates', data: coords }
          } else {
            console.log(`⚠️ Invalid coordinates from HTML pattern ${i + 1}: ${coords.lat}, ${coords.lng}`)
          }
        }
      }
      
      // Try to extract place name and address from HTML
      const titleMatch = html.match(/<title[^>]*>([^<]+)</i)
      if (titleMatch) {
        const title = titleMatch[1].replace(/ - Google Maps$/, '').trim()
        console.log(`📍 Extracted title from HTML: ${title}`)
        return { type: 'address', data: `${title}, Singapore` }
      }
      
      console.log(`❌ No coordinates or useful data found in webpage`)
      return null
      
    } catch (error) {
      console.error('Error fetching Google Maps URL:', error)
      return null
    }
  }

  // Process CSV and add places
  const processCsvData = async (csvData) => {
    loading.value = true
    const batchSize = 5 // Reduced batch size to avoid rate limiting
    const newPlaces = []
    const failedPlaces = []
    const geocodingFailures = []
    
    console.log(`🚀 Starting to process ${csvData.length} CSV rows`)
    console.log('📋 Sample row structure:', csvData[0])
    
    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize)
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(csvData.length/batchSize)} (rows ${i+1}-${Math.min(i+batchSize, csvData.length)})`)
      
      await Promise.all(batch.map(async (row, batchIndex) => {
        let address = null
        let placeName = null
        let source = 'unknown'
        
        try {
          // Check if we have the expected column names from your CSV
          if (row.Title && row.URL) {
            // Your CSV format: Title, Note, URL
            placeName = row.Title?.trim()
            const locationData = await extractLocationFromGoogleMapsUrl(row.URL)
            
            if (locationData) {
              if (locationData.type === 'coordinates') {
                // We have coordinates directly - no need to geocode
                const place = {
                  id: `place_${i + batchIndex}_${Date.now()}`,
                  name: placeName,
                  address: 'Location from Google Maps',
                  coords: locationData.data,
                  source: 'google_maps_coordinates'
                }
                newPlaces.push(place)
                console.log(`✅ Added with coordinates from Google Maps: ${placeName}`)
                return // Skip the rest of the processing for this row
              } else if (locationData.type === 'address') {
                address = locationData.data
                source = 'google_maps_url'
                console.log(`📍 Processing from Google Maps URL: ${placeName} -> ${address}`)
              }
            } else {
              // If URL extraction failed, use the place name as address
              address = placeName
              source = 'place_name_fallback'
              console.log(`📍 URL extraction failed, using place name as address: ${placeName}`)
            }
          } else if (row.licensee_name && row.premises_address) {
            // Original format: licensee_name, premises_address
            placeName = row.licensee_name?.trim()
            address = row.premises_address?.trim()
            source = 'direct_address'
            console.log(`📍 Processing from address: ${placeName} -> ${address}`)
          } else {
            // Try to find any name and address columns
            const nameKey = Object.keys(row).find(key => 
              key.toLowerCase().includes('name') || 
              key.toLowerCase().includes('title') ||
              key.toLowerCase().includes('restaurant')
            )
            const addressKey = Object.keys(row).find(key => 
              key.toLowerCase().includes('address') ||
              key.toLowerCase().includes('location')
            )
            const urlKey = Object.keys(row).find(key => 
              key.toLowerCase().includes('url') ||
              key.toLowerCase().includes('link')
            )
            
            if (nameKey) placeName = row[nameKey]?.trim()
            if (addressKey) address = row[addressKey]?.trim()
            if (urlKey && !address) {
              const locationData = await extractLocationFromGoogleMapsUrl(row[urlKey])
              if (locationData) {
                if (locationData.type === 'coordinates') {
                  // We have coordinates directly - no need to geocode
                  const place = {
                    id: `place_${i + batchIndex}_${Date.now()}`,
                    name: placeName,
                    address: 'Location from Google Maps',
                    coords: locationData.data,
                    source: 'google_maps_coordinates'
                  }
                  newPlaces.push(place)
                  console.log(`✅ Added with coordinates from Google Maps: ${placeName}`)
                  return // Skip the rest of the processing for this row
                } else if (locationData.type === 'address') {
                  address = locationData.data
                  source = 'url_extraction'
                }
              }
            } else if (addressKey) {
              source = 'address_column'
            }
            
            console.log(`🔍 Auto-detected columns (${source}): ${placeName} -> ${address}`)
          }
          
          if (placeName && address) {
            console.log(`🌍 Attempting to geocode: ${placeName} at ${address}`)
            const coords = await geocodeAddress(address)
            if (coords) {
              const place = {
                id: `place_${i + batchIndex}_${Date.now()}`,
                name: placeName,
                address: address,
                coords: coords,
                source: source
              }
              newPlaces.push(place)
              console.log(`✅ Successfully added: ${placeName} (${source})`)
            } else {
              // Try fallback geocoding with just the place name
              console.log(`🔄 Trying fallback geocoding with place name only: ${placeName}`)
              let fallbackCoords = await geocodeAddress(placeName)
              
              // If that fails, try with "Singapore" appended
              if (!fallbackCoords) {
                console.log(`🔄 Trying with Singapore context: ${placeName}, Singapore`)
                fallbackCoords = await geocodeAddress(`${placeName}, Singapore`)
              }
              
              // If still fails, try extracting location from place name
              if (!fallbackCoords && (placeName.includes('—') || placeName.includes('in '))) {
                const parts = placeName.split(/[—|in]/)
                if (parts.length > 1) {
                  const location = parts[parts.length - 1].trim()
                  console.log(`🔄 Trying extracted location: ${location}, Singapore`)
                  fallbackCoords = await geocodeAddress(`${location}, Singapore`)
                }
              }
              
              // If still fails, try with common Singapore area suffixes
              if (!fallbackCoords) {
                const singaporeAreas = ['Marina Bay', 'Orchard', 'Chinatown', 'Little India', 'Clarke Quay', 'Sentosa', 'Jurong', 'Tampines', 'Woodlands', 'Ang Mo Kio']
                for (const area of singaporeAreas) {
                  console.log(`🔄 Trying with area context: ${placeName}, ${area}, Singapore`)
                  fallbackCoords = await geocodeAddress(`${placeName}, ${area}, Singapore`)
                  if (fallbackCoords) break
                }
              }
              
              if (fallbackCoords) {
                const place = {
                  id: `place_${i + batchIndex}_${Date.now()}`,
                  name: placeName,
                  address: address,
                  coords: fallbackCoords,
                  source: source + '_fallback'
                }
                newPlaces.push(place)
                console.log(`✅ Added with fallback geocoding: ${placeName}`)
              } else {
                geocodingFailures.push({ name: placeName, address: address, source: source })
                console.log(`❌ Failed to geocode both address and name: ${placeName} - ${address}`)
              }
            }
          } else {
            failedPlaces.push({ row, reason: 'missing_name_or_address' })
            console.log(`❌ Missing data for row:`, { name: placeName, address: address, row })
          }
        } catch (error) {
          console.error(`💥 Error processing row ${i + batchIndex}:`, error, row)
          failedPlaces.push({ row, reason: 'processing_error', error: error.message })
        }
      }))

      // Longer delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Add places to local state
    places.value = [...places.value, ...newPlaces]
    
    // Save to backend API
    try {
      const result = await placesApi.addBatch(newPlaces)
      console.log(`✅ CSV data saved to backend: ${result.added} new places added`)
    } catch (error) {
      console.error('Failed to save CSV data to backend:', error)
    }
    
    // Summary logging
    console.log(`🎉 CSV Processing Complete!`)
    console.log(`✅ Successfully processed: ${newPlaces.length} places`)
    console.log(`❌ Geocoding failures: ${geocodingFailures.length} places`)
    console.log(`❌ Data issues: ${failedPlaces.length} rows`)
    
    if (geocodingFailures.length > 0) {
      console.log('📍 Geocoding failures:', geocodingFailures.slice(0, 5))
    }
    if (failedPlaces.length > 0) {
      console.log('📋 Failed rows:', failedPlaces.slice(0, 3))
    }
    
    loading.value = false
  }

  // Handle file upload
  const handleFileUpload = (file) => {
    console.log('handleFileUpload called with file:', file)
    if (!file) {
      console.log('No file provided to handleFileUpload')
      return
    }

    console.log('Starting CSV parsing for file:', file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log('CSV parsing complete:', results)
        if (results.data && results.data.length > 0) {
          console.log(`Processing ${results.data.length} CSV rows`)
          places.value = []
          processCsvData(results.data)
        } else {
          console.log('No data found in CSV file')
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error)
      }
    })
  }

  // Mark place functions
  const markAsVisited = (placeId) => {
    visitedPlaces.value.add(placeId)
    wantToVisitPlaces.value.delete(placeId)
    saveData()
  }

  const markAsWantToVisit = (placeId) => {
    wantToVisitPlaces.value.add(placeId)
    visitedPlaces.value.delete(placeId)
    saveData()
  }

  const clearStatus = (placeId) => {
    visitedPlaces.value.delete(placeId)
    wantToVisitPlaces.value.delete(placeId)
    saveData()
  }

  // Add manually created place
  const addPlace = async (place) => {
    try {
      // Save to backend API
      const result = await placesApi.add(place)
      
      // Add to local state
      places.value.push(place)
      
      console.log('✅ Place added to backend:', result)
      return true
    } catch (error) {
      if (error.response?.status === 409) {
        // Place already exists
        console.log('Place already exists in backend')
        return false
      } else {
        // Other error - still add to local state as fallback
        console.error('Failed to save place to backend:', error)
        places.value.push(place)
        return true
      }
    }
  }

  // Focus on place (to be implemented in MapContainer)
  const focusOnPlace = (place) => {
    // This will be handled by the MapContainer component
    console.log('Focus on place:', place)
  }

  return {
    places,
    visitedPlaces,
    wantToVisitPlaces,
    searchQuery,
    loading,
    filteredPlaces,
    visitedCount,
    wantToVisitCount,
    handleFileUpload,
    addPlace,
    markAsVisited,
    markAsWantToVisit,
    clearStatus,
    focusOnPlace,
    loadSavedData,
    fixInvalidCoordinates
  }
}
