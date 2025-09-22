
import { ref, computed } from 'vue'
import { placesApi, healthApi } from '../services/api'

export function useFoodTracker() {
  const places = ref([])
  const searchQuery = ref('')
  const selectedTier = ref('')
  const loading = ref(false)


  // Load saved data from API and localStorage fallback
  const loadSavedData = async () => {
    try {
      // Check if backend is available
      const health = await healthApi.check()
      
      if (health) {
        // Load from API
        const placesData = await placesApi.getAll()
        places.value = placesData
        
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
      places.value = data.places || []
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
    searchQuery,
    selectedTier,
    loading,
    addPlace,
    focusOnPlace,
    loadSavedData
  }
}
