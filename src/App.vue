<template>
  <div class="min-h-screen bg-stone-50 font-sans">
    <!-- Desktop top header -->
    <header
      class="hidden lg:flex fixed top-0 left-0 right-0 h-16 bg-white border-b border-stone-200 z-[110] items-center justify-between px-8"
    >
      <a class="text-xl font-bold tracking-[0.18em] text-stone-900 select-none">
        SINGAPORE FOODs
      </a>
      <nav class="flex items-center gap-8 text-[13px] tracking-wide text-stone-500">
        <button class="text-stone-900 font-medium border-b-2 border-stone-900 pb-1">Explore</button>
        <button @click="showSpinWheelModal = true" class="hover:text-stone-900 transition-colors">
          Up to You
        </button>
        <button @click="showMethodologyModal = true" class="hover:text-stone-900 transition-colors">
          Methodology
        </button>
        <button @click="showViewAllModal = true" class="hover:text-stone-900 transition-colors">
          View All
        </button>
      </nav>
      <div class="flex items-center gap-5">
        <button
          @click="focusSearch"
          class="text-stone-500 hover:text-stone-900 transition-colors"
          title="Search"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
        <button
          v-if="isAdmin"
          @click="showAdminPanel = true"
          class="text-stone-500 hover:text-stone-900 transition-colors"
          title="Admin Settings"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 21a8 8 0 0116 0" />
          </svg>
        </button>
      </div>
    </header>

    <div class="flex h-screen lg:pt-16">
      <!-- Mobile toggle -->
      <button
        v-show="!showSidebar"
        @click="toggleSidebar"
        class="lg:hidden fixed top-4 left-4 z-[100] bg-white p-2.5 rounded-md shadow-lg hover:bg-stone-50 transition-colors border border-stone-200"
      >
        <svg class="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <!-- Mobile spin button -->
      <button
        v-show="!showSidebar"
        @click="showSpinWheelModal = true"
        class="lg:hidden fixed top-16 left-4 z-[100] bg-white p-2.5 rounded-md shadow-lg hover:bg-stone-50 transition-colors border border-stone-200"
        title="Up to you"
      >
        <svg class="w-5 h-5 text-stone-700" viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="9" r="1.5" fill="currentColor" />
          <circle cx="15" cy="7" r="1.5" fill="currentColor" />
          <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M7 16c2-2 3 1 5 0s3 2 5 0" />
        </svg>
      </button>

      <!-- Mobile backdrop -->
      <div
        v-if="showSidebar"
        @click="toggleSidebar"
        class="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
      ></div>

      <!-- Sidebar -->
      <div
        :class="[
          'transition-transform duration-300 ease-in-out',
          showSidebar ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        ]"
        class="lg:relative fixed lg:static top-0 lg:top-auto left-0 z-[90] flex-shrink-0 lg:h-[calc(100vh-4rem)]"
      >
        <Sidebar
          :selected-region="selectedRegion"
          :selected-category="selectedCategory"
          :is-admin="isAdmin"
          @update-category="handleCategorySelect"
          @place-added="handlePlaceAdded"
          @close-sidebar="toggleSidebar"
          @open-settings="showAdminPanel = true"
        />
      </div>

      <!-- Cuisine detail panel (desktop) -->
      <CuisinePanel
        :is-open="showCuisinePanel"
        :places="places"
        :selected-category="selectedCategory"
        :selected-region="selectedRegion"
        :selected-tier="selectedTier"
        :search-query="searchQuery"
        :get-votes="getVotes"
        @close="showCuisinePanel = false"
        @select-place="focusOnPlace"
        @view-all="showViewAllModal = true"
        @update-search="searchQuery = $event"
        @update-tier="selectedTier = $event"
        @update-region="selectedRegion = $event"
      />

      <!-- Map area -->
      <div class="flex-1 relative z-[1]">
        <MapContainer
          ref="mapContainer"
          :places="places"
          :selected-category="selectedCategory"
          :loading="loading"
          :get-comments="getComments"
          :add-comment="addComment"
          :delete-comment="deleteComment"
          :is-admin="isAdmin"
          :get-votes="getVotes"
          :vote="vote"
        />

        <!-- Currently Viewing card overlay -->
        <div
          class="hidden md:block absolute bottom-6 left-6 z-[60] bg-stone-900 text-white px-6 py-4 max-w-[19rem] shadow-2xl"
        >
          <div class="text-[9px] tracking-[0.25em] uppercase text-stone-400 font-medium">
            Currently Viewing
          </div>
          <div class="text-[1.35rem] mt-1 leading-tight font-semibold">
            {{ currentlyViewingTitle }}
          </div>
          <div class="text-[10px] italic text-stone-300 mt-1.5 leading-snug max-w-xs">
            "{{ currentlyViewingTagline }}"
          </div>
          <div class="mt-3 grid grid-cols-2 gap-5 pt-2.5 border-t border-stone-700">
            <div>
              <div class="text-[1.35rem] leading-none font-semibold">{{ filteredCount }}</div>
              <div class="text-[8px] tracking-[0.2em] uppercase text-stone-400 mt-1">Restaurants</div>
            </div>
            <div>
              <div class="text-[1.35rem] leading-none font-semibold">{{ sTierCount }}</div>
              <div class="text-[8px] tracking-[0.2em] uppercase text-stone-400 mt-1">S-Tier Spots</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <ViewAllModal
        :is-open="showViewAllModal"
        :places="places"
        :selected-category="selectedCategory"
        :is-admin="isAdmin"
        @close="showViewAllModal = false"
        @select-place="focusOnPlace"
        @update-place="handlePlaceUpdate"
        @delete-place="handlePlaceDelete"
      />

      <AdminPanel :is-open="showAdminPanel" @close="showAdminPanel = false" />
      <MethodologyModal :is-open="showMethodologyModal" @close="showMethodologyModal = false" />
      <SpinWheelModal
        :is-open="showSpinWheelModal"
        :places="places"
        @close="showSpinWheelModal = false"
        @select-place="handleSpinWheelSelect"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import Sidebar from './components/Sidebar.vue'
import CuisinePanel from './components/CuisinePanel.vue'
import MapContainer from './components/MapContainer.vue'
import ViewAllModal from './components/ViewAllModal.vue'
import AdminPanel from './components/AdminPanel.vue'
import MethodologyModal from './components/MethodologyModal.vue'
import SpinWheelModal from './components/SpinWheelModal.vue'
import { useFoodTracker } from './composables/useFoodTracker'
import { useAdmin } from './composables/useAdmin'
import { useVoting } from './composables/useVoting'
import { useConfig } from './composables/useConfig'

const TAGLINES = {
  default: 'A monochrome love letter to Singapore food.',
}

export default {
  name: 'App',
  components: {
    Sidebar,
    CuisinePanel,
    MapContainer,
    ViewAllModal,
    AdminPanel,
    MethodologyModal,
    SpinWheelModal,
  },
  setup() {
    const showSidebar = ref(window.innerWidth >= 1024)
    const showCuisinePanel = ref(false)
    const showViewAllModal = ref(false)
    const showAdminPanel = ref(false)
    const showMethodologyModal = ref(false)
    const showSpinWheelModal = ref(false)
    const mapContainer = ref(null)

    const {
      places,
      searchQuery,
      selectedTier,
      selectedRegion,
      selectedCategory,
      loading,
      addPlace,
      updatePlace,
      deletePlace,
      loadSavedData,
      getComments,
      addComment,
      deleteComment,
    } = useFoodTracker()

    const { isAdmin, initAdmin } = useAdmin()
    const { getVotes, vote } = useVoting()
    const { loadConfig } = useConfig()

    const toggleSidebar = () => {
      showSidebar.value = !showSidebar.value
    }

    // Selecting a cuisine in the sidebar both updates the filter and pops
    // open the cuisine detail panel (per the design).
    const handleCategorySelect = (category) => {
      selectedCategory.value = category
      showCuisinePanel.value = true
    }

    const handlePlaceAdded = async (place) => {
      await addPlace(place)
    }
    const handlePlaceUpdate = async (id, updatedPlace) => {
      await updatePlace(id, updatedPlace)
    }
    const handlePlaceDelete = async (id) => {
      await deletePlace(id)
    }

    const focusOnPlace = (place) => {
      if (mapContainer.value && mapContainer.value.focusOnPlace) {
        mapContainer.value.focusOnPlace(place)
        if (window.innerWidth < 1024) {
          showSidebar.value = false
        }
      }
    }

    const handleSpinWheelSelect = async (place) => {
      if (place.cuisine_type && place.cuisine_type !== selectedCategory.value) {
        selectedCategory.value = place.cuisine_type
        await nextTick()
        setTimeout(() => focusOnPlace(place), 100)
      } else {
        focusOnPlace(place)
      }
      showSpinWheelModal.value = false
    }

    // Filtered places mirror the Sidebar's filtering logic so the stats card stays in sync.
    const filteredPlaces = computed(() => {
      let result = places.value
      if (selectedCategory.value) {
        result = result.filter((p) => p.cuisine_type === selectedCategory.value)
      }
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        result = result.filter(
          (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
        )
      }
      if (selectedTier.value) {
        result = result.filter((p) => p.tier === selectedTier.value)
      }
      if (selectedRegion.value) {
        result = result.filter((p) => p.region === selectedRegion.value)
      }
      return result
    })

    const filteredCount = computed(() => filteredPlaces.value.length)
    const sTierCount = computed(
      () => filteredPlaces.value.filter((p) => p.tier === 'S').length
    )

    const currentlyViewingTitle = computed(() => {
      if (selectedRegion.value) return selectedRegion.value
      if (selectedCategory.value) return selectedCategory.value
      return 'All Singapore'
    })

    const currentlyViewingTagline = computed(() => {
      if (selectedCategory.value) {
        return `The heart of Singapore's ${selectedCategory.value.toLowerCase()} scene.`
      }
      return TAGLINES.default
    })

    const focusSearch = () => {
      if (!showSidebar.value) showSidebar.value = true
      nextTick(() => {
        const input = document.querySelector('aside input[placeholder="Search restaurants"]')
        if (input) input.focus()
      })
    }

    onMounted(async () => {
      initAdmin()
      await loadConfig()
      loadSavedData()
    })

    return {
      showSidebar,
      showCuisinePanel,
      handleCategorySelect,
      showViewAllModal,
      showAdminPanel,
      showMethodologyModal,
      showSpinWheelModal,
      mapContainer,
      toggleSidebar,
      places,
      searchQuery,
      selectedTier,
      selectedRegion,
      selectedCategory,
      loading,
      handlePlaceAdded,
      handlePlaceUpdate,
      handlePlaceDelete,
      focusOnPlace,
      handleSpinWheelSelect,
      getComments,
      addComment,
      deleteComment,
      isAdmin,
      getVotes,
      vote,
      filteredCount,
      sTierCount,
      currentlyViewingTitle,
      currentlyViewingTagline,
      focusSearch,
    }
  },
}
</script>
