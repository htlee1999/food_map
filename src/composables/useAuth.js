import { ref, computed } from 'vue'
import { authApi } from '../services/api'

// Shared state (singleton pattern, mirrors useAdmin)
const currentUser = ref(null)
const initialized = ref(false)

export function useAuth() {
  // Restore the session from the cookie (only once per page load)
  const initAuth = async () => {
    if (initialized.value) return
    initialized.value = true

    try {
      const { user } = await authApi.me()
      currentUser.value = user
    } catch {
      currentUser.value = null
    }
  }

  const loginWithGoogle = async (credential) => {
    const { user } = await authApi.loginWithGoogle(credential)
    currentUser.value = user
  }

  const logout = async () => {
    await authApi.logout()
    currentUser.value = null
  }

  const isLoggedIn = computed(() => !!currentUser.value)

  return {
    currentUser,
    isLoggedIn,
    initAuth,
    loginWithGoogle,
    logout,
  }
}
