
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
          console.log(`✅ Geocoding successful: ${cleanAddress} -> ${coords.lat}, ${coords.lng}`)
          return coords
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

  // Extract coordinates or address from Google Maps URL
  const extractLocationFromGoogleMapsUrl = (url) => {
    try {
      console.log(`🔗 Extracting location from URL: ${url}`)
      const urlObj = new URL(url)
      
      // Method 1: Extract coordinates from URL path (e.g., /@lat,lng,zoom)
      const pathMatch = urlObj.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)
      if (pathMatch) {
        const coords = {
          lat: parseFloat(pathMatch[1]),
          lng: parseFloat(pathMatch[2])
        }
        console.log(`📍 Extracted coordinates from path: ${coords.lat}, ${coords.lng}`)
        return { type: 'coordinates', data: coords }
      }
      
      // Method 2: Extract from query parameters
      const searchParams = urlObj.searchParams
      
      // Check for ll parameter (lat,lng)
      const llParam = searchParams.get('ll')
      if (llParam) {
        const [lat, lng] = llParam.split(',').map(Number)
        if (!isNaN(lat) && !isNaN(lng)) {
          const coords = { lat, lng }
          console.log(`📍 Extracted coordinates from 'll' param: ${coords.lat}, ${coords.lng}`)
          return { type: 'coordinates', data: coords }
        }
      }
      
      // Check for q parameter (address query)
      const qParam = searchParams.get('q')
      if (qParam) {
        const address = decodeURIComponent(qParam)
        console.log(`📍 Extracted address from 'q' param: ${address}`)
        return { type: 'address', data: address }
      }
      
      // Method 3: Extract from data parameter (encoded coordinates)
      const dataParam = searchParams.get('data')
      if (dataParam) {
        try {
          const decodedData = decodeURIComponent(dataParam)
          console.log(`📊 Data param content: ${decodedData.substring(0, 200)}...`)
          
          // Look for coordinate patterns in the data
          const coordMatch = decodedData.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/)
          if (coordMatch) {
            const coords = {
              lat: parseFloat(coordMatch[1]),
              lng: parseFloat(coordMatch[2])
            }
            console.log(`📍 Extracted coordinates from data param: ${coords.lat}, ${coords.lng}`)
            return { type: 'coordinates', data: coords }
          }
        } catch (e) {
          console.log(`⚠️ Could not decode data param`)
        }
      }
      
      // Method 3.5: Extract from URL path with coordinates (e.g., /place/name/@lat,lng,zoom/data=...)
      const pathWithCoordsMatch = urlObj.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),?\d*z/)
      if (pathWithCoordsMatch) {
        const coords = {
          lat: parseFloat(pathWithCoordsMatch[1]),
          lng: parseFloat(pathWithCoordsMatch[2])
        }
        console.log(`📍 Extracted coordinates from path with coords: ${coords.lat}, ${coords.lng}`)
        return { type: 'coordinates', data: coords }
      }
      
      // Method 4: Extract place name from URL path as fallback
      const pathParts = urlObj.pathname.split('/')
      const placeIndex = pathParts.findIndex(part => part === 'place')
      if (placeIndex !== -1 && placeIndex + 1 < pathParts.length) {
        const encodedPlaceName = pathParts[placeIndex + 1]
        const decodedPlaceName = decodeURIComponent(encodedPlaceName.replace(/\+/g, ' '))
        console.log(`📍 Extracted place name from path: ${decodedPlaceName}`)
        
        // Try to extract location from the place name
        if (decodedPlaceName.includes('—') || decodedPlaceName.includes('in ')) {
          const parts = decodedPlaceName.split(/[—|in]/)
          if (parts.length > 1) {
            const location = parts[parts.length - 1].trim()
            console.log(`📍 Extracted location from place name: ${location}`)
            return { type: 'address', data: location }
          }
        }
        
        // For place names without location context, try to add Singapore context
        const placeNameWithContext = `${decodedPlaceName}, Singapore`
        console.log(`📍 Adding Singapore context: ${placeNameWithContext}`)
        return { type: 'address', data: placeNameWithContext }
      }
      
      console.log(`❌ Could not extract location from URL`)
      return null
    } catch (error) {
      console.error('Error extracting location from Google Maps URL:', error)
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
            const locationData = extractLocationFromGoogleMapsUrl(row.URL)
            
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
              const locationData = extractLocationFromGoogleMapsUrl(row[urlKey])
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
    loadSavedData
  }
}
