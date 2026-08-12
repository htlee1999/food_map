import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

const getAdminHeaders = () => {
  const adminKey = sessionStorage.getItem('adminKey')
  return adminKey ? { 'x-admin-key': adminKey } : {}
}

// Request wrapper with error logging
const request = async (method, url, options = {}) => {
  try {
    const response = await api({ method, url, ...options })
    return response.data
  } catch (error) {
    console.error(`API ${method.toUpperCase()} ${url} failed:`, error)
    throw error
  }
}

const adminRequest = (method, url, data) =>
  request(method, url, { data, headers: getAdminHeaders() })

// Places API
export const placesApi = {
  getAll: () => request('get', '/places'),
  add: (place) => adminRequest('post', '/places', place),
  update: (id, place) => adminRequest('put', `/places/${id}`, place),
  delete: (id) => adminRequest('delete', `/places/${id}`),
  getComments: (placeId) => request('get', `/places/${placeId}/comments`),
  addComment: (placeId, content) => adminRequest('post', `/places/${placeId}/comments`, { content }),
  deleteComment: (commentId) => adminRequest('delete', `/comments/${commentId}`),
}

// Votes API
export const votesApi = {
  get: (placeId, voterId) => request('get', `/places/${placeId}/votes`, { params: { voter_id: voterId } }),
  submit: (placeId, voteType, voterId) => request('post', `/places/${placeId}/votes`, { data: { vote_type: voteType, voter_id: voterId } }),
  remove: (placeId, voterId) => request('delete', `/places/${placeId}/votes`, { data: { voter_id: voterId } }),
}

// Ratings API (per-user friend ratings; requires sign-in to submit)
export const ratingsApi = {
  summary: () => request('get', '/ratings/summary'),
  list: (placeId) => request('get', `/places/${placeId}/ratings`),
  submit: (placeId, tier, review) => request('put', `/places/${placeId}/rating`, { data: { tier, review } }),
  remove: (placeId) => request('delete', `/places/${placeId}/rating`),
}

// Groups API (all endpoints require sign-in)
export const groupsApi = {
  list: () => request('get', '/groups'),
  create: (name) => request('post', '/groups', { data: { name } }),
  join: (inviteCode) => request('post', '/groups/join', { data: { invite_code: inviteCode } }),
  leave: (groupId) => request('delete', `/groups/${groupId}/members/me`),
}

// Auth API (session cookie is sent automatically on same-origin requests)
export const authApi = {
  me: () => request('get', '/auth/me'),
  loginWithGoogle: (credential) => request('post', '/auth/google', { data: { credential } }),
  logout: () => request('post', '/auth/logout'),
}

// Config API
export const configApi = {
  getAll: () => request('get', '/config'),
  addCuisine: (name, sortOrder = 0) => adminRequest('post', '/cuisines', { name, sort_order: sortOrder }),
  updateCuisine: (id, data) => adminRequest('put', `/cuisines/${id}`, data),
  deleteCuisine: (id) => adminRequest('delete', `/cuisines/${id}`),
  addTag: (cuisineId, name) => adminRequest('post', `/cuisines/${cuisineId}/tags`, { name }),
  deleteTag: (id) => adminRequest('delete', `/tags/${id}`),
  addTier: (tierData) => adminRequest('post', '/tiers', tierData),
  updateTier: (id, data) => adminRequest('put', `/tiers/${id}`, data),
  deleteTier: (id) => adminRequest('delete', `/tiers/${id}`),
}

// Blog API
export const blogApi = {
  list: () => request('get', '/blog'),
  get: (id) => request('get', `/blog/${id}`),
  create: (post) => adminRequest('post', '/blog', post),
  update: (id, post) => adminRequest('put', `/blog/${id}`, post),
  delete: (id) => adminRequest('delete', `/blog/${id}`),
  uploadImage: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api({
      method: 'post',
      url: '/blog/upload',
      data: formData,
      headers: { ...getAdminHeaders(), 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

// Settings API
export const settingsApi = {
  get: (key) => request('get', `/settings/${key}`),
  update: (key, value) => adminRequest('put', `/settings/${key}`, { value }),
}

export default api
