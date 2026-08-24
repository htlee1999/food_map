// Google Maps implementation of the map provider interface used by
// MapContainer: init / addMarker / clearMarkers / openPopup / focusOn / destroy.

import { getPopupInsets } from '../../utils/mapPopupInsets'

const SINGAPORE_CENTER = { lat: 1.3521, lng: 103.8198 }
const TILE_CHECK_DELAY_MS = 5000
// Extra vertical space the InfoWindow adds around our content (padding, close
// button, and the pointer tail) — used when positioning it into view.
const INFO_WINDOW_CHROME_PX = 60
// Gap kept between the popup's top edge and the chrome above it.
const POPUP_TOP_MARGIN_PX = 12

// Dark neutral matching the app's stone-900 chrome, used for the destination
// pin and the "within N km" radius overlay.
const ANCHOR_COLOR = '#1c1917'

export function createGoogleMapProvider({ onTileFailure }) {
  let map = null
  let markers = []
  let infoWindow = null
  let anchorMarker = null
  let anchorCircle = null

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

  // Pan the map so a popup that opens upward from `place`'s marker sits fully
  // inside the area not covered by the mobile chrome. Uses the popup's actual
  // rendered height so short popups hug the top and tall ones stay clear of the
  // bottom controls (their content scrolls internally).
  const positionPopupInView = (place, contentEl) => {
    if (!place.coords) return
    const { top, bottom } = getPopupInsets()
    const mapHeight = map.getDiv().offsetHeight
    const popupHeight = contentEl.offsetHeight + INFO_WINDOW_CHROME_PX

    // Desired marker Y: low enough that the upward popup clears the top chrome,
    // but never below the bottom controls.
    const idealMarkerY = top + POPUP_TOP_MARGIN_PX + popupHeight
    const markerY = Math.min(idealMarkerY, mapHeight - bottom)

    map.setCenter({ lat: place.coords.lat, lng: place.coords.lng })
    map.panBy(0, mapHeight / 2 - markerY)
  }

  const openPopup = (place, contentEl) => {
    const entry = markers.find((m) => m.placeId === place.id)
    if (!map || !entry) return

    if (!infoWindow) {
      infoWindow = new window.google.maps.InfoWindow()
    }

    const { isMobile, maxWidth, maxHeight } = getPopupInsets()
    // InfoWindow has no maxHeight option, so cap the content and let it scroll.
    contentEl.style.maxHeight = `${maxHeight - INFO_WINDOW_CHROME_PX}px`
    contentEl.style.overflowY = 'auto'
    contentEl.style.overflowX = 'hidden'

    infoWindow.setOptions({
      maxWidth,
      // On mobile we position it ourselves; the built-in auto-pan is unaware of
      // the fixed chrome overlaying the map.
      disableAutoPan: isMobile,
    })
    infoWindow.setContent(contentEl)
    infoWindow.open(map, entry.marker)

    if (isMobile) {
      window.google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
        positionPopupInView(place, contentEl)
      })
    }
  }

  const focusOn = (place) => {
    if (!map || !place.coords) return
    map.setCenter({ lat: place.coords.lat, lng: place.coords.lng })
    map.setZoom(16)
  }

  const clearAnchor = () => {
    if (anchorMarker) {
      anchorMarker.setMap(null)
      anchorMarker = null
    }
    if (anchorCircle) {
      anchorCircle.setMap(null)
      anchorCircle = null
    }
  }

  // Mark a "where are you headed?" destination and the search radius around it,
  // then frame the map to that radius.
  const showAnchor = (coords, radiusKm) => {
    if (!map) return
    clearAnchor()

    const google = window.google
    const position = { lat: coords.lat, lng: coords.lng }

    anchorMarker = new google.maps.Marker({
      position,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: ANCHOR_COLOR,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
        anchor: new google.maps.Point(0, 0),
      },
      title: 'Your destination',
      zIndex: 9999,
    })

    anchorCircle = new google.maps.Circle({
      map,
      center: position,
      radius: radiusKm * 1000,
      strokeColor: ANCHOR_COLOR,
      strokeOpacity: 0.5,
      strokeWeight: 1,
      fillColor: ANCHOR_COLOR,
      fillOpacity: 0.06,
    })

    map.fitBounds(anchorCircle.getBounds())
  }

  const destroy = () => {
    clearMarkers()
    clearAnchor()
    infoWindow = null
    map = null
    const mapDiv = document.getElementById('map')
    if (mapDiv) mapDiv.innerHTML = ''
  }

  return { init, addMarker, clearMarkers, openPopup, focusOn, showAnchor, clearAnchor, destroy }
}
