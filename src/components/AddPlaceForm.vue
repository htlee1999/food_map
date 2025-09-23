<template>
  <div class="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-md">
    <div class="pb-3">
      <h3 class="text-base font-semibold text-gray-800 flex items-center">
        <span class="mr-2">📍</span>
        Add New Place
      </h3>
    </div>
    <div>
      <form @submit.prevent="handleSubmit" class="space-y-3">
        <div class="space-y-1">
          <label for="placeName" class="text-xs font-semibold text-gray-700 flex items-center">
            <span class="mr-1">🏪</span>
            Shop/Restaurant Name *
          </label>
          <input
            id="placeName"
            v-model="formData.name"
            type="text"
            placeholder="Enter shop or restaurant name"
            required
            :disabled="isLoading"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 text-sm"
          />
        </div>

        <div class="space-y-1">
          <label for="placeAddress" class="text-xs font-semibold text-gray-700 flex items-center">
            <span class="mr-1">📍</span>
            Address *
          </label>
          <input
            id="placeAddress"
            v-model="formData.address"
            type="text"
            placeholder="Enter full address (e.g., 10 Anson Rd, International Plaza, Singapore 079903)"
            required
            :disabled="isLoading"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 text-sm"
          />
          <div
            class="flex items-start text-xs text-gray-500 bg-blue-50 p-2 rounded-md border border-blue-100"
          >
            <span class="mr-1 mt-0.5">💡</span>
            <span>Tips: Include street number, street name, building name, and postal code</span>
          </div>
        </div>

        <div class="space-y-1">
          <label for="placeTier" class="text-xs font-semibold text-gray-700 flex items-center">
            <span class="mr-1">⭐</span>
            Tier Rating *
          </label>
          <select
            id="placeTier"
            v-model="formData.tier"
            required
            :disabled="isLoading"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 text-sm"
          >
            <option value="">Select a tier</option>
            <option value="S">S - Would bring gf's parents</option>
            <option value="A">A - Worth the Grab ride</option>
            <option value="B">B - If nearby, why not</option>
            <option value="C">C - Last resort makan</option>
            <option value="D">D - Leftovers > this</option>
            <option value="F">F - Avoid like GST hikes</option>
          </select>
        </div>

        <div class="flex gap-2">
          <button
            type="submit"
            class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center justify-center text-sm"
            :disabled="isLoading || !formData.name || !formData.address || !formData.tier"
          >
            <span
              v-if="isLoading"
              class="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
            ></span>
            <span v-if="!isLoading" class="mr-1">✅</span>
            {{ isLoading ? 'Geocoding...' : 'Add Place' }}
          </button>

          <button
            type="button"
            @click="resetForm"
            :disabled="isLoading"
            class="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm text-sm"
          >
            Clear
          </button>
        </div>
      </form>

      <div
        v-if="error"
        class="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200"
      >
        <div class="flex items-start">
          <span class="mr-1 mt-0.5">⚠️</span>
          <div v-html="error.replace(/\n/g, '<br>')"></div>
        </div>
      </div>

      <div
        v-if="success"
        class="mt-3 p-3 bg-green-50 text-green-700 text-xs rounded-lg border border-green-200"
      >
        <div class="flex items-center">
          <span class="mr-1">✅</span>
          {{ success }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'

export default {
  name: 'AddPlaceForm',
  emits: ['place-added'],
  setup(_, { emit }) {
    const isLoading = ref(false)
    const error = ref('')
    const success = ref(false)

    const formData = reactive({
      name: '',
      address: '',
      tier: '',
    })

    // Geocode address using Google Geocoding API with multiple fallback strategies
    const geocodeAddress = async (address) => {
      try {
        const apiKey = import.meta.env.VITE_GOOGLE_MAP_API || 'your_google_maps_api_key_here'
        
        if (apiKey === 'your_google_maps_api_key_here') {
          throw new Error('Google Maps API key not configured. Please set VITE_GOOGLE_MAP_API in your environment variables.')
        }

        // Strategy 1: Try the full address as provided
        let response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&region=sg`
        )
        let data = await response.json()

        if (data.status === 'OK' && data.results.length > 0) {
          const result = data.results[0]
          return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            confidence: 'high',
            formatted_address: result.formatted_address
          }
        }

        // Strategy 2: Try without unit number (remove #01-20)
        const addressWithoutUnit = address
          .replace(/#\d+-\d+/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        if (addressWithoutUnit !== address) {
          response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressWithoutUnit)}&key=${apiKey}&region=sg`
          )
          data = await response.json()

          if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0]
            return {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
              confidence: 'medium',
              formatted_address: result.formatted_address
            }
          }
        }

        // Strategy 3: Try with just the street name and building name
        const streetMatch = address.match(/(\d+\s+[^,]+)/)
        const buildingMatch = address.match(
          /([A-Za-z\s]+Plaza|[A-Za-z\s]+Building|[A-Za-z\s]+Centre|[A-Za-z\s]+Mall)/i
        )

        if (streetMatch && buildingMatch) {
          const simplifiedAddress = `${streetMatch[1]}, ${buildingMatch[1]}, Singapore`
          response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(simplifiedAddress)}&key=${apiKey}&region=sg`
          )
          data = await response.json()

          if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0]
            return {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
              confidence: 'low',
              formatted_address: result.formatted_address
            }
          }
        }

        // Strategy 4: Try with just the street name
        if (streetMatch) {
          const streetOnly = `${streetMatch[1]}, Singapore`
          response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(streetOnly)}&key=${apiKey}&region=sg`
          )
          data = await response.json()

          if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0]
            return {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
              confidence: 'very-low',
              formatted_address: result.formatted_address
            }
          }
        }

        // Handle specific Google Maps API errors
        if (data.status === 'ZERO_RESULTS') {
          throw new Error('Address not found. Please check the spelling and try again.')
        } else if (data.status === 'OVER_QUERY_LIMIT') {
          throw new Error('Geocoding service temporarily unavailable. Please try again later.')
        } else if (data.status === 'REQUEST_DENIED') {
          throw new Error('Geocoding service access denied. Please check your API key configuration.')
        }

        return null
      } catch (err) {
        console.error('Geocoding error:', err)
        if (err.message.includes('API key')) {
          throw err
        }
        throw new Error(
          'Failed to geocode address. Please check your internet connection and try again.'
        )
      }
    }

    const handleSubmit = async () => {
      if (!formData.name.trim() || !formData.address.trim() || !formData.tier) {
        error.value = 'Please fill in all required fields'
        return
      }

      isLoading.value = true
      error.value = ''
      success.value = false

      try {
        const coords = await geocodeAddress(formData.address)

        if (!coords) {
          throw new Error(
            'Address not found. Try:\n• Removing unit numbers (#01-20)\n• Using just the street name and building\n• Checking the spelling'
          )
        }

        const newPlace = {
          id: `place_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: formData.name.trim(),
          address: formData.address.trim(),
          tier: formData.tier,
          coords: {
            lat: coords.lat,
            lng: coords.lng,
          },
        }

        emit('place-added', newPlace)

        // Show success message with confidence level
        if (coords.confidence === 'high') {
          success.value = '✅ Place added successfully!'
        } else if (coords.confidence === 'medium') {
          success.value = '✅ Place added (approximate location)'
        } else if (coords.confidence === 'low') {
          success.value = '⚠️ Place added (general area - please verify location)'
        } else {
          success.value = '⚠️ Place added (rough location - please verify)'
        }

        resetForm()

        // Clear success message after 5 seconds
        setTimeout(() => {
          success.value = false
        }, 5000)
      } catch (err) {
        error.value = err.message || 'An error occurred while adding the place'
      } finally {
        isLoading.value = false
      }
    }

    const resetForm = () => {
      formData.name = ''
      formData.address = ''
      formData.tier = ''
      error.value = ''
      success.value = false
    }

    return {
      formData,
      isLoading,
      error,
      success,
      handleSubmit,
      resetForm,
    }
  },
}
</script>
