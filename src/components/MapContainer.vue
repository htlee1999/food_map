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
import { ref, onMounted, watch, onUnmounted } from 'vue'

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
        return
      }

      // Prevent multiple map initializations
      if (map.value) {
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

    // Generate info window content with comments and votes
    const generateInfoWindowContent = (place, comments = [], votes = { up: 0, down: 0, userVote: null }) => {
      const commentsHtml = comments.length > 0
        ? comments.map(c => `
            <div class="comment-item" data-comment-id="${c.id}">
              <div class="comment-content">${c.content}</div>
              <div class="comment-meta">
                <span class="comment-date">${new Date(c.created_at).toLocaleDateString()}</span>
                ${props.isAdmin ? `<button class="comment-delete-btn" data-delete-comment="${c.id}">Delete</button>` : ''}
              </div>
            </div>
          `).join('')
        : '<div class="no-comments">No reviews yet</div>'

      const commentFormHtml = props.isAdmin ? `
        <div class="comment-form">
          <textarea class="comment-input" data-place-id="${place.id}" placeholder="Write a review..."></textarea>
          <button class="comment-submit-btn" data-submit-place="${place.id}">Add Review</button>
        </div>
      ` : ''

      return `
        <div class="custom-popup" data-place-id="${place.id}">
          <div class="popup-name">${place.name}</div>
          <div class="popup-address">${place.address}</div>
          <div class="popup-tier">
            <span class="tier-badge tier-${place.tier}">${place.tier}</span>
          </div>
          <div class="popup-votes">
            <span class="votes-label">Do you agree?</span>
            <div class="votes-buttons">
              <button class="vote-btn vote-up ${votes.userVote === 'up' ? 'active' : ''}" data-vote-place="${place.id}" data-vote-type="up">
                <span class="vote-icon">👍</span>
                <span class="vote-count">${votes.up}</span>
              </button>
              <button class="vote-btn vote-down ${votes.userVote === 'down' ? 'active' : ''}" data-vote-place="${place.id}" data-vote-type="down">
                <span class="vote-icon">👎</span>
                <span class="vote-count">${votes.down}</span>
              </button>
            </div>
          </div>
          <div class="popup-comments">
            <div class="comments-header">Reviews</div>
            <div class="comments-list">${commentsHtml}</div>
            ${commentFormHtml}
          </div>
        </div>
      `
    }

    // Handle info window interactions
    const handleInfoWindowClick = async (event) => {
      const target = event.target

      // Handle vote buttons (check both button and child elements)
      const voteBtn = target.closest('.vote-btn')
      if (voteBtn) {
        const placeId = voteBtn.dataset.votePlace
        const voteType = voteBtn.dataset.voteType
        if (placeId && voteType) {
          const newVotes = await props.vote(parseInt(placeId), voteType)
          if (newVotes) {
            // Refresh the info window
            const markerData = markers.value.find(m => m.place.id === parseInt(placeId))
            if (markerData) {
              const comments = await props.getComments(parseInt(placeId))
              markerData.infoWindow.setContent(generateInfoWindowContent(markerData.place, comments, newVotes))
            }
          }
        }
        return
      }

      // Handle comment submission
      if (target.classList.contains('comment-submit-btn')) {
        const placeId = target.dataset.submitPlace
        const textarea = document.querySelector(`.comment-input[data-place-id="${placeId}"]`)
        if (textarea && textarea.value.trim()) {
          const newComment = await props.addComment(parseInt(placeId), textarea.value.trim())
          if (newComment) {
            // Refresh the info window
            const markerData = markers.value.find(m => m.place.id === parseInt(placeId))
            if (markerData) {
              const comments = await props.getComments(parseInt(placeId))
              const votes = await props.getVotes(parseInt(placeId))
              markerData.infoWindow.setContent(generateInfoWindowContent(markerData.place, comments, votes))
            }
          }
        }
      }

      // Handle comment deletion
      if (target.classList.contains('comment-delete-btn')) {
        const commentId = target.dataset.deleteComment
        const popup = target.closest('.custom-popup')
        const placeId = popup?.dataset.placeId
        if (commentId && placeId) {
          const success = await props.deleteComment(parseInt(commentId))
          if (success) {
            // Refresh the info window
            const markerData = markers.value.find(m => m.place.id === parseInt(placeId))
            if (markerData) {
              const comments = await props.getComments(parseInt(placeId))
              const votes = await props.getVotes(parseInt(placeId))
              markerData.infoWindow.setContent(generateInfoWindowContent(markerData.place, comments, votes))
            }
          }
        }
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
        content: generateInfoWindowContent(place, [])
      })

      marker.addListener('click', async () => {
        // Load comments and votes when marker is clicked
        const [comments, votes] = await Promise.all([
          props.getComments(place.id),
          props.getVotes(place.id)
        ])
        infoWindow.setContent(generateInfoWindowContent(place, comments, votes))
        infoWindow.open(map.value, marker)
      })

      markers.value.push({ marker, place, infoWindow })

      return marker
    }

    // Clear all markers
    const clearMarkers = () => {
      for (let i = 0; i < markers.value.length; i++) {
        const { marker, infoWindow } = markers.value[i]
        infoWindow.close()
        marker.setVisible(false)
        marker.setMap(null)
      }
      markers.value = []
    }

    // Add all places as markers
    const addAllMarkers = () => {
      clearMarkers()
      props.places.forEach((place) => {
        if (place.cuisine_type === props.selectedCategory && place.coords) {
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
      if (event && event.detail && event.detail.error) {
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
      () => {
        if (map.value) {
          addAllMarkers()
        }
      },
      { deep: true }
    )

    // Watch for changes in selectedCategory
    watch(
      () => props.selectedCategory,
      () => {
        if (map.value) {
          addAllMarkers()
        }
      }
    )

    onMounted(() => {
      // Listen for Google Maps loaded event
      window.addEventListener('googleMapsLoaded', handleGoogleMapsLoaded)

      // Listen for info window interactions (using event delegation)
      document.addEventListener('click', handleInfoWindowClick)

      // If Google Maps is already loaded, initialize immediately
      if (window.google && window.google.maps) {
        handleGoogleMapsLoaded()
      }
    })

    onUnmounted(() => {
      window.removeEventListener('googleMapsLoaded', handleGoogleMapsLoaded)
      document.removeEventListener('click', handleInfoWindowClick)
    })

    return {
      mapElement,
      googleMapsLoaded,
      googleMapsError,
      focusOnPlace,
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

:global(.popup-comments) {
  margin-top: 12px;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}

:global(.comments-header) {
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  margin-bottom: 8px;
}

:global(.comments-list) {
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 10px;
}

:global(.comment-item) {
  background: #f9fafb;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 6px;
}

:global(.comment-content) {
  font-size: 0.85rem;
  color: #374151;
  line-height: 1.4;
}

:global(.comment-meta) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

:global(.comment-date) {
  font-size: 0.75rem;
  color: #9ca3af;
}

:global(.comment-delete-btn) {
  font-size: 0.7rem;
  color: #ef4444;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
}

:global(.comment-delete-btn:hover) {
  text-decoration: underline;
}

:global(.no-comments) {
  font-size: 0.85rem;
  color: #9ca3af;
  font-style: italic;
  padding: 8px 0;
}

:global(.comment-form) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

:global(.comment-input) {
  width: 100%;
  min-height: 60px;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.85rem;
  resize: vertical;
  font-family: inherit;
}

:global(.comment-input:focus) {
  outline: none;
  border-color: #4facfe;
}

:global(.comment-submit-btn) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 500;
}

:global(.comment-submit-btn:hover) {
  opacity: 0.9;
}

:global(.popup-votes) {
  margin-top: 12px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 8px;
  text-align: center;
}

:global(.votes-label) {
  font-size: 0.8rem;
  color: #64748b;
  display: block;
  margin-bottom: 8px;
}

:global(.votes-buttons) {
  display: flex;
  justify-content: center;
  gap: 12px;
}

:global(.vote-btn) {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

:global(.vote-btn:hover) {
  border-color: #cbd5e1;
  background: #f8fafc;
}

:global(.vote-btn.vote-up.active) {
  border-color: #22c55e;
  background: #dcfce7;
}

:global(.vote-btn.vote-down.active) {
  border-color: #ef4444;
  background: #fee2e2;
}

:global(.vote-icon) {
  font-size: 1rem;
}

:global(.vote-count) {
  font-weight: 600;
  color: #374151;
  min-width: 16px;
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
