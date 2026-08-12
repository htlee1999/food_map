<template>
  <div class="popup">
    <div class="popup-name">{{ place.name }}</div>
    <div class="popup-address">{{ place.address }}</div>

    <!-- Friend-added places have no public/editorial tier -->
    <div v-if="place.tier" class="popup-tier">
      <span class="tier-badge" :style="badgeStyle(place.tier)">{{ place.tier }}</span>
      <span class="tier-description">{{ getTierDescription(place.tier) }}</span>
    </div>

    <div v-if="place.region || (place.tags && place.tags.length)" class="popup-tags">
      <span v-if="place.region" class="popup-tag popup-tag-region">{{ place.region }}</span>
      <span v-for="tag in place.tags" :key="tag" class="popup-tag">{{ tag }}</span>
    </div>

    <div class="popup-navigate">
      <span class="popup-label">Navigate with:</span>
      <div class="navigate-buttons">
        <a :href="googleMapsUrl" target="_blank" rel="noopener" class="nav-btn nav-gmaps" title="Google Maps">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </a>
        <a :href="wazeUrl" target="_blank" rel="noopener" class="nav-btn nav-waze" title="Waze">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#33CCFF" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        </a>
        <a :href="appleMapsUrl" target="_blank" rel="noopener" class="nav-btn nav-apple" title="Apple Maps">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#555" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </a>
      </div>
    </div>

    <!-- Friend ratings (signed-in users only) -->
    <div v-if="currentUser" class="popup-section">
      <div class="section-header">
        Friend Ratings
        <span v-if="groupTier" class="tier-badge" :style="badgeStyle(groupTier)">{{ groupTier }}</span>
      </div>
      <div class="scroll-list">
        <div v-for="rating in friendRatings" :key="rating.id" class="list-item">
          <div class="rating-item-header">
            <img
              v-if="rating.avatar_url"
              :src="rating.avatar_url"
              referrerpolicy="no-referrer"
              alt=""
              class="rating-avatar"
            />
            <span class="rating-user">{{ rating.display_name || 'Friend' }}</span>
            <span class="tier-badge" :style="badgeStyle(rating.tier)">{{ rating.tier }}</span>
          </div>
          <div v-if="rating.review" class="item-text">{{ rating.review }}</div>
        </div>
        <div v-if="friendRatings.length === 0" class="empty-note">No friend ratings yet</div>
      </div>
      <div class="rating-form">
        <span class="popup-label">Your rating</span>
        <div class="rating-tier-buttons">
          <button
            v-for="tier in tiers"
            :key="tier.code"
            @click="handleTierClick(tier.code)"
            :class="{ active: selectedTier === tier.code }"
            :style="selectedTier === tier.code ? { background: tier.color_hex } : {}"
            :title="tier.description"
            :disabled="saving"
            class="rating-tier-btn"
          >
            {{ tier.code }}
          </button>
        </div>
        <textarea
          v-model="reviewText"
          :placeholder="reviewPlaceholder"
          class="popup-input"
        ></textarea>
        <div class="rating-actions">
          <button @click="handleSaveRating" :disabled="saving" class="popup-submit-btn">
            {{ myRating ? 'Update Rating' : 'Save Rating' }}
          </button>
          <button v-if="myRating" @click="handleRemoveRating" :disabled="saving" class="popup-delete-btn">
            Remove
          </button>
        </div>
      </div>
    </div>

    <!-- Public agree/disagree votes -->
    <div class="popup-votes">
      <span class="popup-label">Do you agree?</span>
      <div class="votes-buttons">
        <button
          @click="handleVote('up')"
          :class="{ active: votes.userVote === 'up' }"
          :disabled="voting"
          class="vote-btn vote-up"
        >
          <span class="vote-icon">👍</span>
          <span class="vote-count">{{ votes.up }}</span>
        </button>
        <button
          @click="handleVote('down')"
          :class="{ active: votes.userVote === 'down' }"
          :disabled="voting"
          class="vote-btn vote-down"
        >
          <span class="vote-icon">👎</span>
          <span class="vote-count">{{ votes.down }}</span>
        </button>
      </div>
    </div>

    <!-- Editorial reviews (comments) -->
    <div class="popup-section">
      <div class="section-header">Reviews</div>
      <div class="scroll-list">
        <div v-for="comment in comments" :key="comment.id" class="list-item">
          <div class="item-text">{{ comment.content }}</div>
          <div class="comment-meta">
            <span class="comment-date">{{ formatDate(comment.created_at) }}</span>
            <button
              v-if="isAdmin"
              @click="handleDeleteComment(comment.id)"
              class="popup-delete-btn"
            >
              Delete
            </button>
          </div>
        </div>
        <div v-if="comments.length === 0" class="empty-note">
          {{ loading ? 'Loading reviews…' : 'No reviews yet' }}
        </div>
      </div>
      <div v-if="isAdmin" class="comment-form">
        <textarea v-model="commentText" placeholder="Write a review..." class="popup-input"></textarea>
        <button
          @click="handleAddComment"
          :disabled="!commentText.trim() || submittingComment"
          class="popup-submit-btn"
        >
          {{ submittingComment ? 'Adding…' : 'Add Review' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useConfig } from '../../composables/useConfig'
import { useAuth } from '../../composables/useAuth'
import { useRatings } from '../../composables/useRatings'
import { getGoogleMapsUrl, getWazeUrl, getAppleMapsUrl } from '../../utils/mapLinks'

export default {
  name: 'PlacePopup',
  props: {
    place: { type: Object, required: true },
    isAdmin: { type: Boolean, default: false },
    getComments: { type: Function, required: true },
    addComment: { type: Function, required: true },
    deleteComment: { type: Function, required: true },
    getVotes: { type: Function, required: true },
    vote: { type: Function, required: true },
  },
  emits: ['loaded'],
  setup(props, { emit }) {
    const { tiers, getTierColorHex, getTierDescription } = useConfig()
    const { currentUser } = useAuth()
    const { ratingsSummary, getRatings, submitRating, removeRating } = useRatings()

    const loading = ref(true)
    const comments = ref([])
    const votes = ref({ up: 0, down: 0, userVote: null })
    const ratings = ref([])

    const commentText = ref('')
    const reviewText = ref('')
    const selectedTier = ref(null)
    const reviewPlaceholder = ref('Add a short review (optional)')
    const saving = ref(false)
    const voting = ref(false)
    const submittingComment = ref(false)

    const myRating = computed(() =>
      currentUser.value ? ratings.value.find((r) => r.user_id === currentUser.value.id) : null
    )
    const friendRatings = computed(() =>
      currentUser.value ? ratings.value.filter((r) => r.user_id !== currentUser.value.id) : []
    )
    const groupTier = computed(() => ratingsSummary.value[props.place.id]?.group_tier)

    const googleMapsUrl = computed(() => getGoogleMapsUrl(props.place))
    const wazeUrl = computed(() => getWazeUrl(props.place))
    const appleMapsUrl = computed(() => getAppleMapsUrl(props.place))

    const badgeStyle = (tierCode) => ({
      background: getTierColorHex(tierCode),
      color: '#374151',
    })

    const formatDate = (date) => new Date(date).toLocaleDateString()

    const loadRatings = async () => {
      ratings.value = await getRatings(props.place.id)
      selectedTier.value = myRating.value?.tier || null
      reviewText.value = myRating.value?.review || ''
    }

    const handleTierClick = async (tierCode) => {
      selectedTier.value = tierCode
      await saveRating(tierCode)
    }

    const handleSaveRating = async () => {
      if (!selectedTier.value) {
        reviewPlaceholder.value = 'Pick a tier first, then save'
        return
      }
      await saveRating(selectedTier.value)
    }

    const saveRating = async (tierCode) => {
      saving.value = true
      const saved = await submitRating(props.place.id, tierCode, reviewText.value.trim() || null)
      if (saved) await loadRatings()
      saving.value = false
    }

    const handleRemoveRating = async () => {
      saving.value = true
      const removed = await removeRating(props.place.id)
      if (removed) await loadRatings()
      saving.value = false
    }

    const handleVote = async (voteType) => {
      voting.value = true
      const newVotes = await props.vote(props.place.id, voteType)
      if (newVotes) votes.value = newVotes
      voting.value = false
    }

    const handleAddComment = async () => {
      submittingComment.value = true
      const newComment = await props.addComment(props.place.id, commentText.value.trim())
      if (newComment) {
        comments.value = [newComment, ...comments.value]
        commentText.value = ''
      }
      submittingComment.value = false
    }

    const handleDeleteComment = async (commentId) => {
      const success = await props.deleteComment(commentId)
      if (success) {
        comments.value = comments.value.filter((c) => c.id !== commentId)
      }
    }

    onMounted(async () => {
      const [fetchedComments, fetchedVotes] = await Promise.all([
        props.getComments(props.place.id),
        props.getVotes(props.place.id),
        loadRatings(),
      ])
      comments.value = fetchedComments
      votes.value = fetchedVotes
      loading.value = false
      emit('loaded')
    })

    return {
      tiers,
      currentUser,
      loading,
      comments,
      votes,
      commentText,
      reviewText,
      selectedTier,
      reviewPlaceholder,
      saving,
      voting,
      submittingComment,
      myRating,
      friendRatings,
      groupTier,
      googleMapsUrl,
      wazeUrl,
      appleMapsUrl,
      badgeStyle,
      formatDate,
      getTierDescription,
      handleTierClick,
      handleSaveRating,
      handleRemoveRating,
      handleVote,
      handleAddComment,
      handleDeleteComment,
    }
  },
}
</script>

<style scoped>
.popup {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #1c1917;
  min-width: 220px;
  max-width: 100%;
}

.popup-name {
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: -0.01em;
  margin-bottom: 4px;
  line-height: 1.2;
}

.popup-address {
  color: #78716c;
  font-size: 0.78rem;
  margin-bottom: 10px;
  letter-spacing: 0.01em;
}

.popup-tier {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tier-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 2px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tier-description {
  font-size: 0.7rem;
  color: #78716c;
  font-style: italic;
}

.popup-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.popup-tag {
  display: inline-block;
  padding: 2px 6px;
  background: #f5f5f4;
  color: #57534e;
  border-radius: 2px;
  font-size: 0.62rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.popup-tag-region {
  background: #dbeafe;
  color: #1d4ed8;
}

.popup-label {
  font-size: 0.62rem;
  color: #78716c;
  display: block;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 600;
}

.popup-navigate {
  margin-top: 10px;
  padding: 8px;
  background: #fafaf9;
  border: 1px solid #e7e5e4;
  border-radius: 2px;
  text-align: center;
}

.navigate-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.nav-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.nav-gmaps:hover { border-color: #4285F4; background: #e8f0fe; }
.nav-waze:hover { border-color: #33CCFF; background: #e6f9ff; }
.nav-apple:hover { border-color: #555; background: #f5f5f5; }

.popup-section {
  margin-top: 12px;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  margin-bottom: 8px;
}

.scroll-list {
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 10px;
}

.list-item {
  background: #f9fafb;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 6px;
}

.item-text {
  font-size: 0.85rem;
  color: #374151;
  line-height: 1.4;
  margin-top: 4px;
}

.rating-item-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rating-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.rating-user {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.78rem;
  font-weight: 600;
  color: #374151;
}

.empty-note {
  font-size: 0.85rem;
  color: #9ca3af;
  font-style: italic;
  padding: 8px 0;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.comment-date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.rating-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: #fafaf9;
  border: 1px solid #e7e5e4;
  border-radius: 2px;
}

.rating-form .popup-label {
  margin-bottom: 0;
}

.rating-tier-buttons {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.rating-tier-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e7e5e4;
  border-radius: 2px;
  background: white;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
  color: #57534e;
  transition: all 0.2s ease;
}

.rating-tier-btn:hover { border-color: #1c1917; color: #1c1917; }
.rating-tier-btn.active { border-color: #1c1917; color: #374151; }
.rating-tier-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.rating-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.popup-input {
  width: 100%;
  min-height: 44px;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  /* 16px prevents iOS Safari from auto-zooming the viewport on focus. */
  font-size: 16px;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}

@media (min-width: 640px) {
  .popup-input { font-size: 0.85rem; }
}

.popup-input:focus {
  outline: none;
  border-color: #1c1917;
}

.popup-submit-btn {
  background: #1c1917;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 2px;
  font-size: 0.7rem;
  cursor: pointer;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.popup-submit-btn:hover { background: #44403c; }
.popup-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.popup-delete-btn {
  font-size: 0.7rem;
  color: #ef4444;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
}

.popup-delete-btn:hover { text-decoration: underline; }
.popup-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.popup-votes {
  margin-top: 12px;
  padding: 10px;
  background: #fafaf9;
  border: 1px solid #e7e5e4;
  border-radius: 2px;
  text-align: center;
}

.popup-votes .popup-label {
  margin-bottom: 8px;
}

.votes-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.vote-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid #e7e5e4;
  border-radius: 2px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.78rem;
  color: #57534e;
}

.vote-btn:hover { border-color: #1c1917; color: #1c1917; }
.vote-btn:disabled { opacity: 0.6; pointer-events: none; }

.vote-btn.vote-up.active {
  border-color: #1c1917;
  background: #1c1917;
  color: #ffffff;
}

.vote-btn.vote-down.active {
  border-color: #1c1917;
  background: #ffffff;
  color: #1c1917;
}

.vote-icon { font-size: 1rem; }

.vote-count {
  font-weight: 600;
  color: #374151;
  min-width: 16px;
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>
