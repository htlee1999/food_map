import axios from 'axios'

// Use environment variable for API URL, fallback to same origin for production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Helper to get admin headers
const getAdminHeaders = () => {
  const adminKey = sessionStorage.getItem('adminKey')
  return adminKey ? { 'x-admin-key': adminKey } : {}
}

// Places API
export const placesApi = {
  // Get all places
  async getAll() {
    try {
      const response = await api.get('/places')
      return response.data
    } catch (error) {
      console.error('Error fetching places:', error)
      throw error
    }
  },

  // Add a single place (admin only)
  async add(place) {
    try {
      const response = await api.post('/places', place, { headers: getAdminHeaders() })
      return response.data
    } catch (error) {
      console.error('Error adding place:', error)
      throw error
    }
  },

  // Update a place (admin only)
  async update(id, place) {
    try {
      const response = await api.put(`/places/${id}`, place, { headers: getAdminHeaders() })
      return response.data
    } catch (error) {
      console.error('Error updating place:', error)
      throw error
    }
  },

  // Delete a place (admin only)
  async delete(id) {
    try {
      const response = await api.delete(`/places/${id}`, { headers: getAdminHeaders() })
      return response.data
    } catch (error) {
      console.error('Error deleting place:', error)
      throw error
    }
  },

  // Get comments for a place
  async getComments(placeId) {
    try {
      const response = await api.get(`/places/${placeId}/comments`)
      return response.data
    } catch (error) {
      console.error('Error fetching comments:', error)
      throw error
    }
  },

  // Add a comment to a place
  async addComment(placeId, content) {
    try {
      const response = await api.post(`/places/${placeId}/comments`, { content })
      return response.data
    } catch (error) {
      console.error('Error adding comment:', error)
      throw error
    }
  },

  // Delete a comment (admin only)
  async deleteComment(commentId) {
    try {
      const response = await api.delete(`/comments/${commentId}`, { headers: getAdminHeaders() })
      return response.data
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw error
    }
  },
}

// Votes API
export const votesApi = {
  // Get votes for a place
  async get(placeId, voterId) {
    try {
      const response = await api.get(`/places/${placeId}/votes`, {
        params: { voter_id: voterId },
      })
      return response.data
    } catch (error) {
      console.error('Error fetching votes:', error)
      throw error
    }
  },

  // Submit a vote
  async submit(placeId, voteType, voterId) {
    try {
      const response = await api.post(`/places/${placeId}/votes`, {
        vote_type: voteType,
        voter_id: voterId,
      })
      return response.data
    } catch (error) {
      console.error('Error submitting vote:', error)
      throw error
    }
  },

  // Remove a vote
  async remove(placeId, voterId) {
    try {
      const response = await api.delete(`/places/${placeId}/votes`, {
        data: { voter_id: voterId },
      })
      return response.data
    } catch (error) {
      console.error('Error removing vote:', error)
      throw error
    }
  },
}

// Health check
export const healthApi = {
  async check() {
    try {
      const response = await api.get('/health')
      return response.data
    } catch (error) {
      console.error('Backend server not available:', error)
      return null
    }
  },
}

// Config API (cuisines, tags, tiers)
export const configApi = {
  // Get all config
  async getAll() {
    try {
      const response = await api.get('/config')
      return response.data
    } catch (error) {
      console.error('Error fetching config:', error)
      throw error
    }
  },

  // Add cuisine
  async addCuisine(name, sortOrder = 0) {
    try {
      const response = await api.post('/cuisines', { name, sort_order: sortOrder }, { headers: getAdminHeaders() })
      return response.data
    } catch (error) {
      console.error('Error adding cuisine:', error)
      throw error
    }
  },

  // Update cuisine
  async updateCuisine(id, data) {
    try {
      const response = await api.put(`/cuisines/${id}`, data, { headers: getAdminHeaders() })
      return response.data
    } catch (error) {
      console.error('Error updating cuisine:', error)
      throw error
    }
  },

  // Delete cuisine
  async deleteCuisine(id) {
    try {
      const response = await api.delete(`/cuisines/${id}`, { headers: getAdminHeaders() })
      return response.data
    } catch (error) {
      console.error('Error deleting cuisine:', error)
      throw error
    }
  },

  // Add tag to cuisine
  async addTag(cuisineId, name) {
    try {
      const response = await api.post(`/cuisines/${cuisineId}/tags`, { name }, { headers: getAdminHeaders() })
      return response.data
    } catch (error) {
      console.error('Error adding tag:', error)
      throw error
    }
  },

  // Delete tag
  async deleteTag(id) {
    try {
      const response = await api.delete(`/tags/${id}`, { headers: getAdminHeaders() })
      return response.data
    } catch (error) {
      console.error('Error deleting tag:', error)
      throw error
    }
  },

  // Add tier
  async addTier(tierData) {
    try {
      const response = await api.post('/tiers', tierData, { headers: getAdminHeaders() })
      return response.data
    } catch (error) {
      console.error('Error adding tier:', error)
      throw error
    }
  },

  // Update tier
  async updateTier(id, data) {
    try {
      const response = await api.put(`/tiers/${id}`, data, { headers: getAdminHeaders() })
      return response.data
    } catch (error) {
      console.error('Error updating tier:', error)
      throw error
    }
  },

  // Delete tier
  async deleteTier(id) {
    try {
      const response = await api.delete(`/tiers/${id}`, { headers: getAdminHeaders() })
      return response.data
    } catch (error) {
      console.error('Error deleting tier:', error)
      throw error
    }
  },
}

export default api
