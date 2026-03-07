<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'
import { parseMaps } from '@/services/parsers'
import { useServerStore } from '@/stores/server'

const store = useServerStore()
const mapImages = ref<Record<string, string>>({})
const allMaps = ref<string[]>([])
const loading = ref(true)
const error = ref('')
const uploading = ref<string | null>(null)
const search = ref('')
const currentPage = ref(1)
const perPage = 9

const filteredMaps = computed(() => {
  if (!search.value) return allMaps.value
  const q = search.value.toLowerCase()
  return allMaps.value.filter((m) => m.toLowerCase().includes(q))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredMaps.value.length / perPage)))

const paginatedMaps = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filteredMaps.value.slice(start, start + perPage)
})

// Reset to page 1 when search changes
function onSearch() {
  currentPage.value = 1
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [imgs, mapsHtml] = await Promise.all([
      api.getMapImages(),
      api.fetchPage('defaults_maps', { GameType: store.defaultsGameType }),
    ])
    mapImages.value = imgs
    const mapsData = parseMaps(mapsHtml)
    // Combine excluded + included to get ALL maps
    const combined = [
      ...mapsData.includedMaps.map((m) => m.label),
      ...mapsData.excludedMaps.map((m) => m.label),
    ]
    allMaps.value = combined.sort().filter((m) => m !== '*** None ***' && m !== 'KF-Menu')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function triggerUpload(mapName: string) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/jpeg,image/png,image/webp'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    uploading.value = mapName
    error.value = ''
    try {
      const path = await api.uploadMapImage(mapName, file)
      mapImages.value[mapName] = path
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      uploading.value = null
    }
  }
  input.click()
}

async function deleteImage(mapName: string) {
  uploading.value = mapName
  error.value = ''
  try {
    await api.deleteMapImage(mapName)
    delete mapImages.value[mapName]
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    uploading.value = null
  }
}

function imageUrl(path: string): string {
  return '/map-api' + path
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-['Orbitron'] font-bold text-white mb-2">
      <i class="ri-gallery-line text-red-500 mr-2"></i>Map Images
      <span v-if="!loading" class="text-gray-500 font-normal text-base ml-2">({{ allMaps.length }})</span>
    </h1>
    <p class="text-gray-400 text-sm mb-4">
      Upload preview screenshots for maps. These will be shown on the Overview page.
    </p>

    <!-- Search -->
    <div v-if="!loading && allMaps.length > 0" class="mb-4">
      <div class="relative max-w-sm">
        <i class="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></i>
        <input
          v-model="search"
          @input="onSearch"
          type="text"
          placeholder="Search maps..."
          class="w-full bg-[#1a1a1a] border border-red-900/30 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-600/60 transition-colors"
        />
        <button
          v-if="search"
          @click="search = ''; onSearch()"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
        >
          <i class="ri-close-line"></i>
        </button>
      </div>
      <p v-if="search" class="text-gray-500 text-xs mt-1.5">
        {{ filteredMaps.length }} map{{ filteredMaps.length !== 1 ? 's' : '' }} found
      </p>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 flex items-center gap-3">
        <i class="ri-loader-4-line animate-spin text-xl"></i>
        <span>Loading maps...</span>
      </div>
    </div>

    <div v-else-if="error && allMaps.length === 0" class="bg-red-900/20 border border-red-900/40 rounded-lg p-4 text-red-400">
      <i class="ri-error-warning-line mr-2"></i>{{ error }}
    </div>

    <div v-else>
      <!-- No results -->
      <div v-if="filteredMaps.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-500">
        <i class="ri-map-pin-line text-4xl mb-2"></i>
        <p class="text-sm">No maps matching "{{ search }}"</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="mapName in paginatedMaps"
          :key="mapName"
          class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg overflow-hidden group"
        >
          <!-- Image preview or placeholder -->
          <div class="relative aspect-square bg-gradient-to-br from-gray-900 to-black overflow-hidden">
            <img
              v-if="mapImages[mapName]"
              :src="imageUrl(mapImages[mapName]!)"
              :alt="mapName"
              class="w-full h-full object-cover"
            />
            <div v-else class="flex items-center justify-center h-full">
              <div class="text-center">
                <i class="ri-image-add-fill text-3xl text-gray-700 mb-1 block"></i>
                <span class="text-gray-600 text-xs">No image</span>
              </div>
            </div>
            <!-- Overlay on hover -->
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                @click="triggerUpload(mapName)"
                :disabled="uploading === mapName"
                class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <i class="ri-upload-2-line"></i>
                {{ mapImages[mapName] ? 'Replace' : 'Upload' }}
              </button>
              <button
                v-if="mapImages[mapName]"
                @click="deleteImage(mapName)"
                :disabled="uploading === mapName"
                class="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <i class="ri-delete-bin-line"></i>
              </button>
            </div>
            <i v-if="uploading === mapName" class="ri-loader-4-line animate-spin text-white text-xl absolute top-2 right-2"></i>
          </div>
          <!-- Map name -->
          <div class="px-4 py-3 flex items-center justify-between">
            <span class="text-white font-medium text-sm">{{ mapName }}</span>
            <span
              v-if="mapImages[mapName]"
              class="text-green-500 text-xs flex items-center gap-1"
            >
              <i class="ri-check-line"></i>Has image
            </span>
            <span v-else class="text-gray-600 text-xs">No image</span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-1.5 mt-6">
        <button
          @click="currentPage = 1"
          :disabled="currentPage === 1"
          class="px-2 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="First page"
        >
          <i class="ri-skip-back-mini-line"></i>
        </button>
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="px-2 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <i class="ri-arrow-left-s-line"></i>
        </button>

        <template v-for="page in totalPages" :key="page">
          <button
            v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
            @click="currentPage = page"
            :class="[
              'min-w-[32px] px-2 py-1.5 rounded text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5',
            ]"
          >
            {{ page }}
          </button>
          <span
            v-else-if="page === 2 && currentPage > 3 || page === totalPages - 1 && currentPage < totalPages - 2"
            class="text-gray-600 px-1"
          >...</span>
        </template>

        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="px-2 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <i class="ri-arrow-right-s-line"></i>
        </button>
        <button
          @click="currentPage = totalPages"
          :disabled="currentPage === totalPages"
          class="px-2 py-1.5 rounded text-sm text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Last page"
        >
          <i class="ri-skip-forward-mini-line"></i>
        </button>
      </div>

      <div v-if="error" class="mt-4 text-red-400 text-sm">
        <i class="ri-error-warning-line mr-1"></i>{{ error }}
      </div>

      <p class="text-gray-600 text-xs mt-4">
        <i class="ri-information-line mr-1"></i>
        Supported formats: JPG, PNG, WebP. Max size: 5MB.
      </p>
    </div>
  </div>
</template>
