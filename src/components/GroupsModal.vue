<template>
  <teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] sm:p-4"
      @click="$emit('close')"
    >
      <div
        class="bg-white sm:rounded-xl rounded-t-2xl shadow-xl w-full sm:w-[90%] max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col"
        @click.stop
      >
        <div class="flex justify-between items-center px-4 sm:px-6 py-4 border-b border-stone-200">
          <div>
            <h2 class="text-lg font-semibold text-stone-900">Friend Groups</h2>
            <p class="text-xs text-stone-500 mt-0.5">Rate places together with your friends</p>
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

        <div class="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-6">
          <!-- Groups list -->
          <div v-if="loading" class="text-sm text-stone-500 italic">Loading groups...</div>
          <div v-else-if="groups.length === 0" class="text-sm text-stone-500 italic">
            No groups yet. Create one and share the invite link with your friends.
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="group in groups"
              :key="group.id"
              class="border border-stone-200 rounded-lg p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <h3 class="font-semibold text-stone-900 truncate">{{ group.name }}</h3>
                <button
                  @click="handleLeave(group)"
                  class="text-[10px] tracking-[0.14em] uppercase text-stone-400 hover:text-red-600 transition-colors flex-shrink-0"
                >
                  Leave
                </button>
              </div>
              <div class="mt-2 flex items-center gap-1.5 flex-wrap">
                <template v-for="member in group.members" :key="member.id">
                  <img
                    v-if="member.avatar_url"
                    :src="member.avatar_url"
                    :alt="member.display_name || 'Friend'"
                    :title="member.display_name || 'Friend'"
                    referrerpolicy="no-referrer"
                    class="w-6 h-6 rounded-full border border-stone-200"
                  />
                  <span
                    v-else
                    :title="member.display_name || 'Friend'"
                    class="w-6 h-6 rounded-full bg-stone-200 text-stone-600 text-[10px] font-semibold flex items-center justify-center"
                  >
                    {{ (member.display_name || '?').charAt(0).toUpperCase() }}
                  </span>
                </template>
                <span class="text-xs text-stone-500 ml-1">
                  {{ group.members.length }} {{ group.members.length === 1 ? 'member' : 'members' }}
                </span>
              </div>
              <button
                @click="copyInviteLink(group)"
                class="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[11px] tracking-[0.15em] uppercase font-medium bg-white text-stone-700 border border-stone-300 hover:border-stone-900 transition-all"
              >
                {{ copiedGroupId === group.id ? 'Link Copied!' : 'Copy Invite Link' }}
              </button>
            </div>
          </div>

          <!-- Create group -->
          <div class="border-t border-stone-100 pt-5">
            <label class="block text-[10px] tracking-[0.22em] uppercase text-stone-500 font-medium mb-2">
              Create a group
            </label>
            <div class="flex gap-2">
              <input
                v-model="newGroupName"
                @keyup.enter="handleCreate"
                type="text"
                maxlength="100"
                placeholder="e.g. Makan Kakis"
                class="flex-1 min-w-0 px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:border-stone-900"
              />
              <button
                @click="handleCreate"
                :disabled="!newGroupName.trim() || submitting"
                class="px-4 py-2 rounded-md text-[11px] tracking-[0.15em] uppercase font-medium bg-stone-900 text-white disabled:opacity-40 hover:bg-stone-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>

          <!-- Join with code -->
          <div>
            <label class="block text-[10px] tracking-[0.22em] uppercase text-stone-500 font-medium mb-2">
              Join with invite code
            </label>
            <div class="flex gap-2">
              <input
                v-model="joinCode"
                @keyup.enter="handleJoin"
                type="text"
                placeholder="e.g. 3f9a1c2e"
                class="flex-1 min-w-0 px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:border-stone-900"
              />
              <button
                @click="handleJoin"
                :disabled="!joinCode.trim() || submitting"
                class="px-4 py-2 rounded-md text-[11px] tracking-[0.15em] uppercase font-medium bg-white text-stone-700 border border-stone-300 disabled:opacity-40 hover:border-stone-900 transition-all"
              >
                Join
              </button>
            </div>
            <p v-if="errorMessage" class="mt-2 text-xs text-red-600">{{ errorMessage }}</p>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { ref } from 'vue'
import { useGroups } from '../composables/useGroups'

const COPIED_FEEDBACK_MS = 2000

export default {
  name: 'GroupsModal',
  props: {
    isOpen: { type: Boolean, default: false },
  },
  emits: ['close'],
  setup() {
    const { groups, loading, createGroup, joinGroup, leaveGroup } = useGroups()

    const newGroupName = ref('')
    const joinCode = ref('')
    const submitting = ref(false)
    const errorMessage = ref('')
    const copiedGroupId = ref(null)

    const handleCreate = async () => {
      const name = newGroupName.value.trim()
      if (!name || submitting.value) return

      submitting.value = true
      errorMessage.value = ''
      try {
        await createGroup(name)
        newGroupName.value = ''
      } catch {
        errorMessage.value = 'Failed to create group. Please try again.'
      } finally {
        submitting.value = false
      }
    }

    const handleJoin = async () => {
      const code = joinCode.value.trim()
      if (!code || submitting.value) return

      submitting.value = true
      errorMessage.value = ''
      try {
        await joinGroup(code)
        joinCode.value = ''
      } catch (error) {
        errorMessage.value =
          error.response?.status === 404
            ? 'Invalid invite code.'
            : 'Failed to join group. Please try again.'
      } finally {
        submitting.value = false
      }
    }

    const handleLeave = async (group) => {
      try {
        await leaveGroup(group.id)
      } catch {
        errorMessage.value = 'Failed to leave group. Please try again.'
      }
    }

    const copyInviteLink = async (group) => {
      const inviteLink = `${window.location.origin}?join=${group.invite_code}`
      try {
        await navigator.clipboard.writeText(inviteLink)
        copiedGroupId.value = group.id
        setTimeout(() => {
          if (copiedGroupId.value === group.id) copiedGroupId.value = null
        }, COPIED_FEEDBACK_MS)
      } catch {
        // Clipboard can be unavailable (e.g. non-HTTPS); show the link instead
        window.prompt('Copy this invite link:', inviteLink)
      }
    }

    return {
      groups,
      loading,
      newGroupName,
      joinCode,
      submitting,
      errorMessage,
      copiedGroupId,
      handleCreate,
      handleJoin,
      handleLeave,
      copyInviteLink,
    }
  },
}
</script>
