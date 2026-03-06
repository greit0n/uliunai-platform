<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'
import { parsePlayers } from '@/services/parsers'
import { useServerStore } from '@/stores/server'
import type { PlayersData } from '@/types'

const store = useServerStore()
const data = ref<PlayersData | null>(null)
const loading = ref(true)
const error = ref('')
const minPlayersInput = ref('0')
const selectedAction = ref<Record<number, string>>({})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const html = await api.fetchPage('current_players')
    data.value = parsePlayers(html)
    minPlayersInput.value = String(data.value.minPlayers)
    store.updateServerInfo(data.value.serverInfo.mapName, data.value.serverInfo.gameType)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function setMinPlayers() {
  try {
    const html = await api.submitForm('current_players', {
      MinPlayers: minPlayersInput.value,
      SetMinPlayers: 'Set',
    })
    data.value = parsePlayers(html)
    minPlayersInput.value = String(data.value.minPlayers)
  } catch (e) {
    error.value = (e as Error).message
  }
}

function selectAction(playerIndex: number, action: string) {
  // Clear other actions for this player
  if (selectedAction.value[playerIndex] === action) {
    delete selectedAction.value[playerIndex]
  } else {
    selectedAction.value[playerIndex] = action
  }
}

async function kickBan() {
  if (!data.value || data.value.players.length === 0) return

  const formData: Record<string, string> = {}

  for (const [indexStr, action] of Object.entries(selectedAction.value)) {
    const index = Number(indexStr)
    if (action === 'kick') {
      formData[`PlayerKick${index}`] = 'on'
    } else if (action === 'session') {
      formData[`PlayerSessionBan${index}`] = 'on'
    } else if (action === 'ban') {
      formData[`PlayerBan${index}`] = 'on'
    }
  }

  formData['Kick'] = 'Kick/Ban'

  try {
    const html = await api.submitForm('current_players', formData)
    data.value = parsePlayers(html)
    selectedAction.value = {}
  } catch (e) {
    error.value = (e as Error).message
  }
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-['Orbitron'] font-bold text-white">
        <i class="ri-group-line text-red-500 mr-2"></i>Player List
      </h1>
      <button
        @click="load"
        class="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold transition-colors flex items-center gap-2"
      >
        <i class="ri-refresh-line"></i>Refresh
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 flex items-center gap-3">
        <i class="ri-loader-4-line animate-spin text-xl"></i>
        <span>Loading players...</span>
      </div>
    </div>

    <div v-else-if="error" class="bg-red-900/20 border border-red-900/40 rounded-lg p-4 text-red-400">
      <i class="ri-error-warning-line mr-2"></i>{{ error }}
    </div>

    <div v-else-if="data">
      <!-- Min Players -->
      <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-4 mb-6">
        <div class="flex items-center gap-3">
          <label class="text-gray-400 text-sm whitespace-nowrap">Minimum Players:</label>
          <input
            v-model="minPlayersInput"
            type="text"
            maxlength="2"
            class="bg-black border border-red-900/30 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none w-16 text-center"
          />
          <button
            @click="setMinPlayers"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-colors"
          >
            Set
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="data.players.length === 0"
        class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-12 text-center"
      >
        <i class="ri-user-unfollow-line text-5xl text-gray-600 mb-4 block"></i>
        <p class="text-gray-500 text-lg">No players connected</p>
        <p class="text-gray-600 text-sm mt-2">Players will appear here when they join the server</p>
      </div>

      <!-- Players table -->
      <div v-else class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-red-900/10 text-left">
                <th class="px-3 py-3 text-gray-400 font-medium text-center">Kick</th>
                <th class="px-3 py-3 text-gray-400 font-medium text-center">Session</th>
                <th class="px-3 py-3 text-gray-400 font-medium text-center">Ban</th>
                <th class="px-4 py-3 text-gray-400 font-medium">Name</th>
                <th class="px-4 py-3 text-gray-400 font-medium">Team</th>
                <th class="px-4 py-3 text-gray-400 font-medium text-right">Ping</th>
                <th class="px-4 py-3 text-gray-400 font-medium text-right">Score</th>
                <th class="px-4 py-3 text-gray-400 font-medium text-right">Team Kills</th>
                <th class="px-4 py-3 text-gray-400 font-medium">IP</th>
                <th class="px-4 py-3 text-gray-400 font-medium">Global ID</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(player, index) in data.players"
                :key="index"
                class="border-t border-red-900/10 hover:bg-white/5 transition-colors"
              >
                <td class="px-3 py-3 text-center">
                  <input
                    type="radio"
                    :name="'action_' + index"
                    :checked="selectedAction[index] === 'kick'"
                    @click="selectAction(index, 'kick')"
                    class="accent-red-600"
                  />
                </td>
                <td class="px-3 py-3 text-center">
                  <input
                    type="radio"
                    :name="'action_' + index"
                    :checked="selectedAction[index] === 'session'"
                    @click="selectAction(index, 'session')"
                    class="accent-red-600"
                  />
                </td>
                <td class="px-3 py-3 text-center">
                  <input
                    type="radio"
                    :name="'action_' + index"
                    :checked="selectedAction[index] === 'ban'"
                    @click="selectAction(index, 'ban')"
                    class="accent-red-600"
                  />
                </td>
                <td class="px-4 py-3 text-white font-medium">{{ player.name }}</td>
                <td class="px-4 py-3 text-gray-300">{{ player.team || '—' }}</td>
                <td class="px-4 py-3 text-gray-300 text-right">{{ player.ping }}</td>
                <td class="px-4 py-3 text-gray-300 text-right">{{ player.score }}</td>
                <td class="px-4 py-3 text-gray-300 text-right">{{ player.teamKills }}</td>
                <td class="px-4 py-3 text-gray-400 font-mono text-sm">{{ player.ip || '—' }}</td>
                <td class="px-4 py-3 text-gray-400 font-mono text-sm">{{ player.globalId || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="border-t border-red-900/10 p-4 flex justify-end">
          <button
            @click="kickBan"
            :disabled="Object.keys(selectedAction).length === 0"
            class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <i class="ri-user-forbid-line"></i>Kick/Ban
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
