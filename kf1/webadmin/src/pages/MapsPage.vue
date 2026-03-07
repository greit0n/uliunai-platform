<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { api } from '@/services/api'
import { parseMaps } from '@/services/parsers'
import { useServerStore } from '@/stores/server'
import type { MapsData, SelectOption } from '@/types'

const HIDDEN_MAPS = ['KF-Menu', '*** None ***']

const store = useServerStore()
const data = ref<MapsData | null>(null)
const loading = ref(true)
const error = ref('')
const selectedExcluded = ref<string[]>([])
const selectedIncluded = ref<string[]>([])
const mapImages = ref<Record<string, string>>({})

// Search & sort
const excludedSearch = ref('')
const includedSearch = ref('')
const excludedSortAsc = ref(true)
const includedSortAsc = ref<boolean | null>(null) // null = server order (no sort)

// Track the last clicked index in each list for shift+click range selection
const lastClickedExcludedIndex = ref<number | null>(null)
const lastClickedIncludedIndex = ref<number | null>(null)

// Drag-and-drop state
const dragSource = ref<'excluded' | 'included' | null>(null)
const dragIndex = ref<number | null>(null)
const dropTargetIndex = ref<number | null>(null)
const isDragging = ref(false)
const includedListEl = ref<HTMLElement | null>(null)
const dropTargetList = ref<'excluded' | 'included' | null>(null)
let scrollRAF: number | null = null

// Computed: the currently previewed map (last selected from either list)
const previewMap = ref<{ name: string; list: 'excluded' | 'included' } | null>(null)

const previewImageUrl = computed(() => {
  if (!previewMap.value) return null
  const name = previewMap.value.name
  const imgPath = mapImages.value[name]
  if (imgPath) return '/map-api' + imgPath
  return null
})

// Filter out hidden maps, apply search and sort
function filterAndSort(maps: SelectOption[], search: string, sortAsc: boolean | null): SelectOption[] {
  let result = maps.filter((m) => !HIDDEN_MAPS.includes(m.value) && !HIDDEN_MAPS.includes(m.label))
  if (search) {
    const q = search.toLowerCase()
    result = result.filter((m) => m.label.toLowerCase().includes(q))
  }
  if (sortAsc !== null) {
    result = [...result].sort((a, b) =>
      sortAsc ? a.label.localeCompare(b.label) : b.label.localeCompare(a.label),
    )
  }
  return result
}

const filteredExcluded = computed(() =>
  filterAndSort(data.value?.excludedMaps ?? [], excludedSearch.value, excludedSortAsc.value),
)

const filteredIncluded = computed(() =>
  filterAndSort(data.value?.includedMaps ?? [], includedSearch.value, includedSortAsc.value),
)

// Total counts (excluding hidden, before search filter)
const totalExcluded = computed(() =>
  (data.value?.excludedMaps ?? []).filter((m) => !HIDDEN_MAPS.includes(m.value) && !HIDDEN_MAPS.includes(m.label)).length,
)
const totalIncluded = computed(() =>
  (data.value?.includedMaps ?? []).filter((m) => !HIDDEN_MAPS.includes(m.value) && !HIDDEN_MAPS.includes(m.label)).length,
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const html = await api.fetchPage('defaults_maps', { GameType: store.defaultsGameType })
    data.value = parseMaps(html)
    store.updateServerInfo(data.value.serverInfo.mapName, data.value.serverInfo.gameType)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function loadMapImages() {
  try {
    mapImages.value = await api.getMapImages()
  } catch {
    // Silently fail — map previews are optional
  }
}

async function moveMap(action: string, moveCount?: number) {
  if (!data.value) return
  error.value = ''
  try {
    const formData: Record<string, string | string[]> = {
      GameType: store.defaultsGameType,
      Session: 'Session',
      MoveMap: action,
      MoveMapCount: String(moveCount ?? 1),
    }

    if (action === ' > ') {
      formData['ExcludeMapsSelect'] = [...selectedExcluded.value]
    } else if (action === ' < ') {
      formData['IncludeMapsSelect'] = [...selectedIncluded.value]
    } else if (action === 'Up' || action === 'Down') {
      if (selectedIncluded.value.length > 0) {
        formData['IncludeMapsSelect'] = [selectedIncluded.value[0]!]
      }
    }

    const html = await api.submitForm('defaults_maps', formData)
    data.value = parseMaps(html)
    selectedExcluded.value = []
    selectedIncluded.value = []

    // Sync to KillingFloor.ini so rotation survives server restarts
    const includedMapNames = data.value.includedMaps
      .filter((m) => !HIDDEN_MAPS.includes(m.value) && !HIDDEN_MAPS.includes(m.label))
      .map((m) => m.value)
    api.syncMaplist(store.defaultsGameType, includedMapNames).catch(() => {})
  } catch (e) {
    error.value = (e as Error).message
  }
}

function toggleExcludedSelection(value: string, event: MouseEvent) {
  const maps = filteredExcluded.value
  const clickedIndex = maps.findIndex((m) => m.value === value)

  if (event.shiftKey && lastClickedExcludedIndex.value !== null) {
    const start = Math.min(lastClickedExcludedIndex.value, clickedIndex)
    const end = Math.max(lastClickedExcludedIndex.value, clickedIndex)
    const rangeValues = maps.slice(start, end + 1).map((m) => m.value)

    if (event.ctrlKey || event.metaKey) {
      const merged = new Set([...selectedExcluded.value, ...rangeValues])
      selectedExcluded.value = [...merged]
    } else {
      selectedExcluded.value = rangeValues
    }
  } else if (event.ctrlKey || event.metaKey) {
    const idx = selectedExcluded.value.indexOf(value)
    if (idx >= 0) {
      selectedExcluded.value.splice(idx, 1)
    } else {
      selectedExcluded.value.push(value)
    }
    lastClickedExcludedIndex.value = clickedIndex
  } else {
    selectedExcluded.value = [value]
    lastClickedExcludedIndex.value = clickedIndex
  }

  const map = maps[clickedIndex]
  if (map) {
    previewMap.value = { name: map.label, list: 'excluded' }
  }
}

function toggleIncludedSelection(value: string, event: MouseEvent) {
  const maps = filteredIncluded.value
  const clickedIndex = maps.findIndex((m) => m.value === value)

  if (event.shiftKey && lastClickedIncludedIndex.value !== null) {
    const start = Math.min(lastClickedIncludedIndex.value, clickedIndex)
    const end = Math.max(lastClickedIncludedIndex.value, clickedIndex)
    const rangeValues = maps.slice(start, end + 1).map((m) => m.value)

    if (event.ctrlKey || event.metaKey) {
      const merged = new Set([...selectedIncluded.value, ...rangeValues])
      selectedIncluded.value = [...merged]
    } else {
      selectedIncluded.value = rangeValues
    }
  } else if (event.ctrlKey || event.metaKey) {
    const idx = selectedIncluded.value.indexOf(value)
    if (idx >= 0) {
      selectedIncluded.value.splice(idx, 1)
    } else {
      selectedIncluded.value.push(value)
    }
    lastClickedIncludedIndex.value = clickedIndex
  } else {
    selectedIncluded.value = [value]
    lastClickedIncludedIndex.value = clickedIndex
  }

  const map = maps[clickedIndex]
  if (map) {
    previewMap.value = { name: map.label, list: 'included' }
  }
}

// ---------------------------------------------------------------------------
// Drag-and-drop: reorder within cycle list + cross-list transfer
// ---------------------------------------------------------------------------

function onExcludedDragStart(event: DragEvent, index: number) {
  const map = filteredExcluded.value[index]
  if (!map) return
  dragSource.value = 'excluded'
  dragIndex.value = index
  isDragging.value = true
  selectedExcluded.value = [map.value]
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', map.value)
  }
}

function onIncludedDragStart(event: DragEvent, index: number) {
  const map = filteredIncluded.value[index]
  if (!map) return
  dragSource.value = 'included'
  dragIndex.value = index
  isDragging.value = true
  selectedIncluded.value = [map.value]
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', map.value)
  }
}

function onItemDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dropTargetIndex.value = index
}

function onItemDragLeave() {
  dropTargetIndex.value = null
}

// Drop onto the excluded list container (cross-list: included → excluded)
function onExcludedContainerDragOver(event: DragEvent) {
  if (dragSource.value === 'included') {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    dropTargetList.value = 'excluded'
  }
}

function onExcludedContainerDragLeave() {
  dropTargetList.value = null
}

async function onExcludedContainerDrop(event: DragEvent) {
  event.preventDefault()
  dropTargetList.value = null
  dropTargetIndex.value = null
  isDragging.value = false
  stopAutoScroll()

  if (dragSource.value === 'included' && dragIndex.value !== null) {
    const map = filteredIncluded.value[dragIndex.value]
    if (map) {
      selectedIncluded.value = [map.value]
      await moveMap(' < ')
    }
  }
  resetDragState()
}

// Drop onto the included list container
function onIncludedContainerDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  if (dragSource.value === 'excluded') {
    dropTargetList.value = 'included'
  }
  // Auto-scroll
  const el = includedListEl.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const y = event.clientY - rect.top
  if (y < SCROLL_ZONE) {
    startAutoScroll(-SCROLL_SPEED * (1 - y / SCROLL_ZONE))
  } else if (y > rect.height - SCROLL_ZONE) {
    startAutoScroll(SCROLL_SPEED * (1 - (rect.height - y) / SCROLL_ZONE))
  } else {
    stopAutoScroll()
  }
}

function onIncludedContainerDragLeave() {
  dropTargetList.value = null
  stopAutoScroll()
}

async function onIncludedContainerDrop(event: DragEvent) {
  event.preventDefault()
  dropTargetList.value = null
  dropTargetIndex.value = null
  isDragging.value = false
  stopAutoScroll()

  if (dragSource.value === 'excluded' && dragIndex.value !== null) {
    // Cross-list: excluded → included
    const map = filteredExcluded.value[dragIndex.value]
    if (map) {
      selectedExcluded.value = [map.value]
      await moveMap(' > ')
    }
  }
  resetDragState()
}

// Drop onto a specific item in the included list (reorder or cross-list)
async function onIncludedItemDrop(event: DragEvent, targetIndex: number) {
  event.preventDefault()
  dropTargetIndex.value = null
  isDragging.value = false
  stopAutoScroll()

  if (dragSource.value === 'excluded' && dragIndex.value !== null) {
    // Cross-list: excluded → included at specific position
    const map = filteredExcluded.value[dragIndex.value]
    // Resolve the target position in the real (unfiltered) list before the add
    const targetMap = filteredIncluded.value[targetIndex]
    const realTargetIdx = targetMap
      ? (data.value?.includedMaps.findIndex((m) => m.value === targetMap.value) ?? -1)
      : -1
    if (map) {
      selectedExcluded.value = [map.value]
      await moveMap(' > ')
      // After adding, the map lands at the end of the included list.
      // Move it up to the target position if needed.
      if (data.value && realTargetIdx >= 0) {
        const newIdx = data.value.includedMaps.findIndex((m) => m.value === map.value)
        // Drop indicator shows below the target item, so land at realTargetIdx + 1
        const moveBy = newIdx - realTargetIdx - 1
        if (newIdx >= 0 && moveBy > 0) {
          selectedIncluded.value = [map.value]
          await moveMap('Up', moveBy)
        }
      }
    }
  } else if (dragSource.value === 'included' && dragIndex.value !== null && dragIndex.value !== targetIndex && data.value) {
    // Reorder within included list
    const draggedMap = filteredIncluded.value[dragIndex.value]
    const targetMap = filteredIncluded.value[targetIndex]
    if (draggedMap && targetMap) {
      const realDragIdx = data.value.includedMaps.findIndex((m) => m.value === draggedMap.value)
      const realTargetIdx = data.value.includedMaps.findIndex((m) => m.value === targetMap.value)
      if (realDragIdx >= 0 && realTargetIdx >= 0) {
        const diff = realDragIdx - realTargetIdx
        if (diff > 0) await moveMap('Up', diff)
        else await moveMap('Down', Math.abs(diff))
      }
    }
  }
  resetDragState()
}

function onDragEnd() {
  resetDragState()
  stopAutoScroll()
}

function resetDragState() {
  dragSource.value = null
  dragIndex.value = null
  dropTargetIndex.value = null
  dropTargetList.value = null
  isDragging.value = false
}

// Auto-scroll constants
const SCROLL_ZONE = 50
const SCROLL_SPEED = 8

function startAutoScroll(speed: number) {
  stopAutoScroll()
  function tick() {
    const el = includedListEl.value
    if (el) el.scrollTop += speed
    scrollRAF = requestAnimationFrame(tick)
  }
  scrollRAF = requestAnimationFrame(tick)
}

function stopAutoScroll() {
  if (scrollRAF !== null) {
    cancelAnimationFrame(scrollRAF)
    scrollRAF = null
  }
}

// Native wheel listener — Vue's @wheel doesn't fire reliably during drag
function handleWheel(event: WheelEvent) {
  if (!isDragging.value) return
  event.preventDefault()
  const el = includedListEl.value
  if (el) el.scrollTop += event.deltaY
}

function attachWheelListener() {
  nextTick(() => {
    includedListEl.value?.addEventListener('wheel', handleWheel, { passive: false })
  })
}

function detachWheelListener() {
  includedListEl.value?.removeEventListener('wheel', handleWheel)
}

watch(() => store.defaultsGameType, () => { load() })

onMounted(() => {
  load()
  loadMapImages()
  attachWheelListener()
})

onUnmounted(() => {
  stopAutoScroll()
  detachWheelListener()
})

// Re-attach wheel listener when the element changes (after loading completes)
watch(includedListEl, (el) => {
  if (el) attachWheelListener()
})
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-['Orbitron'] font-bold text-white mb-6">
      <i class="ri-map-2-line text-red-500 mr-2"></i>Map Rotation
    </h1>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 flex items-center gap-3">
        <i class="ri-loader-4-line animate-spin text-xl"></i>
        <span>Loading maps...</span>
      </div>
    </div>

    <div v-else-if="error && !data" class="bg-red-900/20 border border-red-900/40 rounded-lg p-4 text-red-400">
      <i class="ri-error-warning-line mr-2"></i>{{ error }}
    </div>

    <div v-else-if="data">
      <p class="text-gray-400 text-sm mb-6">
        Manage the map rotation cycle. Move maps between excluded and included lists to configure the rotation.
        Drag and drop maps in the cycle list to reorder them.
      </p>

      <!-- Map Lists -->
      <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          <!-- Excluded Maps (left) -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-gray-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <i class="ri-close-circle-line text-gray-500"></i>
                Not In Cycle
                <span class="text-gray-600 font-normal normal-case text-xs">
                  ({{ totalExcluded }})
                </span>
              </h3>
              <button
                @click="excludedSortAsc = !excludedSortAsc"
                class="text-gray-500 hover:text-gray-300 text-xs flex items-center gap-1 transition-colors"
                :title="excludedSortAsc ? 'Sort Z-A' : 'Sort A-Z'"
              >
                <i :class="excludedSortAsc ? 'ri-sort-alphabet-asc' : 'ri-sort-alphabet-desc'" class="text-sm"></i>
              </button>
            </div>
            <div class="mb-2">
              <input
                v-model="excludedSearch"
                type="text"
                placeholder="Search maps..."
                class="w-full bg-black/50 border border-red-900/20 rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div
              class="bg-black/50 border border-red-900/20 rounded-lg overflow-hidden min-h-[280px] max-h-[400px] overflow-y-auto transition-colors"
              :class="dropTargetList === 'excluded' ? 'ring-2 ring-red-500/50' : ''"
              @dragover="onExcludedContainerDragOver"
              @dragleave="onExcludedContainerDragLeave"
              @drop="onExcludedContainerDrop"
            >
              <div
                v-if="filteredExcluded.length === 0"
                class="p-8 text-center text-gray-600 text-sm"
              >
                {{ excludedSearch ? 'No maps match your search' : 'All maps are in the cycle' }}
              </div>
              <div
                v-for="(map, index) in filteredExcluded"
                :key="map.value"
                draggable="true"
                @dragstart="onExcludedDragStart($event, index)"
                @dragend="onDragEnd"
                @click="toggleExcludedSelection(map.value, $event)"
                class="px-4 py-2 text-sm cursor-grab transition-colors border-b border-red-900/5 last:border-0 select-none"
                :class="[
                  selectedExcluded.includes(map.value)
                    ? 'bg-red-900/30 text-white'
                    : 'text-gray-300 hover:bg-white/5',
                  dragSource === 'excluded' && dragIndex === index ? 'opacity-40' : '',
                ]"
              >
                <i class="ri-map-pin-line text-gray-600 mr-2 text-xs"></i>{{ map.label }}
              </div>
            </div>
          </div>

          <!-- Arrow Buttons (center) -->
          <div class="flex md:flex-col flex-row items-center justify-center gap-2 md:pt-10">
            <button
              @click="moveMap(' > ')"
              :disabled="selectedExcluded.length === 0"
              class="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white w-10 h-10 rounded flex items-center justify-center transition-colors"
              title="Add selected maps to cycle"
            >
              <i class="ri-arrow-right-s-line text-lg"></i>
            </button>
            <button
              @click="moveMap(' < ')"
              :disabled="selectedIncluded.length === 0"
              class="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white w-10 h-10 rounded flex items-center justify-center transition-colors"
              title="Remove selected maps from cycle"
            >
              <i class="ri-arrow-left-s-line text-lg"></i>
            </button>
            <div class="w-2 md:h-2"></div>
            <button
              @click="moveMap('>>')"
              class="bg-gray-800 hover:bg-gray-700 text-white w-10 h-10 rounded flex items-center justify-center transition-colors"
              title="Add all maps to cycle"
            >
              <i class="ri-arrow-right-double-line text-lg"></i>
            </button>
            <button
              @click="moveMap('<<')"
              class="bg-gray-800 hover:bg-gray-700 text-white w-10 h-10 rounded flex items-center justify-center transition-colors"
              title="Remove all maps from cycle"
            >
              <i class="ri-arrow-left-double-line text-lg"></i>
            </button>
          </div>

          <!-- Included Maps (right) — with drag-and-drop reordering -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-gray-400 text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <i class="ri-checkbox-circle-line text-green-500"></i>
                In Cycle
                <span class="text-gray-600 font-normal normal-case text-xs">
                  ({{ totalIncluded }})
                </span>
              </h3>
              <div class="flex items-center gap-1">
                <button
                  @click="includedSortAsc = includedSortAsc === null ? true : (includedSortAsc ? false : null)"
                  class="text-xs flex items-center gap-1 transition-colors"
                  :class="includedSortAsc === null ? 'text-gray-600 hover:text-gray-400' : 'text-gray-400 hover:text-gray-200'"
                  :title="includedSortAsc === null ? 'Sort A-Z' : (includedSortAsc ? 'Sort Z-A' : 'Server order')"
                >
                  <i v-if="includedSortAsc === null" class="ri-list-ordered text-sm"></i>
                  <i v-else :class="includedSortAsc ? 'ri-sort-alphabet-asc' : 'ri-sort-alphabet-desc'" class="text-sm"></i>
                </button>
              </div>
            </div>
            <div class="mb-2">
              <input
                v-model="includedSearch"
                type="text"
                placeholder="Search maps..."
                class="w-full bg-black/50 border border-red-900/20 rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-red-500 focus:outline-none"
              />
            </div>
            <div
              ref="includedListEl"
              class="bg-black/50 border border-red-900/20 rounded-lg overflow-hidden min-h-[280px] max-h-[400px] overflow-y-auto transition-colors"
              :class="dropTargetList === 'included' ? 'ring-2 ring-green-500/50' : ''"
              @dragover="onIncludedContainerDragOver"
              @dragleave="onIncludedContainerDragLeave"
              @drop="onIncludedContainerDrop"
            >
              <div
                v-if="filteredIncluded.length === 0"
                class="p-8 text-center text-gray-600 text-sm"
              >
                {{ includedSearch ? 'No maps match your search' : 'No maps in the cycle' }}
              </div>
              <div
                v-for="(map, index) in filteredIncluded"
                :key="map.value"
                draggable="true"
                @dragstart="onIncludedDragStart($event, index)"
                @dragover="onItemDragOver($event, index)"
                @dragleave="onItemDragLeave"
                @drop="onIncludedItemDrop($event, index)"
                @dragend="onDragEnd"
                @click="toggleIncludedSelection(map.value, $event)"
                class="px-4 py-2 text-sm transition-colors border-b last:border-0 select-none"
                :class="[
                  selectedIncluded.includes(map.value)
                    ? 'bg-red-900/30 text-white'
                    : 'text-gray-300 hover:bg-white/5',
                  dragSource === 'included' && dragIndex === index ? 'opacity-40' : '',
                  isDragging ? 'cursor-grabbing' : 'cursor-grab',
                  dropTargetIndex === index && !(dragSource === 'included' && dragIndex === index)
                    ? (dragSource === 'included' && dragIndex !== null && dragIndex > index
                        ? 'border-t-2 border-t-red-500 border-b-red-900/5'
                        : 'border-b-2 border-b-red-500 border-t-transparent')
                    : 'border-b-red-900/5',
                ]"
              >
                <i class="ri-draggable text-gray-600 mr-1 text-xs"></i>
                <i class="ri-map-pin-line text-green-600 mr-2 text-xs"></i>{{ map.label }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Map Preview -->
      <div
        v-if="previewMap"
        class="mt-6 bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-4"
      >
        <h3 class="text-gray-300 text-sm font-semibold mb-3 flex items-center gap-2">
          <i class="ri-image-line text-gray-500"></i>
          {{ previewMap.name }}
        </h3>
        <div class="flex items-center justify-center bg-black/50 rounded-lg p-4 min-h-[120px]">
          <img
            v-if="previewImageUrl"
            :src="previewImageUrl"
            :alt="previewMap.name"
            class="max-h-[200px] object-contain rounded"
          />
          <div v-else class="text-gray-600 text-sm flex flex-col items-center gap-2">
            <i class="ri-image-2-line text-3xl text-gray-700"></i>
            <span>No preview available</span>
          </div>
        </div>
      </div>

      <p class="text-gray-600 text-xs mt-4">
        <i class="ri-information-line mr-1"></i>
        Hold Ctrl/Cmd to select multiple maps. Hold Shift to select a range. Drag items in the cycle list to reorder.
      </p>

      <div v-if="error" class="mt-4 text-red-400 text-sm">
        <i class="ri-error-warning-line mr-1"></i>{{ error }}
      </div>
    </div>
  </div>
</template>
