<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'
import { parseMaps } from '@/services/parsers'
import { useServerStore } from '@/stores/server'
import type { MapsData } from '@/types'

const store = useServerStore()
const data = ref<MapsData | null>(null)
const loading = ref(true)
const error = ref('')
const selectedExcluded = ref<string[]>([])
const selectedIncluded = ref<string[]>([])
const moveCount = ref('1')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const html = await api.fetchPage('defaults_maps')
    data.value = parseMaps(html)
    store.updateServerInfo(data.value.serverInfo.mapName, data.value.serverInfo.gameType)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function moveMap(action: string) {
  if (!data.value) return
  error.value = ''
  try {
    const formData: Record<string, string> = {
      Session: 'Session',
      GameType: '',
      MoveMap: action,
    }

    // Include selected maps from both lists
    const lastExcluded = selectedExcluded.value[selectedExcluded.value.length - 1]
    if (lastExcluded) {
      formData['ExcludeMapsSelect'] = lastExcluded
    }
    const lastIncluded = selectedIncluded.value[selectedIncluded.value.length - 1]
    if (lastIncluded) {
      formData['IncludeMapsSelect'] = lastIncluded
    }
    if (action === 'Up' || action === 'Down') {
      formData['MoveMapCount'] = moveCount.value
    }

    const html = await api.submitForm('defaults_maps', formData)
    data.value = parseMaps(html)
    selectedExcluded.value = []
    selectedIncluded.value = []
  } catch (e) {
    error.value = (e as Error).message
  }
}

function toggleExcludedSelection(value: string, event: MouseEvent) {
  if (event.ctrlKey || event.metaKey) {
    const idx = selectedExcluded.value.indexOf(value)
    if (idx >= 0) {
      selectedExcluded.value.splice(idx, 1)
    } else {
      selectedExcluded.value.push(value)
    }
  } else {
    selectedExcluded.value = [value]
  }
}

function toggleIncludedSelection(value: string, event: MouseEvent) {
  if (event.ctrlKey || event.metaKey) {
    const idx = selectedIncluded.value.indexOf(value)
    if (idx >= 0) {
      selectedIncluded.value.splice(idx, 1)
    } else {
      selectedIncluded.value.push(value)
    }
  } else {
    selectedIncluded.value = [value]
  }
}

onMounted(load)
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
      </p>

      <!-- Map Lists -->
      <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-6">
        <div class="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
          <!-- Excluded Maps (left) -->
          <div>
            <h3 class="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <i class="ri-close-circle-line text-gray-500"></i>
              Maps Not In Cycle
              <span class="text-gray-600 font-normal normal-case text-xs">
                ({{ data.excludedMaps.length }})
              </span>
            </h3>
            <div class="bg-black/50 border border-red-900/20 rounded-lg overflow-hidden min-h-[280px] max-h-[400px] overflow-y-auto">
              <div
                v-if="data.excludedMaps.length === 0"
                class="p-8 text-center text-gray-600 text-sm"
              >
                All maps are in the cycle
              </div>
              <div
                v-for="map in data.excludedMaps"
                :key="map.value"
                @click="toggleExcludedSelection(map.value, $event)"
                class="px-4 py-2 text-sm cursor-pointer transition-colors border-b border-red-900/5 last:border-0"
                :class="
                  selectedExcluded.includes(map.value)
                    ? 'bg-red-900/30 text-white'
                    : 'text-gray-300 hover:bg-white/5'
                "
              >
                <i class="ri-map-pin-line text-gray-600 mr-2 text-xs"></i>{{ map.label }}
              </div>
            </div>
          </div>

          <!-- Arrow Buttons (center) -->
          <div class="flex flex-col items-center gap-2 pt-10">
            <button
              @click="moveMap(' > ')"
              class="bg-gray-800 hover:bg-gray-700 text-white w-10 h-10 rounded flex items-center justify-center transition-colors"
              title="Add selected map"
            >
              <i class="ri-arrow-right-s-line text-lg"></i>
            </button>
            <button
              @click="moveMap(' < ')"
              class="bg-gray-800 hover:bg-gray-700 text-white w-10 h-10 rounded flex items-center justify-center transition-colors"
              title="Remove selected map"
            >
              <i class="ri-arrow-left-s-line text-lg"></i>
            </button>
            <div class="h-2"></div>
            <button
              @click="moveMap('>>')"
              class="bg-gray-800 hover:bg-gray-700 text-white w-10 h-10 rounded flex items-center justify-center transition-colors"
              title="Add all maps"
            >
              <i class="ri-arrow-right-double-line text-lg"></i>
            </button>
            <button
              @click="moveMap('<<')"
              class="bg-gray-800 hover:bg-gray-700 text-white w-10 h-10 rounded flex items-center justify-center transition-colors"
              title="Remove all maps"
            >
              <i class="ri-arrow-left-double-line text-lg"></i>
            </button>
          </div>

          <!-- Included Maps (right) -->
          <div>
            <h3 class="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
              <i class="ri-checkbox-circle-line text-green-500"></i>
              Maps In Cycle
              <span class="text-gray-600 font-normal normal-case text-xs">
                ({{ data.includedMaps.length }})
              </span>
            </h3>
            <div class="bg-black/50 border border-red-900/20 rounded-lg overflow-hidden min-h-[280px] max-h-[400px] overflow-y-auto">
              <div
                v-if="data.includedMaps.length === 0"
                class="p-8 text-center text-gray-600 text-sm"
              >
                No maps in the cycle
              </div>
              <div
                v-for="map in data.includedMaps"
                :key="map.value"
                @click="toggleIncludedSelection(map.value, $event)"
                class="px-4 py-2 text-sm cursor-pointer transition-colors border-b border-red-900/5 last:border-0"
                :class="
                  selectedIncluded.includes(map.value)
                    ? 'bg-red-900/30 text-white'
                    : 'text-gray-300 hover:bg-white/5'
                "
              >
                <i class="ri-map-pin-line text-green-600 mr-2 text-xs"></i>{{ map.label }}
              </div>
            </div>

            <!-- Up/Down controls -->
            <div class="flex items-center gap-2 mt-3 justify-end">
              <input
                v-model="moveCount"
                type="text"
                maxlength="1"
                class="bg-black border border-red-900/30 rounded px-3 py-1.5 text-white focus:border-red-500 focus:outline-none w-10 text-center text-sm"
              />
              <button
                @click="moveMap('Up')"
                class="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1"
              >
                <i class="ri-arrow-up-s-line"></i>Up
              </button>
              <button
                @click="moveMap('Down')"
                class="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1"
              >
                <i class="ri-arrow-down-s-line"></i>Down
              </button>
            </div>
          </div>
        </div>
      </div>

      <p class="text-gray-600 text-xs mt-4">
        <i class="ri-information-line mr-1"></i>
        Hold Ctrl/Cmd to select multiple maps. Use the arrow buttons to move maps between lists.
      </p>

      <div v-if="error" class="mt-4 text-red-400 text-sm">
        <i class="ri-error-warning-line mr-1"></i>{{ error }}
      </div>
    </div>
  </div>
</template>
