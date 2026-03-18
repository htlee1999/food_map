import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

function loadGoogleMaps() {
  window.initGoogleMaps = function() {
    window.dispatchEvent(new CustomEvent('googleMapsLoaded'));
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAP_API;
  if (apiKey) {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = function() {
      window.dispatchEvent(new CustomEvent('googleMapsLoaded', { detail: { error: 'Failed to load Google Maps API.' } }));
    };
    document.head.appendChild(script);
  } else {
    window.dispatchEvent(new CustomEvent('googleMapsLoaded', { detail: { error: 'API key not configured.' } }));
  }
}

loadGoogleMaps();
createApp(App).mount('#app')
