<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
    <div class="flex h-screen">
      <!-- Mobile toggle button -->
      <button
        @click="toggleSidebar"
        class="lg:hidden fixed top-4 left-4 z-[100] bg-white p-2 rounded-md shadow-lg hover:bg-gray-50"
      >
        ☰
      </button>

      <!-- Mobile backdrop -->
      <div
        v-if="showSidebar"
        @click="toggleSidebar"
        class="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-[80]"
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
          @update-search="searchQuery = $event"
          @update-tier="selectedTier = $event"
          @place-added="handlePlaceAdded"
          @focus-place="focusOnPlace"
          @view-all="showViewAllModal = true"
        />
      </div>

      <!-- Map Container -->
      <div class="flex-1 relative z-[1]">
        <MapContainer :places="places" :loading="loading" />
      </div>

      <!-- View All Modal -->
      <ViewAllModal
        :is-open="showViewAllModal"
        :places="places"
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

export default {
  name: 'App',
  components: {
    Sidebar,
    MapContainer,
    ViewAllModal,
  },
  setup() {
    const showSidebar = ref(true)
    const showViewAllModal = ref(false)

    const { places, searchQuery, selectedTier, loading, addPlace, updatePlace, deletePlace, focusOnPlace, loadSavedData } =
      useFoodTracker()

    const toggleSidebar = () => {
      showSidebar.value = !showSidebar.value
    }

    const handlePlaceAdded = async (place) => {
      try {
        const added = await addPlace(place)
        if (added) {
          console.log('Place added successfully:', place)
        } else {
          console.log('Place already exists:', place)
        }
      } catch (error) {
        console.error('Error adding place:', error)
      }
    }

    const handlePlaceUpdate = async (id, updatedPlace) => {
      try {
        const success = await updatePlace(id, updatedPlace)
        if (success) {
          console.log('Place updated successfully:', updatedPlace)
        } else {
          console.log('Failed to update place:', updatedPlace)
        }
      } catch (error) {
        console.error('Error updating place:', error)
      }
    }

    const handlePlaceDelete = async (id) => {
      try {
        const success = await deletePlace(id)
        if (success) {
          console.log('Place deleted successfully')
        } else {
          console.log('Failed to delete place')
        }
      } catch (error) {
        console.error('Error deleting place:', error)
      }
    }

    onMounted(() => {
      loadSavedData()
    })

    return {
      showSidebar,
      showViewAllModal,
      toggleSidebar,
      places,
      searchQuery,
      selectedTier,
      loading,
      handlePlaceAdded,
      handlePlaceUpdate,
      handlePlaceDelete,
      focusOnPlace,
    }
  },
}
</script>
