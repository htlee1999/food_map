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
  if (apiKey) {
    window.initGoogleMaps = function() {
      if (window.google && window.google.maps) {
        window.mapProvider = 'google';
        window.dispatchEvent(new CustomEvent('mapReady', { detail: { provider: 'google' } }));
      } else {
        window.dispatchEvent(new CustomEvent('mapReady', { detail: { provider: 'google_failed' } }));
      }
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = function() {
      window.dispatchEvent(new CustomEvent('mapReady', { detail: { provider: 'google_failed' } }));
    };
    document.head.appendChild(script);

    setTimeout(() => {
      if (!window.mapProvider) {
        window.dispatchEvent(new CustomEvent('mapReady', { detail: { provider: 'google_failed' } }));
      }
    }, 10000);
  } else {
    window.dispatchEvent(new CustomEvent('mapReady', { detail: { provider: 'google_failed' } }));
  }
}

loadMaps();
createApp(App).mount('#app')
