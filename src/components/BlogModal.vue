<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] sm:p-4"
    @click="$emit('close')"
  >
    <div
      class="bg-neutral-50 sm:rounded-xl rounded-t-2xl shadow-xl w-full sm:w-[95%] max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="flex justify-between items-center px-6 py-4 border-b border-stone-200 bg-white sm:rounded-t-xl">
        <div class="flex items-center gap-3">
          <button
            v-if="activePost"
            @click="activePost = null"
            class="text-stone-500 hover:text-stone-900 transition-colors"
            aria-label="Back to posts"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 class="text-lg font-semibold text-stone-900 tracking-tight">
            {{ activePost ? 'Post' : 'The Visual Eater — Blog' }}
          </h2>
        </div>
        <button
          @click="$emit('close')"
          class="text-stone-400 hover:text-stone-600 transition-colors"
          aria-label="Close"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- List view -->
        <div v-if="!activePost" class="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div v-if="loading" class="text-center text-stone-400 py-8">Loading...</div>
          <template v-else>
            <p class="text-sm text-stone-500">
              Quick reviews from around Singapore. Tap a post to read more.
            </p>
            <div v-if="posts.length === 0" class="text-center text-stone-400 py-12">
              No posts yet.
            </div>
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <button
                v-for="post in posts"
                :key="post.id"
                @click="openPost(post)"
                class="text-left bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-md transition-shadow"
              >
                <img
                  v-if="post.hero"
                  :src="post.hero"
                  :alt="post.title"
                  class="w-full h-44 object-cover"
                />
                <div v-else class="w-full h-44 bg-stone-100 flex items-center justify-center text-stone-300 text-xs">
                  No image
                </div>
                <div class="p-4">
                  <div
                    v-if="post.location"
                    class="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-semibold flex items-center gap-1"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657A8 8 0 1117.657 16.657z" />
                      <circle cx="12" cy="11" r="3" />
                    </svg>
                    {{ post.location }}
                  </div>
                  <h3 class="font-bold text-lg leading-tight mt-1.5">{{ post.title }}</h3>
                  <p v-if="post.summary" class="text-sm text-stone-500 mt-2 line-clamp-2">{{ post.summary }}</p>
                  <div v-if="post.rating" class="mt-3 text-base">{{ post.rating }}</div>
                </div>
              </button>
            </div>
          </template>
        </div>

        <!-- Detail view -->
        <article v-else class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div class="mb-6">
            <h2 class="text-3xl md:text-5xl font-extrabold tracking-tight mb-2 leading-tight">
              {{ activePost.title }}
            </h2>
            <p class="text-stone-500 text-sm flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0L6.343 16.657A8 8 0 1117.657 16.657z" />
                <circle cx="12" cy="11" r="3" />
              </svg>
              <span v-if="activePost.location">{{ activePost.location }} • </span>
              <span>{{ formatDate(activePost.created_at) }}</span>
            </p>
          </div>

          <div v-if="activePost.hero" class="mb-8">
            <img
              :src="activePost.hero"
              :alt="activePost.title"
              class="w-full h-72 md:h-[450px] object-cover rounded-2xl shadow-sm"
            />
            <p v-if="content.heroCaption" class="text-xs text-stone-400 mt-2 text-right">
              {{ content.heroCaption }}
            </p>
          </div>

          <!-- Quick summary -->
          <div v-if="content.stats?.length" class="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 mb-10">
            <h3 class="font-bold text-lg mb-4">Quick Summary</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div v-for="(stat, i) in content.stats" :key="i" class="flex flex-col gap-1">
                <span class="text-stone-500 text-xs uppercase font-semibold">{{ stat.label }}</span>
                <span class="font-medium">{{ stat.value }}</span>
              </div>
            </div>
          </div>

          <!-- Experience -->
          <div v-if="content.experience?.length" class="mb-10">
            <h3 class="text-2xl font-bold mb-4 border-b border-stone-200 pb-2">The Experience</h3>
            <ul class="space-y-3">
              <li v-for="(item, i) in content.experience" :key="i" class="flex items-start gap-3">
                <span
                  :class="item.type === 'tip'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'"
                  class="p-1 rounded-full mt-0.5 w-6 h-6 flex items-center justify-center text-xs"
                >
                  {{ item.type === 'tip' ? '!' : '✓' }}
                </span>
                <span><strong>{{ item.heading }}:</strong> {{ item.body }}</span>
              </li>
            </ul>
          </div>

          <!-- Food -->
          <div v-if="content.gallery?.length" class="mb-12">
            <h3 class="text-2xl font-bold mb-4 border-b border-stone-200 pb-2">The Food</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-for="(item, i) in content.gallery" :key="i" class="flex flex-col">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.name"
                  class="w-full h-64 object-cover rounded-xl mb-3 shadow-sm"
                />
                <h4 class="font-bold text-lg">{{ item.name }}</h4>
                <p class="text-stone-600 text-sm leading-relaxed">{{ item.notes }}</p>
              </div>
            </div>
          </div>

          <!-- Verdict -->
          <div
            v-if="activePost.rating || content.verdictQuote || content.wouldReturn || content.bestFor"
            class="bg-stone-900 text-white rounded-2xl p-8 text-center shadow-lg"
          >
            <h3 class="text-2xl font-bold mb-4">Final Verdict</h3>
            <div v-if="activePost.rating" class="text-5xl mb-4">{{ activePost.rating }}</div>
            <p v-if="content.verdictQuote" class="text-lg text-stone-300 mb-6">"{{ content.verdictQuote }}"</p>
            <div class="flex justify-center gap-4 flex-wrap">
              <div v-if="content.wouldReturn" class="bg-stone-800 px-4 py-2 rounded-lg">
                <span class="block text-xs text-stone-400 uppercase">Would I go back?</span>
                <span class="font-bold text-green-400">{{ content.wouldReturn }}</span>
              </div>
              <div v-if="content.bestFor" class="bg-stone-800 px-4 py-2 rounded-lg">
                <span class="block text-xs text-stone-400 uppercase">Best For</span>
                <span class="font-bold text-blue-400">{{ content.bestFor }}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useBlog } from '../composables/useBlog'

export default {
  name: 'BlogModal',
  props: {
    isOpen: { type: Boolean, default: false },
  },
  emits: ['close'],
  setup(props) {
    const { posts, loading, loadPosts, getPost } = useBlog()
    const activePost = ref(null)

    watch(() => props.isOpen, (open) => {
      if (open) {
        loadPosts(true)
      } else {
        activePost.value = null
      }
    })

    const openPost = async (post) => {
      try {
        activePost.value = await getPost(post.id)
      } catch (error) {
        console.error('Failed to load post:', error)
        activePost.value = post
      }
    }

    const content = computed(() => activePost.value?.content || {})

    const formatDate = (iso) => {
      if (!iso) return ''
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    }

    return { posts, loading, activePost, openPost, content, formatDate }
  },
}
</script>
