import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

window.loadOneMap = function() {
  return new Promise((resolve) => {
    if (window.L) { resolve(true); return; }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://www.onemap.gov.sg/web-assets/libs/leaflet/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://www.onemap.gov.sg/web-assets/libs/leaflet/onemap-leaflet.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

function loadMaps() {
  window.mapProvider = null;

  const apiKey = import.meta.env.VITE_GOOGLE_MAP_API;
  console.log('[MapLoader] API key present:', !!apiKey);

  if (apiKey) {
    window.initGoogleMaps = function() {
      console.log('[MapLoader] Google Maps callback fired');
      console.log('[MapLoader] window.google exists:', !!window.google);
      console.log('[MapLoader] window.google.maps exists:', !!(window.google && window.google.maps));
      console.log('[MapLoader] google.maps.Map exists:', !!(window.google && window.google.maps && window.google.maps.Map));
      if (window.google && window.google.maps) {
        window.mapProvider = 'google';
        window.dispatchEvent(new CustomEvent('mapReady', { detail: { provider: 'google' } }));
      } else {
        console.warn('[MapLoader] Google Maps callback fired but API not available');
        window.dispatchEvent(new CustomEvent('mapReady', { detail: { provider: 'google_failed' } }));
      }
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = function(e) {
      console.error('[MapLoader] Google Maps script failed to load', e);
      window.dispatchEvent(new CustomEvent('mapReady', { detail: { provider: 'google_failed' } }));
    };
    document.head.appendChild(script);
    console.log('[MapLoader] Google Maps script tag added');

    setTimeout(() => {
      if (!window.mapProvider) {
        console.warn('[MapLoader] Google Maps timed out after 10s');
        window.dispatchEvent(new CustomEvent('mapReady', { detail: { provider: 'google_failed' } }));
      }
    }, 10000);
  } else {
    console.warn('[MapLoader] No API key configured');
    window.dispatchEvent(new CustomEvent('mapReady', { detail: { provider: 'google_failed' } }));
  }
}

loadMaps();
createApp(App).mount('#app')
