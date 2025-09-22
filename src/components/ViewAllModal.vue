<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
    @click="closeModal"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl w-[90%] max-w-5xl h-[76vh] flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div
        class="flex justify-between items-center p-8 border-b border-gray-200 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 text-white"
      >
        <div>
          <h2 class="text-3xl font-bold mb-2">🍽️ All Zi Char Restaurants</h2>
          <p class="text-lg opacity-90">Browse and filter your restaurant collection</p>
        </div>
        <button
          @click="closeModal"
          class="text-white hover:text-gray-200 text-3xl font-bold bg-black bg-opacity-20 rounded-full w-12 h-12 flex items-center justify-center transition-colors"
        >
          ×
        </button>
      </div>

      <!-- Search and Filter -->
      <div class="p-8 border-b border-gray-200 bg-gray-50">
        <div class="flex gap-6 mb-6">
          <div class="flex-1">
            <label class="block text-sm font-semibold text-gray-700 mb-2"
              >🔍 Search Restaurants</label
            >
            <input
              v-model="searchQuery"
              placeholder="Type restaurant name or address..."
              class="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
          <div class="w-64">
            <label class="block text-sm font-semibold text-gray-700 mb-2">⭐ Filter by Tier</label>
            <select
              v-model="selectedTier"
              class="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            >
              <option value="">All Tiers</option>
              <option value="S">S - Would bring gf's parents</option>
              <option value="A">A - Worth the Grab ride</option>
              <option value="B">B - If nearby, why not</option>
              <option value="C">C - Last resort makan</option>
              <option value="D">D - Leftovers > this</option>
              <option value="F">F - Avoid like GST hikes</option>
            </select>
          </div>
        </div>
        <div
          class="text-lg font-medium text-gray-700 bg-white px-4 py-3 rounded-lg border-2 border-gray-200"
        >
          📊 Showing {{ filteredPlaces.length }} of {{ places.length }} restaurants
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-8">
        <div v-if="filteredPlaces.length === 0" class="text-center text-gray-500 py-16">
          <div class="text-6xl mb-4">🔍</div>
          <h3 class="text-2xl font-semibold mb-2">No restaurants found</h3>
          <p class="text-lg">Try adjusting your search or filter criteria</p>
        </div>
        <div v-else class="grid gap-6">
          <div
            v-for="place in filteredPlaces"
            :key="place.id"
            class="p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
            @click="selectPlace(place)"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3
                  class="font-bold text-gray-800 text-2xl mb-3 group-hover:text-blue-600 transition-colors"
                >
                  {{ place.name }}
                </h3>
                <p class="text-gray-600 text-lg mb-4 leading-relaxed">{{ place.address }}</p>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-500">Tier Rating:</span>
                  <span
                    :class="getTierBadgeClass(place.tier)"
                    class="inline-block px-4 py-2 text-lg font-bold rounded-full"
                  >
                    {{ place.tier }}
                  </span>
                </div>
              </div>
              <div class="ml-6 flex items-center">
                <div class="text-4xl opacity-20 group-hover:opacity-40 transition-opacity">📍</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue'

export default {
  name: 'ViewAllModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    places: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['close', 'select-place'],
  setup(props, { emit }) {
    const searchQuery = ref('')
    const selectedTier = ref('')

    const filteredPlaces = computed(() => {
      let filtered = props.places

      // Filter by search query
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(
          (place) =>
            place.name.toLowerCase().includes(query) || place.address.toLowerCase().includes(query)
        )
      }

      // Filter by tier
      if (selectedTier.value) {
        filtered = filtered.filter((place) => place.tier === selectedTier.value)
      }

      return filtered
    })

    const getTierBadgeClass = (tier) => {
      const tierClasses = {
        S: 'bg-blue-100 text-blue-800',
        A: 'bg-blue-200 text-blue-800',
        B: 'bg-blue-300 text-blue-800',
        C: 'bg-blue-400 text-white',
        D: 'bg-blue-500 text-white',
        F: 'bg-blue-600 text-white',
      }
      return tierClasses[tier] || 'bg-gray-100 text-gray-700'
    }

    const closeModal = () => {
      emit('close')
    }

    const selectPlace = (place) => {
      emit('select-place', place)
      closeModal()
    }

    // Reset filters when modal opens
    watch(
      () => props.isOpen,
      (isOpen) => {
        if (isOpen) {
          searchQuery.value = ''
          selectedTier.value = ''
        }
      }
    )

    return {
      searchQuery,
      selectedTier,
      filteredPlaces,
      getTierBadgeClass,
      closeModal,
      selectPlace,
    }
  },
}
</script>
