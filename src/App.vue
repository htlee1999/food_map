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
        <button @click="showNearbyModal = true" class="hover:text-stone-900 transition-colors">
          Near Me
        </button>
        <button @click="showSpinWheelModal = true" class="hover:text-stone-900 transition-colors">
          Up to You
        </button>
        <button @click="showMethodologyModal = true" class="hover:text-stone-900 transition-colors">
          Methodology
        </button>
        <button @click="showViewAllModal = true" class="hover:text-stone-900 transition-colors">
          View All
        </button>
        <button @click="showBlogModal = true" class="hover:text-stone-900 transition-colors">
          Blog
        </button>
      </nav>
      <div class="flex items-center gap-5">
        <!-- Public / Friends view toggle -->
        <div
          v-if="isLoggedIn"
          class="flex items-center border border-stone-300 rounded-md overflow-hidden text-[11px] tracking-[0.15em] uppercase font-medium"
        >
          <button
            @click="viewMode = 'public'"
            :class="viewMode === 'public' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'"
            class="px-3 py-1.5 transition-colors"
          >
            Public
          </button>
          <button
            @click="viewMode = 'friends'"
            :class="viewMode === 'friends' ? 'bg-stone-900 text-white' : 'text-stone-500 hover:text-stone-900'"
            class="px-3 py-1.5 transition-colors"
          >
            Friends
          </button>
        </div>
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

    <div class="flex h-[100dvh] lg:pt-16 relative">
      <!-- Mobile top chrome: header + search + category chips (floats over map) -->
      <div
        v-show="!showSidebar"
        class="lg:hidden fixed top-0 left-0 right-0 z-[70] bg-stone-50/95 backdrop-blur-sm border-b border-stone-200/70"
        style="padding-top: env(safe-area-inset-top, 0px)"
      >
        <!-- Header row -->
        <div class="flex items-center justify-between px-4 h-14">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-lg bg-stone-900 flex items-center justify-center text-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z" />
                <circle cx="12" cy="11" r="2" />
              </svg>
            </div>
            <span class="text-lg font-semibold text-stone-900 tracking-tight">Map View</span>
          </div>
          <button
            @click="toggleSidebar"
            class="flex-shrink-0"
            aria-label="Open profile menu"
          >
            <img
              v-if="userAvatar"
              :src="userAvatar"
              alt="Profile"
              referrerpolicy="no-referrer"
              class="w-9 h-9 rounded-full border border-stone-200 object-cover"
            />
            <span v-else class="w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center text-stone-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 21a8 8 0 0116 0" />
              </svg>
            </span>
          </button>
        </div>

        <!-- Search + filter -->
        <div class="px-4 pb-2.5">
          <div class="flex items-center gap-2 bg-white rounded-xl border border-stone-200 shadow-sm h-11 px-3.5">
            <svg class="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Search for food..."
              class="flex-1 min-w-0 bg-transparent text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none"
            />
            <button
              @click="showMobileFilters = true"
              class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
              :class="hasActiveFilters ? 'bg-stone-900 text-white hover:bg-stone-900' : ''"
              aria-label="Filters"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M7 12h10M10 18h4" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Category chips -->
        <div class="flex gap-2 px-4 pb-2.5 overflow-x-auto no-scrollbar">
          <button
            @click="selectCategoryChip('')"
            :class="selectedCategory === '' ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 border border-stone-200'"
            class="flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors"
          >
            All
          </button>
          <button
            v-for="category in cuisineNames"
            :key="category"
            @click="selectCategoryChip(category)"
            :class="selectedCategory === category ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 border border-stone-200'"
            class="flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <!-- Mobile floating controls: List View + locate (sit above bottom nav) -->
      <div
        v-show="!showSidebar"
        class="lg:hidden fixed left-0 right-0 z-[70] flex items-center justify-center px-4"
        style="bottom: calc(env(safe-area-inset-bottom, 0px) + 4.75rem)"
      >
        <button
          @click="showNearbyModal = true"
          class="absolute left-4 w-12 h-12 bg-white rounded-full shadow-xl border border-stone-200 flex items-center justify-center text-stone-700 active:scale-95 transition-transform"
          aria-label="Find food near a destination"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z" />
            <circle cx="12" cy="11" r="2" />
          </svg>
        </button>
        <button
          @click="showViewAllModal = true"
          class="flex items-center gap-2 bg-stone-900 text-white rounded-full pl-5 pr-6 h-12 shadow-xl active:scale-95 transition-transform"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
          <span class="text-sm font-semibold">List View</span>
        </button>
        <button
          @click="locateUser"
          class="absolute right-4 w-12 h-12 bg-white rounded-full shadow-xl border border-stone-200 flex items-center justify-center text-stone-700 active:scale-95 transition-transform"
          aria-label="Center on my location"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      </div>

      <!-- Mobile bottom navigation -->
      <nav
        v-show="!showSidebar"
        class="lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white border-t border-stone-200 flex"
        style="padding-bottom: env(safe-area-inset-bottom, 0px)"
      >
        <button
          @click="goToMap"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-stone-900"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span class="text-[10px] font-medium">Map</span>
        </button>
        <button
          @click="showSpinWheelModal = true"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-stone-400"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 8l-2 6-6 2 2-6 6-2z" />
          </svg>
          <span class="text-[10px] font-medium">Discover</span>
        </button>
        <button
          @click="showViewAllModal = true"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-stone-400"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
          </svg>
          <span class="text-[10px] font-medium">Saved</span>
        </button>
        <button
          @click="toggleSidebar"
          class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-stone-400"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 21a8 8 0 0116 0" />
          </svg>
          <span class="text-[10px] font-medium">Profile</span>
        </button>
      </nav>

      <!-- Mobile filter sheet -->
      <teleport to="body">
        <div v-if="showMobileFilters" class="lg:hidden fixed inset-0 z-[120]">
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showMobileFilters = false"></div>
          <div
            class="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl shadow-2xl p-5 space-y-5"
            style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1.5rem)"
          >
            <div class="mx-auto w-10 h-1 rounded-full bg-stone-200"></div>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-stone-900">Filters</h3>
              <button
                @click="clearFilters"
                class="text-[11px] tracking-[0.14em] uppercase text-stone-400 hover:text-stone-900 transition-colors"
              >
                Reset
              </button>
            </div>

            <!-- Rating tier -->
            <div>
              <div class="text-[10px] tracking-[0.22em] uppercase text-stone-500 mb-2">Rating tier</div>
              <div class="flex flex-wrap gap-2">
                <button
                  @click="selectedTier = ''"
                  :class="selectedTier === '' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'"
                  class="h-8 px-3.5 rounded-full text-xs font-medium transition-colors"
                >
                  All
                </button>
                <button
                  v-for="tier in tierOptions"
                  :key="tier.code"
                  @click="selectedTier = tier.code"
                  :class="selectedTier === tier.code ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'"
                  class="h-8 px-3.5 rounded-full text-xs font-medium transition-colors"
                >
                  {{ tier.code }}
                </button>
              </div>
            </div>

            <!-- Public / Friends -->
            <div v-if="isLoggedIn">
              <div class="text-[10px] tracking-[0.22em] uppercase text-stone-500 mb-2">View</div>
              <div class="flex items-center border border-stone-300 rounded-lg overflow-hidden text-xs font-medium">
                <button
                  @click="viewMode = 'public'"
                  :class="viewMode === 'public' ? 'bg-stone-900 text-white' : 'text-stone-500'"
                  class="flex-1 py-2 transition-colors"
                >
                  Public
                </button>
                <button
                  @click="viewMode = 'friends'"
                  :class="viewMode === 'friends' ? 'bg-stone-900 text-white' : 'text-stone-500'"
                  class="flex-1 py-2 transition-colors"
                >
                  Friends
                </button>
              </div>
            </div>

            <!-- Secondary links -->
            <div class="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
              <button
                @click="showMethodologyModal = true; showMobileFilters = false"
                class="flex flex-col items-center gap-1 py-2 text-stone-600"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8h.01M11 12h1v4h1" />
                </svg>
                <span class="text-[10px] tracking-[0.1em] uppercase">About</span>
              </button>
              <button
                @click="showBlogModal = true; showMobileFilters = false"
                class="flex flex-col items-center gap-1 py-2 text-stone-600"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 5h12M4 9h12M4 13h8M4 17h6" />
                </svg>
                <span class="text-[10px] tracking-[0.1em] uppercase">Blog</span>
              </button>
            </div>
          </div>
        </div>
      </teleport>

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
          @place-added="addPlace"
          @close-sidebar="toggleSidebar"
          @open-settings="showAdminPanel = true"
          @open-groups="showGroupsModal = true"
        />
      </div>

      <!-- Cuisine detail panel (desktop) -->
      <CuisinePanel
        :is-open="showCuisinePanel"
        :places="places"
        :loading="loading"
        :selected-category="selectedCategory"
        :selected-region="selectedRegion"
        :selected-tier="selectedTier"
        :search-query="searchQuery"
        :get-votes="getVotes"
        @close="showCuisinePanel = false"
        @back="backToCategories"
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
          :view-mode="viewMode"
          :search-query="searchQuery"
          :selected-tier="selectedTier"
          :selected-region="selectedRegion"
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
        :loading="loading"
        :selected-category="selectedCategory"
        :is-admin="isAdmin"
        @close="showViewAllModal = false"
        @select-place="focusOnPlace"
        @update-place="updatePlace"
        @delete-place="deletePlace"
      />

      <AdminPanel :is-open="showAdminPanel" @close="showAdminPanel = false" />
      <GroupsModal :is-open="showGroupsModal" @close="showGroupsModal = false" />
      <MethodologyModal :is-open="showMethodologyModal" @close="showMethodologyModal = false" />
      <BlogModal :is-open="showBlogModal" @close="showBlogModal = false" />
      <SpinWheelModal
        :is-open="showSpinWheelModal"
        :places="wheelPlaces"
        @close="showSpinWheelModal = false"
        @select-place="handleSpinWheelSelect"
      />
      <NearbyModal
        :is-open="showNearbyModal"
        :places="places"
        @close="closeNearbyModal"
        @anchor-set="showNearbyAnchor"
        @select-place="handleNearbySelect"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Sidebar from './components/Sidebar.vue'
import CuisinePanel from './components/CuisinePanel.vue'
import MapContainer from './components/MapContainer.vue'
import ViewAllModal from './components/ViewAllModal.vue'
import AdminPanel from './components/AdminPanel.vue'
import GroupsModal from './components/GroupsModal.vue'
import MethodologyModal from './components/MethodologyModal.vue'
import SpinWheelModal from './components/SpinWheelModal.vue'
import NearbyModal from './components/NearbyModal.vue'
import BlogModal from './components/BlogModal.vue'
import { useFoodTracker } from './composables/useFoodTracker'
import { useAdmin } from './composables/useAdmin'
import { useVoting } from './composables/useVoting'
import { useConfig } from './composables/useConfig'
import { useGroups } from './composables/useGroups'
import { useAuth } from './composables/useAuth'
import { useRatings } from './composables/useRatings'
import { filterPlaces } from './utils/filterPlaces'

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
    GroupsModal,
    MethodologyModal,
    SpinWheelModal,
    NearbyModal,
    BlogModal,
  },
  setup() {
    const showSidebar = ref(window.innerWidth >= 1024)
    const showCuisinePanel = ref(false)
    const showViewAllModal = ref(false)
    const showAdminPanel = ref(false)
    const showMethodologyModal = ref(false)
    const showSpinWheelModal = ref(false)
    const showNearbyModal = ref(false)
    const showBlogModal = ref(false)
    const showGroupsModal = ref(false)
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
    const { loadConfig, cuisineNames, tierOptions } = useConfig()
    const { initGroups, groups } = useGroups()
    const { isLoggedIn, currentUser } = useAuth()

    // Mobile filter bottom-sheet
    const showMobileFilters = ref(false)
    const { ratingsSummary, loadRatingsSummary } = useRatings()

    // 'public' = the curated map everyone sees; 'friends' = group tiers
    const viewMode = ref('public')

    // Login state changes what places/ratings are visible
    watch(isLoggedIn, async (loggedIn) => {
      if (!loggedIn) viewMode.value = 'public'
      await Promise.all([loadSavedData(), loadRatingsSummary()])
    })

    // Group membership changes place visibility (e.g. after joining via invite)
    watch(groups, () => {
      loadSavedData()
    })

    // Friends-mode spin wheel only offers places someone in the group has rated
    const wheelPlaces = computed(() =>
      viewMode.value === 'friends'
        ? places.value.filter((place) => ratingsSummary.value[place.id])
        : places.value
    )

    const toggleSidebar = () => {
      showSidebar.value = !showSidebar.value
    }

    // Selecting a cuisine in the sidebar both updates the filter and pops
    // open the cuisine detail panel (per the design).
    const handleCategorySelect = (category) => {
      selectedCategory.value = category
      showCuisinePanel.value = true
      // On mobile, close the sidebar so the cuisine sheet has the screen.
      if (window.innerWidth < 1024) {
        showSidebar.value = false
      }
    }

    // "Back" from the cuisine panel returns to the category list. On mobile the
    // sidebar was closed when the panel opened, so reopen it; on desktop it's
    // already visible underneath.
    const backToCategories = () => {
      showCuisinePanel.value = false
      if (window.innerWidth < 1024) {
        showSidebar.value = true
      }
    }

    const focusOnPlace = (place) => {
      if (mapContainer.value && mapContainer.value.focusOnPlace) {
        mapContainer.value.focusOnPlace(place)
        if (window.innerWidth < 1024) {
          showSidebar.value = false
          showCuisinePanel.value = false
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
    const filteredPlaces = computed(() =>
      filterPlaces(places.value, {
        category: selectedCategory.value,
        search: searchQuery.value,
        tier: selectedTier.value,
        region: selectedRegion.value,
      })
    )

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

    // Avatar shown in the mobile header (falls back to a generic icon)
    const userAvatar = computed(() => currentUser.value?.avatar_url || '')

    // Mobile category chip: set the filter directly without opening the
    // desktop cuisine panel. An empty string means "All".
    const selectCategoryChip = (category) => {
      selectedCategory.value = category
      showCuisinePanel.value = false
    }

    const hasActiveFilters = computed(
      () => !!selectedTier.value || viewMode.value === 'friends'
    )

    const clearFilters = () => {
      selectedTier.value = ''
      viewMode.value = 'public'
    }

    // Mobile "Map" tab: dismiss any overlays and reveal the map
    const goToMap = () => {
      showSidebar.value = false
      showCuisinePanel.value = false
      showMobileFilters.value = false
    }

    const locateUser = () => {
      if (mapContainer.value && mapContainer.value.locateUser) {
        mapContainer.value.locateUser()
      }
    }

    // ─── "Where are you headed?" nearby suggestions ───

    // Draw the destination + radius on the map when the user searches.
    const showNearbyAnchor = ({ coords, radiusKm }) => {
      mapContainer.value?.showNearbyAnchor?.(coords, radiusKm)
    }

    // Clearing the anchor keeps the map free of a stale radius once we're done.
    const closeNearbyModal = () => {
      showNearbyModal.value = false
      mapContainer.value?.clearNearbyAnchor?.()
    }

    const handleNearbySelect = (place) => {
      closeNearbyModal()
      focusOnPlace(place)
    }

    onMounted(async () => {
      initAdmin()
      initGroups()
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
      showNearbyModal,
      showBlogModal,
      showGroupsModal,
      mapContainer,
      toggleSidebar,
      backToCategories,
      places,
      searchQuery,
      selectedTier,
      selectedRegion,
      selectedCategory,
      loading,
      addPlace,
      updatePlace,
      deletePlace,
      focusOnPlace,
      handleSpinWheelSelect,
      showNearbyAnchor,
      closeNearbyModal,
      handleNearbySelect,
      getComments,
      addComment,
      deleteComment,
      isAdmin,
      isLoggedIn,
      viewMode,
      wheelPlaces,
      cuisineNames,
      tierOptions,
      userAvatar,
      showMobileFilters,
      selectCategoryChip,
      hasActiveFilters,
      clearFilters,
      goToMap,
      locateUser,
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

<style scoped>
/* Hide the scrollbar on the horizontal category chip row while keeping it swipeable. */
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
