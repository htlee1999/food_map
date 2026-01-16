import { ref } from 'vue'
import { placesApi, healthApi } from '../services/api'

export function useFoodTracker() {
  const places = ref([])
  const searchQuery = ref('')
  const selectedTier = ref('')
  const loading = ref(false)
  const selectedCategory = ref('Zi Char')

  // Load saved data from API and localStorage fallback
  const loadSavedData = async () => {
    try {
      // Check if backend is available
      const health = await healthApi.check()

      if (health) {
        // Load from API
        const placesData = await placesApi.getAll()
        places.value = placesData
      } else {
        // Fallback to localStorage
        loadFromLocalStorage()
      }
    } catch (error) {
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
      return true
    } catch (error) {
      if (error.response?.status === 409) {
        // Place already exists
        return false
      } else {
        // Other error - still add to local state as fallback
        places.value.push(place)
        return true
      }
    }
  }

  // Update a place
  const updatePlace = async (id, updatedPlace) => {
    try {
      // Update in backend API
      const result = await placesApi.update(id, updatedPlace)
      
      // Update the place in local state
      const index = places.value.findIndex(place => place.id === id)
      if (index !== -1) {
        places.value[index] = result.place
      }
      return true
    } catch (error) {
      return false
    }
  }

  // Delete a place
  const deletePlace = async (id) => {
    try {
      // Delete from backend API
      await placesApi.delete(id)

      // Remove from local state
      places.value = places.value.filter(place => place.id !== id)
      return true
    } catch (error) {
      return false
    }
  }

  // Get comments for a place
  const getComments = async (placeId) => {
    try {
      const comments = await placesApi.getComments(placeId)
      return comments
    } catch (error) {
      return []
    }
  }

  // Add a comment to a place
  const addComment = async (placeId, content) => {
    try {
      const result = await placesApi.addComment(placeId, content)
      return result.comment
    } catch (error) {
      return null
    }
  }

  // Delete a comment
  const deleteComment = async (commentId) => {
    try {
      await placesApi.deleteComment(commentId)
      return true
    } catch (error) {
      return false
    }
  }

  return {
    places,
    searchQuery,
    selectedTier,
    selectedCategory,
    loading,
    addPlace,
    updatePlace,
    deletePlace,
    loadSavedData,
    getComments,
    addComment,
    deleteComment,
  }
}
