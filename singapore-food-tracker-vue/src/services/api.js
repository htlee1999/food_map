import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

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

  // Add a single place
  async add(place) {
    try {
      const response = await api.post('/places', place)
      return response.data
    } catch (error) {
      console.error('Error adding place:', error)
      throw error
    }
  },

  // Add multiple places (for CSV import)
  async addBatch(places) {
    try {
      const response = await api.post('/places/batch', { places })
      return response.data
    } catch (error) {
      console.error('Error adding places batch:', error)
      throw error
    }
  }
}

// Preferences API
export const preferencesApi = {
  // Get user preferences
  async get() {
    try {
      const response = await api.get('/preferences')
      return response.data
    } catch (error) {
      console.error('Error fetching preferences:', error)
      return { visited: [], wantToVisit: [] }
    }
  },

  // Save user preferences
  async save(preferences) {
    try {
      const response = await api.post('/preferences', preferences)
      return response.data
    } catch (error) {
      console.error('Error saving preferences:', error)
      throw error
    }
  }
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
  }
}

export default api
