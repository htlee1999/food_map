<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
    <div class="flex h-screen">
      <!-- Mobile toggle button -->
      <button
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
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import MapContainer from './components/MapContainer.vue'
import ViewAllModal from './components/ViewAllModal.vue'
import { useFoodTracker } from './composables/useFoodTracker'
import { useAdmin } from './composables/useAdmin'
import { useVoting } from './composables/useVoting'

export default {
  name: 'App',
  components: {
    Sidebar,
    MapContainer,
    ViewAllModal,
  },
  setup() {
    // Start with sidebar closed on mobile, open on desktop
    const showSidebar = ref(window.innerWidth >= 1024)
    const showViewAllModal = ref(false)
    const mapContainer = ref(null)

    const { places, searchQuery, selectedTier, selectedCategory, loading, addPlace, updatePlace, deletePlace, loadSavedData, getComments, addComment, deleteComment } =
      useFoodTracker()

    // Admin state
    const { isAdmin, initAdmin } = useAdmin()

    // Voting functionality
    const { getVotes, vote } = useVoting()

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

    onMounted(() => {
      initAdmin()
      loadSavedData()
    })

    return {
      showSidebar,
      showViewAllModal,
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
