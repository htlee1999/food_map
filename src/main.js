import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

function loadOneMap() {
  return new Promise((resolve) => {
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

async function loadMaps() {
  window.mapProvider = null;

  const apiKey = import.meta.env.VITE_GOOGLE_MAP_API;
  if (apiKey) {
    const googleLoaded = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 8000);

      window.initGoogleMaps = function() {
        clearTimeout(timeout);
        resolve(true);
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`;
      script.async = true;
      script.defer = true;
      script.onerror = function() {
        clearTimeout(timeout);
        resolve(false);
      };
      document.head.appendChild(script);
    });

    if (googleLoaded && window.google && window.google.maps) {
      window.mapProvider = 'google';
      window.dispatchEvent(new CustomEvent('mapReady', { detail: { provider: 'google' } }));
      return;
    }
  }

  // Fallback to OneMap
  const oneMapLoaded = await loadOneMap();
  if (oneMapLoaded && window.L) {
    window.mapProvider = 'onemap';
    window.dispatchEvent(new CustomEvent('mapReady', { detail: { provider: 'onemap' } }));
  } else {
    window.dispatchEvent(new CustomEvent('mapReady', { detail: { error: 'Failed to load any map provider.' } }));
  }
}

loadMaps();
createApp(App).mount('#app')
