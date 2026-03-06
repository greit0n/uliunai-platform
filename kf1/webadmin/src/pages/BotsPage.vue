<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'
import { parseBots } from '@/services/parsers'
import { useServerStore } from '@/stores/server'
import type { BotsData } from '@/types'

const store = useServerStore()
const data = ref<BotsData | null>(null)
const loading = ref(true)
const error = ref('')
const botAction = ref('Add')
const botQuantity = ref('1')
const botChecked = ref<Record<string, boolean>>({})
const submittingQuantity = ref(false)
const submittingSelect = ref(false)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const html = await api.fetchPage('current_bots')
    data.value = parseBots(html)
    store.updateServerInfo(data.value.serverInfo.mapName, data.value.serverInfo.gameType)

    // Initialize checkbox states
    for (const cat of data.value.categories) {
      for (const bot of cat.bots) {
        botChecked.value[bot.inputName] = bot.checked
      }
    }
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function submitQuantity() {
  if (submittingQuantity.value) return
  submittingQuantity.value = true
  error.value = ''
  try {
    const html = await api.submitForm('current_bots', {
      botaction: botAction.value,
      addnum: botQuantity.value,
      addbotnum: 'Accept',
    })
    data.value = parseBots(html)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    submittingQuantity.value = false
  }
}

async function submitSelectedBots() {
  if (!data.value || submittingSelect.value) return
  submittingSelect.value = true
  error.value = ''
  try {
    const formData: Record<string, string> = {}

    for (const cat of data.value.categories) {
      for (const bot of cat.bots) {
        // Always send the hidden field
        formData[bot.hiddenName] = ''
        if (botChecked.value[bot.inputName]) {
          formData[bot.inputName] = bot.value
        }
      }
    }

    formData['selectbots'] = 'Accept'

    const html = await api.submitForm('current_bots', formData)
    data.value = parseBots(html)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    submittingSelect.value = false
  }
}

/** Check if any bots in this page are enabled (game has started) */
function hasEnabledBots(): boolean {
  if (!data.value) return false
  return data.value.categories.some((cat) => cat.bots.some((bot) => !bot.disabled))
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-['Orbitron'] font-bold text-white mb-6">
      <i class="ri-robot-line text-red-500 mr-2"></i>Bots
    </h1>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 flex items-center gap-3">
        <i class="ri-loader-4-line animate-spin text-xl"></i>
        <span>Loading bots...</span>
      </div>
    </div>

    <div v-else-if="error && !data" class="bg-red-900/20 border border-red-900/40 rounded-lg p-4 text-red-400">
      <i class="ri-error-warning-line mr-2"></i>{{ error }}
    </div>

    <div v-else-if="data" class="space-y-6">
      <!-- Add/Remove by Quantity -->
      <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg p-6">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Add / Remove by Quantity
        </h2>
        <div class="flex items-center gap-3 flex-wrap">
          <select
            v-model="botAction"
            class="bg-black border border-red-900/30 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none"
          >
            <option value="Add">Add</option>
            <option value="Remove">Remove</option>
          </select>
          <input
            v-model="botQuantity"
            type="text"
            maxlength="3"
            class="bg-black border border-red-900/30 rounded px-3 py-2 text-white focus:border-red-500 focus:outline-none w-20 text-center"
          />
          <span class="text-gray-400 text-sm">Bot(s) to the current game</span>
          <button
            @click="submitQuantity"
            :disabled="submittingQuantity"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <i class="ri-check-line"></i>Accept
          </button>
        </div>
      </div>

      <!-- Add/Remove by Selecting -->
      <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-red-900/10 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Add / Remove by Selecting
            </h2>
            <p v-if="!hasEnabledBots()" class="text-gray-500 text-xs mt-1">
              <i class="ri-information-line mr-1"></i>Only available once the game has started
            </p>
          </div>
          <button
            @click="submitSelectedBots"
            :disabled="!hasEnabledBots() || submittingSelect"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <i class="ri-check-line"></i>Accept
          </button>
        </div>

        <div class="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="category in data.categories"
            :key="category.name"
            class="bg-black/30 border border-red-900/10 rounded-lg overflow-hidden"
          >
            <div class="px-4 py-2 bg-red-900/10 border-b border-red-900/10">
              <h3 class="text-white text-sm font-semibold">{{ category.name }}</h3>
            </div>
            <div class="p-3 space-y-1">
              <label
                v-for="bot in category.bots"
                :key="bot.inputName"
                class="flex items-center gap-2 px-2 py-1.5 rounded transition-colors"
                :class="bot.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'"
              >
                <input
                  type="checkbox"
                  v-model="botChecked[bot.inputName]"
                  :disabled="bot.disabled"
                  class="accent-red-600 shrink-0"
                />
                <span class="text-gray-300 text-sm">{{ bot.name }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div v-if="error" class="text-red-400 text-sm">
        <i class="ri-error-warning-line mr-1"></i>{{ error }}
      </div>
    </div>
  </div>
</template>
