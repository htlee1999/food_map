<template>
  <div class="grid grid-cols-2 gap-4">
    <div class="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4 text-center shadow-sm">
      <div class="text-3xl font-bold text-green-700 mb-1">{{ visitedCount }}</div>
      <div class="text-sm font-medium text-green-600 flex items-center justify-center">
        <span class="mr-1">✅</span>
        Visited
      </div>
    </div>
    <div class="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4 text-center shadow-sm">
      <div class="text-3xl font-bold text-blue-700 mb-1">{{ wantToVisitCount }}</div>
      <div class="text-sm font-medium text-blue-600 flex items-center justify-center">
        <span class="mr-1">⭐</span>
        Want to Visit
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatsCard',
  props: {
    visitedCount: {
      type: Number,
      default: 0
    },
    wantToVisitCount: {
      type: Number,
      default: 0
    }
  }
}
</script>

