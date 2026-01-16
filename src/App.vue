<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
    <div class="flex h-screen">
      <!-- Mobile toggle button (hidden when sidebar is open) -->
      <button
        v-show="!showSidebar"
        @click="toggleSidebar"
        class="lg:hidden fixed top-4 left-4 z-[100] bg-white p-2.5 rounded-lg shadow-lg hover:bg-slate-50 transition-colors"
      >
        <svg class="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
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
        class="lg:relative fixed lg:static top-0 left-0 z-[90] flex-shrink-0"
      >
        <Sidebar
          :places="places"
          :search-query="searchQuery"
          :selected-tier="selectedTier"
          :selected-category="selectedCategory"
          :is-admin="isAdmin"
          @update-search="searchQuery = $event"
          @update-tier="selectedTier = $event"
          @update-category="selectedCategory = $event"
          @place-added="handlePlaceAdded"
          @focus-place="focusOnPlace"
          @view-all="showViewAllModal = true"
          @close-sidebar="toggleSidebar"
          @show-methodology="showMethodologyModal = true"
        />
      </div>

      <!-- Map Container -->
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
      </div>

      <!-- View All Modal -->
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

      <!-- Admin Settings Button -->
      <button
        v-if="isAdmin"
        @click="showAdminPanel = true"
        class="fixed top-4 right-4 z-[100] bg-white p-2.5 rounded-lg shadow-lg hover:bg-slate-50 transition-colors"
        title="Admin Settings"
      >
        <svg class="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      </button>

      <!-- Admin Panel -->
      <AdminPanel
        :is-open="showAdminPanel"
        @close="showAdminPanel = false"
      />

      <!-- Desktop Methodology Button -->
      <button
        @click="showMethodologyModal = true"
        class="hidden lg:flex fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-white px-4 py-2 rounded-full shadow-lg hover:bg-slate-50 transition-colors items-center gap-2"
      >
        <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-sm font-medium text-slate-700">Methodology</span>
      </button>

      <!-- Methodology Modal -->
      <MethodologyModal
        :is-open="showMethodologyModal"
        @close="showMethodologyModal = false"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import MapContainer from './components/MapContainer.vue'
import ViewAllModal from './components/ViewAllModal.vue'
import AdminPanel from './components/AdminPanel.vue'
import MethodologyModal from './components/MethodologyModal.vue'
import { useFoodTracker } from './composables/useFoodTracker'
import { useAdmin } from './composables/useAdmin'
import { useVoting } from './composables/useVoting'
import { useConfig } from './composables/useConfig'

export default {
  name: 'App',
  components: {
    Sidebar,
    MapContainer,
    ViewAllModal,
    AdminPanel,
    MethodologyModal,
  },
  setup() {
    // Start with sidebar closed on mobile, open on desktop
    const showSidebar = ref(window.innerWidth >= 1024)
    const showViewAllModal = ref(false)
    const showAdminPanel = ref(false)
    const showMethodologyModal = ref(false)
    const mapContainer = ref(null)

    const { places, searchQuery, selectedTier, selectedCategory, loading, addPlace, updatePlace, deletePlace, loadSavedData, getComments, addComment, deleteComment } =
      useFoodTracker()

    // Admin state
    const { isAdmin, initAdmin } = useAdmin()

    // Voting functionality
    const { getVotes, vote } = useVoting()

    // Config (cuisines, tags, tiers)
    const { loadConfig } = useConfig()

    const toggleSidebar = () => {
      showSidebar.value = !showSidebar.value
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
        // Close sidebar on mobile when focusing on a place
        if (window.innerWidth < 1024) {
          showSidebar.value = false
        }
      }
    }

    onMounted(async () => {
      initAdmin()
      await loadConfig()
      loadSavedData()
    })

    return {
      showSidebar,
      showViewAllModal,
      showAdminPanel,
      showMethodologyModal,
      mapContainer,
      toggleSidebar,
      places,
      searchQuery,
      selectedTier,
      selectedCategory,
      loading,
      handlePlaceAdded,
      handlePlaceUpdate,
      handlePlaceDelete,
      focusOnPlace,
      getComments,
      addComment,
      deleteComment,
      isAdmin,
      getVotes,
      vote,
    }
  },
}
</script>
