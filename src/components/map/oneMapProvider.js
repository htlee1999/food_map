// OneMap (Leaflet) implementation of the map provider interface used by
// MapContainer: init / addMarker / clearMarkers / openPopup / focusOn / destroy.
// Used as the fallback when Google Maps fails to load or render.

const ONEMAP_ATTRIBUTION = '<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>'

export function createOneMapProvider() {
  let map = null
  let markers = []
  let popup = null

  const init = () => {
    if (!window.L) return false
    if (map) return true

    const L = window.L
    const bounds = L.latLngBounds(L.latLng(1.144, 103.535), L.latLng(1.494, 104.502))

    map = L.map('map', {
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
    }).addTo(map)

    return true
  }

  const createIcon = (color) => {
    const svgIcon = `
      <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="8" fill="${color}" stroke="#ffffff" stroke-width="3"/>
      </svg>`
    return window.L.divIcon({
      html: svgIcon,
      className: 'leaflet-tier-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    })
  }

  const addMarker = ({ place, color, onClick }) => {
    if (!map || !place.coords) return

    const marker = window.L.marker(
      [place.coords.lat, place.coords.lng],
      { icon: createIcon(color), title: place.name }
    ).addTo(map)
    marker.on('click', () => onClick(place))
    markers.push({ placeId: place.id, marker })
  }

  const clearMarkers = () => {
    if (popup) {
      popup.remove()
      popup = null
    }
    for (const { marker } of markers) {
      marker.remove()
    }
    markers = []
  }

  const openPopup = (place, contentEl) => {
    if (!map || !place.coords) return

    if (!popup) {
      popup = window.L.popup({ autoPanPadding: [16, 16] })
    }
    popup.options.maxWidth = Math.min(window.innerWidth - 48, 340)
    popup.options.maxHeight = Math.min(window.innerHeight - 160, 480)
    popup
      .setLatLng([place.coords.lat, place.coords.lng])
      .setContent(contentEl)
      .openOn(map)
  }

  const focusOn = (place) => {
    if (!map || !place.coords) return
    map.setView([place.coords.lat, place.coords.lng], 16, {
      animate: true,
      duration: 0.8
    })
  }

  const destroy = () => {
    clearMarkers()
    if (map) {
      map.remove()
      map = null
    }
  }

  return { init, addMarker, clearMarkers, openPopup, focusOn, destroy }
}
