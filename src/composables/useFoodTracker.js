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


  // Add manually created place
  const addPlace = async (place) => {
    try {
      // Save to backend API
      const result = await placesApi.add(place)

      // Add the place returned from the API to local state (with correct database ID)
      places.value.push(result.place)

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
    console.log('Focus on place:', place)
  }

  return {
    places,
    searchQuery,
    selectedTier,
    loading,
    addPlace,
    focusOnPlace,
    loadSavedData,
  }
}
