import { ref } from 'vue'
import { blogApi } from '../services/api'

const posts = ref([])
const loading = ref(false)
const loaded = ref(false)

export function useBlog() {
  const loadPosts = async (force = false) => {
    if (loaded.value && !force) return
    loading.value = true
    try {
      posts.value = await blogApi.list()
      loaded.value = true
    } catch (error) {
      console.error('Failed to load blog posts:', error)
    } finally {
      loading.value = false
    }
  }

  const getPost = async (id) => {
    return await blogApi.get(id)
  }

  const createPost = async (post) => {
    const { post: created } = await blogApi.create(post)
    await loadPosts(true)
    return created
  }

  const updatePost = async (id, post) => {
    const { post: updated } = await blogApi.update(id, post)
    await loadPosts(true)
    return updated
  }

  const deletePost = async (id) => {
    await blogApi.delete(id)
    await loadPosts(true)
  }

  return {
    posts,
    loading,
    loadPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
  }
}
