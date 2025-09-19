<template>
  <div class="places-list">
    <PlaceItem 
      v-for="place in places" 
      :key="place.id"
      :place="place"
      :is-visited="visitedPlaces.has(place.id)"
      :is-want-to-visit="wantToVisitPlaces.has(place.id)"
      @mark-visited="$emit('mark-visited', place.id)"
      @mark-want-to-visit="$emit('mark-want-to-visit', place.id)"
      @clear-status="$emit('clear-status', place.id)"
      @focus-place="$emit('focus-place', place)"
    />
    
    <div v-if="places.length === 0" class="place-item">
      <div class="place-name">No places found</div>
      <div class="place-address">Upload a CSV file to get started</div>
    </div>
  </div>
</template>

<script>
import PlaceItem from './PlaceItem.vue'

export default {
  name: 'PlaceList',
  components: {
    PlaceItem
  },
  props: {
    places: {
      type: Array,
      default: () => []
    },
    visitedPlaces: {
      type: Set,
      default: () => new Set()
    },
    wantToVisitPlaces: {
      type: Set,
      default: () => new Set()
    }
  },
  emits: [
    'mark-visited',
    'mark-want-to-visit',
    'clear-status',
    'focus-place'
  ]
}
</script>

<style scoped>
.places-list {
  padding: 0 20px 20px;
}

.place-item {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border-left: 4px solid transparent;
}

.place-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.place-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
  font-size: 0.95rem;
}

.place-address {
  color: #666;
  font-size: 0.85rem;
  line-height: 1.4;
  margin-bottom: 10px;
}
</style>
