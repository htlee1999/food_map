<template>
  <aside
    v-if="isOpen"
    class="hidden lg:flex lg:w-[20vw] lg:min-w-[260px] lg:max-w-[340px] h-full bg-stone-50 border-r border-stone-200 flex-col flex-shrink-0 z-[80]"
  >
    <!-- Header -->
    <div class="px-7 pt-7 pb-4 bg-white border-b border-stone-200">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2
            class="text-[30px] leading-none text-stone-900 uppercase tracking-tight truncate font-semibold"
          >
            {{ selectedCategory || 'All' }}
          </h2>
          <p class="mt-2 text-[10px] tracking-[0.22em] uppercase text-stone-500 font-medium">
            {{ filteredPlaces.length }}
            {{ filteredPlaces.length === 1 ? 'establishment' : 'establishments' }} found
            <template v-if="selectedRegion"> / {{ selectedRegion }}</template>
          </p>
        </div>
        <button
          @click="$emit('close')"
          class="text-stone-400 hover:text-stone-900 transition-colors flex-shrink-0"
          aria-label="Close panel"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Filters -->
      <div class="mt-4 space-y-2">
        <div class="relative">
          <input
            :value="searchQuery"
            @input="$emit('update-search', $event.target.value)"
            placeholder="Search restaurants"
            class="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:border-stone-900 transition-all text-xs text-stone-700 placeholder:text-stone-400"
          />
          <svg
            class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <select
            :value="selectedTier"
            @change="$emit('update-tier', $event.target.value)"
            class="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:border-stone-900 transition-all text-[11px] text-stone-700 cursor-pointer"
          >
            <option value="">All Tiers</option>
            <option v-for="tier in tierOptions" :key="tier.code" :value="tier.code">
              {{ tier.code }} — {{ tier.description }}
            </option>
          </select>
          <select
            :value="selectedRegion"
            @change="$emit('update-region', $event.target.value)"
            class="w-full px-2 py-1.5 bg-stone-50 border border-stone-200 rounded-md focus:outline-none focus:border-stone-900 transition-all text-[11px] text-stone-700 cursor-pointer"
          >
            <option value="">All Regions</option>
            <option v-for="region in availableRegions" :key="region" :value="region">
              {{ region }}
            </option>
          </select>
        </div>
      </div>

      <button
        @click="$emit('view-all')"
        class="mt-4 text-[10px] tracking-[0.18em] uppercase text-stone-900 font-medium border-b border-stone-900 hover:text-stone-600 hover:border-stone-600 transition-colors"
      >
        View All Cuisines
      </button>
    </div>

    <!-- Cards list -->
    <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
      <div
        v-if="loading && places.length === 0"
        class="text-center text-stone-400 py-12 text-xs"
      >
        Loading restaurants…
      </div>
      <div
        v-else-if="filteredPlaces.length === 0"
        class="text-center text-stone-400 py-12 text-xs"
      >
        No restaurants found
      </div>
      <article
        v-for="place in filteredPlaces"
        :key="place.id"
        class="bg-white border border-stone-200 hover:border-stone-400 transition-colors"
      >
        <div class="px-4 pt-3.5 pb-3">
          <div class="flex items-start justify-between gap-3">
            <h3 class="text-[17px] leading-tight text-stone-900 min-w-0 font-semibold">
              {{ place.name }}
            </h3>
            <span
              v-if="place.region"
              class="text-[8px] tracking-[0.16em] uppercase text-stone-500 text-right pt-1 max-w-[90px] flex-shrink-0"
            >
              {{ place.region }}
            </span>
          </div>
          <span
            :class="getTierBadgeClass(place.tier)"
            class="inline-flex items-center mt-2 px-2 py-0.5 rounded-sm text-[8px] tracking-[0.14em] uppercase font-bold"
          >
            Tier {{ place.tier }}
          </span>
          <p class="mt-2.5 text-[11.5px] leading-relaxed text-stone-600 line-clamp-3">
            {{ place.description || place.address }}
          </p>
        </div>
        <div class="px-4 py-2.5 border-t border-stone-100 flex items-center justify-between">
          <div class="flex items-center gap-3.5 text-stone-500 text-[11px]">
            <span class="flex items-center gap-1">
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"
                />
              </svg>
              <span class="font-medium">{{ formatCount(votesById[place.id]?.up ?? 0) }}</span>
            </span>
            <span class="flex items-center gap-1">
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zM17 2h3a2 2 0 012 2v7a2 2 0 01-2 2h-3"
                />
              </svg>
              <span class="font-medium">{{ formatCount(votesById[place.id]?.down ?? 0) }}</span>
            </span>
          </div>
          <button
            @click="$emit('select-place', place)"
            class="text-[9px] tracking-[0.2em] uppercase font-bold text-white bg-stone-900 px-3 py-1.5 hover:bg-stone-700 transition-colors"
          >
            Details
          </button>
        </div>
      </article>
    </div>
  </aside>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { useConfig } from '../composables/useConfig'
import { getAvailableRegions } from '../utils/regionMapping'

export default {
  name: 'CuisinePanel',
  props: {
    isOpen: { type: Boolean, default: false },
    places: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    selectedCategory: { type: String, default: '' },
    selectedRegion: { type: String, default: '' },
    selectedTier: { type: String, default: '' },
    searchQuery: { type: String, default: '' },
    getVotes: { type: Function, required: true },
  },
  emits: [
    'close',
    'select-place',
    'view-all',
    'update-search',
    'update-tier',
    'update-region',
  ],
  setup(props) {
    const { getTierBadgeClass, tierOptions } = useConfig()
    const availableRegions = getAvailableRegions()
    const votesById = ref({})

    const filteredPlaces = computed(() => {
      let result = props.places
      if (props.selectedCategory) {
        result = result.filter((p) => p.cuisine_type === props.selectedCategory)
      }
      if (props.searchQuery) {
        const q = props.searchQuery.toLowerCase()
        result = result.filter(
          (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
        )
      }
      if (props.selectedTier) {
        result = result.filter((p) => p.tier === props.selectedTier)
      }
      if (props.selectedRegion) {
        result = result.filter((p) => p.region === props.selectedRegion)
      }
      return result
    })

    // Lazy-load vote counts for each visible card. Cached by place id so
    // re-filtering doesn't refetch.
    const loadVotesFor = async (places) => {
      const missing = places.filter((p) => votesById.value[p.id] === undefined)
      if (missing.length === 0) return
      const results = await Promise.all(
        missing.map(async (p) => {
          try {
            const v = await props.getVotes(p.id)
            return [p.id, v]
          } catch {
            return [p.id, { up: 0, down: 0 }]
          }
        })
      )
      const next = { ...votesById.value }
      for (const [id, v] of results) next[id] = v
      votesById.value = next
    }

    watch(
      () => [props.isOpen, filteredPlaces.value],
      ([open, places]) => {
        if (open && places.length > 0) loadVotesFor(places)
      },
      { immediate: true }
    )

    const formatCount = (n) => {
      if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
      return String(n)
    }

    return {
      filteredPlaces,
      votesById,
      getTierBadgeClass,
      tierOptions,
      availableRegions,
      formatCount,
    }
  },
}
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
