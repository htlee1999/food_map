import { ref } from 'vue'
import { ratingsApi } from '../services/api'

// Shared state (singleton pattern): place_id -> { group_tier, my_tier, rating_count }
const ratingsSummary = ref({})

export function useRatings() {
  // Refresh the per-place group-tier summary (empty when signed out)
  const loadRatingsSummary = async () => {
    try {
      const rows = await ratingsApi.summary()
      ratingsSummary.value = Object.fromEntries(rows.map((row) => [row.place_id, row]))
    } catch {
      ratingsSummary.value = {}
    }
  }

  // Get all friend ratings for a place
  const getRatings = async (placeId) => {
    try {
      return await ratingsApi.list(placeId)
    } catch (error) {
      console.error('Error fetching ratings:', error)
      return []
    }
  }

  // Create or update the signed-in user's rating
  const submitRating = async (placeId, tier, review) => {
    try {
      const result = await ratingsApi.submit(placeId, tier, review)
      await loadRatingsSummary()
      return result.rating
    } catch (error) {
      console.error('Error saving rating:', error)
      return null
    }
  }

  // Remove the signed-in user's rating
  const removeRating = async (placeId) => {
    try {
      await ratingsApi.remove(placeId)
      await loadRatingsSummary()
      return true
    } catch (error) {
      console.error('Error removing rating:', error)
      return false
    }
  }

  return {
    ratingsSummary,
    loadRatingsSummary,
    getRatings,
    submitRating,
    removeRating,
  }
}
