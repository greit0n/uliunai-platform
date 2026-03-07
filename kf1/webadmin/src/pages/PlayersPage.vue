<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '@/services/api'
import { parsePlayers } from '@/services/parsers'
import { useServerStore } from '@/stores/server'
import type { PlayersData } from '@/types'

const store = useServerStore()
const data = ref<PlayersData | null>(null)
const loading = ref(true)
const error = ref('')
const minPlayersInput = ref('0')
const checkedFields = ref<Record<string, boolean>>({})
const success = ref('')
let refreshInterval: ReturnType<typeof setInterval> | null = null

async function load() {
  try {
    const html = await api.fetchPage('current_players')
    data.value = parsePlayers(html)
    // TODO: Remove dummy data
    if (data.value.players.length === 0) {
      data.value.players = [
        { name: 'FragMaster', team: '', ping: 32, score: 47, teamKills: 0, ip: '192.168.1.10', globalId: 'STEAM_0:1:12345', kickField: '', sessionField: '', banField: '' },
        { name: 'Zer0Kill', team: '', ping: 28, score: 43, teamKills: 1, ip: '10.0.0.55', globalId: 'STEAM_0:0:67890', kickField: '', sessionField: '', banField: '' },
        { name: 'BloodRaven', team: '', ping: 45, score: 41, teamKills: 0, ip: '172.16.0.8', globalId: 'STEAM_0:1:11111', kickField: '', sessionField: '', banField: '' },
        { name: 'NightStalker', team: '', ping: 18, score: 35, teamKills: 0, ip: '192.168.2.20', globalId: 'STEAM_0:0:22222', kickField: '', sessionField: '', banField: '' },
        { name: 'DeadShot', team: '', ping: 55, score: 35, teamKills: 2, ip: '10.0.1.100', globalId: 'STEAM_0:1:33333', kickField: '', sessionField: '', banField: '' },
        { name: 'ShadowHunter', team: '', ping: 67, score: 33, teamKills: 0, ip: '192.168.3.15', globalId: 'STEAM_0:0:44444', kickField: '', sessionField: '', banField: '' },
        { name: 'CrimsonBlade', team: '', ping: 22, score: 31, teamKills: 0, ip: '10.0.2.50', globalId: 'STEAM_0:1:55555', kickField: '', sessionField: '', banField: '' },
        { name: 'GhostReaper', team: '', ping: 41, score: 28, teamKills: 1, ip: '172.16.1.20', globalId: 'STEAM_0:0:66666', kickField: '', sessionField: '', banField: '' },
        { name: 'VenomStrike', team: '', ping: 35, score: 25, teamKills: 0, ip: '192.168.4.30', globalId: 'STEAM_0:1:77777', kickField: '', sessionField: '', banField: '' },
        { name: 'ThunderBolt', team: '', ping: 52, score: 22, teamKills: 0, ip: '10.0.3.80', globalId: 'STEAM_0:0:88888', kickField: '', sessionField: '', banField: '' },
        { name: 'IronFist', team: '', ping: 19, score: 20, teamKills: 0, ip: '172.16.2.40', globalId: 'STEAM_0:1:99999', kickField: '', sessionField: '', banField: '' },
        { name: 'SkullCrusher', team: '', ping: 73, score: 18, teamKills: 1, ip: '192.168.5.60', globalId: 'STEAM_0:0:10101', kickField: '', sessionField: '', banField: '' },
        { name: 'DarkPhoenix', team: '', ping: 29, score: 16, teamKills: 0, ip: '10.0.4.15', globalId: 'STEAM_0:1:20202', kickField: '', sessionField: '', banField: '' },
        { name: 'WolfBane', team: '', ping: 88, score: 14, teamKills: 0, ip: '172.16.3.90', globalId: 'STEAM_0:0:30303', kickField: '', sessionField: '', banField: '' },
        { name: 'SteelViper', team: '', ping: 44, score: 11, teamKills: 0, ip: '192.168.6.25', globalId: 'STEAM_0:1:40404', kickField: '', sessionField: '', banField: '' },
      ]
    }
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
    success.value = 'Minimum players updated'
    setTimeout(() => { success.value = '' }, 3000)
  } catch (e) {
    error.value = (e as Error).message
  }
}

function toggleCheck(field: string) {
  if (!field) return
  checkedFields.value[field] = !checkedFields.value[field]
}

async function kickBan() {
  if (!data.value || data.value.players.length === 0) return

  const formData: Record<string, string> = {}

  for (const [field, checked] of Object.entries(checkedFields.value)) {
    if (checked && field) {
      // KF1 WebAdmin checkboxes all use value="True"
      formData[field] = 'True'
    }
  }

  if (Object.keys(formData).length === 0) return

  formData['Kick'] = 'Kick/Ban'

  try {
    const html = await api.submitForm('current_players', formData)
    data.value = parsePlayers(html)
    checkedFields.value = {}
    success.value = 'Kick/Ban action applied'
    setTimeout(() => { success.value = '' }, 3000)
  } catch (e) {
    error.value = (e as Error).message
  }
}

const hasChecked = () => Object.values(checkedFields.value).some(Boolean)

onMounted(() => {
  load()
  refreshInterval = setInterval(load, 10000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
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

    <div v-else-if="error && !data" class="bg-red-900/20 border border-red-900/40 rounded-lg p-4 text-red-400">
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
                    v-if="player.kickField"
                    type="checkbox"
                    :checked="!!checkedFields[player.kickField]"
                    @change="toggleCheck(player.kickField)"
                    class="accent-red-600"
                  />
                </td>
                <td class="px-3 py-3 text-center">
                  <input
                    v-if="player.sessionField"
                    type="checkbox"
                    :checked="!!checkedFields[player.sessionField]"
                    @change="toggleCheck(player.sessionField)"
                    class="accent-red-600"
                  />
                </td>
                <td class="px-3 py-3 text-center">
                  <input
                    v-if="player.banField"
                    type="checkbox"
                    :checked="!!checkedFields[player.banField]"
                    @change="toggleCheck(player.banField)"
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
            :disabled="!hasChecked()"
            class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <i class="ri-user-forbid-line"></i>Kick/Ban
          </button>
        </div>
      </div>

      <div v-if="success" class="mt-4 text-green-400 text-sm flex items-center gap-1">
        <i class="ri-checkbox-circle-line"></i>{{ success }}
      </div>
      <div v-else-if="error" class="mt-4 text-red-400 text-sm">
        <i class="ri-error-warning-line mr-1"></i>{{ error }}
      </div>
    </div>
  </div>
</template>
