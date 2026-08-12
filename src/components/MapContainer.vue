<template>
  <div class="map-container flex-1">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <div>Loading map and places...</div>
    </div>
    <div v-if="!mapLoaded && !mapError" class="loading">
      <div class="spinner"></div>
      <div>Loading map...</div>
    </div>
    <div v-if="mapError" class="error-message">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <h3>Map Error</h3>
        <p>{{ mapError }}</p>
      </div>
    </div>
    <div ref="mapElement" id="map"></div>
  </div>
</template>

<script>
import { ref, createApp, onMounted, watch, onUnmounted } from 'vue'
import { useConfig } from '../composables/useConfig'
import { useRatings } from '../composables/useRatings'
import { createGoogleMapProvider } from './map/googleMapProvider'
import { createOneMapProvider } from './map/oneMapProvider'
import PlacePopup from './map/PlacePopup.vue'

export default {
  name: 'MapContainer',
  props: {
    places: {
      type: Array,
      default: () => [],
    },
    selectedCategory: {
      type: String,
      default: '',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    getComments: {
      type: Function,
      required: true,
    },
    addComment: {
      type: Function,
      required: true,
    },
    deleteComment: {
      type: Function,
      required: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    getVotes: {
      type: Function,
      required: true,
    },
    vote: {
      type: Function,
      required: true,
    },
    viewMode: {
      type: String,
      default: 'public', // 'public' shows places.tier; 'friends' shows group tiers
    },
  },
  setup(props) {
    const { getTierColorHex } = useConfig()
    const { ratingsSummary } = useRatings()

    const mapElement = ref(null)
    const mapLoaded = ref(false)
    const mapError = ref(null)
    const providerName = ref(null) // 'google' | 'onemap'
    let mapProvider = null

    // Tier that drives the pin color for the current view mode
    const getDisplayTier = (place) =>
      props.viewMode === 'friends'
        ? ratingsSummary.value[place.id]?.group_tier || null
        : place.tier

    // ─── Popup lifecycle: mount PlacePopup into the provider's popup ───

    let activePopup = null // { app, el }

    const destroyActivePopup = () => {
      if (activePopup) {
        activePopup.app.unmount()
        activePopup = null
      }
    }

    // Opens once the popup component has fetched its data, mirroring the
    // pre-refactor behavior of fetching before showing the info window.
    const openPlacePopup = (place) => {
      destroyActivePopup()
      const el = document.createElement('div')
      const app = createApp(PlacePopup, {
        place,
        isAdmin: props.isAdmin,
        getComments: props.getComments,
        addComment: props.addComment,
        deleteComment: props.deleteComment,
        getVotes: props.getVotes,
        vote: props.vote,
        onLoaded: () => {
          // Skip if another popup was opened while this one was loading
          if (activePopup?.el === el && mapProvider) {
            mapProvider.openPopup(place, el)
          }
        },
      })
      app.mount(el)
      activePopup = { app, el }
    }

    const handleMarkerClick = (place) => {
      if (providerName.value === 'onemap' && mapProvider) {
        mapProvider.focusOn(place)
      }
      openPlacePopup(place)
    }

    // ─── Provider lifecycle ───

    const startProvider = (name) => {
      destroyActivePopup()
      if (mapProvider) mapProvider.destroy()

      providerName.value = name
      mapProvider = name === 'google'
        ? createGoogleMapProvider({ onTileFailure: switchToOneMap })
        : createOneMapProvider()

      const ready = mapProvider.init()
      mapLoaded.value = ready
      if (ready && props.places.length > 0) {
        addAllMarkers()
      }
      return ready
    }

    const switchToOneMap = async () => {
      console.warn('[MapContainer] Switching to OneMap fallback')
      mapLoaded.value = false
      if (mapProvider) {
        mapProvider.destroy()
        mapProvider = null
      }

      const loaded = await window.loadOneMap()
      if (loaded && window.L) {
        startProvider('onemap')
      } else {
        console.error('[MapContainer] OneMap also failed to load')
        mapError.value = 'Failed to load any map provider.'
      }
    }

    const handleMapReady = async (event) => {
      if (event?.detail?.error) {
        mapError.value = event.detail.error
        return
      }

      const eventProvider = event?.detail?.provider || window.mapProvider
      if (eventProvider === 'google_failed') {
        await switchToOneMap()
        return
      }
      startProvider(eventProvider)
    }

    // ─── Markers ───

    const addAllMarkers = () => {
      if (!mapProvider) return
      destroyActivePopup()
      mapProvider.clearMarkers()

      const placesToAdd = props.places.filter(
        (place) => place.cuisine_type === props.selectedCategory && place.coords
      )
      for (const place of placesToAdd) {
        mapProvider.addMarker({
          place,
          color: getTierColorHex(getDisplayTier(place)),
          onClick: handleMarkerClick,
        })
      }
    }

    // Exposed to App for sidebar/wheel navigation
    const focusOnPlace = (place) => {
      if (!mapProvider) return
      mapProvider.focusOn(place)
      // Give the OneMap pan animation time to finish before the popup opens
      const popupDelay = providerName.value === 'onemap' ? 850 : 0
      setTimeout(() => openPlacePopup(place), popupDelay)
    }

    // ─── Reactivity ───

    watch(
      () => props.places,
      () => {
        if (mapLoaded.value) addAllMarkers()
      },
      { deep: true }
    )

    watch(
      () => props.selectedCategory,
      () => {
        if (mapLoaded.value) addAllMarkers()
      }
    )

    // Re-color pins when the view mode flips or the group summary changes
    watch(
      () => props.viewMode,
      () => {
        if (mapLoaded.value) addAllMarkers()
      }
    )

    watch(ratingsSummary, () => {
      if (mapLoaded.value && props.viewMode === 'friends') addAllMarkers()
    })

    onMounted(() => {
      window.addEventListener('mapReady', handleMapReady)

      if (window.mapProvider) {
        handleMapReady({ detail: { provider: window.mapProvider } })
      }

      // Also listen for late Google Maps errors (e.g. gm_authFailure)
      window.gm_authFailure = () => {
        if (providerName.value === 'google') {
          switchToOneMap()
        }
      }
    })

    onUnmounted(() => {
      window.removeEventListener('mapReady', handleMapReady)
      destroyActivePopup()
      if (mapProvider) {
        mapProvider.destroy()
        mapProvider = null
      }
    })

    return {
      mapElement,
      mapLoaded,
      mapError,
      focusOnPlace,
    }
  },
}
</script>

<style scoped>
.map-container {
  position: relative;
  height: 100%;
  width: 100%;
  z-index: 1;
}

#map {
  height: 100%;
  width: 100%;
  position: relative;
  z-index: 1;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  z-index: 1;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4facfe;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.error-text h3 {
  color: #dc2626;
  margin-bottom: 15px;
  font-size: 1.5rem;
}

.error-text p {
  color: #374151;
  margin-bottom: 15px;
  line-height: 1.6;
}

/* Leaflet marker cleanup (rendered outside this component's subtree) */
:global(.leaflet-tier-marker) {
  background: none !important;
  border: none !important;
}
</style>
