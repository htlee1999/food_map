import { ref, computed } from 'vue'
import { useAuth } from './useAuth'

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

  // Admin via the legacy ?admin= secret, or a signed-in account with the admin flag
  const { currentUser } = useAuth()
  const isAdmin = computed(() => !!adminKey.value || !!currentUser.value?.is_admin)

  return {
    isAdmin,
    initAdmin,
  }
}
