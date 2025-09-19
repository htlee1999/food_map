<template>
  <div class="w-96 min-w-96 h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0 relative z-[90] shadow-lg animate-fade-in">
    <!-- Header Section -->
    <div class="relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-pink-500"></div>
      <div class="absolute inset-0 bg-black/10"></div>
      <div class="relative p-6 text-white text-center">
        <div class="mb-3">
          <div class="text-4xl mb-2">🍽️</div>
          <h1 class="text-2xl font-bold tracking-tight">Food Tracker SG</h1>
        </div>
        <p class="text-sm opacity-90 font-medium">Discover and track your food adventures</p>
      </div>
    </div>
    
    <!-- Main Content Section -->
    <div class="flex-1 overflow-y-auto bg-gray-50">
      <div class="p-6 space-y-5">
        <!-- Add New Place Section -->
        <div class="space-y-3">
          <button 
            @click="toggleAddPlaceForm"
            :class="showAddPlaceForm 
              ? 'bg-white text-gray-700 border-gray-300 shadow-sm' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-md hover:shadow-lg'"
            class="w-full flex items-center justify-start px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium hover:scale-105 active:scale-95"
          >
            <span class="mr-3 text-lg">{{ showAddPlaceForm ? '▼' : '▶' }}</span>
            <span class="mr-2">➕</span>
            Add New Place
          </button>
          
          <div v-if="showAddPlaceForm" class="mt-3">
            <AddPlaceForm @place-added="handlePlaceAdded" />
          </div>
        </div>
        
        <!-- Upload CSV Section -->
        <div class="space-y-3">
          <button 
            type="button" 
            @click="triggerFileUpload"
            class="w-full flex items-center justify-start px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-sm"
          >
            <span class="mr-3">📄</span>
            Upload Food Places CSV
          </button>
          <input 
            ref="fileInput"
            type="file" 
            @change="handleFileChange" 
            accept=".csv"
            class="hidden"
          >
        </div>
        
        <!-- Search Section -->
        <div class="space-y-3">
          <div class="relative">
            <input 
              :value="searchQuery"
              @input="$emit('update-search', $event.target.value)"
              placeholder="Search food places..."
              class="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-400">🔍</span>
            </div>
          </div>
        </div>
        
        <!-- Stats Section -->
        <div class="mt-6">
          <StatsCard 
            :visited-count="visitedCount"
            :want-to-visit-count="wantToVisitCount"
          />
        </div>
        
        <!-- Places List Section -->
        <div class="mt-6 bg-white border-t border-gray-200 rounded-t-xl">
          <PlaceList 
            :places="filteredPlaces"
            :visited-places="visitedPlaces"
            :want-to-visit-places="wantToVisitPlaces"
            @mark-visited="$emit('mark-visited', $event)"
            @mark-want-to-visit="$emit('mark-want-to-visit', $event)"
            @clear-status="$emit('clear-status', $event)"
            @focus-place="$emit('focus-place', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import StatsCard from './StatsCard.vue'
import PlaceList from './PlaceList.vue'
import AddPlaceForm from './AddPlaceForm.vue'

export default {
  name: 'Sidebar',
  components: {
    StatsCard,
    PlaceList,
    AddPlaceForm
  },
  props: {
    places: {
      type: Array,
      default: () => []
    },
    visitedPlaces: {
      type: Set,
      default: () => new Set()
    },
    wantToVisitPlaces: {
      type: Set,
      default: () => new Set()
    },
    searchQuery: {
      type: String,
      default: ''
    }
  },
  emits: [
    'update-search',
    'upload-csv',
    'place-added',
    'mark-visited',
    'mark-want-to-visit',
    'clear-status',
    'focus-place'
  ],
  setup(props, { emit }) {
    const showAddPlaceForm = ref(false)
    const fileInput = ref(null)

    const filteredPlaces = computed(() => {
      if (!props.searchQuery) return props.places
      const query = props.searchQuery.toLowerCase()
      return props.places.filter(place => 
        place.name.toLowerCase().includes(query) || 
        place.address.toLowerCase().includes(query)
      )
    })

    const visitedCount = computed(() => props.visitedPlaces.size)
    const wantToVisitCount = computed(() => props.wantToVisitPlaces.size)

    const triggerFileUpload = () => {
      console.log('Upload button clicked, triggering file input...')
      fileInput.value?.click()
    }

    const handleFileChange = (event) => {
      console.log('File input changed:', event.target.files)
      const file = event.target.files[0]
      if (file) {
        console.log('File selected:', file.name, file.type, file.size)
        emit('upload-csv', file)
        // Reset the input so the same file can be selected again
        event.target.value = ''
      } else {
        console.log('No file selected')
      }
    }

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
      fileInput,
      filteredPlaces,
      visitedCount,
      wantToVisitCount,
      triggerFileUpload,
      handleFileChange,
      handlePlaceAdded,
      toggleAddPlaceForm
    }
  }
}
</script>

