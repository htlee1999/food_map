<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
    @click="closeModal"
  >
    <div
      class="bg-white rounded-xl shadow-xl w-[90%] max-w-5xl h-[80vh] flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="flex justify-between items-center px-6 py-4 border-b border-slate-200">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">{{ selectedCategory || 'All Restaurants' }}</h2>
          <p class="text-xs text-slate-500 mt-0.5">Browse and manage your collection</p>
        </div>
        <button
          @click="closeModal"
          class="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Search and Filter -->
      <div class="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div class="flex gap-3 mb-3">
          <div class="flex-1 relative">
            <input
              v-model="searchQuery"
              placeholder="Search restaurants..."
              class="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-sm placeholder:text-slate-400"
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
          <div class="w-32 relative">
            <select
              v-model="selectedTier"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-sm appearance-none cursor-pointer text-slate-700"
            >
              <option value="">All Tiers</option>
              <option v-for="tier in tierOptions" :key="tier.code" :value="tier.code">
                {{ tier.code }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
          <div class="w-40 relative" v-if="!selectedCategory">
            <select
              v-model="localCategory"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 text-sm appearance-none cursor-pointer text-slate-700"
            >
              <option value="">All Categories</option>
              <option v-for="cuisine in cuisineNames" :key="cuisine" :value="cuisine">
                {{ cuisine }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
          <div v-else class="w-40 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium">
            {{ selectedCategory }}
          </div>
        </div>
        <div class="text-xs text-slate-600">
          {{ filteredPlaces.length }} of {{ places.length }} restaurants
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="filteredPlaces.length === 0" class="text-center text-slate-400 py-16">
          <svg class="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <h3 class="text-base font-medium text-slate-600 mb-1">No restaurants found</h3>
          <p class="text-sm text-slate-500">Try adjusting your search or filter</p>
        </div>
        <div v-else class="grid gap-3">
          <div
            v-for="place in filteredPlaces"
            :key="place.id"
            class="p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all duration-200 group"
          >
            <!-- Edit Form (shown when editing) -->
            <div v-if="editingPlace && editingPlace.id === place.id" class="space-y-3">
              <div class="flex justify-between items-center">
                <h3 class="text-sm font-medium text-slate-900">Edit Restaurant</h3>
                <div class="flex gap-2">
                  <button
                    @click="saveEdit"
                    class="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs hover:bg-slate-800 transition-colors font-medium"
                  >
                    Save
                  </button>
                  <button
                    @click="cancelEdit"
                    class="px-3 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-slate-700">Restaurant Name</label>
                  <input
                    v-model="editForm.name"
                    class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                    placeholder="Enter name"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-slate-700">Tier Rating</label>
                  <div class="relative">
                    <select
                      v-model="editForm.tier"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 appearance-none cursor-pointer"
                    >
                      <option value="">Select Tier</option>
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
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-700">Address</label>
                <input
                  v-model="editForm.address"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                  placeholder="Enter address"
                />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-700">Description</label>
                <textarea
                  v-model="editForm.description"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                  rows="2"
                  placeholder="Enter description (optional)"
                ></textarea>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-slate-700">Cuisine Type</label>
                  <div class="relative">
                    <select
                      v-model="editForm.cuisine_type"
                      @change="editForm.tags = []"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 appearance-none cursor-pointer"
                    >
                      <option value="">Select Cuisine</option>
                      <option v-for="cuisine in cuisineNames" :key="cuisine" :value="cuisine">
                        {{ cuisine }}
                      </option>
                    </select>
                    <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="editAvailableTags.length > 0" class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-700">Tags</label>
                <div class="flex flex-wrap gap-2">
                  <label
                    v-for="tag in editAvailableTags"
                    :key="tag"
                    class="inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      :value="tag"
                      v-model="editForm.tags"
                      class="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                    <span class="text-xs text-slate-600">{{ tag }}</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Normal View (shown when not editing) -->
            <div v-else>
              <div class="flex justify-between items-start gap-4">
                <div class="flex-1 cursor-pointer" @click="selectPlace(place)">
                  <div class="flex items-start gap-3 mb-1.5">
                    <h3 class="font-medium text-slate-900 text-sm group-hover:text-slate-700 transition-colors flex-1">
                      {{ place.name }}
                    </h3>
                    <span
                      :class="getTierBadgeClass(place.tier)"
                      class="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold"
                    >
                      {{ place.tier }}
                    </span>
                  </div>
                  <p class="text-slate-600 text-xs">{{ place.address }}</p>
                  <div class="flex flex-wrap gap-1 mt-2">
                    <span
                      v-if="place.region"
                      class="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium"
                    >
                      {{ place.region }}
                    </span>
                    <span
                      v-for="tag in place.tags"
                      :key="tag"
                      class="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <!-- Navigation buttons -->
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <a
                    :href="getGoogleMapsUrl(place)"
                    target="_blank"
                    @click.stop
                    class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Open in Google Maps"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </a>
                  <a
                    :href="getWazeUrl(place)"
                    target="_blank"
                    @click.stop
                    class="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                    title="Open in Waze"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2c-4.42 0-8 3.58-8 8 0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8zm-2 11h-.5v.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-.5H8c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h.5v-.5c0-.28.22-.5.5-.5s.5.22.5.5v.5h.5c.28 0 .5.22.5.5s-.22.5-.5.5zm4.5.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-1c0-.28.22-.5.5-.5s.5.22.5.5v1zm2 0c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-1c0-.28.22-.5.5-.5s.5.22.5.5v1z"/>
                    </svg>
                  </a>
                  <a
                    :href="getAppleMapsUrl(place)"
                    target="_blank"
                    @click.stop
                    class="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Open in Apple Maps"
                  >
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </a>
                </div>
                <div v-if="isAdmin" class="flex items-center gap-2 flex-shrink-0">
                  <button
                    @click="startEdit(place)"
                    class="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(place)"
                    class="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { useConfig } from '../composables/useConfig'

export default {
  name: 'ViewAllModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
    places: {
      type: Array,
      default: () => [],
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
  emits: ['close', 'select-place', 'update-place', 'delete-place'],
  setup(props, { emit }) {
    const { cuisineNames, tierOptions, getTierBadgeClass, getTagsForCuisine } = useConfig()

    const searchQuery = ref('')
    const selectedTier = ref('')
    const localCategory = ref('')
    const editingPlace = ref(null)
    const editForm = ref({
      name: '',
      address: '',
      description: '',
      tier: '',
      cuisine_type: '',
      tags: [],
      coords: null
    })

    const editAvailableTags = computed(() => {
      return getTagsForCuisine(editForm.value.cuisine_type)
    })

    const filteredPlaces = computed(() => {
      let filtered = props.places

      // Filter by parent's selected category first (from sidebar)
      if (props.selectedCategory) {
        filtered = filtered.filter((place) => place.cuisine_type === props.selectedCategory)
      }
      // Then filter by local category selection (from modal dropdown) if different from parent
      else if (localCategory.value) {
        filtered = filtered.filter((place) => place.cuisine_type === localCategory.value)
      }

      // Filter by search query
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(
          (place) =>
            place.name.toLowerCase().includes(query) || place.address.toLowerCase().includes(query)
        )
      }

      // Filter by tier
      if (selectedTier.value) {
        filtered = filtered.filter((place) => place.tier === selectedTier.value)
      }

      return filtered
    })

    const closeModal = () => {
      emit('close')
      cancelEdit()
    }

    const selectPlace = (place) => {
      emit('select-place', place)
      closeModal()
    }

    const startEdit = (place) => {
      editingPlace.value = place
      editForm.value = {
        name: place.name,
        address: place.address,
        description: place.description || '',
        tier: place.tier || '',
        cuisine_type: place.cuisine_type || '',
        tags: place.tags ? [...place.tags] : [],
        coords: place.coords
      }
    }

    const cancelEdit = () => {
      editingPlace.value = null
      editForm.value = {
        name: '',
        address: '',
        description: '',
        tier: '',
        cuisine_type: '',
        tags: [],
        coords: null
      }
    }

    const saveEdit = async () => {
      if (!editForm.value.name || !editForm.value.address) {
        alert('Please fill in the required fields (name and address)')
        return
      }

      const updatedPlace = {
        ...editForm.value,
        coords: editForm.value.coords || editingPlace.value.coords
      }

      emit('update-place', editingPlace.value.id, updatedPlace)
      cancelEdit()
    }

    const confirmDelete = (place) => {
      if (confirm(`Are you sure you want to delete "${place.name}"? This action cannot be undone.`)) {
        emit('delete-place', place.id)
      }
    }

    // Navigation URL helpers
    const getGoogleMapsUrl = (place) => {
      if (!place.coords) return '#'
      const { lat, lng } = place.coords
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    }

    const getWazeUrl = (place) => {
      if (!place.coords) return '#'
      const { lat, lng } = place.coords
      return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
    }

    const getAppleMapsUrl = (place) => {
      if (!place.coords) return '#'
      const { lat, lng } = place.coords
      return `https://maps.apple.com/?daddr=${lat},${lng}`
    }

    // Reset filters when modal opens
    watch(
      () => props.isOpen,
      (isOpen) => {
        if (isOpen) {
          searchQuery.value = ''
          selectedTier.value = ''
          localCategory.value = ''
          cancelEdit()
        }
      }
    )

    return {
      searchQuery,
      selectedTier,
      localCategory,
      filteredPlaces,
      editingPlace,
      editForm,
      editAvailableTags,
      cuisineNames,
      tierOptions,
      getTierBadgeClass,
      closeModal,
      selectPlace,
      startEdit,
      cancelEdit,
      saveEdit,
      confirmDelete,
      getGoogleMapsUrl,
      getWazeUrl,
      getAppleMapsUrl,
    }
  },
}
</script>
