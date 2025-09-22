import axios from 'axios'

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
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

export default api
