<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'
import { parseGame } from '@/services/parsers'
import { useServerStore } from '@/stores/server'
import type { GameData } from '@/types'

const store = useServerStore()
const data = ref<GameData | null>(null)
const loading = ref(true)
const error = ref('')
const switching = ref(false)
const selectedGameType = ref('')
const selectedMap = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const html = await api.fetchPage('current_game')
    data.value = parseGame(html)
    store.updateServerInfo(data.value.serverInfo.mapName, data.value.serverInfo.gameType)
    // Set dropdowns to currently selected values
    const currentGT = data.value.gameTypes.find((g) => g.selected)
    selectedGameType.value = currentGT?.value ?? data.value.gameTypes[0]?.value ?? ''
    const currentMap = data.value.maps.find((m) => m.selected)
    selectedMap.value = currentMap?.value ?? data.value.maps[0]?.value ?? ''
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function handleSwitchResponse(html: string) {
  // Server returns a "Please Wait" page during map/gametype transition
  if (html.includes('Please Wait') || html.includes('server is now switching')) {
    switching.value = true
    // Wait for the server to finish switching, then reload
    setTimeout(async () => {
      await load()
      switching.value = false
    }, 10000)
    return
  }
  data.value = parseGame(html)
  store.updateServerInfo(data.value.serverInfo.mapName, data.value.serverInfo.gameType)
  const currentGT = data.value.gameTypes.find((g) => g.selected)
  selectedGameType.value = currentGT?.value ?? data.value.gameTypes[0]?.value ?? ''
  const currentMap = data.value.maps.find((m) => m.selected)
  selectedMap.value = currentMap?.value ?? data.value.maps[0]?.value ?? ''
}

async function switchGameType() {
  error.value = ''
  try {
    const html = await api.submitForm('current_game', {
      GameTypeSelect: selectedGameType.value,
      SwitchGameType: 'Switch',
    })
    await handleSwitchResponse(html)
  } catch (e) {
    error.value = (e as Error).message
  }
}

async function switchMap() {
  error.value = ''
  try {
    const html = await api.submitForm('current_game', {
      MapSelect: selectedMap.value,
      SwitchMap: 'Switch',
    })
    await handleSwitchResponse(html)
  } catch (e) {
    error.value = (e as Error).message
  }
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-['Orbitron'] font-bold text-white mb-6">
      <i class="ri-gamepad-line text-red-500 mr-2"></i>Current Game
    </h1>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 flex items-center gap-3">
        <i class="ri-loader-4-line animate-spin text-xl"></i>
        <span>Loading game info...</span>
      </div>
    </div>

    <div v-else-if="error" class="bg-red-900/20 border border-red-900/40 rounded-lg p-4 text-red-400">
      <i class="ri-error-warning-line mr-2"></i>{{ error }}
    </div>

    <div v-if="switching" class="bg-yellow-900/20 border border-yellow-900/40 rounded-lg p-6 text-center mb-6">
      <i class="ri-loader-4-line animate-spin text-2xl text-yellow-400 mb-2 block"></i>
      <p class="text-yellow-300 font-semibold">Server is switching maps...</p>
      <p class="text-yellow-400/60 text-sm mt-1">Please wait ~10 seconds while the server changes maps.</p>
    </div>

    <div v-else-if="data" class="space-y-6">
      <!-- Game Type Switch -->
      <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-6">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Switch Game Type</h2>
        <div class="flex items-center gap-3">
          <select
            v-model="selectedGameType"
            class="bg-black border border-red-900/30 rounded px-3 py-2 text-white text-sm cursor-pointer focus:border-red-500 focus:outline-none flex-1 max-w-md"
          >
            <option
              v-for="gt in data.gameTypes"
              :key="gt.value"
              :value="gt.value"
            >
              {{ gt.label }}
            </option>
          </select>
          <button
            @click="switchGameType"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <i class="ri-arrow-left-right-line"></i>Switch
          </button>
        </div>
      </div>

      <!-- Map Switch -->
      <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-6">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Switch Map</h2>
        <div class="flex items-center gap-3">
          <select
            v-model="selectedMap"
            class="bg-black border border-red-900/30 rounded px-3 py-2 text-white text-sm cursor-pointer focus:border-red-500 focus:outline-none flex-1 max-w-md"
          >
            <option
              v-for="map in data.maps"
              :key="map.value"
              :value="map.value"
            >
              {{ map.label }}
            </option>
          </select>
          <button
            @click="switchMap"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <i class="ri-map-pin-line"></i>Switch
          </button>
        </div>
      </div>

      <!-- Player Stats -->
      <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-red-900/10">
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">Player Statistics</h2>
        </div>

        <div v-if="data.players.length === 0" class="p-12 text-center">
          <i class="ri-user-unfollow-line text-4xl text-gray-600 mb-3 block"></i>
          <p class="text-gray-500">No players connected</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-red-900/10 text-left">
                <th class="px-4 py-3 text-gray-400 font-medium">Player Name</th>
                <th class="px-4 py-3 text-gray-400 font-medium text-right">Kills</th>
                <th class="px-4 py-3 text-gray-400 font-medium text-right">Team Kills</th>
                <th class="px-4 py-3 text-gray-400 font-medium text-right">Deaths</th>
                <th class="px-4 py-3 text-gray-400 font-medium text-right">Suicides</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(player, index) in data.players"
                :key="index"
                class="border-t border-red-900/10 hover:bg-white/5 transition-colors"
              >
                <td class="px-4 py-3 text-white font-medium">{{ player.name }}</td>
                <td class="px-4 py-3 text-gray-300 text-right">{{ player.kills }}</td>
                <td class="px-4 py-3 text-gray-300 text-right">{{ player.teamKills }}</td>
                <td class="px-4 py-3 text-gray-300 text-right">{{ player.deaths }}</td>
                <td class="px-4 py-3 text-gray-300 text-right">{{ player.suicides }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
