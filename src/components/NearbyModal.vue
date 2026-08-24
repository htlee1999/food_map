<template>
  <Transition name="modal">
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] sm:p-4"
    @click="$emit('close')"
  >
    <div
      class="modal-panel bg-white sm:rounded-xl rounded-t-2xl shadow-xl w-full sm:w-[90%] max-w-lg max-h-[92vh] sm:max-h-[90vh] flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="flex justify-between items-center px-6 py-4 border-b border-stone-200">
        <div>
          <h2 class="text-lg font-semibold text-stone-900">Where are you headed?</h2>
          <p class="text-xs text-stone-500 mt-0.5">
            The best-rated spots within {{ radiusKm }}km of your destination
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="text-stone-400 hover:text-stone-600 transition-colors"
          aria-label="Close"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Destination input -->
      <div class="px-6 pt-4 pb-3">
        <form class="flex items-center gap-2" @submit.prevent="search">
          <div class="flex items-center gap-2 flex-1 bg-white rounded-lg border border-stone-300 focus-within:border-stone-900 transition-colors h-11 px-3.5">
            <svg class="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref="inputRef"
              v-model="destinationQuery"
              type="search"
              enterkeyhint="search"
              placeholder="e.g. Bugis MRT, Marina Bay Sands"
              class="flex-1 min-w-0 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            :disabled="isLoading || !destinationQuery.trim()"
            class="h-11 px-4 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {{ isLoading ? '…' : 'Find' }}
          </button>
        </form>
        <p v-if="resolvedAddress" class="mt-2 text-xs text-stone-500 truncate">
          Near <span class="text-stone-700">{{ resolvedAddress }}</span>
        </p>
        <p v-if="error" class="mt-2 text-xs text-red-600">{{ error }}</p>
      </div>

      <!-- Results -->
      <div class="flex-1 overflow-y-auto px-6 pb-5 space-y-4">
        <!-- Top pick -->
        <div v-if="topPick">
          <div class="text-[10px] tracking-[0.22em] uppercase text-stone-500 mb-2">Top pick</div>
          <button
            @click="select(topPick)"
            class="w-full text-left rounded-xl border border-stone-900 bg-stone-900 text-white p-4 hover:bg-stone-800 transition-colors"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-amber-300 text-lg leading-none">★</span>
              <h3 class="font-semibold truncate flex-1">{{ topPick.name }}</h3>
              <span
                :class="getTierBadgeClass(topPick.tier)"
                class="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold"
              >
                {{ topPick.tier }}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-1.5 text-xs text-stone-300">
              <span>{{ formatDistance(topPick.distanceKm) }} away</span>
              <span v-if="topPick.cuisine_type">·</span>
              <span v-if="topPick.cuisine_type" class="truncate">{{ topPick.cuisine_type }}</span>
            </div>
          </button>
        </div>

        <!-- The rest, nearest first -->
        <div v-if="otherPlaces.length > 0">
          <div class="text-[10px] tracking-[0.22em] uppercase text-stone-500 mb-2">
            {{ otherPlaces.length }} more nearby
          </div>
          <ul class="space-y-1.5">
            <li v-for="place in otherPlaces" :key="place.id">
              <button
                @click="select(place)"
                class="w-full text-left flex items-center gap-3 rounded-lg border border-stone-200 p-3 hover:border-stone-400 hover:bg-stone-50 transition-colors"
              >
                <span
                  :class="getTierBadgeClass(place.tier)"
                  class="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold"
                >
                  {{ place.tier }}
                </span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-stone-900 truncate">{{ place.name }}</div>
                  <div class="text-xs text-stone-500 truncate">{{ place.address }}</div>
                </div>
                <span class="flex-shrink-0 text-xs font-medium text-stone-500">
                  {{ formatDistance(place.distanceKm) }}
                </span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Empty states -->
        <div v-if="anchor && ranked.length === 0" class="text-center text-stone-400 py-10">
          <svg class="w-14 h-14 mx-auto mb-3 text-stone-300" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z" />
            <circle cx="12" cy="11" r="2" />
          </svg>
          <h3 class="text-base font-medium text-stone-600 mb-1">No rated spots within {{ radiusKm }}km</h3>
          <p class="text-sm text-stone-500">Try a destination in a busier area.</p>
        </div>

        <div v-if="!anchor && !isLoading" class="text-center text-stone-400 py-10">
          <p class="text-sm">Enter where you're going to see the nearest rated food.</p>
        </div>
      </div>
    </div>
  </div>
  </Transition>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'
import { useConfig } from '../composables/useConfig'
import { geocodeAddress } from '../utils/geocode'
import { rankByProximity, pickTopPick, formatDistance, NEARBY_RADIUS_KM } from '../utils/distance'

export default {
  name: 'NearbyModal',
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
  emits: ['close', 'select-place', 'anchor-set'],
  setup(props, { emit }) {
    const { getTierBadgeClass } = useConfig()

    const inputRef = ref(null)
    const destinationQuery = ref('')
    const resolvedAddress = ref('')
    const anchor = ref(null)
    const isLoading = ref(false)
    const error = ref('')
    const radiusKm = NEARBY_RADIUS_KM

    const ranked = computed(() => rankByProximity(props.places, anchor.value, { radiusKm }))
    const topPick = computed(() => pickTopPick(ranked.value))
    const otherPlaces = computed(() =>
      topPick.value ? ranked.value.filter((place) => place.id !== topPick.value.id) : ranked.value
    )

    const resetResults = () => {
      anchor.value = null
      resolvedAddress.value = ''
      error.value = ''
    }

    const search = async () => {
      const query = destinationQuery.value.trim()
      if (!query || isLoading.value) return

      isLoading.value = true
      resetResults()

      try {
        const result = await geocodeAddress(query)
        if (!result) {
          error.value = 'Destination not found. Try a nearby landmark or MRT station.'
          return
        }
        anchor.value = { lat: result.lat, lng: result.lng }
        resolvedAddress.value = result.formatted_address
        emit('anchor-set', { coords: anchor.value, radiusKm })
      } catch (err) {
        error.value = err.message
      } finally {
        isLoading.value = false
      }
    }

    const select = (place) => {
      emit('select-place', place)
    }

    // Fresh start each time the modal opens, and focus the input.
    watch(
      () => props.isOpen,
      (isOpen) => {
        if (!isOpen) return
        destinationQuery.value = ''
        resetResults()
        nextTick(() => inputRef.value?.focus())
      }
    )

    return {
      inputRef,
      destinationQuery,
      resolvedAddress,
      anchor,
      isLoading,
      error,
      radiusKm,
      ranked,
      topPick,
      otherPlaces,
      search,
      select,
      formatDistance,
      getTierBadgeClass,
    }
  },
}
</script>

<style scoped>
/* Matches the app's other modals: backdrop fades, panel slides up. */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: translateY(100%);
}
@media (min-width: 640px) {
  .modal-enter-from .modal-panel,
  .modal-leave-to .modal-panel {
    transform: translateY(24px) scale(0.97);
  }
}
</style>
