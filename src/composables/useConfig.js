import { ref, computed } from 'vue'
import { configApi } from '../services/api'

// Shared state (singleton pattern)
const cuisines = ref([])
const tags = ref([])
const tagsByCategory = ref({})
const tiers = ref([])
const loading = ref(false)
const loaded = ref(false)

// Shared in-flight promise so concurrent callers reuse the same request
// instead of racing each other and overwriting state out of order.
let inFlightLoad = null

// Fallback config if API fails
const useFallbackConfig = () => {
  cuisines.value = [
    { id: 1, name: 'Zi Char', sort_order: 1 },
    { id: 2, name: 'Ramen', sort_order: 2 },
    { id: 3, name: 'Korean', sort_order: 3 },
    { id: 4, name: 'European', sort_order: 4 },
    { id: 5, name: 'Cafe', sort_order: 5 },
    { id: 6, name: 'South East Asian', sort_order: 6 },
  ]
  tagsByCategory.value = {
    'Cafe': ['bagel', 'just coffee', 'fusion', 'sandwich'],
    'South East Asian': ['thai', 'indonesian', 'vietnamese', 'filipino', 'malaysian', 'local'],
    'European': ['spanish', 'italian', 'french'],
    'Korean': ['bbq', 'fried chicken', 'stew/jjigae', 'bibimbap', 'tteokbokki', 'army stew', 'jjajangmyeon'],
    'Ramen': ['tonkotsu', 'shoyu', 'miso', 'shio', 'tsukemen', 'spicy', 'dandanmen'],
  }
  tiers.value = [
    { id: 1, code: 'S', description: "Would bring gf's parents", color_class: 'bg-pink-100 text-pink-700 border border-pink-200', color_hex: '#f9a8d4', sort_order: 1 },
    { id: 2, code: 'A', description: 'Worth the Grab ride', color_class: 'bg-emerald-100 text-emerald-700 border border-emerald-200', color_hex: '#86efac', sort_order: 2 },
    { id: 3, code: 'B', description: 'If nearby, why not', color_class: 'bg-amber-100 text-amber-700 border border-amber-200', color_hex: '#fde047', sort_order: 3 },
    { id: 4, code: 'C', description: 'Last resort makan', color_class: 'bg-orange-100 text-orange-700 border border-orange-200', color_hex: '#fdba74', sort_order: 4 },
    { id: 5, code: 'D', description: 'Leftovers > this', color_class: 'bg-rose-100 text-rose-700 border border-rose-200', color_hex: '#fca5a5', sort_order: 5 },
    { id: 6, code: 'F', description: 'Avoid like GST hikes', color_class: 'bg-slate-100 text-slate-700 border border-slate-200', color_hex: '#d1d5db', sort_order: 6 },
  ]
}

// Module-level loader so consumers can trigger it idempotently from setup()
const loadConfig = async (force = false) => {
  if (loaded.value && !force) return
  if (inFlightLoad) return inFlightLoad

  loading.value = true
  inFlightLoad = (async () => {
    try {
      const config = await configApi.getAll()
      cuisines.value = config.cuisines || []
      tags.value = config.tags || []
      tagsByCategory.value = config.tagsByCategory || {}
      tiers.value = config.tiers || []
      loaded.value = true
    } catch (error) {
      console.error('Failed to load config:', error)
      // Seed UI with fallback so it renders, but keep `loaded` false so a
      // later call will retry the real API instead of locking in the stub.
      if (!loaded.value) useFallbackConfig()
    } finally {
      loading.value = false
      inFlightLoad = null
    }
  })()
  return inFlightLoad
}

export function useConfig() {
  // Kick off the shared load on first access. The in-flight dedup and
  // `loaded` cache make this cheap for every consumer to call, and it
  // guarantees no consumer renders empty forever even if App.vue's initial
  // fetch failed.
  if (!loaded.value && !inFlightLoad) {
    loadConfig()
  }

  // Computed: cuisine names array
  const cuisineNames = computed(() => cuisines.value.map(c => c.name))

  // Computed: tier options for dropdowns
  const tierOptions = computed(() => tiers.value.map(t => ({
    code: t.code,
    label: `${t.code} - ${t.description}`,
    description: t.description,
    colorClass: t.color_class,
    colorHex: t.color_hex,
  })))

  // Get tier badge class by code
  const getTierBadgeClass = (tierCode) => {
    const tier = tiers.value.find(t => t.code === tierCode)
    return tier?.color_class || 'bg-slate-100 text-slate-700 border border-slate-200'
  }

  // Get tier color hex by code
  const getTierColorHex = (tierCode) => {
    const tier = tiers.value.find(t => t.code === tierCode)
    return tier?.color_hex || '#d1d5db'
  }

  // Get tier description by code
  const getTierDescription = (tierCode) => {
    const tier = tiers.value.find(t => t.code === tierCode)
    return tier?.description || ''
  }

  // Get tags for a cuisine
  const getTagsForCuisine = (cuisineName) => {
    return tagsByCategory.value[cuisineName] || []
  }

  // Refresh config (call after admin changes)
  const refreshConfig = () => loadConfig(true)

  // Admin operations
  const addCuisine = async (name, sortOrder) => {
    const result = await configApi.addCuisine(name, sortOrder)
    await refreshConfig()
    return result
  }

  const updateCuisine = async (id, data) => {
    const result = await configApi.updateCuisine(id, data)
    await refreshConfig()
    return result
  }

  const deleteCuisine = async (id) => {
    const result = await configApi.deleteCuisine(id)
    await refreshConfig()
    return result
  }

  const addTag = async (cuisineId, name) => {
    const result = await configApi.addTag(cuisineId, name)
    await refreshConfig()
    return result
  }

  const deleteTag = async (id) => {
    const result = await configApi.deleteTag(id)
    await refreshConfig()
    return result
  }

  const addTier = async (tierData) => {
    const result = await configApi.addTier(tierData)
    await refreshConfig()
    return result
  }

  const updateTier = async (id, data) => {
    const result = await configApi.updateTier(id, data)
    await refreshConfig()
    return result
  }

  const deleteTier = async (id) => {
    const result = await configApi.deleteTier(id)
    await refreshConfig()
    return result
  }

  return {
    // State
    cuisines,
    tags,
    tagsByCategory,
    tiers,
    loading,
    loaded,

    // Computed
    cuisineNames,
    tierOptions,

    // Methods
    loadConfig,
    refreshConfig,
    getTierBadgeClass,
    getTierColorHex,
    getTierDescription,
    getTagsForCuisine,

    // Admin operations
    addCuisine,
    updateCuisine,
    deleteCuisine,
    addTag,
    deleteTag,
    addTier,
    updateTier,
    deleteTier,
  }
}
