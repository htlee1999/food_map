<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] sm:p-4"
    @click="$emit('close')"
  >
    <div
      class="bg-white sm:rounded-xl rounded-t-2xl shadow-xl w-full sm:w-[90%] max-w-2xl max-h-[92vh] sm:max-h-[80vh] flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="flex justify-between items-center px-6 py-4 border-b border-slate-200">
        <h2 class="text-lg font-semibold text-slate-900">Admin Settings</h2>
        <button
          @click="$emit('close')"
          class="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-slate-200">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="activeTab === tab.id ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'"
          class="px-6 py-3 text-sm font-medium border-b-2 transition-colors"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Cuisines Tab -->
        <div v-if="activeTab === 'cuisines'" class="space-y-4">
          <div class="flex gap-2">
            <input
              v-model="newCuisine"
              placeholder="New cuisine name..."
              class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
              @keyup.enter="handleAddCuisine"
            />
            <button
              @click="handleAddCuisine"
              :disabled="!newCuisine.trim()"
              class="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
          <p class="text-xs text-slate-500">Drag cuisines or use arrows to reorder. Order affects sidebar display.</p>
          <div class="space-y-2">
            <div
              v-for="(cuisine, index) in cuisines"
              :key="cuisine.id"
              class="flex items-center gap-2 p-3 bg-slate-50 rounded-lg group"
            >
              <!-- Reorder buttons -->
              <div class="flex flex-col gap-0.5">
                <button
                  @click="handleMoveCuisine(index, 'up')"
                  :disabled="index === 0 || reordering"
                  class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                  </svg>
                </button>
                <button
                  @click="handleMoveCuisine(index, 'down')"
                  :disabled="index === cuisines.length - 1 || reordering"
                  class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>
              <!-- Order number -->
              <span class="w-6 h-6 flex items-center justify-center bg-slate-200 text-slate-600 rounded text-xs font-medium">
                {{ index + 1 }}
              </span>
              <!-- Cuisine name (editable) -->
              <input
                v-model="cuisine.name"
                class="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
              />
              <!-- Save button -->
              <button
                @click="handleUpdateCuisine(cuisine)"
                class="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
              >
                Save
              </button>
              <!-- Delete button -->
              <button
                @click="handleDeleteCuisine(cuisine.id)"
                class="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Tags Tab -->
        <div v-if="activeTab === 'tags'" class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Select Cuisine</label>
            <select
              v-model="selectedCuisineId"
              class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
            >
              <option value="">Choose a cuisine...</option>
              <option v-for="cuisine in cuisines" :key="cuisine.id" :value="cuisine.id">
                {{ cuisine.name }}
              </option>
            </select>
          </div>

          <div v-if="selectedCuisineId" class="space-y-4">
            <div class="flex gap-2">
              <input
                v-model="newTag"
                placeholder="New tag name..."
                class="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                @keyup.enter="handleAddTag"
              />
              <button
                @click="handleAddTag"
                :disabled="!newTag.trim()"
                class="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="tag in cuisineTags"
                :key="tag.id"
                class="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full"
              >
                <span class="text-sm text-slate-700">{{ tag.name }}</span>
                <button
                  @click="handleDeleteTag(tag.id)"
                  class="text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div v-if="cuisineTags.length === 0" class="text-sm text-slate-400">
                No tags yet. Add some above.
              </div>
            </div>
          </div>
        </div>

        <!-- Tiers Tab -->
        <div v-if="activeTab === 'tiers'" class="space-y-4">
          <!-- Add New Tier -->
          <div class="p-4 border border-dashed border-slate-300 rounded-lg space-y-3">
            <h3 class="text-sm font-medium text-slate-700">Add New Tier</h3>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-slate-500">Code (e.g., B+, B-)</label>
                <input
                  v-model="newTier.code"
                  placeholder="B+"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label class="text-xs text-slate-500">Sort Order</label>
                <input
                  v-model.number="newTier.sort_order"
                  type="number"
                  placeholder="0"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>
            <div>
              <label class="text-xs text-slate-500">Description</label>
              <input
                v-model="newTier.description"
                placeholder="Rating description..."
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-slate-500">Badge Color Class</label>
                <select
                  v-model="newTier.color_class"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                >
                  <option value="bg-pink-100 text-pink-700 border border-pink-200">Pink</option>
                  <option value="bg-emerald-100 text-emerald-700 border border-emerald-200">Emerald</option>
                  <option value="bg-amber-100 text-amber-700 border border-amber-200">Amber</option>
                  <option value="bg-orange-100 text-orange-700 border border-orange-200">Orange</option>
                  <option value="bg-rose-100 text-rose-700 border border-rose-200">Rose</option>
                  <option value="bg-slate-100 text-slate-700 border border-slate-200">Slate</option>
                  <option value="bg-blue-100 text-blue-700 border border-blue-200">Blue</option>
                  <option value="bg-purple-100 text-purple-700 border border-purple-200">Purple</option>
                  <option value="bg-cyan-100 text-cyan-700 border border-cyan-200">Cyan</option>
                  <option value="bg-lime-100 text-lime-700 border border-lime-200">Lime</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-slate-500">Marker Color</label>
                <input
                  v-model="newTier.color_hex"
                  type="color"
                  class="w-full h-[38px] px-1 py-1 border border-slate-200 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            <button
              @click="handleAddTier"
              :disabled="!newTier.code.trim()"
              class="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Add Tier
            </button>
          </div>

          <!-- Existing Tiers -->
          <p class="text-xs text-slate-500">Use arrows to reorder tiers. Order affects dropdowns and display.</p>
          <div
            v-for="(tier, index) in tiers"
            :key="tier.id"
            class="p-4 border border-slate-200 rounded-lg"
          >
            <div class="flex items-center gap-3">
              <!-- Reorder buttons -->
              <div class="flex flex-col gap-0.5">
                <button
                  @click="handleMoveTier(index, 'up')"
                  :disabled="index === 0 || reorderingTiers"
                  class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move up"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                  </svg>
                </button>
                <button
                  @click="handleMoveTier(index, 'down')"
                  :disabled="index === tiers.length - 1 || reorderingTiers"
                  class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Move down"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
              </div>
              <span
                :class="tier.color_class"
                class="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
              >
                {{ tier.code }}
              </span>
              <div class="flex-1">
                <input
                  v-model="tier.description"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                  placeholder="Tier description..."
                />
              </div>
              <button
                @click="handleUpdateTier(tier)"
                class="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                Save
              </button>
              <button
                @click="handleDeleteTier(tier.id)"
                class="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                title="Delete tier"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Methodology Tab -->
        <div v-if="activeTab === 'methodology'" class="space-y-4">
          <div v-if="methodologyLoading" class="text-center text-slate-400 py-8">
            Loading...
          </div>
          <template v-else>
            <p class="text-xs text-slate-500">
              Add headers and body sections to create your methodology/disclaimer content.
              Use arrows to reorder sections.
            </p>

            <!-- Add Section Buttons -->
            <div class="flex gap-2">
              <button
                @click="addSection('header')"
                class="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                + Add Header
              </button>
              <button
                @click="addSection('body')"
                class="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                + Add Body
              </button>
            </div>

            <!-- Sections List -->
            <div v-if="methodology.sections.length === 0" class="text-center text-slate-400 py-8">
              No sections yet. Add a header or body section above.
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="(section, index) in methodology.sections"
                :key="index"
                class="p-4 border border-slate-200 rounded-lg"
              >
                <div class="flex items-start gap-3">
                  <!-- Reorder buttons -->
                  <div class="flex flex-col gap-0.5 pt-1">
                    <button
                      @click="moveSection(index, 'up')"
                      :disabled="index === 0"
                      class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>
                      </svg>
                    </button>
                    <button
                      @click="moveSection(index, 'down')"
                      :disabled="index === methodology.sections.length - 1"
                      class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                  </div>

                  <!-- Type badge -->
                  <div class="flex-shrink-0">
                    <span
                      :class="section.type === 'header' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'"
                      class="px-2 py-1 rounded text-xs font-medium"
                    >
                      {{ section.type === 'header' ? 'Header' : 'Body' }}
                    </span>
                  </div>

                  <!-- Content textarea -->
                  <div class="flex-1">
                    <textarea
                      v-model="section.content"
                      :placeholder="section.type === 'header' ? 'Section heading...' : 'Body text...'"
                      :rows="section.type === 'header' ? 1 : 3"
                      class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 resize-none"
                    ></textarea>
                  </div>

                  <!-- Delete button -->
                  <button
                    @click="removeSection(index)"
                    class="p-2 text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0"
                    title="Delete section"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Save Button -->
            <button
              @click="handleSaveMethodology"
              :disabled="methodologySaving"
              class="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {{ methodologySaving ? 'Saving...' : 'Save Methodology' }}
            </button>
          </template>
        </div>

        <!-- Blog Tab -->
        <div v-if="activeTab === 'blog'" class="space-y-4">
          <!-- List view -->
          <template v-if="!blogEditing">
            <div class="flex justify-between items-center">
              <p class="text-xs text-slate-500">Manage blog posts shown in the Blog modal.</p>
              <button
                @click="startNewBlog"
                class="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                + New Post
              </button>
            </div>

            <div v-if="blogLoading" class="text-center text-slate-400 py-8">Loading...</div>
            <div v-else-if="blogPosts.length === 0" class="text-center text-slate-400 py-8">
              No posts yet. Create one above.
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="post in blogPosts"
                :key="post.id"
                class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
              >
                <div
                  class="w-12 h-12 rounded bg-slate-200 flex-shrink-0 bg-cover bg-center"
                  :style="post.hero ? `background-image:url('${post.hero}')` : ''"
                ></div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-slate-900 truncate">{{ post.title }}</div>
                  <div class="text-xs text-slate-500 truncate">
                    {{ post.location || '—' }} • {{ formatDate(post.created_at) }}
                  </div>
                </div>
                <button
                  @click="startEditBlog(post)"
                  class="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  @click="handleDeleteBlog(post.id)"
                  class="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Delete post"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </template>

          <!-- Edit view -->
          <template v-else>
            <div class="flex justify-between items-center">
              <button
                @click="cancelBlogEdit"
                class="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to posts
              </button>
              <span class="text-xs text-slate-500">
                {{ blogForm.id ? `Editing #${blogForm.id}` : 'New post' }}
              </span>
            </div>

            <!-- Basic fields -->
            <div class="space-y-3">
              <div>
                <label class="text-xs text-slate-500">Title *</label>
                <input
                  v-model="blogForm.title"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                  placeholder="Post title"
                />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-slate-500">Location</label>
                  <input
                    v-model="blogForm.location"
                    class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                    placeholder="e.g., Katong"
                  />
                </div>
                <div>
                  <label class="text-xs text-slate-500">Rating</label>
                  <input
                    v-model="blogForm.rating"
                    class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                    placeholder="🍔🍔🍔🍔🤍"
                  />
                </div>
              </div>
              <div>
                <label class="text-xs text-slate-500">Hero image URL</label>
                <input
                  v-model="blogForm.hero"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label class="text-xs text-slate-500">Hero caption</label>
                <input
                  v-model="blogForm.content.heroCaption"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                  placeholder="Short caption under hero image"
                />
              </div>
              <div>
                <label class="text-xs text-slate-500">Summary (shown in list)</label>
                <textarea
                  v-model="blogForm.summary"
                  rows="2"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 resize-none"
                  placeholder="One-line teaser"
                ></textarea>
              </div>
            </div>

            <!-- Stats -->
            <div class="space-y-2 border-t pt-4">
              <div class="flex justify-between items-center">
                <h4 class="text-sm font-medium text-slate-700">Quick Summary stats</h4>
                <button
                  @click="addBlogStat"
                  class="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  + Add stat
                </button>
              </div>
              <div
                v-for="(stat, i) in blogForm.content.stats"
                :key="`stat-${i}`"
                class="flex gap-2 items-center"
              >
                <input
                  v-model="stat.label"
                  placeholder="Label (e.g., Price)"
                  class="w-1/3 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-slate-400"
                />
                <input
                  v-model="stat.value"
                  placeholder="Value (e.g., $$)"
                  class="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-slate-400"
                />
                <button @click="blogForm.content.stats.splice(i, 1)" class="text-slate-400 hover:text-rose-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Experience -->
            <div class="space-y-2 border-t pt-4">
              <div class="flex justify-between items-center">
                <h4 class="text-sm font-medium text-slate-700">The Experience</h4>
                <button
                  @click="addBlogExperience"
                  class="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  + Add item
                </button>
              </div>
              <div
                v-for="(item, i) in blogForm.content.experience"
                :key="`exp-${i}`"
                class="flex gap-2 items-start"
              >
                <select
                  v-model="item.type"
                  class="px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-slate-400"
                >
                  <option value="pro">Pro</option>
                  <option value="tip">Tip</option>
                </select>
                <input
                  v-model="item.heading"
                  placeholder="Heading"
                  class="w-1/3 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-slate-400"
                />
                <input
                  v-model="item.body"
                  placeholder="Body"
                  class="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-slate-400"
                />
                <button @click="blogForm.content.experience.splice(i, 1)" class="text-slate-400 hover:text-rose-500 mt-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Gallery -->
            <div class="space-y-2 border-t pt-4">
              <div class="flex justify-between items-center">
                <h4 class="text-sm font-medium text-slate-700">Food gallery</h4>
                <button
                  @click="addBlogGallery"
                  class="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  + Add item
                </button>
              </div>
              <div
                v-for="(item, i) in blogForm.content.gallery"
                :key="`gal-${i}`"
                class="space-y-2 p-3 bg-slate-50 rounded-lg"
              >
                <div class="flex gap-2">
                  <input
                    v-model="item.name"
                    placeholder="Item name"
                    class="w-1/3 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-slate-400"
                  />
                  <input
                    v-model="item.image"
                    placeholder="Image URL"
                    class="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-slate-400"
                  />
                  <button @click="blogForm.content.gallery.splice(i, 1)" class="text-slate-400 hover:text-rose-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <textarea
                  v-model="item.notes"
                  rows="2"
                  placeholder="Notes"
                  class="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-slate-400 resize-none"
                ></textarea>
              </div>
            </div>

            <!-- Verdict -->
            <div class="space-y-3 border-t pt-4">
              <h4 class="text-sm font-medium text-slate-700">Final Verdict</h4>
              <div>
                <label class="text-xs text-slate-500">Verdict quote</label>
                <textarea
                  v-model="blogForm.content.verdictQuote"
                  rows="2"
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 resize-none"
                  placeholder="A short quote summarizing your verdict"
                ></textarea>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-slate-500">Would I go back?</label>
                  <input
                    v-model="blogForm.content.wouldReturn"
                    class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                    placeholder="e.g., Absolutely Yes"
                  />
                </div>
                <div>
                  <label class="text-xs text-slate-500">Best for</label>
                  <input
                    v-model="blogForm.content.bestFor"
                    class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400"
                    placeholder="e.g., Weekend Lunch"
                  />
                </div>
              </div>
            </div>

            <button
              @click="handleSaveBlog"
              :disabled="blogSaving || !blogForm.title.trim()"
              class="w-full px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              {{ blogSaving ? 'Saving...' : (blogForm.id ? 'Update Post' : 'Create Post') }}
            </button>
          </template>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
        <p class="text-xs text-slate-500">
          Changes are saved automatically to the database.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useConfig } from '../composables/useConfig'
import { useMethodology } from '../composables/useMethodology'
import { useBlog } from '../composables/useBlog'
import { configApi } from '../services/api'

const emptyBlogForm = () => ({
  id: null,
  title: '',
  location: '',
  hero: '',
  summary: '',
  rating: '',
  content: {
    heroCaption: '',
    stats: [],
    experience: [],
    gallery: [],
    verdictQuote: '',
    wouldReturn: '',
    bestFor: '',
  },
})

export default {
  name: 'AdminPanel',
  props: {
    isOpen: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close'],
  setup() {
    const {
      cuisines,
      tags,
      tiers,
      addCuisine,
      updateCuisine,
      deleteCuisine,
      addTag,
      deleteTag,
      addTier,
      updateTier,
      deleteTier,
      refreshConfig,
    } = useConfig()

    const tabs = [
      { id: 'cuisines', label: 'Cuisines' },
      { id: 'tags', label: 'Tags' },
      { id: 'tiers', label: 'Tiers' },
      { id: 'methodology', label: 'Methodology' },
      { id: 'blog', label: 'Blog' },
    ]

    const activeTab = ref('cuisines')
    const newCuisine = ref('')
    const newTag = ref('')
    const selectedCuisineId = ref('')
    const reordering = ref(false)
    const reorderingTiers = ref(false)
    const newTier = ref({
      code: '',
      description: '',
      color_class: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      color_hex: '#86efac',
      sort_order: 0,
    })

    // Methodology
    const {
      methodology,
      loading: methodologyLoading,
      loadMethodology,
      saveMethodology,
      addSection,
      removeSection,
      moveSection,
    } = useMethodology()

    const methodologySaving = ref(false)

    // Blog
    const {
      posts: blogPosts,
      loading: blogLoading,
      loadPosts: loadBlogPosts,
      getPost: getBlogPost,
      createPost: createBlogPost,
      updatePost: updateBlogPost,
      deletePost: deleteBlogPost,
    } = useBlog()

    const blogEditing = ref(false)
    const blogSaving = ref(false)
    const blogForm = ref(emptyBlogForm())

    // Load tab data on switch
    watch(activeTab, (newTab) => {
      if (newTab === 'methodology') {
        loadMethodology(true)
      } else if (newTab === 'blog') {
        loadBlogPosts(true)
      }
    })

    const startNewBlog = () => {
      blogForm.value = emptyBlogForm()
      blogEditing.value = true
    }

    const startEditBlog = async (post) => {
      try {
        const full = await getBlogPost(post.id)
        const c = full.content || {}
        blogForm.value = {
          id: full.id,
          title: full.title || '',
          location: full.location || '',
          hero: full.hero || '',
          summary: full.summary || '',
          rating: full.rating || '',
          content: {
            heroCaption: c.heroCaption || '',
            stats: Array.isArray(c.stats) ? c.stats.map((s) => ({ ...s })) : [],
            experience: Array.isArray(c.experience) ? c.experience.map((e) => ({ ...e })) : [],
            gallery: Array.isArray(c.gallery) ? c.gallery.map((g) => ({ ...g })) : [],
            verdictQuote: c.verdictQuote || '',
            wouldReturn: c.wouldReturn || '',
            bestFor: c.bestFor || '',
          },
        }
        blogEditing.value = true
      } catch (error) {
        alert('Failed to load post: ' + (error.response?.data?.error || error.message))
      }
    }

    const cancelBlogEdit = () => {
      blogEditing.value = false
      blogForm.value = emptyBlogForm()
    }

    const addBlogStat = () => {
      blogForm.value.content.stats.push({ label: '', value: '' })
    }

    const addBlogExperience = () => {
      blogForm.value.content.experience.push({ type: 'pro', heading: '', body: '' })
    }

    const addBlogGallery = () => {
      blogForm.value.content.gallery.push({ name: '', image: '', notes: '' })
    }

    const handleSaveBlog = async () => {
      if (!blogForm.value.title.trim()) return
      blogSaving.value = true
      try {
        const payload = {
          title: blogForm.value.title.trim(),
          location: blogForm.value.location.trim() || null,
          hero: blogForm.value.hero.trim() || null,
          summary: blogForm.value.summary.trim() || null,
          rating: blogForm.value.rating.trim() || null,
          content: blogForm.value.content,
        }
        if (blogForm.value.id) {
          await updateBlogPost(blogForm.value.id, payload)
        } else {
          await createBlogPost(payload)
        }
        cancelBlogEdit()
      } catch (error) {
        alert('Failed to save post: ' + (error.response?.data?.error || error.message))
      } finally {
        blogSaving.value = false
      }
    }

    const handleDeleteBlog = async (id) => {
      if (!confirm('Delete this blog post? This cannot be undone.')) return
      try {
        await deleteBlogPost(id)
      } catch (error) {
        alert('Failed to delete post: ' + (error.response?.data?.error || error.message))
      }
    }

    const formatDate = (iso) => {
      if (!iso) return ''
      return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const handleSaveMethodology = async () => {
      methodologySaving.value = true
      try {
        await saveMethodology()
        alert('Methodology saved successfully!')
      } catch (error) {
        alert('Failed to save methodology: ' + (error.response?.data?.error || error.message))
      } finally {
        methodologySaving.value = false
      }
    }

    // Get tags for selected cuisine
    const cuisineTags = computed(() => {
      if (!selectedCuisineId.value) return []
      return tags.value.filter(t => t.cuisine_id === parseInt(selectedCuisineId.value))
    })

    const handleAddCuisine = async () => {
      if (!newCuisine.value.trim()) return
      try {
        await addCuisine(newCuisine.value.trim())
        newCuisine.value = ''
      } catch (error) {
        alert('Failed to add cuisine: ' + (error.response?.data?.error || error.message))
      }
    }

    const handleDeleteCuisine = async (id) => {
      if (!confirm('Are you sure? This will also delete all tags for this cuisine.')) return
      try {
        await deleteCuisine(id)
      } catch (error) {
        alert('Failed to delete cuisine: ' + (error.response?.data?.error || error.message))
      }
    }

    const handleUpdateCuisine = async (cuisine) => {
      if (!cuisine.name.trim()) {
        alert('Cuisine name cannot be empty')
        return
      }
      try {
        await updateCuisine(cuisine.id, { name: cuisine.name.trim() })
      } catch (error) {
        alert('Failed to update cuisine: ' + (error.response?.data?.error || error.message))
      }
    }

    const handleMoveCuisine = async (index, direction) => {
      if (reordering.value) return

      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= cuisines.value.length) return

      const currentCuisine = cuisines.value[index]
      const targetCuisine = cuisines.value[newIndex]

      reordering.value = true
      try {
        await Promise.all([
          configApi.updateCuisine(currentCuisine.id, { sort_order: newIndex }),
          configApi.updateCuisine(targetCuisine.id, { sort_order: index }),
        ])
        await refreshConfig()
      } catch (error) {
        alert('Failed to reorder: ' + (error.response?.data?.error || error.message))
      } finally {
        reordering.value = false
      }
    }

    const handleMoveTier = async (index, direction) => {
      if (reorderingTiers.value) return

      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= tiers.value.length) return

      const currentTier = tiers.value[index]
      const targetTier = tiers.value[newIndex]

      reorderingTiers.value = true
      try {
        await Promise.all([
          configApi.updateTier(currentTier.id, { sort_order: newIndex }),
          configApi.updateTier(targetTier.id, { sort_order: index }),
        ])
        await refreshConfig()
      } catch (error) {
        alert('Failed to reorder: ' + (error.response?.data?.error || error.message))
      } finally {
        reorderingTiers.value = false
      }
    }

    const handleAddTag = async () => {
      if (!newTag.value.trim() || !selectedCuisineId.value) return
      try {
        await addTag(selectedCuisineId.value, newTag.value.trim())
        newTag.value = ''
      } catch (error) {
        alert('Failed to add tag: ' + (error.response?.data?.error || error.message))
      }
    }

    const handleDeleteTag = async (id) => {
      try {
        await deleteTag(id)
      } catch (error) {
        alert('Failed to delete tag: ' + (error.response?.data?.error || error.message))
      }
    }

    const handleAddTier = async () => {
      if (!newTier.value.code.trim()) return
      try {
        await addTier({
          code: newTier.value.code.trim(),
          description: newTier.value.description.trim(),
          color_class: newTier.value.color_class,
          color_hex: newTier.value.color_hex,
          sort_order: newTier.value.sort_order || 0,
        })
        // Reset form
        newTier.value = {
          code: '',
          description: '',
          color_class: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
          color_hex: '#86efac',
          sort_order: 0,
        }
      } catch (error) {
        alert('Failed to add tier: ' + (error.response?.data?.error || error.message))
      }
    }

    const handleUpdateTier = async (tier) => {
      try {
        await updateTier(tier.id, { description: tier.description })
        alert('Tier updated!')
      } catch (error) {
        alert('Failed to update tier: ' + (error.response?.data?.error || error.message))
      }
    }

    const handleDeleteTier = async (id) => {
      if (!confirm('Are you sure you want to delete this tier?')) return
      try {
        await deleteTier(id)
      } catch (error) {
        alert('Failed to delete tier: ' + (error.response?.data?.error || error.message))
      }
    }

    return {
      tabs,
      activeTab,
      cuisines,
      tiers,
      newCuisine,
      newTag,
      newTier,
      selectedCuisineId,
      cuisineTags,
      reordering,
      reorderingTiers,
      handleAddCuisine,
      handleUpdateCuisine,
      handleDeleteCuisine,
      handleMoveCuisine,
      handleAddTag,
      handleDeleteTag,
      handleAddTier,
      handleUpdateTier,
      handleDeleteTier,
      handleMoveTier,
      // Methodology
      methodology,
      methodologyLoading,
      methodologySaving,
      addSection,
      removeSection,
      moveSection,
      handleSaveMethodology,
      // Blog
      blogPosts,
      blogLoading,
      blogEditing,
      blogSaving,
      blogForm,
      startNewBlog,
      startEditBlog,
      cancelBlogEdit,
      addBlogStat,
      addBlogExperience,
      addBlogGallery,
      handleSaveBlog,
      handleDeleteBlog,
      formatDate,
    }
  },
}
</script>
