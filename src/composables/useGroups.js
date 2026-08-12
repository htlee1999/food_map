import { ref, watch } from 'vue'
import { groupsApi } from '../services/api'
import { useAuth } from './useAuth'
import { useRatings } from './useRatings'

const PENDING_JOIN_CODE_KEY = 'pendingJoinCode'

// Shared state (singleton pattern)
const groups = ref([])
const loading = ref(false)
const joinedGroupName = ref('') // Set when a ?join=CODE invite is consumed
const initialized = ref(false)

export function useGroups() {
  const { isLoggedIn } = useAuth()
  const { loadRatingsSummary } = useRatings()

  const loadGroups = async () => {
    loading.value = true
    try {
      groups.value = await groupsApi.list()
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      loading.value = false
    }
  }

  const createGroup = async (name) => {
    const result = await groupsApi.create(name)
    await loadGroups()
    return result.group
  }

  // Joining/leaving changes which friends' ratings are visible, so the
  // pin-color summary is refreshed alongside the group list.
  const joinGroup = async (inviteCode) => {
    const result = await groupsApi.join(inviteCode)
    await Promise.all([loadGroups(), loadRatingsSummary()])
    return result.group
  }

  const leaveGroup = async (groupId) => {
    await groupsApi.leave(groupId)
    await Promise.all([loadGroups(), loadRatingsSummary()])
  }

  // Consume a pending ?join=CODE invite once the user is signed in
  const consumePendingInvite = async () => {
    const pendingCode = sessionStorage.getItem(PENDING_JOIN_CODE_KEY)
    if (!pendingCode) return

    sessionStorage.removeItem(PENDING_JOIN_CODE_KEY)
    try {
      const group = await joinGroup(pendingCode)
      joinedGroupName.value = group.name
    } catch (error) {
      console.error('Failed to join group from invite link:', error)
    }
  }

  // Capture ?join=CODE from the URL and sync groups with login state (only once)
  const initGroups = () => {
    if (initialized.value) return
    initialized.value = true

    const inviteCode = new URLSearchParams(window.location.search).get('join')
    if (inviteCode) {
      sessionStorage.setItem(PENDING_JOIN_CODE_KEY, inviteCode)
    }

    watch(
      isLoggedIn,
      async (loggedIn) => {
        if (!loggedIn) {
          groups.value = []
          return
        }
        await consumePendingInvite()
        await loadGroups()
      },
      { immediate: true }
    )
  }

  return {
    groups,
    loading,
    joinedGroupName,
    initGroups,
    loadGroups,
    createGroup,
    joinGroup,
    leaveGroup,
  }
}
