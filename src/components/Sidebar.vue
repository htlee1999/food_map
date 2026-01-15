<template>
  <div
    class="w-80 min-w-80 h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col flex-shrink-0 relative z-[90]"
  >
    <!-- Header Section -->
    <div class="px-6 pt-8 pb-6">
      <div class="flex items-center justify-between gap-3 mb-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-xl">
            🍽️
          </div>
          <div>
            <h1 class="text-xl font-semibold text-slate-900 tracking-tight">{{ selectedCategory }}</h1>
            <p class="text-xs text-slate-500">Tier List</p>
          </div>
        </div>
        <!-- Mobile close button -->
        <button
          @click="$emit('close-sidebar')"
          class="lg:hidden text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Main Content Section -->
    <div class="flex-1 overflow-y-auto px-6 pb-6">
      <div class="space-y-4">
        <!-- Category Toggle Section -->
        <div class="relative">
          <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              v-for="category in categories"
              :key="category"
              @click="$emit('update-category', category)"
              :class="selectedCategory === category ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'"
              class="px-3 py-2 rounded-lg focus:outline-none transition-all text-xs font-medium whitespace-nowrap flex-shrink-0"
            >
              {{ category }}
            </button>
          </div>
        </div>

        <!-- Add New Place Section (Admin Only) -->
        <div v-if="isAdmin">
          <button
            @click="toggleAddPlaceForm"
            :class="
              showAddPlaceForm
                ? 'bg-slate-100 text-slate-700'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            "
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg focus:outline-none transition-all duration-200 text-sm font-medium"
          >
            <span class="text-base">{{ showAddPlaceForm ? '−' : '+' }}</span>
            <span>{{ showAddPlaceForm ? 'Close' : 'Add Place' }}</span>
          </button>

          <div v-if="showAddPlaceForm" class="mt-3">
            <AddPlaceForm @place-added="handlePlaceAdded" />
          </div>
        </div>

        <!-- Search Section -->
        <div class="relative">
          <input
            :value="searchQuery"
            @input="$emit('update-search', $event.target.value)"
            placeholder="Search restaurants..."
            class="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all text-sm placeholder:text-slate-400"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <!-- Tier Filter Section -->
        <div class="relative">
          <select
            :value="selectedTier"
            @change="$emit('update-tier', $event.target.value)"
            class="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all text-sm text-slate-700 appearance-none cursor-pointer"
          >
            <option value="">All Tiers</option>
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

        <!-- Places List Section -->
        <div class="pt-2">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-sm font-medium text-slate-900">Restaurants</h3>
            <button
              @click="$emit('view-all')"
              class="text-slate-500 hover:text-slate-900 text-xs font-medium transition-colors"
            >
              View All
            </button>
          </div>
          <div v-if="filteredPlaces.length === 0" class="text-center text-slate-400 py-12 text-sm">
            No restaurants found
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="place in filteredPlaces.slice(0, 5)"
              :key="place.id"
              class="group p-3 bg-white border border-slate-100 rounded-lg cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all duration-200"
              @click="$emit('focus-place', place)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-slate-900 text-sm truncate group-hover:text-slate-700">
                    {{ place.name }}
                  </div>
                  <div class="text-xs text-slate-500 mt-0.5 truncate">{{ place.address }}</div>
                  <div v-if="place.tags && place.tags.length > 0" class="flex flex-wrap gap-1 mt-1.5">
                    <span
                      v-for="tag in place.tags"
                      :key="tag"
                      class="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <span
                  :class="getTierBadgeClass(place.tier)"
                  class="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold"
                >
                  {{ place.tier }}
                </span>
              </div>
            </div>
            <div v-if="filteredPlaces.length > 5" class="text-center text-slate-400 text-xs pt-2">
              +{{ filteredPlaces.length - 5 }} more
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
import { useConfig } from '../composables/useConfig'

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
    selectedCategory: {
      type: String,
      default: '',
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update-search', 'update-tier', 'update-category', 'place-added', 'focus-place', 'view-all', 'close-sidebar'],
  setup(props, { emit }) {
    const showAddPlaceForm = ref(false)
    const { cuisineNames: categories, tierOptions, getTierBadgeClass } = useConfig()

    const filteredPlaces = computed(() => {
      let filtered = props.places

      // Filter by category
      if (props.selectedCategory) {
        filtered = filtered.filter((place) => place.cuisine_type === props.selectedCategory)
      }

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
      categories,
      tierOptions,
    }
  },
}
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
