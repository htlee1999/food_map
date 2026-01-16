import { ref } from 'vue'
import { settingsApi } from '../services/api'

// Shared state (singleton pattern)
const methodology = ref({ sections: [] })
const loading = ref(false)
const loaded = ref(false)

const SETTING_KEY = 'methodology'

export function useMethodology() {
  // Load methodology from API
  const loadMethodology = async (force = false) => {
    if (loaded.value && !force) return

    loading.value = true
    try {
      const response = await settingsApi.get(SETTING_KEY)
      if (response.value) {
        methodology.value = response.value
      } else {
        methodology.value = { sections: [] }
      }
      loaded.value = true
    } catch (error) {
      console.error('Failed to load methodology:', error)
      methodology.value = { sections: [] }
    } finally {
      loading.value = false
    }
  }

  // Save methodology (admin only)
  const saveMethodology = async () => {
    try {
      await settingsApi.update(SETTING_KEY, methodology.value)
      return true
    } catch (error) {
      console.error('Failed to save methodology:', error)
      throw error
    }
  }

  // Add a section
  const addSection = (type) => {
    methodology.value.sections.push({
      type,
      content: '',
    })
  }

  // Remove a section by index
  const removeSection = (index) => {
    methodology.value.sections.splice(index, 1)
  }

  // Move section up or down
  const moveSection = (index, direction) => {
    const sections = methodology.value.sections
    const newIndex = direction === 'up' ? index - 1 : index + 1

    if (newIndex < 0 || newIndex >= sections.length) return

    const temp = sections[index]
    sections[index] = sections[newIndex]
    sections[newIndex] = temp
  }

  return {
    methodology,
    loading,
    loaded,
    loadMethodology,
    saveMethodology,
    addSection,
    removeSection,
    moveSection,
  }
}
