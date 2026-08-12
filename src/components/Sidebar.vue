<template>
  <aside
    class="w-[85vw] max-w-[300px] lg:w-[16vw] lg:min-w-[210px] lg:max-w-[260px] h-[100dvh] lg:h-full bg-white border-r border-stone-200 flex flex-col flex-shrink-0 relative z-[90]"
  >
    <!-- Header / Title -->
    <div class="px-7 pt-7 pb-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-[26px] leading-none text-stone-900 tracking-tight font-semibold">
            Curated Maps
          </h2>
          <p class="mt-2 text-[10px] tracking-[0.22em] uppercase text-stone-500">
            {{ subtitle }}
          </p>
        </div>
        <!-- Mobile close -->
        <button
          @click="$emit('close-sidebar')"
          class="lg:hidden text-stone-400 hover:text-stone-700 transition-colors"
          aria-label="Close menu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Categories — vertical icon list (grows to fill available space) -->
    <div class="relative flex-1 min-h-0">
      <nav
        ref="categoryScroller"
        @scroll="updateScrollState"
        class="px-3 space-y-1 h-full overflow-y-auto sidebar-scroll"
      >
        <button
          v-for="category in categories"
          :key="category"
          @click="$emit('update-category', category)"
          :class="[
            'w-full flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-150 text-left',
            selectedCategory === category
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
          ]"
        >
          <span class="w-5 h-5 flex-shrink-0" v-html="getCategoryIcon(category)"></span>
          <span class="text-[11px] tracking-[0.18em] uppercase font-medium">{{ category }}</span>
        </button>
      </nav>
      <!-- Bottom fade hint when more content is below the fold -->
      <div
        v-show="canScrollDown"
        class="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white via-white/80 to-transparent"
      ></div>
      <!-- Chevron pulse when scrollable -->
      <div
        v-show="canScrollDown"
        class="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-stone-400"
      >
        <svg class="w-4 h-4 animate-bounce-soft" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- Add place (admins add public places; signed-in friends add group-visible ones) -->
    <div v-if="isAdmin || isLoggedIn" class="px-7 pt-5 pb-4">
      <button
        @click="openAddPlaceModal"
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all text-[11px] tracking-[0.15em] uppercase font-medium bg-white text-stone-700 border border-stone-300 hover:border-stone-900"
      >
        <span>+ Add Place</span>
      </button>
    </div>

    <!-- Add place modal -->
    <teleport to="body">
      <div
        v-if="showAddPlaceForm"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] sm:p-4"
        @click="closeAddPlaceModal"
      >
        <div
          class="bg-white sm:rounded-xl rounded-t-2xl shadow-xl w-full sm:w-[90%] max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col"
          @click.stop
        >
          <div class="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-stone-200">
            <div>
              <h2 class="text-lg font-semibold text-stone-900">Add New Restaurant</h2>
              <p class="text-xs text-stone-500 mt-0.5">Add a place to your collection</p>
            </div>
            <button
              @click="closeAddPlaceModal"
              class="text-stone-400 hover:text-stone-600 transition-colors"
              aria-label="Close"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
            <AddPlaceForm @place-added="handlePlaceAdded" />
          </div>
        </div>
      </div>
    </teleport>

    <!-- Account (sign in / user info) -->
    <div class="px-7 pt-4 pb-4 border-t border-stone-100">
      <AuthControl />
      <button
        v-if="isLoggedIn"
        @click="$emit('open-groups')"
        class="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all text-[11px] tracking-[0.15em] uppercase font-medium bg-white text-stone-700 border border-stone-300 hover:border-stone-900"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6-4a3 3 0 11-3-3" />
        </svg>
        <span>Friend Groups</span>
      </button>
    </div>

    <!-- Footer (admin settings only) -->
    <div v-if="isAdmin" class="px-7 pt-3 pb-6 border-t border-stone-100">
      <button
        @click="$emit('open-settings')"
        class="w-full flex items-center gap-2.5 text-stone-500 hover:text-stone-900 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="text-[10px] tracking-[0.22em] uppercase font-medium">Settings</span>
      </button>
    </div>
  </aside>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import AddPlaceForm from './AddPlaceForm.vue'
import AuthControl from './AuthControl.vue'
import { useConfig } from '../composables/useConfig'
import { useAuth } from '../composables/useAuth'

// Lucide-style stroke icons keyed by lowercase keyword in the cuisine name.
// Order matters — first match wins.
const ICON_PATHS = {
  forkKnife:
    '<path d="M6 2v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V2M8 12v10M18 2c-1.5 0-3 1.5-3 4v6h2v10"/>',
  bowl:
    '<path d="M3 11h18l-1.2 5.5A4 4 0 0 1 15.9 20H8.1a4 4 0 0 1-3.9-3.5L3 11z"/><path d="M7 11c0-2 2-3 5-3s5 1 5 3"/><path d="M11 4c0 1 1 1 1 2s-1 1-1 2"/>',
  coffee:
    '<path d="M17 8h1a3 3 0 0 1 0 6h-1"/><path d="M3 8h14v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><path d="M6 2v3M10 2v3M14 2v3"/>',
  moon:
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  wine:
    '<path d="M8 22h8M12 15v7M17 3H7l1 9a4 4 0 0 0 8 0l1-9z"/>',
  burger:
    '<path d="M3 11h18M4 15h16M7 19h10"/><path d="M3 11a9 9 0 0 1 18 0"/>',
}

const ICON_MATCHERS = [
  { keys: ['ramen', 'noodle', 'pho'], icon: 'bowl' },
  { keys: ['cafe', 'coffee', 'bakery', 'dessert'], icon: 'coffee' },
  { keys: ['bar', 'wine', 'cocktail'], icon: 'wine' },
  { keys: ['late', 'night', 'supper'], icon: 'moon' },
  { keys: ['burger', 'western', 'american'], icon: 'burger' },
]

const getCategoryIcon = (name) => {
  const lower = (name || '').toLowerCase()
  const match = ICON_MATCHERS.find((m) => m.keys.some((k) => lower.includes(k)))
  const key = match ? match.icon : 'forkKnife'
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="100%" height="100%">${ICON_PATHS[key]}</svg>`
}

export default {
  name: 'Sidebar',
  components: {
    AddPlaceForm,
    AuthControl,
  },
  props: {
    selectedRegion: { type: String, default: '' },
    selectedCategory: { type: String, default: '' },
    isAdmin: { type: Boolean, default: false },
  },
  emits: [
    'update-category',
    'place-added',
    'close-sidebar',
    'open-settings',
    'open-groups',
  ],
  setup(props, { emit }) {
    const showAddPlaceForm = ref(false)
    const categoryScroller = ref(null)
    const canScrollDown = ref(false)
    const { cuisineNames: categories } = useConfig()
    const { isLoggedIn } = useAuth()

    const subtitle = computed(() => {
      if (props.selectedRegion) return props.selectedRegion
      if (props.selectedCategory) return `${props.selectedCategory} dining`
      return 'Street-Chic Dining'
    })

    const handlePlaceAdded = (place) => {
      emit('place-added', place)
      showAddPlaceForm.value = false
    }

    const openAddPlaceModal = () => {
      showAddPlaceForm.value = true
    }

    const closeAddPlaceModal = () => {
      showAddPlaceForm.value = false
    }

    // Track whether the category list has more content below the fold so we
    // can render the bottom fade + chevron indicator.
    const updateScrollState = () => {
      const el = categoryScroller.value
      if (!el) {
        canScrollDown.value = false
        return
      }
      canScrollDown.value = el.scrollTop + el.clientHeight < el.scrollHeight - 1
    }

    let resizeObserver = null
    onMounted(() => {
      updateScrollState()
      // Recompute when the category list resizes (e.g., cuisines load late,
      // viewport changes).
      if (categoryScroller.value && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(updateScrollState)
        resizeObserver.observe(categoryScroller.value)
      }
      window.addEventListener('resize', updateScrollState)
    })
    onUnmounted(() => {
      if (resizeObserver) resizeObserver.disconnect()
      window.removeEventListener('resize', updateScrollState)
    })

    // Re-check whenever the categories array (asynchronously loaded) changes.
    watch(categories, () => nextTick(updateScrollState))

    return {
      showAddPlaceForm,
      categoryScroller,
      canScrollDown,
      updateScrollState,
      subtitle,
      handlePlaceAdded,
      openAddPlaceModal,
      closeAddPlaceModal,
      categories,
      getCategoryIcon,
      isLoggedIn,
    }
  },
}
</script>

<style scoped>
/* Thin visible scrollbar so the scroll affordance is obvious. */
.sidebar-scroll {
  scrollbar-width: thin;
  scrollbar-color: #d6d3d1 transparent;
}
.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}
.sidebar-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.sidebar-scroll::-webkit-scrollbar-thumb {
  background: #d6d3d1;
  border-radius: 3px;
}
.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: #a8a29e;
}

/* Gentle bounce on the chevron hint so it's noticeable but not noisy. */
@keyframes bounce-soft {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(3px);
  }
}
.animate-bounce-soft {
  animation: bounce-soft 1.6s ease-in-out infinite;
}
</style>
