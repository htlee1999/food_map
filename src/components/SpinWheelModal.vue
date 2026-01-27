<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
    @click="$emit('close')"
  >
    <div
      class="bg-white rounded-xl shadow-xl w-[90%] max-w-lg max-h-[90vh] flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="flex justify-between items-center px-6 py-4 border-b border-slate-200">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">Random Pick</h2>
          <p class="text-xs text-slate-500 mt-0.5">Spin to find your next meal</p>
        </div>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Wheel Section - Prominent, non-scrollable -->
      <div class="px-6 py-4 flex flex-col items-center">
        <div v-if="filteredPlaces.length === 0" class="text-center text-slate-400 py-8">
          <svg class="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 class="text-base font-medium text-slate-600 mb-1">No restaurants match</h3>
          <p class="text-sm text-slate-500">Try adjusting your filters below</p>
        </div>

        <template v-else>
          <!-- Wheel Container -->
          <div class="relative w-64 h-64">
            <!-- Pointer -->
            <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <svg class="w-6 h-6 text-slate-900 drop-shadow-md rotate-180" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 14h16L12 2z"></path>
              </svg>
            </div>

            <!-- Spinning Wheel -->
            <div
              ref="wheelRef"
              class="w-full h-full rounded-full shadow-lg border-4 border-slate-200 overflow-hidden"
              :style="wheelStyle"
            >
              <!-- Wheel segments using conic gradient -->
              <div
                class="w-full h-full"
                :style="{ background: conicGradient }"
              ></div>
            </div>

            <!-- Center circle - Spin Button -->
            <button
              @click="spin"
              :disabled="isSpinning || filteredPlaces.length === 0"
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white shadow-md border-2 border-slate-200 flex items-center justify-center hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span class="text-xl">{{ isSpinning ? '🎲' : '🎰' }}</span>
            </button>
          </div>
        </template>
      </div>

      <!-- Filters - Scrollable, secondary -->
      <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 space-y-3 overflow-y-auto max-h-[35vh] lg:max-h-[40vh]">
        <!-- Cuisine Filter -->
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1.5">Cuisine</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="cuisine in cuisineNames"
              :key="cuisine"
              @click="toggleFilter('cuisines', cuisine)"
              :class="selectedCuisines.includes(cuisine)
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'"
              class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
            >
              {{ cuisine }}
            </button>
          </div>
        </div>

        <!-- Tier Filter -->
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1.5">Tier</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="tier in tierOptions"
              :key="tier.code"
              @click="toggleFilter('tiers', tier.code)"
              :class="selectedTiers.includes(tier.code)
                ? getTierBadgeClass(tier.code) + ' ring-2 ring-offset-1 ring-slate-400'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'"
              class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
            >
              {{ tier.code }}
            </button>
          </div>
        </div>

        <!-- Region Filter -->
        <div>
          <label class="block text-xs font-medium text-slate-700 mb-1.5">Region</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="region in availableRegions"
              :key="region"
              @click="toggleFilter('regions', region)"
              :class="selectedRegions.includes(region)
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'"
              class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
            >
              {{ region }}
            </button>
          </div>
        </div>

        <div class="text-xs text-slate-600 pt-1">
          {{ filteredPlaces.length }} restaurant{{ filteredPlaces.length !== 1 ? 's' : '' }} in wheel
        </div>
      </div>

      <!-- Result Section -->
      <div v-if="selectedPlace" class="px-6 py-4 border-t border-slate-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <div class="flex items-center justify-between gap-4">
          <div class="flex-1 min-w-0">
            <p class="text-xs text-slate-500 mb-1">Your pick:</p>
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-slate-900 truncate">{{ selectedPlace.name }}</h3>
              <span
                :class="getTierBadgeClass(selectedPlace.tier)"
                class="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold"
              >
                {{ selectedPlace.tier }}
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-0.5 truncate">{{ selectedPlace.address }}</p>
          </div>
          <button
            @click="viewOnMap"
            class="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex-shrink-0"
          >
            View on Map
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useConfig } from '../composables/useConfig'
import { getAvailableRegions } from '../utils/regionMapping'

export default {
  name: 'SpinWheelModal',
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
    const { cuisineNames, tierOptions, getTierBadgeClass } = useConfig()
    const availableRegions = getAvailableRegions()

    const selectedCuisines = ref([])
    const selectedTiers = ref([])
    const selectedRegions = ref([])
    const isSpinning = ref(false)
    const selectedPlace = ref(null)
    const wheelRef = ref(null)
    const currentRotation = ref(0)

    // Wheel colors for segments
    const segmentColors = [
      '#f87171', // red
      '#fb923c', // orange
      '#fbbf24', // amber
      '#a3e635', // lime
      '#4ade80', // green
      '#2dd4bf', // teal
      '#22d3ee', // cyan
      '#60a5fa', // blue
      '#a78bfa', // violet
      '#f472b6', // pink
      '#fb7185', // rose
      '#94a3b8', // slate
    ]

    const filteredPlaces = computed(() => {
      let filtered = props.places

      if (selectedCuisines.value.length > 0) {
        filtered = filtered.filter(place => selectedCuisines.value.includes(place.cuisine_type))
      }

      if (selectedTiers.value.length > 0) {
        filtered = filtered.filter(place => selectedTiers.value.includes(place.tier))
      }

      if (selectedRegions.value.length > 0) {
        filtered = filtered.filter(place => selectedRegions.value.includes(place.region))
      }

      return filtered
    })

    const conicGradient = computed(() => {
      const places = filteredPlaces.value
      if (places.length === 0) return 'linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 100%)'

      const segmentAngle = 360 / places.length
      const gradientStops = places.map((_, index) => {
        const color = segmentColors[index % segmentColors.length]
        const start = index * segmentAngle
        const end = (index + 1) * segmentAngle
        return `${color} ${start}deg ${end}deg`
      })

      return `conic-gradient(from 0deg, ${gradientStops.join(', ')})`
    })

    const wheelStyle = computed(() => ({
      transform: `rotate(${currentRotation.value}deg)`,
      transition: isSpinning.value
        ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
        : 'none',
    }))

    const toggleFilter = (filterType, value) => {
      const filterMap = {
        cuisines: selectedCuisines,
        tiers: selectedTiers,
        regions: selectedRegions,
      }
      const filter = filterMap[filterType]
      const index = filter.value.indexOf(value)

      if (index === -1) {
        filter.value.push(value)
      } else {
        filter.value.splice(index, 1)
      }

      // Clear selected place when filters change
      selectedPlace.value = null
    }

    const spin = () => {
      if (isSpinning.value || filteredPlaces.value.length === 0) return

      isSpinning.value = true
      selectedPlace.value = null

      const places = filteredPlaces.value
      const segmentAngle = 360 / places.length

      // Random winner index
      const winnerIndex = Math.floor(Math.random() * places.length)

      // Calculate final rotation
      // We want the pointer (at top) to point to the winning segment
      // Segment 0 starts at 0deg (right side), so we need to offset by 90deg (270deg from top)
      // Plus half segment to land in center of segment
      const baseRotation = 360 * 5 // 5 full spins
      const winnerAngle = winnerIndex * segmentAngle + segmentAngle / 2
      // Pointer is at top (270deg in standard coords, or -90deg)
      // We rotate wheel clockwise, so to land segment at top: 360 - winnerAngle + 90
      const finalAngle = baseRotation + (360 - winnerAngle + 90)

      currentRotation.value = finalAngle

      // After animation completes
      setTimeout(() => {
        isSpinning.value = false
        selectedPlace.value = places[winnerIndex]
      }, 4000)
    }

    const viewOnMap = () => {
      if (selectedPlace.value) {
        emit('select-place', selectedPlace.value)
        emit('close')
      }
    }

    // Reset state when modal opens
    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        selectedCuisines.value = []
        selectedTiers.value = []
        selectedRegions.value = []
        selectedPlace.value = null
        currentRotation.value = 0
        isSpinning.value = false
      }
    })

    return {
      cuisineNames,
      tierOptions,
      availableRegions,
      selectedCuisines,
      selectedTiers,
      selectedRegions,
      filteredPlaces,
      isSpinning,
      selectedPlace,
      wheelRef,
      currentRotation,
      conicGradient,
      wheelStyle,
      getTierBadgeClass,
      toggleFilter,
      spin,
      viewOnMap,
    }
  },
}
</script>
