<template>
  <div
    class="w-96 min-w-96 h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0 relative z-[90] shadow-lg animate-fade-in"
  >
    <!-- Header Section -->
    <div class="relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600"></div>
      <div class="absolute inset-0 bg-black/10"></div>
      <div class="relative p-6 text-white text-center">
        <div class="mb-3">
          <div class="text-4xl mb-2">🍽️</div>
          <h1 class="text-2xl font-bold tracking-tight">Zi Char Tier List</h1>
        </div>
        <p class="text-sm opacity-90 font-medium">Rate and discover zi char restaurants</p>
      </div>
    </div>

    <!-- Main Content Section -->
    <div class="flex-1 overflow-y-auto bg-gray-50">
      <div class="p-6 space-y-5">
        <!-- Add New Place Section -->
        <div class="space-y-3">
          <button
            @click="toggleAddPlaceForm"
            :class="
              showAddPlaceForm
                ? 'bg-white text-gray-700 border-gray-300 shadow-sm'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-md hover:shadow-lg'
            "
            class="w-full flex items-center justify-start px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium hover:scale-105 active:scale-95"
          >
            <span class="mr-3 text-lg">{{ showAddPlaceForm ? '▼' : '▶' }}</span>
            <span class="mr-2">➕</span>
            Add New Place
          </button>

          <div v-if="showAddPlaceForm" class="mt-3">
            <AddPlaceForm @place-added="handlePlaceAdded" />
          </div>
        </div>

        <!-- Search Section -->
        <div class="space-y-3">
          <div class="relative">
            <input
              :value="searchQuery"
              @input="$emit('update-search', $event.target.value)"
              placeholder="Search food places..."
              class="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-400">🔍</span>
            </div>
          </div>
        </div>

        <!-- Tier Filter Section -->
        <div class="space-y-3">
          <div class="relative">
            <select
              :value="selectedTier"
              @change="$emit('update-tier', $event.target.value)"
              class="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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

        <!-- Places List Section -->
        <div class="mt-6 bg-white border-t border-gray-200 rounded-t-xl">
          <div class="p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-800">Zi Char Restaurants</h3>
              <button
                @click="$emit('view-all')"
                class="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                View All
              </button>
            </div>
            <div v-if="filteredPlaces.length === 0" class="text-center text-gray-500 py-8">
              No restaurants found
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="place in filteredPlaces.slice(0, 5)"
                :key="place.id"
                class="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                @click="$emit('focus-place', place)"
              >
                <div class="font-medium text-gray-800">{{ place.name }}</div>
                <div class="text-sm text-gray-600">{{ place.address }}</div>
                <div class="mt-2">
                  <span
                    :class="getTierBadgeClass(place.tier)"
                    class="inline-block px-2 py-1 text-xs font-semibold rounded-full"
                  >
                    {{ place.tier }}
                  </span>
                </div>
              </div>
              <div v-if="filteredPlaces.length > 5" class="text-center text-gray-500 text-sm">
                +{{ filteredPlaces.length - 5 }} more restaurants
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import AddPlaceForm from './AddPlaceForm.vue'

export default {
  name: 'Sidebar',
  components: {
    AddPlaceForm,
  },
  props: {
    places: {
      type: Array,
      default: () => [],
    },
    searchQuery: {
      type: String,
      default: '',
    },
    selectedTier: {
      type: String,
      default: '',
    },
  },
  emits: ['update-search', 'update-tier', 'place-added', 'focus-place', 'view-all'],
  setup(props, { emit }) {
    const showAddPlaceForm = ref(false)

    const filteredPlaces = computed(() => {
      let filtered = props.places

      // Filter by search query
      if (props.searchQuery) {
        const query = props.searchQuery.toLowerCase()
        filtered = filtered.filter(
          (place) =>
            place.name.toLowerCase().includes(query) || place.address.toLowerCase().includes(query)
        )
      }

      // Filter by tier
      if (props.selectedTier) {
        filtered = filtered.filter((place) => place.tier === props.selectedTier)
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

    const handlePlaceAdded = (place) => {
      emit('place-added', place)
      // Hide the form after successfully adding a place
      showAddPlaceForm.value = false
    }

    const toggleAddPlaceForm = () => {
      showAddPlaceForm.value = !showAddPlaceForm.value
    }

    return {
      showAddPlaceForm,
      filteredPlaces,
      getTierBadgeClass,
      handlePlaceAdded,
      toggleAddPlaceForm,
    }
  },
}
</script>
