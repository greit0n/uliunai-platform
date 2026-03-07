<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { api } from '@/services/api'
import { parseGame, parsePlayers } from '@/services/parsers'
import { useServerStore } from '@/stores/server'
import type { GameData, PlayersData, GameState, GameStatePlayer, MonsterKills } from '@/types'

const store = useServerStore()
const gameData = ref<GameData | null>(null)
const playersData = ref<PlayersData | null>(null)
const gameState = ref<GameState | null>(null)
const mapImages = ref<Record<string, string>>({})
const loading = ref(true)
const error = ref('')
const switching = ref(false)
const switchSuccess = ref('')
const selectedGameType = ref('')
const selectedMap = ref('')
const serverStartedAt = ref<string | null>(null)
const mapChangedAt = ref<string | null>(null)
const now = ref(Date.now())
let refreshInterval: ReturnType<typeof setInterval> | null = null
let clockInterval: ReturnType<typeof setInterval> | null = null

const mapImageUrl = computed(() => {
  const name = currentMap.value
  if (!name) return ''
  const imgPath = mapImages.value[name]
  if (imgPath) return '/map-api' + imgPath
  return ''
})

const currentMap = computed(() => {
  if (gameData.value) {
    const fromHeader = gameData.value.serverInfo.mapName
    if (fromHeader) return fromHeader
    const selected = gameData.value.maps.find((m) => m.selected)
    return selected?.label ?? store.currentMap
  }
  return store.currentMap
})

const currentGameType = computed(() => {
  if (gameData.value) {
    const fromHeader = gameData.value.serverInfo.gameType
    if (fromHeader) return fromHeader
    const selected = gameData.value.gameTypes.find((t) => t.selected)
    return selected?.label ?? store.currentGameType
  }
  return store.currentGameType
})

const playerCount = computed(() => playersData.value?.players.length ?? 0)

const waveText = computed(() => {
  if (!gameState.value) return '—'
  const { current, total } = gameState.value.wave
  return `${current} / ${total}`
})

const waveStatus = computed(() => {
  if (!gameState.value) return ''
  if (gameState.value.wave.traderTime) return 'Trader'
  if (gameState.value.wave.inProgress) return 'In Progress'
  return 'Waiting'
})

function formatUptime(isoStr: string | null): string {
  if (!isoStr) return '—'
  const start = new Date(isoStr).getTime()
  const diff = Math.max(0, now.value - start)
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  return `${minutes}m ${seconds % 60}s`
}

const serverUptime = computed(() => formatUptime(serverStartedAt.value))
const mapUptime = computed(() => formatUptime(mapChangedAt.value))

const PERK_COLORS: Record<string, string> = {
  Berserker: 'text-red-400 bg-red-900/30',
  FieldMedic: 'text-blue-400 bg-blue-900/30',
  SupportSpec: 'text-lime-400 bg-lime-900/30',
  Sharpshooter: 'text-sky-300 bg-sky-900/30',
  Commando: 'text-green-400 bg-green-900/30',
  Firebug: 'text-orange-400 bg-orange-900/30',
  Demolitions: 'text-yellow-400 bg-yellow-900/30',
}

const MONSTER_COLS: { key: keyof MonsterKills; label: string; color: string }[] = [
  { key: 'clot', label: 'CLO', color: 'text-gray-300' },
  { key: 'gorefast', label: 'GOR', color: 'text-red-400' },
  { key: 'crawler', label: 'CRA', color: 'text-green-400' },
  { key: 'stalker', label: 'STA', color: 'text-purple-400' },
  { key: 'bloat', label: 'BLO', color: 'text-yellow-400' },
  { key: 'siren', label: 'SIR', color: 'text-pink-400' },
  { key: 'husk', label: 'HUS', color: 'text-orange-400' },
  { key: 'scrake', label: 'SCR', color: 'text-cyan-400' },
  { key: 'fleshpound', label: 'FP', color: 'text-red-500' },
  { key: 'boss', label: 'BOSS', color: 'text-yellow-300' },
]

function livePlayerTotalKills(p: GameStatePlayer) {
  return Object.values(p.monsterKills).reduce((a, b) => a + b, 0)
}

const livePlayersSorted = computed(() => {
  const players = gameState.value?.players ?? []
  return [...players].sort((a, b) => livePlayerTotalKills(b) - livePlayerTotalKills(a))
})

function hpColor(p: GameStatePlayer): string {
  const pct = p.maxHealth > 0 ? (p.health / p.maxHealth) * 100 : 0
  return pct > 60 ? 'text-green-400' : pct > 25 ? 'text-yellow-400' : 'text-red-400'
}

function perkDisplay(perk: string): string {
  return perk.replace('FieldMedic', 'Medic').replace('SupportSpec', 'Support')
}

async function load() {
  try {
    const [gameHtml, playersHtml, imgs, status, liveState] = await Promise.all([
      api.fetchPage('current_game'),
      api.fetchPage('current_players'),
      api.getMapImages(),
      api.getServerStatus(),
      api.getGameState(),
    ])
    mapImages.value = imgs
    serverStartedAt.value = status.serverStartedAt
    mapChangedAt.value = status.mapChangedAt
    gameData.value = parseGame(gameHtml)
    playersData.value = parsePlayers(playersHtml)
    // TODO: Remove dummy data
    if (gameData.value.players.length === 0) {
      gameData.value.players = [
        { name: 'FragMaster', kills: 47, teamKills: 0, deaths: 2, suicides: 0 },
        { name: 'Zer0Kill', kills: 43, teamKills: 1, deaths: 3, suicides: 0 },
        { name: 'BloodRaven', kills: 41, teamKills: 0, deaths: 1, suicides: 1 },
        { name: 'NightStalker', kills: 35, teamKills: 0, deaths: 4, suicides: 0 },
        { name: 'DeadShot', kills: 35, teamKills: 2, deaths: 2, suicides: 0 },
        { name: 'ShadowHunter', kills: 33, teamKills: 0, deaths: 5, suicides: 1 },
        { name: 'CrimsonBlade', kills: 31, teamKills: 0, deaths: 1, suicides: 0 },
        { name: 'GhostReaper', kills: 28, teamKills: 1, deaths: 3, suicides: 0 },
        { name: 'VenomStrike', kills: 25, teamKills: 0, deaths: 2, suicides: 0 },
        { name: 'ThunderBolt', kills: 22, teamKills: 0, deaths: 4, suicides: 1 },
        { name: 'IronFist', kills: 20, teamKills: 0, deaths: 1, suicides: 0 },
        { name: 'SkullCrusher', kills: 18, teamKills: 1, deaths: 3, suicides: 0 },
        { name: 'DarkPhoenix', kills: 16, teamKills: 0, deaths: 0, suicides: 0 },
        { name: 'WolfBane', kills: 14, teamKills: 0, deaths: 6, suicides: 1 },
        { name: 'SteelViper', kills: 11, teamKills: 0, deaths: 2, suicides: 0 },
      ]
    }
    gameState.value = liveState
    // TODO: Remove dummy data
    if (!gameState.value || gameState.value.players.length === 0) {
      gameState.value = {
        wave: { current: 7, total: 10, inProgress: true, traderTime: false },
        zeds: { alive: 14, maxAtOnce: 24 },
        difficulty: 'Hard',
        difficultyNum: 4,
        map: 'KF-BioticsLab',
        players: [
          { name: 'FragMaster', perk: 'Commando', perkLevel: 6, kills: 47, monsterKills: { clot: 19, gorefast: 7, crawler: 10, stalker: 1, bloat: 3, siren: 0, husk: 3, scrake: 2, fleshpound: 1, boss: 0, other: 1 }, cash: 3100, health: 0, maxHealth: 100, deaths: 2, ping: 32 },
          { name: 'Zer0Kill', perk: 'Berserker', perkLevel: 5, kills: 43, monsterKills: { clot: 12, gorefast: 7, crawler: 10, stalker: 5, bloat: 1, siren: 3, husk: 1, scrake: 1, fleshpound: 1, boss: 0, other: 2 }, cash: 2350, health: 100, maxHealth: 100, deaths: 3, ping: 28 },
          { name: 'BloodRaven', perk: 'Sharpshooter', perkLevel: 6, kills: 41, monsterKills: { clot: 17, gorefast: 9, crawler: 9, stalker: 1, bloat: 2, siren: 0, husk: 3, scrake: 0, fleshpound: 0, boss: 0, other: 0 }, cash: 1800, health: 78, maxHealth: 100, deaths: 1, ping: 45 },
          { name: 'NightStalker', perk: 'FieldMedic', perkLevel: 6, kills: 35, monsterKills: { clot: 7, gorefast: 4, crawler: 9, stalker: 5, bloat: 4, siren: 3, husk: 1, scrake: 0, fleshpound: 1, boss: 0, other: 1 }, cash: 4200, health: 100, maxHealth: 100, deaths: 4, ping: 18 },
          { name: 'DeadShot', perk: 'SupportSpec', perkLevel: 5, kills: 35, monsterKills: { clot: 14, gorefast: 4, crawler: 9, stalker: 4, bloat: 2, siren: 0, husk: 1, scrake: 0, fleshpound: 0, boss: 0, other: 1 }, cash: 1500, health: 45, maxHealth: 100, deaths: 2, ping: 55 },
          { name: 'ShadowHunter', perk: 'Firebug', perkLevel: 4, kills: 33, monsterKills: { clot: 10, gorefast: 6, crawler: 3, stalker: 6, bloat: 1, siren: 2, husk: 1, scrake: 2, fleshpound: 0, boss: 0, other: 2 }, cash: 900, health: 92, maxHealth: 100, deaths: 5, ping: 67 },
          { name: 'CrimsonBlade', perk: 'Demolitions', perkLevel: 6, kills: 31, monsterKills: { clot: 8, gorefast: 5, crawler: 7, stalker: 3, bloat: 2, siren: 1, husk: 2, scrake: 1, fleshpound: 1, boss: 0, other: 1 }, cash: 2800, health: 100, maxHealth: 100, deaths: 1, ping: 22 },
          { name: 'GhostReaper', perk: 'Commando', perkLevel: 5, kills: 28, monsterKills: { clot: 10, gorefast: 4, crawler: 6, stalker: 3, bloat: 1, siren: 1, husk: 1, scrake: 1, fleshpound: 0, boss: 0, other: 1 }, cash: 1650, health: 85, maxHealth: 100, deaths: 3, ping: 41 },
          { name: 'VenomStrike', perk: 'FieldMedic', perkLevel: 4, kills: 25, monsterKills: { clot: 9, gorefast: 3, crawler: 5, stalker: 2, bloat: 2, siren: 1, husk: 1, scrake: 0, fleshpound: 1, boss: 0, other: 1 }, cash: 3500, health: 100, maxHealth: 100, deaths: 2, ping: 35 },
          { name: 'ThunderBolt', perk: 'Demolitions', perkLevel: 5, kills: 22, monsterKills: { clot: 5, gorefast: 3, crawler: 4, stalker: 2, bloat: 3, siren: 1, husk: 2, scrake: 1, fleshpound: 0, boss: 0, other: 1 }, cash: 2100, health: 65, maxHealth: 100, deaths: 4, ping: 52 },
          { name: 'IronFist', perk: 'Berserker', perkLevel: 6, kills: 20, monsterKills: { clot: 6, gorefast: 4, crawler: 3, stalker: 2, bloat: 1, siren: 1, husk: 1, scrake: 1, fleshpound: 0, boss: 0, other: 1 }, cash: 1900, health: 100, maxHealth: 100, deaths: 1, ping: 19 },
          { name: 'SkullCrusher', perk: 'SupportSpec', perkLevel: 4, kills: 18, monsterKills: { clot: 7, gorefast: 2, crawler: 3, stalker: 1, bloat: 2, siren: 0, husk: 1, scrake: 1, fleshpound: 0, boss: 0, other: 1 }, cash: 1200, health: 55, maxHealth: 100, deaths: 3, ping: 73 },
          { name: 'DarkPhoenix', perk: 'Sharpshooter', perkLevel: 5, kills: 16, monsterKills: { clot: 5, gorefast: 2, crawler: 4, stalker: 1, bloat: 1, siren: 1, husk: 0, scrake: 1, fleshpound: 0, boss: 0, other: 1 }, cash: 2400, health: 100, maxHealth: 100, deaths: 0, ping: 29 },
          { name: 'WolfBane', perk: 'Firebug', perkLevel: 5, kills: 14, monsterKills: { clot: 5, gorefast: 3, crawler: 2, stalker: 1, bloat: 1, siren: 0, husk: 1, scrake: 0, fleshpound: 0, boss: 0, other: 1 }, cash: 800, health: 30, maxHealth: 100, deaths: 6, ping: 88 },
          { name: 'SteelViper', perk: 'Commando', perkLevel: 3, kills: 11, monsterKills: { clot: 4, gorefast: 2, crawler: 2, stalker: 1, bloat: 0, siren: 1, husk: 0, scrake: 0, fleshpound: 0, boss: 0, other: 1 }, cash: 600, health: 100, maxHealth: 100, deaths: 2, ping: 44 },
        ],
        playerCount: 15,
      }
    }
    store.updateServerInfo(
      gameData.value.serverInfo.mapName,
      gameData.value.serverInfo.gameType,
    )
    // Report current map to tracker (records timestamp on change)
    if (gameData.value.serverInfo.mapName) {
      api.reportMapChange(gameData.value.serverInfo.mapName).catch(() => {})
    }
    // Sync dropdown selections
    const currentGT = gameData.value.gameTypes.find((g) => g.selected)
    if (currentGT) selectedGameType.value = currentGT.value
    else if (!selectedGameType.value && gameData.value.gameTypes.length > 0) {
      selectedGameType.value = gameData.value.gameTypes[0]!.value
    }
    const currentM = gameData.value.maps.find((m) => m.selected)
    if (currentM) selectedMap.value = currentM.value
    else if (!selectedMap.value && gameData.value.maps.length > 0) {
      selectedMap.value = gameData.value.maps[0]!.value
    }
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function switchGameType() {
  error.value = ''
  switchSuccess.value = ''
  try {
    const html = await api.submitForm('current_game', {
      GameTypeSelect: selectedGameType.value,
      SwitchGameType: 'Switch',
    })
    await handleSwitchResponse(html, 'Game type switched successfully!')
  } catch (e) {
    error.value = (e as Error).message
  }
}

async function switchMap() {
  error.value = ''
  switchSuccess.value = ''
  try {
    const html = await api.submitForm('current_game', {
      MapSelect: selectedMap.value,
      SwitchMap: 'Switch',
    })
    await handleSwitchResponse(html, 'Map switched successfully!')
  } catch (e) {
    error.value = (e as Error).message
  }
}

async function handleSwitchResponse(html: string, successMsg: string) {
  if (html.includes('Please Wait') || html.includes('server is now switching')) {
    switching.value = true
    // Pause auto-refresh during switch
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
    setTimeout(async () => {
      switching.value = false
      switchSuccess.value = successMsg
      await load()
      // Resume auto-refresh
      refreshInterval = setInterval(load, 5000)
      // Clear success after 5s
      setTimeout(() => { switchSuccess.value = '' }, 5000)
    }, 10000)
  } else {
    gameData.value = parseGame(html)
    store.updateServerInfo(gameData.value.serverInfo.mapName, gameData.value.serverInfo.gameType)
    const currentGT = gameData.value.gameTypes.find((g) => g.selected)
    if (currentGT) selectedGameType.value = currentGT.value
    const currentM = gameData.value.maps.find((m) => m.selected)
    if (currentM) selectedMap.value = currentM.value
    switchSuccess.value = successMsg
    setTimeout(() => { switchSuccess.value = '' }, 5000)
  }
}

onMounted(() => {
  load()
  refreshInterval = setInterval(load, 5000)
  clockInterval = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null }
  if (clockInterval) { clearInterval(clockInterval); clockInterval = null }
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-['Orbitron'] font-bold text-white">
        <i class="ri-dashboard-line text-red-500 mr-2"></i>Server Overview
      </h1>
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500 flex items-center gap-1">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>
    </div>

    <!-- Switching / Success banners -->
    <div v-if="switching" class="bg-yellow-900/20 border border-yellow-900/40 rounded-lg p-6 text-center mb-6">
      <i class="ri-loader-4-line animate-spin text-2xl text-yellow-400 mb-2 block"></i>
      <p class="text-yellow-300 font-semibold">Server is switching maps...</p>
      <p class="text-yellow-400/60 text-sm mt-1">Please wait ~10 seconds while the server changes maps.</p>
    </div>

    <div v-if="switchSuccess" class="bg-green-900/20 border border-green-900/40 rounded-lg px-4 py-3 text-green-400 mb-6 flex items-center gap-2">
      <i class="ri-checkbox-circle-line"></i>{{ switchSuccess }}
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 flex items-center gap-3">
        <i class="ri-loader-4-line animate-spin text-xl"></i>
        <span>Loading server info...</span>
      </div>
    </div>

    <div v-else-if="error && !gameData" class="bg-red-900/20 border border-red-900/40 rounded-lg p-4 text-red-400">
      <i class="ri-error-warning-line mr-2"></i>{{ error }}
    </div>

    <div v-else class="space-y-6">
      <!-- Map Hero Card -->
      <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg overflow-hidden">
        <!-- Two-column layout when image is available -->
        <div v-if="mapImageUrl" class="flex flex-col md:flex-row">
          <!-- Left: Map info (vertically centered) -->
          <div class="order-2 md:order-1 flex-1 flex items-center px-8 py-6">
            <div>
              <div class="text-gray-400 text-xs uppercase tracking-widest mb-2 font-semibold">Current Map</div>
              <h2 class="text-4xl font-['Orbitron'] font-bold text-white tracking-wide">
                {{ currentMap || 'Unknown' }}
              </h2>
              <div class="flex items-center gap-3 mt-3">
                <span class="bg-red-900/60 text-red-200 px-3 py-1 rounded text-sm font-medium flex items-center gap-1.5">
                  <i class="ri-gamepad-line text-xs"></i>
                  {{ currentGameType || 'Unknown' }}
                </span>
                <span class="bg-green-900/60 text-green-200 px-3 py-1 rounded text-sm font-medium flex items-center gap-1.5">
                  <i class="ri-group-line text-xs"></i>
                  {{ playerCount }} player{{ playerCount !== 1 ? 's' : '' }} online
                </span>
              </div>
            </div>
          </div>
          <!-- Right: Map image at natural aspect ratio -->
          <div class="order-1 md:order-2 md:w-1/2 lg:w-[480px] flex-shrink-0">
            <img
              :src="mapImageUrl"
              :alt="currentMap"
              class="w-full h-auto block"
            />
          </div>
        </div>

        <!-- Full-width gradient fallback when no image -->
        <div v-else class="relative">
          <div class="relative h-52 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-red-950/80 via-gray-900 to-black">
              <div class="absolute inset-0 opacity-10" style="background-image: repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(139,0,0,0.3) 40px, rgba(139,0,0,0.3) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(139,0,0,0.3) 40px, rgba(139,0,0,0.3) 41px);"></div>
            </div>
            <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/30"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

            <div class="absolute inset-0 flex items-center justify-between px-8">
              <div>
                <div class="text-gray-400 text-xs uppercase tracking-widest mb-2 font-semibold">Current Map</div>
                <h2 class="text-4xl font-['Orbitron'] font-bold text-white tracking-wide drop-shadow-lg">
                  {{ currentMap || 'Unknown' }}
                </h2>
                <div class="flex items-center gap-3 mt-3">
                  <span class="bg-red-900/60 text-red-200 px-3 py-1 rounded text-sm font-medium flex items-center gap-1.5 backdrop-blur-sm">
                    <i class="ri-gamepad-line text-xs"></i>
                    {{ currentGameType || 'Unknown' }}
                  </span>
                  <span class="bg-green-900/60 text-green-200 px-3 py-1 rounded text-sm font-medium flex items-center gap-1.5 backdrop-blur-sm">
                    <i class="ri-group-line text-xs"></i>
                    {{ playerCount }} player{{ playerCount !== 1 ? 's' : '' }} online
                  </span>
                </div>
              </div>
              <div class="hidden md:flex items-center justify-center w-28 h-28 rounded-xl bg-black/40 border border-red-900/20 backdrop-blur-sm">
                <i class="ri-image-add-line text-4xl text-red-500/40"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Scoreboard -->
      <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg overflow-hidden">
        <div class="px-5 py-3 border-b border-red-900/10 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="ri-bar-chart-line text-red-500"></i>
            <span class="text-white font-semibold text-sm">Live Scoreboard</span>
          </div>
          <router-link to="/players" class="text-red-400 text-xs hover:text-red-300 flex items-center gap-1 transition-colors">
            Manage players <i class="ri-arrow-right-s-line"></i>
          </router-link>
        </div>
        <div v-if="livePlayersSorted.length > 0" class="overflow-x-auto max-h-[290px] overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 z-10">
              <tr class="bg-[#1a0808] text-left">
                <th class="px-3 py-3 font-bold text-gray-300 w-8">#</th>
                <th class="px-3 py-3 font-bold text-gray-300">Player</th>
                <th class="px-3 py-3 font-bold text-gray-300">Perk</th>
                <th class="px-3 py-3 text-right font-bold text-white">Kills</th>
                <th v-for="c in MONSTER_COLS" :key="c.key" class="px-2 py-3 text-right font-bold" :class="c.color">{{ c.label }}</th>
                <th class="px-3 py-3 text-right font-bold text-yellow-400">Cash</th>
                <th class="px-3 py-3 text-right font-bold text-gray-300">HP</th>
                <th class="px-3 py-3 text-right font-bold text-gray-300">Ping</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(p, i) in livePlayersSorted"
                :key="i"
                class="border-t border-red-900/10 hover:bg-white/5 transition-[background-color]"
              >
                <td class="px-3 py-2.5 text-gray-500 font-mono">{{ i + 1 }}</td>
                <td class="px-3 py-2.5 text-white font-medium truncate max-w-[180px]">{{ p.name }}</td>
                <td class="px-3 py-2.5">
                  <span class="px-2 py-0.5 rounded text-xs font-mono" :class="PERK_COLORS[p.perk] || 'text-gray-300 bg-red-900/25'">
                    {{ perkDisplay(p.perk) }}
                  </span>
                </td>
                <td class="px-3 py-2.5 text-right text-white font-mono font-bold">{{ livePlayerTotalKills(p) }}</td>
                <td v-for="c in MONSTER_COLS" :key="c.key" class="px-2 py-2.5 text-right font-mono" :class="p.monsterKills[c.key] > 0 ? c.color : 'text-gray-700'">
                  {{ p.monsterKills[c.key] }}
                </td>
                <td class="px-3 py-2.5 text-right text-yellow-400/80 font-mono">£{{ p.cash }}</td>
                <td class="px-3 py-2.5 text-right font-mono" :class="hpColor(p)">
                  <template v-if="p.health > 0">{{ p.health }}</template>
                  <span v-else class="text-red-600">DEAD</span>
                </td>
                <td class="px-3 py-2.5 text-right text-gray-500 font-mono">{{ p.ping }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="p-12 text-center">
          <i class="ri-user-unfollow-line text-4xl text-gray-600 mb-3 block"></i>
          <p class="text-gray-500">No players connected</p>
        </div>
      </div>

      <!-- Switch Controls + Quick Info -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Switch Game Type -->
        <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-4">
          <div class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Switch Game Type</div>
          <div class="flex items-center gap-2">
            <select
              v-model="selectedGameType"
              :disabled="switching"
              class="bg-black border border-red-900/30 rounded px-3 py-1.5 text-white text-sm cursor-pointer focus:border-red-500 focus:outline-none flex-1 disabled:opacity-50"
            >
              <option v-for="gt in gameData?.gameTypes ?? []" :key="gt.value" :value="gt.value">{{ gt.label }}</option>
            </select>
            <button
              @click="switchGameType"
              :disabled="switching"
              class="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors"
            >Switch</button>
          </div>
        </div>
        <!-- Switch Map -->
        <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-4">
          <div class="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Switch Map</div>
          <div class="flex items-center gap-2">
            <select
              v-model="selectedMap"
              :disabled="switching"
              class="bg-black border border-red-900/30 rounded px-3 py-1.5 text-white text-sm cursor-pointer focus:border-red-500 focus:outline-none flex-1 disabled:opacity-50"
            >
              <option v-for="map in gameData?.maps ?? []" :key="map.value" :value="map.value">{{ map.label }}</option>
            </select>
            <button
              @click="switchMap"
              :disabled="switching"
              class="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors"
            >Switch</button>
          </div>
        </div>
      </div>

      <!-- Compact Info Row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-4 flex items-center gap-3">
          <div class="w-8 h-8 rounded bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <i class="ri-time-line text-red-400 text-sm"></i>
          </div>
          <div>
            <div class="text-gray-500 text-[10px] uppercase tracking-wider">Server Uptime</div>
            <div class="text-white text-lg font-bold leading-tight font-mono">{{ serverUptime }}</div>
          </div>
        </div>
        <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-4 flex items-center gap-3">
          <div class="w-8 h-8 rounded bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <i class="ri-map-pin-time-line text-red-400 text-sm"></i>
          </div>
          <div>
            <div class="text-gray-500 text-[10px] uppercase tracking-wider">Map Running</div>
            <div class="text-white text-lg font-bold leading-tight font-mono">{{ mapUptime }}</div>
          </div>
        </div>
        <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-4 flex items-center gap-3">
          <div class="w-8 h-8 rounded bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <i class="ri-group-line text-red-400 text-sm"></i>
          </div>
          <div>
            <div class="text-gray-500 text-[10px] uppercase tracking-wider">Players</div>
            <div class="text-white text-lg font-bold leading-tight">{{ playerCount }}</div>
          </div>
        </div>
        <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-4 flex items-center gap-3">
          <div class="w-8 h-8 rounded bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <i class="ri-sword-line text-red-400 text-sm"></i>
          </div>
          <div>
            <div class="text-gray-500 text-[10px] uppercase tracking-wider">Wave</div>
            <div class="text-white text-lg font-bold leading-tight font-mono">{{ waveText }}</div>
            <div v-if="waveStatus" class="text-xs mt-0.5" :class="waveStatus === 'In Progress' ? 'text-red-400' : waveStatus === 'Trader' ? 'text-green-400' : 'text-gray-500'">{{ waveStatus }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
