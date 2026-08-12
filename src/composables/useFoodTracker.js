import { ref } from 'vue'
import { placesApi } from '../services/api'

export function useFoodTracker() {
  const places = ref([])
  const searchQuery = ref('')
  const selectedTier = ref('')
  const selectedRegion = ref('')
  const loading = ref(false)
  const selectedCategory = ref('Zi Char')

  // Load places from the API
  const loadSavedData = async () => {
    loading.value = true
    try {
      places.value = await placesApi.getAll()
    } catch (error) {
      console.error('Failed to load places:', error)
    } finally {
      loading.value = false
    }
  }

  // Add manually created place
  const addPlace = async (place) => {
    try {
      // The API returns the saved place with its database ID
      const result = await placesApi.add(place)
      places.value.push(result.place)
      return true
    } catch (error) {
      return false
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
    selectedRegion,
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
