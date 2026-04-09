<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] sm:p-4"
    @click="$emit('close')"
  >
    <div
      class="bg-white sm:rounded-xl rounded-t-2xl shadow-xl w-full sm:w-[90%] max-w-lg max-h-[92vh] sm:max-h-[80vh] flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="flex justify-between items-center px-6 py-4 border-b border-slate-200">
        <h2 class="text-lg font-semibold text-slate-900">About This Map</h2>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="loading" class="text-center text-slate-400 py-8">
          Loading...
        </div>
        <div v-else-if="methodology.sections.length === 0" class="text-center text-slate-400 py-8">
          No methodology content available.
        </div>
        <div v-else class="space-y-4">
          <template v-for="(section, index) in methodology.sections" :key="index">
            <h3 v-if="section.type === 'header'" class="text-base font-semibold text-slate-900">
              {{ section.content }}
            </h3>
            <p v-else class="text-sm text-slate-600 leading-relaxed">
              {{ section.content }}
            </p>
          </template>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
        <button
          @click="$emit('close')"
          class="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, watch } from 'vue'
import { useMethodology } from '../composables/useMethodology'

export default {
  name: 'MethodologyModal',
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close'],
  setup(props) {
    const { methodology, loading, loadMethodology } = useMethodology()

    // Load methodology when modal opens
    watch(() => props.isOpen, (isOpen) => {
      if (isOpen) {
        loadMethodology()
      }
    })

    onMounted(() => {
      if (props.isOpen) {
        loadMethodology()
      }
    })

    return {
      methodology,
      loading,
    }
  },
}
</script>
