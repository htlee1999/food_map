import { ref } from 'vue'
import { votesApi } from '../services/api'

// Generate or retrieve voter ID from localStorage
const getVoterId = () => {
  let voterId = localStorage.getItem('voterId')
  if (!voterId) {
    voterId = 'voter_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
    localStorage.setItem('voterId', voterId)
  }
  return voterId
}

export function useVoting() {
  const voterId = getVoterId()
  const votesCache = ref({}) // Cache: { placeId: { up, down, userVote } }

  // Get votes for a place
  const getVotes = async (placeId) => {
    try {
      const votes = await votesApi.get(placeId, voterId)
      votesCache.value[placeId] = votes
      return votes
    } catch (error) {
      console.error('Error fetching votes:', error)
      return { up: 0, down: 0, userVote: null }
    }
  }

  // Submit a vote (toggle behavior)
  const vote = async (placeId, voteType) => {
    try {
      const currentVote = votesCache.value[placeId]?.userVote

      // If clicking the same vote type, remove the vote
      if (currentVote === voteType) {
        await votesApi.remove(placeId, voterId)
        // Update cache
        const newVotes = { ...votesCache.value[placeId] }
        if (voteType === 'up') newVotes.up--
        else newVotes.down--
        newVotes.userVote = null
        votesCache.value[placeId] = newVotes
        return newVotes
      }

      // Otherwise, submit the new vote
      await votesApi.submit(placeId, voteType, voterId)

      // Update cache
      const newVotes = { ...votesCache.value[placeId] }
      if (currentVote === 'up') newVotes.up--
      else if (currentVote === 'down') newVotes.down--
      if (voteType === 'up') newVotes.up++
      else newVotes.down++
      newVotes.userVote = voteType
      votesCache.value[placeId] = newVotes

      return newVotes
    } catch (error) {
      console.error('Error submitting vote:', error)
      return null
    }
  }

  return {
    votesCache,
    getVotes,
    vote,
  }
}
