// Google Maps implementation of the map provider interface used by
// MapContainer: init / addMarker / clearMarkers / openPopup / focusOn / destroy.

const SINGAPORE_CENTER = { lat: 1.3521, lng: 103.8198 }
const TILE_CHECK_DELAY_MS = 5000

export function createGoogleMapProvider({ onTileFailure }) {
  let map = null
  let markers = []
  let infoWindow = null

  const init = () => {
    if (!window.google || !window.google.maps) {
      console.warn('[googleMapProvider] google.maps not available')
      return false
    }
    if (map) return true

    const google = window.google
    const singaporeBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(1.144, 103.535),
      new google.maps.LatLng(1.494, 104.502)
    )

    map = new google.maps.Map(document.getElementById('map'), {
      center: SINGAPORE_CENTER,
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
      // Keep the map in full color; only hide POI markers to cut clutter
      // so our own place pins stand out.
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] }
      ]
    })

    // Detect Google Maps tile rendering failures and hand off to the fallback
    let tilesDidLoad = false
    google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
      tilesDidLoad = true
    })

    setTimeout(() => {
      const mapDiv = document.getElementById('map')
      const errContainer = mapDiv?.querySelector('.gm-err-container')
      const mapText = mapDiv?.innerText || ''
      const hasErrorText = mapText.includes('Sorry, we have no imagery') || mapText.includes('This page can\'t load Google Maps')

      if (!tilesDidLoad || errContainer || hasErrorText) {
        console.warn('[googleMapProvider] Tile failure detected')
        onTileFailure()
      }
    }, TILE_CHECK_DELAY_MS)

    return true
  }

  const addMarker = ({ place, color, onClick }) => {
    if (!map || !place.coords) return

    const google = window.google
    const marker = new google.maps.Marker({
      position: { lat: place.coords.lat, lng: place.coords.lng },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        anchor: new google.maps.Point(0, 0)
      },
      title: place.name,
      animation: google.maps.Animation.DROP
    })
    marker.addListener('click', () => onClick(place))
    markers.push({ placeId: place.id, marker })
  }

  const clearMarkers = () => {
    if (infoWindow) infoWindow.close()
    for (const { marker } of markers) {
      marker.setMap(null)
    }
    markers = []
  }

  const openPopup = (place, contentEl) => {
    const entry = markers.find((m) => m.placeId === place.id)
    if (!map || !entry) return

    if (!infoWindow) {
      infoWindow = new window.google.maps.InfoWindow()
    }
    infoWindow.setOptions({ maxWidth: Math.min(window.innerWidth - 48, 340) })
    infoWindow.setContent(contentEl)
    infoWindow.open(map, entry.marker)
  }

  const focusOn = (place) => {
    if (!map || !place.coords) return
    map.setCenter({ lat: place.coords.lat, lng: place.coords.lng })
    map.setZoom(16)
  }

  const destroy = () => {
    clearMarkers()
    infoWindow = null
    map = null
    const mapDiv = document.getElementById('map')
    if (mapDiv) mapDiv.innerHTML = ''
  }

  return { init, addMarker, clearMarkers, openPopup, focusOn, destroy }
}
