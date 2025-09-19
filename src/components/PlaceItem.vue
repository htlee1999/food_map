<template>
  <Card 
    :class="[
      'p-4 mb-3 cursor-pointer transition-all hover:shadow-lg',
      placeClass
    ]"
    @click="$emit('focus-place', place)"
  >
    <div class="space-y-2">
      <div class="font-semibold text-foreground">{{ place.name }}</div>
      <div class="text-sm text-muted-foreground">{{ place.address }}</div>
      <div class="flex gap-2 flex-wrap">
        <Button 
          size="sm" 
          variant="default"
          @click.stop="$emit('mark-visited', place.id)"
          class="text-xs"
        >
          ✓ Visited
        </Button>
        <Button 
          size="sm" 
          variant="secondary"
          @click.stop="$emit('mark-want-to-visit', place.id)"
          class="text-xs"
        >
          ⭐ Want to Visit
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          @click.stop="$emit('clear-status', place.id)"
          class="text-xs"
        >
          Clear
        </Button>
      </div>
    </div>
  </Card>
</template>

<script>
import { computed } from 'vue'
import Card from './ui/card.vue'
import Button from './ui/button.vue'

export default {
  name: 'PlaceItem',
  components: {
    Card,
    Button
  },
  props: {
    place: {
      type: Object,
      required: true
    },
    isVisited: {
      type: Boolean,
      default: false
    },
    isWantToVisit: {
      type: Boolean,
      default: false
    }
  },
  emits: [
    'mark-visited',
    'mark-want-to-visit',
    'clear-status',
    'focus-place'
  ],
  setup(props) {
    const placeClass = computed(() => {
      if (props.isVisited) return 'border-l-4 border-l-green-500 bg-green-50'
      if (props.isWantToVisit) return 'border-l-4 border-l-orange-500 bg-orange-50'
      return ''
    })

    return {
      placeClass
    }
  }
}
</script>

