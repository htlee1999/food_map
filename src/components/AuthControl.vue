<template>
  <!-- Signed in: avatar + name + sign out -->
  <div v-if="isLoggedIn" class="flex items-center gap-2.5">
    <img
      v-if="currentUser.avatar_url"
      :src="currentUser.avatar_url"
      :alt="displayName"
      referrerpolicy="no-referrer"
      class="w-7 h-7 rounded-full border border-stone-200 flex-shrink-0"
    />
    <span class="flex-1 min-w-0 truncate text-[11px] tracking-[0.12em] uppercase font-medium text-stone-700">
      {{ displayName }}
    </span>
    <button
      @click="handleLogout"
      class="text-[10px] tracking-[0.18em] uppercase text-stone-400 hover:text-stone-900 transition-colors"
    >
      Sign out
    </button>
  </div>

  <!-- Signed out: Google renders its button into this container -->
  <div v-else-if="googleClientId" ref="googleButtonContainer"></div>
</template>

<script>
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { useAuth } from '../composables/useAuth'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

// Load the Google Identity Services script once, shared across mounts
let googleScriptPromise = null
const loadGoogleScript = () => {
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GOOGLE_SCRIPT_URL
    script.async = true
    script.onload = resolve
    script.onerror = () => reject(new Error('Failed to load Google sign-in'))
    document.head.appendChild(script)
  })
  return googleScriptPromise
}

export default {
  name: 'AuthControl',
  setup() {
    const { currentUser, isLoggedIn, initAuth, loginWithGoogle, logout } = useAuth()
    const googleButtonContainer = ref(null)

    const displayName = computed(
      () => currentUser.value?.display_name || currentUser.value?.email || ''
    )

    const renderGoogleButton = async () => {
      if (!googleClientId || isLoggedIn.value) return

      await loadGoogleScript()
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          try {
            await loginWithGoogle(response.credential)
          } catch (error) {
            console.error('Sign-in failed:', error)
          }
        },
      })
      await nextTick()
      if (googleButtonContainer.value) {
        window.google.accounts.id.renderButton(googleButtonContainer.value, {
          theme: 'outline',
          size: 'medium',
          text: 'signin_with',
          shape: 'pill',
        })
      }
    }

    const handleLogout = async () => {
      try {
        await logout()
        renderGoogleButton()
      } catch (error) {
        console.error('Sign-out failed:', error)
      }
    }

    onMounted(async () => {
      await initAuth()
      renderGoogleButton()
    })

    // Re-render the button if the user signs out elsewhere in the app
    watch(isLoggedIn, (loggedIn) => {
      if (!loggedIn) renderGoogleButton()
    })

    return {
      currentUser,
      isLoggedIn,
      displayName,
      googleClientId,
      googleButtonContainer,
      handleLogout,
    }
  },
}
</script>
