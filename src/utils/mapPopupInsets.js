/**
 * Vertical/horizontal space that the map popup must stay clear of so it is
 * never hidden behind the mobile chrome (top header + search + category chips,
 * and the floating List View button + bottom nav). Shared by both map
 * providers and MapContainer so the popup positioning stays consistent.
 */

// Approximate height of the fixed mobile chrome, in CSS pixels.
const MOBILE_TOP_CHROME_PX = 210
const MOBILE_BOTTOM_CHROME_PX = 150
// Desktop has no overlay chrome, just a small breathing-room margin.
const DESKTOP_INSET_PX = 24
const POPUP_MAX_WIDTH_PX = 340
const VIEWPORT_SIDE_MARGIN_PX = 48
const MIN_POPUP_HEIGHT_PX = 180
const MOBILE_BREAKPOINT_PX = 1024

export function getPopupInsets() {
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT_PX
  const top = isMobile ? MOBILE_TOP_CHROME_PX : DESKTOP_INSET_PX
  const bottom = isMobile ? MOBILE_BOTTOM_CHROME_PX : DESKTOP_INSET_PX
  const maxWidth = Math.min(window.innerWidth - VIEWPORT_SIDE_MARGIN_PX, POPUP_MAX_WIDTH_PX)
  const maxHeight = Math.max(window.innerHeight - top - bottom, MIN_POPUP_HEIGHT_PX)
  return { isMobile, top, bottom, maxWidth, maxHeight }
}
