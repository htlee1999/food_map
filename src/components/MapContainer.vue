<template>
  <div class="map-container flex-1">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <div>Loading map and places...</div>
    </div>
    <div ref="mapElement" id="map"></div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'

export default {
  name: 'MapContainer',
  props: {
    places: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const mapElement = ref(null)
    const map = ref(null)
    const markers = ref([])

    // Initialize map
    const initMap = () => {
      if (!window.L) {
        console.error('Leaflet not loaded')
        return
      }

      const sw = L.latLng(1.144, 103.535)
      const ne = L.latLng(1.494, 104.502)
      const bounds = L.latLngBounds(sw, ne)
      
      map.value = L.map('map', {
        center: L.latLng(1.3521, 103.8198),
        zoom: 12
      })
      
      map.value.setMaxBounds(bounds)
      
      const basemap = L.tileLayer('https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png', {
        detectRetina: true,
        maxZoom: 19,
        minZoom: 11,
        attribution: '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>'
      })
      
      basemap.addTo(map.value)
    }

    // Get marker icon based on tier
    const getMarkerIcon = (tier) => {
      const tierColors = {
        'S': '#60a5fa', // light blue
        'A': '#3b82f6', // blue
        'B': '#2563eb', // darker blue
        'C': '#1d4ed8', // even darker blue
        'D': '#1e40af', // dark blue
        'F': '#1e3a8a'  // darkest blue
      }
      
      const color = tierColors[tier] || '#6b7280' // gray for unknown

      return L.divIcon({
        html: `<div style="background-color: ${color}; width: 15px; height: 15px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
        className: 'custom-marker',
        iconSize: [21, 21],
        iconAnchor: [10, 10]
      })
    }

    // Add marker to map
    const addMarker = (place) => {
      if (!map.value || !place.coords) return

      const marker = L.marker([place.coords.lat, place.coords.lng], {
        icon: getMarkerIcon(place.tier)
      }).addTo(map.value)

      const popupContent = `
        <div class="custom-popup">
          <div class="popup-name">${place.name}</div>
          <div class="popup-address">${place.address}</div>
          <div class="popup-tier">
            <span class="tier-badge tier-${place.tier}">${place.tier}</span>
          </div>
        </div>
      `

      marker.bindPopup(popupContent)
      markers.value.push({ marker, place })

      return marker
    }

    // Update marker icon
    const updateMarkerIcon = (place) => {
      const markerData = markers.value.find(m => m.place.id === place.id)
      if (markerData) {
        const newIcon = getMarkerIcon(place.tier)
        markerData.marker.setIcon(newIcon)
      }
    }

    // Clear all markers
    const clearMarkers = () => {
      markers.value.forEach(({ marker }) => {
        map.value.removeLayer(marker)
      })
      markers.value = []
    }

    // Add all places as markers
    const addAllMarkers = () => {
      clearMarkers()
      props.places.forEach(place => {
        if (place.coords) {
          addMarker(place)
        }
      })
    }

    // Watch for changes in places
    watch(() => props.places, () => {
      if (map.value) {
        addAllMarkers()
        // Update marker icons for existing markers
        markers.value.forEach(({ place }) => {
          updateMarkerIcon(place)
        })
      }
    }, { deep: true })

    onMounted(() => {
      initMap()
      if (props.places.length > 0) {
        addAllMarkers()
      }
    })

    return {
      mapElement
    }
  }
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  background: #60a5fa;
  color: white;
}

:global(.tier-A) {
  background: #3b82f6;
  color: white;
}

:global(.tier-B) {
  background: #2563eb;
  color: white;
}

:global(.tier-C) {
  background: #1d4ed8;
  color: white;
}

:global(.tier-D) {
  background: #1e40af;
  color: white;
}

:global(.tier-F) {
  background: #1e3a8a;
  color: white;
}
</style>
