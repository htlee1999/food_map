import { ref, computed } from 'vue'

// Shared state (singleton pattern)
const adminKey = ref(null)
const initialized = ref(false)

export function useAdmin() {
  // Initialize from URL parameters (only once)
  const initAdmin = () => {
    if (initialized.value) return

    const urlParams = new URLSearchParams(window.location.search)
    const key = urlParams.get('admin')

    if (key) {
      adminKey.value = key
      // Store in sessionStorage so it persists during the session
      sessionStorage.setItem('adminKey', key)
    } else {
      // Check sessionStorage for existing session
      const storedKey = sessionStorage.getItem('adminKey')
      if (storedKey) {
        adminKey.value = storedKey
      }
    }

    initialized.value = true
  }

  // Computed property to check if user is admin
  const isAdmin = computed(() => !!adminKey.value)

  return {
    isAdmin,
    initAdmin,
  }
}
