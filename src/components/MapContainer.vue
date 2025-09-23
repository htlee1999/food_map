<template>
  <div class="map-container flex-1">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <div>Loading map and places...</div>
    </div>
    <div v-if="!googleMapsLoaded && !googleMapsError" class="loading">
      <div class="spinner"></div>
      <div>Loading Google Maps...</div>
    </div>
    <div v-if="googleMapsError" class="error-message">
      <div class="error-icon">⚠️</div>
      <div class="error-text">
        <h3>Google Maps API Error</h3>
        <p>{{ googleMapsError }}</p>
        <p class="error-instructions">
          To fix this issue:
          <br>1. Get your Google Maps API key from <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a>
          <br>2. Create a <code>.env.local</code> file in your project root
          <br>3. Add <code>VITE_GOOGLE_MAP_API=your_actual_api_key_here</code> to the file
          <br>4. Enable Maps JavaScript API and Geocoding API
          <br>5. Restart your development server
        </p>
      </div>
    </div>
    <div ref="mapElement" id="map"></div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onUnmounted, nextTick } from 'vue'

export default {
  name: 'MapContainer',
  props: {
    places: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const mapElement = ref(null)
    const map = ref(null)
    const markers = ref([])
    const googleMapsLoaded = ref(false)
    const googleMapsError = ref(null)

    // Initialize Google Maps
    const initMap = () => {
      if (!window.google || !window.google.maps) {
        console.error('Google Maps not loaded')
        return
      }

      // Singapore bounds
      const singaporeBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(1.144, 103.535), // Southwest
        new google.maps.LatLng(1.494, 104.502)  // Northeast
      )

      map.value = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 1.3521, lng: 103.8198 }, // Singapore center
        zoom: 12,
        restriction: {
          latLngBounds: singaporeBounds,
          strictBounds: false,
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      googleMapsLoaded.value = true
    }

    // Get marker icon based on tier
    const getMarkerIcon = (tier) => {
      const tierColors = {
        S: '#f9a8d4', // pink
        A: '#86efac', // light green
        B: '#fde047', // light yellow
        C: '#fdba74', // light orange
        D: '#fca5a5', // light red
        F: '#d1d5db', // light gray
      }

      const color = tierColors[tier] || '#6b7280' // gray for unknown

      return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        anchor: new google.maps.Point(0, 0)
      }
    }

    // Add marker to map
    const addMarker = (place) => {
      if (!map.value || !place.coords) return

      const marker = new google.maps.Marker({
        position: { lat: place.coords.lat, lng: place.coords.lng },
        map: map.value,
        icon: getMarkerIcon(place.tier),
        title: place.name,
        animation: google.maps.Animation.DROP
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="custom-popup">
            <div class="popup-name">${place.name}</div>
            <div class="popup-address">${place.address}</div>
            <div class="popup-tier">
              <span class="tier-badge tier-${place.tier}">${place.tier}</span>
            </div>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(map.value, marker)
      })

      markers.value.push({ marker, place, infoWindow })

      return marker
    }

    // Update marker icon
    const updateMarkerIcon = (place) => {
      const markerData = markers.value.find((m) => m.place.id === place.id)
      if (markerData) {
        const newIcon = getMarkerIcon(place.tier)
        markerData.marker.setIcon(newIcon)
      }
    }

    // Clear all markers
    const clearMarkers = () => {
      markers.value.forEach(({ marker, infoWindow }) => {
        marker.setMap(null)
        infoWindow.close()
      })
      markers.value = []
    }

    // Add all places as markers
    const addAllMarkers = () => {
      clearMarkers()
      props.places.forEach((place) => {
        if (place.coords) {
          addMarker(place)
        }
      })
    }

    // Focus on a specific place
    const focusOnPlace = (place) => {
      if (!map.value || !place.coords) return

      const position = { lat: place.coords.lat, lng: place.coords.lng }
      
      map.value.setCenter(position)
      map.value.setZoom(16)

      // Find and open the info window for this place
      const markerData = markers.value.find((m) => m.place.id === place.id)
      if (markerData) {
        markerData.infoWindow.open(map.value, markerData.marker)
      }
    }

    // Listen for Google Maps loaded event
    const handleGoogleMapsLoaded = (event) => {
      if (event.detail && event.detail.error) {
        googleMapsError.value = event.detail.error
        return
      }
      
      initMap()
      if (props.places.length > 0) {
        addAllMarkers()
      }
    }

    // Watch for changes in places
    watch(
      () => props.places,
      async (newPlaces, oldPlaces) => {
        if (map.value) {
          // Use nextTick to ensure DOM updates are complete
          await nextTick()
          addAllMarkers()
          // Update marker icons for existing markers
          markers.value.forEach(({ place }) => {
            updateMarkerIcon(place)
          })
        }
      },
      { deep: true }
    )

    onMounted(() => {
      // Listen for Google Maps loaded event
      window.addEventListener('googleMapsLoaded', handleGoogleMapsLoaded)
      
      // If Google Maps is already loaded, initialize immediately
      if (window.google && window.google.maps) {
        handleGoogleMapsLoaded()
      }
    })

    onUnmounted(() => {
      window.removeEventListener('googleMapsLoaded', handleGoogleMapsLoaded)
    })

    // Expose focusOnPlace method to parent component
    const focusOnPlaceHandler = (place) => {
      focusOnPlace(place)
    }

    return {
      mapElement,
      googleMapsLoaded,
      googleMapsError,
      focusOnPlace: focusOnPlaceHandler,
    }
  },
}
</script>

<style scoped>
.map-container {
  position: relative;
  height: 100vh;
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

:global(.custom-popup .leaflet-popup-content) {
  margin: 15px;
  font-family: inherit;
}

:global(.popup-name) {
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

:global(.popup-address) {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

:global(.popup-tier) {
  margin-top: 8px;
}

:global(.tier-badge) {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  text-align: center;
  min-width: 20px;
}

:global(.tier-S) {
  background: #f9a8d4;
  color: #374151;
}

:global(.tier-A) {
  background: #86efac;
  color: #374151;
}

:global(.tier-B) {
  background: #fde047;
  color: #374151;
}

:global(.tier-C) {
  background: #fdba74;
  color: #374151;
}

:global(.tier-D) {
  background: #fca5a5;
  color: #374151;
}

:global(.tier-F) {
  background: #d1d5db;
  color: #374151;
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

.error-instructions {
  background: #fef3c7;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
  text-align: left;
  font-size: 0.9rem;
}

.error-instructions a {
  color: #2563eb;
  text-decoration: underline;
}

.error-instructions code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #1f2937;
}
</style>
