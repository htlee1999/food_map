<template>
  <Card
    class="p-4 mb-3 cursor-pointer transition-all hover:shadow-lg"
    @click="$emit('focus-place', place)"
  >
    <div class="space-y-2">
      <div class="font-semibold text-foreground">{{ place.name }}</div>
      <div class="text-sm text-muted-foreground">{{ place.address }}</div>
    </div>
  </Card>
</template>

<script>
import Card from './ui/card.vue'

export default {
  name: 'PlaceItem',
  components: {
    Card,
  },
  props: {
    place: {
      type: Object,
      required: true,
    },
  },
  emits: ['focus-place'],
  setup() {
    return {}
  },
}
</script>
