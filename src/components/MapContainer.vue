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
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { useConfig } from '../composables/useConfig'
import { getGoogleMapsUrl, getWazeUrl, getAppleMapsUrl } from '../utils/mapLinks'

const ONEMAP_ATTRIBUTION = '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>'

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
  setup(props) {
    const { getTierColorHex, getTierDescription } = useConfig()

    const mapElement = ref(null)
    const map = ref(null)
    const markers = ref([])
    const mapLoaded = ref(false)
    const mapError = ref(null)
    const provider = ref(null)

    // ─── Fallback: tear down Google Maps and switch to OneMap ───

    const switchToOneMap = async () => {
      console.log('[MapContainer] Switching to OneMap fallback')
      // Clean up Google Map
      if (map.value) {
        clearGoogleMarkers()
        map.value = null
      }
      // Clear the map div contents left by Google Maps
      const mapDiv = document.getElementById('map')
      if (mapDiv) mapDiv.innerHTML = ''

      mapLoaded.value = false
      provider.value = 'onemap'

      const loaded = await window.loadOneMap()
      if (loaded && window.L) {
        console.log('[MapContainer] OneMap loaded successfully')
        initOneMap()
        if (props.places.length > 0) {
          addAllMarkers()
        }
      } else {
        console.error('[MapContainer] OneMap also failed to load')
        mapError.value = 'Failed to load any map provider.'
      }
    }

    // ─── Google Maps implementation ───

    const initGoogleMap = () => {
      console.log('[MapContainer] initGoogleMap called')
      if (!window.google || !window.google.maps) {
        console.warn('[MapContainer] google.maps not available')
        return
      }
      if (map.value) {
        console.log('[MapContainer] Map already initialized')
        return
      }

      const singaporeBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(1.144, 103.535),
        new google.maps.LatLng(1.494, 104.502)
      )

      map.value = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 1.3521, lng: 103.8198 },
        zoom: 12,
        restriction: {
          latLngBounds: singaporeBounds,
          strictBounds: false,
        },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT,
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { elementType: 'geometry', stylers: [{ saturation: -100 }] },
          { elementType: 'labels', stylers: [{ saturation: -100 }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d6d6d6' }] },
          { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
          { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#777777' }] }
        ]
      })
      console.log('[MapContainer] Google Map instance created')

      // Detect Google Maps tile rendering failures
      let tilesDidLoad = false
      google.maps.event.addListenerOnce(map.value, 'tilesloaded', () => {
        tilesDidLoad = true
        console.log('[MapContainer] Google Maps tiles loaded successfully')
      })

      setTimeout(() => {
        const mapDiv = document.getElementById('map')
        const errContainer = mapDiv?.querySelector('.gm-err-container')
        const hasCopyright = mapDiv?.querySelector('.gm-style-cc')
        const mapText = mapDiv?.innerText || ''
        const hasErrorText = mapText.includes('Sorry, we have no imagery') || mapText.includes('This page can\'t load Google Maps')

        console.log('[MapContainer] Tile check — tilesLoaded:', tilesDidLoad)
        console.log('[MapContainer] Tile check — errContainer:', !!errContainer)
        console.log('[MapContainer] Tile check — hasCopyright:', !!hasCopyright)
        console.log('[MapContainer] Tile check — hasErrorText:', hasErrorText)
        console.log('[MapContainer] Tile check — mapText snippet:', mapText.substring(0, 200))

        if (!tilesDidLoad || errContainer || hasErrorText) {
          console.warn('[MapContainer] Google Maps tile failure detected, switching to OneMap')
          switchToOneMap()
          return
        }
        console.log('[MapContainer] Google Maps rendering OK')
      }, 5000)

      mapLoaded.value = true
    }

    const getGoogleMarkerIcon = (tier) => {
      const color = getTierColorHex(tier)
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

    const addGoogleMarker = async (place) => {
      if (!map.value || !place.coords) return

      const marker = new google.maps.Marker({
        position: { lat: place.coords.lat, lng: place.coords.lng },
        map: map.value,
        icon: getGoogleMarkerIcon(place.tier),
        title: place.name,
        animation: google.maps.Animation.DROP
      })

      const infoWindow = new google.maps.InfoWindow({
        content: generatePopupContent(place, [], { up: 0, down: 0, userVote: null }),
        maxWidth: Math.min(window.innerWidth - 48, 340)
      })

      const markerData = { marker, place, infoWindow }
      markers.value.push(markerData)

      const [comments, votes] = await Promise.all([
        props.getComments(place.id),
        props.getVotes(place.id)
      ])

      if (markers.value.includes(markerData)) {
        infoWindow.setContent(generatePopupContent(place, comments, votes))
      }

      marker.addListener('click', async () => {
        const [freshComments, freshVotes] = await Promise.all([
          props.getComments(place.id),
          props.getVotes(place.id)
        ])
        infoWindow.setContent(generatePopupContent(place, freshComments, freshVotes))
        infoWindow.open(map.value, marker)
      })

      return marker
    }

    const clearGoogleMarkers = () => {
      for (const { marker, infoWindow } of markers.value) {
        infoWindow.close()
        marker.setVisible(false)
        marker.setMap(null)
      }
      markers.value = []
    }

    const focusGoogleMap = (place) => {
      if (!map.value || !place.coords) return
      map.value.setCenter({ lat: place.coords.lat, lng: place.coords.lng })
      map.value.setZoom(16)
      const markerData = markers.value.find((m) => m.place.id === place.id)
      if (markerData) {
        markerData.infoWindow.open(map.value, markerData.marker)
      }
    }

    // ─── OneMap (Leaflet) implementation ───

    const initOneMap = () => {
      if (!window.L) return
      if (map.value) return

      const sw = L.latLng(1.144, 103.535)
      const ne = L.latLng(1.494, 104.502)
      const bounds = L.latLngBounds(sw, ne)

      const leafletMap = L.map('map', {
        center: L.latLng(1.3521, 103.8198),
        zoom: 12,
        minZoom: 11,
        maxZoom: 19,
        maxBounds: bounds,
        zoomAnimation: true,
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 120
      })

      L.tileLayer('https://www.onemap.gov.sg/maps/tiles/Grey/{z}/{x}/{y}.png', {
        detectRetina: true,
        maxZoom: 19,
        minZoom: 11,
        attribution: ONEMAP_ATTRIBUTION
      }).addTo(leafletMap)

      map.value = leafletMap
      mapLoaded.value = true
    }

    const createLeafletIcon = (tier) => {
      const color = getTierColorHex(tier)
      const svgIcon = `
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="8" fill="${color}" stroke="#ffffff" stroke-width="3"/>
        </svg>`
      return L.divIcon({
        html: svgIcon,
        className: 'leaflet-tier-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
      })
    }

    const addLeafletMarker = async (place) => {
      if (!map.value || !place.coords) return

      const marker = L.marker(
        [place.coords.lat, place.coords.lng],
        { icon: createLeafletIcon(place.tier), title: place.name }
      ).addTo(map.value)

      const popup = L.popup({
        maxWidth: Math.min(window.innerWidth - 48, 340),
        maxHeight: Math.min(window.innerHeight - 160, 480),
        autoPanPadding: [16, 16]
      })
        .setContent(generatePopupContent(place, [], { up: 0, down: 0, userVote: null }))

      marker.bindPopup(popup)

      const markerData = { marker, place, popup }
      markers.value.push(markerData)

      const [comments, votes] = await Promise.all([
        props.getComments(place.id),
        props.getVotes(place.id)
      ])

      if (markers.value.includes(markerData)) {
        popup.setContent(generatePopupContent(place, comments, votes))
      }

      marker.on('click', async () => {
        map.value.setView([place.coords.lat, place.coords.lng], 16, {
          animate: true,
          duration: 0.8
        })
        const [freshComments, freshVotes] = await Promise.all([
          props.getComments(place.id),
          props.getVotes(place.id)
        ])
        popup.setContent(generatePopupContent(place, freshComments, freshVotes))
      })

      return marker
    }

    const clearLeafletMarkers = () => {
      for (const { marker } of markers.value) {
        marker.remove()
      }
      markers.value = []
    }

    const focusLeafletMap = (place) => {
      if (!map.value || !place.coords) return
      map.value.setView([place.coords.lat, place.coords.lng], 16, {
        animate: true,
        duration: 0.8
      })
      const markerData = markers.value.find((m) => m.place.id === place.id)
      if (markerData) {
        setTimeout(() => {
          markerData.marker.openPopup()
        }, 850)
      }
    }

    // ─── Shared logic ───

    const generatePopupContent = (place, comments = [], votes = { up: 0, down: 0, userVote: null }) => {
      const regionBadge = place.region
        ? `<span class="popup-tag popup-tag-region">${place.region}</span>`
        : ''
      const tagsBadges = place.tags && place.tags.length > 0
        ? place.tags.map(tag => `<span class="popup-tag">${tag}</span>`).join('')
        : ''
      const tagsHtml = (regionBadge || tagsBadges)
        ? `<div class="popup-tags">${regionBadge}${tagsBadges}</div>`
        : ''

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

      const commentForm = props.isAdmin ? `
        <div class="comment-form">
          <textarea class="comment-input" data-place-id="${place.id}" placeholder="Write a review..."></textarea>
          <button class="comment-submit-btn" data-submit-place="${place.id}">Add Review</button>
        </div>
      ` : ''

      const commentsSection = `
        <div class="popup-comments">
          <div class="comments-header">Reviews</div>
          <div class="comments-list">${commentsHtml}</div>
          ${commentForm}
        </div>
      `

      const tierColor = getTierColorHex(place.tier)
      const tierDescription = getTierDescription(place.tier)
      const gmapsHref = getGoogleMapsUrl(place)
      const wazeHref = getWazeUrl(place)
      const appleHref = getAppleMapsUrl(place)

      return `
        <div class="custom-popup" data-place-id="${place.id}">
          <div class="popup-name">${place.name}</div>
          <div class="popup-address">${place.address}</div>
          <div class="popup-tier">
            <span class="tier-badge" style="background: ${tierColor}; color: #374151;">${place.tier}</span>
            <span class="tier-description">${tierDescription}</span>
          </div>
          ${tagsHtml}
          <div class="popup-navigate">
            <span class="navigate-label">Navigate with:</span>
            <div class="navigate-buttons">
              <a href="${gmapsHref}" target="_blank" class="nav-btn nav-gmaps" title="Google Maps">
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              </a>
              <a href="${wazeHref}" target="_blank" class="nav-btn nav-waze" title="Waze">
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#33CCFF" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              </a>
              <a href="${appleHref}" target="_blank" class="nav-btn nav-apple" title="Apple Maps">
                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#555" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              </a>
            </div>
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
          ${commentsSection}
        </div>
      `
    }

    const handleInfoWindowClick = async (event) => {
      const target = event.target

      const voteBtn = target.closest('.vote-btn')
      if (voteBtn) {
        const placeId = voteBtn.dataset.votePlace
        const voteType = voteBtn.dataset.voteType
        if (placeId && voteType) {
          const allVoteBtns = document.querySelectorAll(`.vote-btn[data-vote-place="${placeId}"]`)
          allVoteBtns.forEach(btn => btn.classList.add('loading'))
          voteBtn.classList.add('voting')

          const newVotes = await props.vote(parseInt(placeId), voteType)

          allVoteBtns.forEach(btn => btn.classList.remove('loading', 'voting'))

          if (newVotes) {
            const markerData = markers.value.find(m => m.place.id === parseInt(placeId))
            if (markerData) {
              const comments = await props.getComments(parseInt(placeId))
              const content = generatePopupContent(markerData.place, comments, newVotes)
              if (provider.value === 'google') {
                markerData.infoWindow.setContent(content)
              } else {
                markerData.popup.setContent(content)
              }
            }
          }
        }
        return
      }

      if (target.classList.contains('comment-submit-btn')) {
        const placeId = target.dataset.submitPlace
        const textarea = document.querySelector(`.comment-input[data-place-id="${placeId}"]`)
        if (textarea && textarea.value.trim()) {
          target.classList.add('loading')
          target.disabled = true
          target.innerHTML = '<span class="btn-spinner"></span> Adding...'
          textarea.disabled = true

          const newComment = await props.addComment(parseInt(placeId), textarea.value.trim())
          if (newComment) {
            const markerData = markers.value.find(m => m.place.id === parseInt(placeId))
            if (markerData) {
              const comments = await props.getComments(parseInt(placeId))
              const votes = await props.getVotes(parseInt(placeId))
              const content = generatePopupContent(markerData.place, comments, votes)
              if (provider.value === 'google') {
                markerData.infoWindow.setContent(content)
              } else {
                markerData.popup.setContent(content)
              }
            }
          } else {
            target.classList.remove('loading')
            target.disabled = false
            target.innerHTML = 'Add Review'
            textarea.disabled = false
          }
        }
      }

      if (target.classList.contains('comment-delete-btn')) {
        const commentId = target.dataset.deleteComment
        const popup = target.closest('.custom-popup')
        const placeId = popup?.dataset.placeId
        if (commentId && placeId) {
          target.innerHTML = '...'
          target.disabled = true

          const success = await props.deleteComment(parseInt(commentId))
          if (success) {
            const markerData = markers.value.find(m => m.place.id === parseInt(placeId))
            if (markerData) {
              const comments = await props.getComments(parseInt(placeId))
              const votes = await props.getVotes(parseInt(placeId))
              const content = generatePopupContent(markerData.place, comments, votes)
              if (provider.value === 'google') {
                markerData.infoWindow.setContent(content)
              } else {
                markerData.popup.setContent(content)
              }
            }
          } else {
            target.innerHTML = 'Delete'
            target.disabled = false
          }
        }
      }
    }

    const addAllMarkers = async () => {
      if (provider.value === 'google') {
        clearGoogleMarkers()
      } else {
        clearLeafletMarkers()
      }

      const placesToAdd = props.places.filter(
        (place) => place.cuisine_type === props.selectedCategory && place.coords
      )

      const addFn = provider.value === 'google' ? addGoogleMarker : addLeafletMarker
      await Promise.all(placesToAdd.map((place) => addFn(place)))
    }

    const focusOnPlace = (place) => {
      if (provider.value === 'google') {
        focusGoogleMap(place)
      } else {
        focusLeafletMap(place)
      }
    }

    const handleMapReady = async (event) => {
      if (event && event.detail && event.detail.error) {
        mapError.value = event.detail.error
        return
      }

      const eventProvider = event?.detail?.provider || window.mapProvider

      if (eventProvider === 'google_failed') {
        await switchToOneMap()
        return
      }

      provider.value = eventProvider

      if (provider.value === 'google') {
        initGoogleMap()
      } else if (provider.value === 'onemap') {
        initOneMap()
      }

      if (props.places.length > 0) {
        addAllMarkers()
      }
    }

    watch(
      () => props.places,
      () => {
        if (map.value) addAllMarkers()
      },
      { deep: true }
    )

    watch(
      () => props.selectedCategory,
      () => {
        if (map.value) addAllMarkers()
      }
    )

    onMounted(() => {
      window.addEventListener('mapReady', handleMapReady)
      document.addEventListener('click', handleInfoWindowClick)

      if (window.mapProvider) {
        handleMapReady({ detail: { provider: window.mapProvider } })
      }

      // Also listen for late Google Maps errors (e.g. gm_authFailure)
      window.gm_authFailure = () => {
        if (provider.value === 'google') {
          switchToOneMap()
        }
      }
    })

    onUnmounted(() => {
      window.removeEventListener('mapReady', handleMapReady)
      document.removeEventListener('click', handleInfoWindowClick)
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

:global(.custom-popup) {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1c1917;
  min-width: 220px;
  max-width: 100%;
}

:global(.popup-name) {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-weight: 700;
  font-size: 1.15rem;
  color: #1c1917;
  letter-spacing: -0.01em;
  margin-bottom: 4px;
  line-height: 1.2;
}

:global(.popup-address) {
  color: #78716c;
  font-size: 0.78rem;
  margin-bottom: 10px;
  letter-spacing: 0.01em;
}

:global(.popup-tier) {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

:global(.tier-badge) {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 2px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

:global(.tier-description) {
  font-size: 0.7rem;
  color: #78716c;
  font-style: italic;
  letter-spacing: 0.01em;
}

:global(.popup-tags) {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

:global(.popup-tag) {
  display: inline-block;
  padding: 2px 6px;
  background: #f5f5f4;
  color: #57534e;
  border-radius: 2px;
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

:global(.popup-tag-region) {
  background: #dbeafe;
  color: #1d4ed8;
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
  /* 16px prevents iOS Safari from auto-zooming the viewport on focus. */
  font-size: 16px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}

@media (min-width: 640px) {
  :global(.comment-input) {
    font-size: 0.85rem;
  }
}

:global(.comment-input:focus) {
  outline: none;
  border-color: #1c1917;
}

:global(.comment-submit-btn) {
  background: #1c1917;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 2px;
  font-size: 0.7rem;
  cursor: pointer;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

:global(.comment-submit-btn:hover) {
  background: #44403c;
}

:global(.popup-navigate) {
  margin-top: 10px;
  padding: 8px;
  background: #fafaf9;
  border: 1px solid #e7e5e4;
  border-radius: 2px;
  text-align: center;
}

:global(.navigate-label) {
  font-size: 0.62rem;
  color: #78716c;
  display: block;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 600;
}

:global(.navigate-buttons) {
  display: flex;
  justify-content: center;
  gap: 8px;
}

:global(.nav-btn) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

:global(.nav-btn:hover) {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

:global(.nav-gmaps:hover) {
  border-color: #4285F4;
  background: #e8f0fe;
}

:global(.nav-waze:hover) {
  border-color: #33CCFF;
  background: #e6f9ff;
}

:global(.nav-apple:hover) {
  border-color: #555;
  background: #f5f5f5;
}

:global(.popup-votes) {
  margin-top: 12px;
  padding: 10px;
  background: #fafaf9;
  border: 1px solid #e7e5e4;
  border-radius: 2px;
  text-align: center;
}

:global(.votes-label) {
  font-size: 0.62rem;
  color: #78716c;
  display: block;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 600;
}

:global(.votes-buttons) {
  display: flex;
  justify-content: center;
  gap: 10px;
}

:global(.vote-btn) {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid #e7e5e4;
  border-radius: 2px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.78rem;
  color: #57534e;
}

:global(.vote-btn:hover) {
  border-color: #1c1917;
  color: #1c1917;
}

:global(.vote-btn.vote-up.active) {
  border-color: #1c1917;
  background: #1c1917;
  color: #ffffff;
}

:global(.vote-btn.vote-down.active) {
  border-color: #1c1917;
  background: #ffffff;
  color: #1c1917;
}

:global(.vote-icon) {
  font-size: 1rem;
}

:global(.vote-count) {
  font-weight: 600;
  color: #374151;
  min-width: 16px;
}

/* Loading states for vote buttons */
:global(.vote-btn.loading) {
  opacity: 0.6;
  pointer-events: none;
}

:global(.vote-btn.voting) {
  animation: pulse 0.3s ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Loading spinner for buttons */
:global(.btn-spinner) {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 4px;
  vertical-align: middle;
}

:global(.comment-submit-btn.loading) {
  opacity: 0.8;
  cursor: not-allowed;
}

:global(.comment-submit-btn:disabled) {
  opacity: 0.7;
  cursor: not-allowed;
}

:global(.comment-input:disabled) {
  background: #f1f5f9;
  cursor: not-allowed;
}

:global(.comment-delete-btn:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
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

/* Leaflet marker cleanup */
:global(.leaflet-tier-marker) {
  background: none !important;
  border: none !important;
}
</style>
