<template>
  <div class="bg-white border border-slate-200 rounded-lg p-4">
    <form @submit.prevent="handleSubmit" class="space-y-3">
      <div class="space-y-1.5">
        <label for="placeName" class="text-xs font-medium text-slate-700">
          Restaurant Name
        </label>
        <input
          id="placeName"
          v-model="formData.name"
          type="text"
          placeholder="Enter name"
          required
          :disabled="isLoading"
          class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all text-sm placeholder:text-slate-400"
        />
      </div>

      <div class="space-y-1.5">
        <label for="placeAddress" class="text-xs font-medium text-slate-700">
          Address
        </label>
        <input
          id="placeAddress"
          v-model="formData.address"
          type="text"
          placeholder="Full address with postal code"
          required
          :disabled="isLoading"
          class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all text-sm placeholder:text-slate-400"
        />
        <p class="text-xs text-slate-500 flex items-start gap-1.5">
          <svg class="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
          </svg>
          <span>Include street, building name & postal code</span>
        </p>
      </div>

      <div class="space-y-1.5">
        <label for="placeTier" class="text-xs font-medium text-slate-700">
          Tier Rating
        </label>
        <div class="relative">
          <select
            id="placeTier"
            v-model="formData.tier"
            required
            :disabled="isLoading"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all text-sm appearance-none cursor-pointer text-slate-700"
          >
            <option value="">Select tier</option>
            <option v-for="tier in tierOptions" :key="tier.code" :value="tier.code">
              {{ tier.label }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>
      <div class="space-y-1.5">
        <label for="placeCuisine" class="text-xs font-medium text-slate-700">
          Cuisine Type
        </label>
        <div class="relative">
          <select
            id="placeCuisine"
            v-model="formData.cuisine_type"
            required
            :disabled="isLoading"
            class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed transition-all text-sm appearance-none cursor-pointer text-slate-700"
          >
            <option value="">Select cuisine type</option>
            <option v-for="cuisine in cuisineNames" :key="cuisine" :value="cuisine">
              {{ cuisine }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Tags Section (shown only for cuisines with tags) -->
      <div v-if="availableTags.length > 0" class="space-y-1.5">
        <label class="text-xs font-medium text-slate-700">Tags (optional)</label>
        <div class="flex flex-wrap gap-2">
          <label
            v-for="tag in availableTags"
            :key="tag"
            class="inline-flex items-center gap-1.5 cursor-pointer"
          >
            <input
              type="checkbox"
              :value="tag"
              v-model="formData.tags"
              :disabled="isLoading"
              class="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500 disabled:cursor-not-allowed"
            />
            <span class="text-xs text-slate-600">{{ tag }}</span>
          </label>
        </div>
      </div>

      <div class="flex gap-2 pt-1">
        <button
          type="submit"
          class="flex-1 bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-slate-800 focus:outline-none disabled:bg-slate-300 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center text-sm"
          :disabled="isLoading || !formData.name || !formData.address || !formData.tier || !formData.cuisine_type"
        >
          <span
            v-if="isLoading"
            class="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
          ></span>
          {{ isLoading ? 'Adding...' : 'Add' }}
        </button>

        <button
          type="button"
          @click="resetForm"
          :disabled="isLoading"
          class="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
        >
          Clear
        </button>
      </div>
    </form>

    <div
      v-if="error"
      class="mt-3 p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200"
    >
      <div class="flex items-start gap-2">
        <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <div v-html="error.replace(/\n/g, '<br>')"></div>
      </div>
    </div>

    <div
      v-if="success"
      class="mt-3 p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200"
    >
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <span>{{ success }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch } from 'vue'
import { useConfig } from '../composables/useConfig'
import { classifyRegion } from '../utils/regionMapping'

export default {
  name: 'AddPlaceForm',
  emits: ['place-added'],
  setup(_, { emit }) {
    const isLoading = ref(false)
    const error = ref('')
    const success = ref(false)

    const { cuisineNames, tierOptions, getTagsForCuisine } = useConfig()

    const formData = reactive({
      name: '',
      address: '',
      tier: '',
      cuisine_type: '',
      tags: [],
    })

    const availableTags = computed(() => {
      return getTagsForCuisine(formData.cuisine_type)
    })

    // Clear tags when cuisine type changes
    watch(() => formData.cuisine_type, () => {
      formData.tags = []
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
          const region = classifyRegion(address, result.formatted_address)
          return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            confidence: 'high',
            formatted_address: result.formatted_address,
            region
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
            const region = classifyRegion(addressWithoutUnit, result.formatted_address)
            return {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
              confidence: 'medium',
              formatted_address: result.formatted_address,
              region
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
            const region = classifyRegion(simplifiedAddress, result.formatted_address)
            return {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
              confidence: 'low',
              formatted_address: result.formatted_address,
              region
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
            const region = classifyRegion(streetOnly, result.formatted_address)
            return {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
              confidence: 'very-low',
              formatted_address: result.formatted_address,
              region
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
          cuisine_type: formData.cuisine_type,
          tags: [...formData.tags],
          region: coords.region,
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
      formData.cuisine_type = ''
      formData.tags = []
      error.value = ''
      success.value = false
    }

    return {
      formData,
      isLoading,
      error,
      success,
      availableTags,
      cuisineNames,
      tierOptions,
      handleSubmit,
      resetForm,
    }
  },
}
</script>
