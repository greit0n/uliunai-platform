<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { api } from '@/services/api'
import { parseVotingGameConfig } from '@/services/parsers'
import { useServerStore } from '@/stores/server'
import type { VotingGameConfigData, VotingGameConfigEntry } from '@/types'

const store = useServerStore()
const data = ref<VotingGameConfigData | null>(null)
const loading = ref(true)
const error = ref('')
const submitting = ref<number | null>(null)
const success = ref('')

// Local editable state for entries in edit mode
const editState = ref<Record<number, {
  gameType: string
  mapPrefixes: string
  abbreviation: string
  name: string
  mutators: string[]
  options: string
}>>({})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const html = await api.fetchPage('defaults_votinggameconfig', {
      GameType: store.defaultsGameType,
    })
    data.value = parseVotingGameConfig(html)
    store.updateServerInfo(data.value.serverInfo.mapName, data.value.serverInfo.gameType)
    syncEditState()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function syncEditState() {
  if (!data.value) return
  editState.value = {}
  for (const entry of data.value.entries) {
    if (entry.isEditing) {
      editState.value[entry.index] = {
        gameType: entry.gameType,
        mapPrefixes: entry.mapPrefixes,
        abbreviation: entry.abbreviation,
        name: entry.name,
        mutators: [...entry.mutators],
        options: entry.options,
      }
    }
  }
}

async function createNew() {
  if (!data.value || submitting.value !== null) return
  submitting.value = -1
  error.value = ''
  try {
    const html = await api.submitForm(
      `defaults_votinggameconfig?GameConfigIndex=${data.value.newIndex}`,
      { New: 'New' },
    )
    data.value = parseVotingGameConfig(html)
    syncEditState()
    success.value = 'New config created'
    setTimeout(() => { success.value = '' }, 3000)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    submitting.value = null
  }
}

async function editEntry(entry: VotingGameConfigEntry) {
  if (submitting.value !== null) return
  submitting.value = entry.index
  error.value = ''
  try {
    const html = await api.submitForm(
      `defaults_votinggameconfig?GameConfigIndex=${entry.index}`,
      { Edit: 'Edit' },
    )
    data.value = parseVotingGameConfig(html)
    syncEditState()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    submitting.value = null
  }
}

async function updateEntry(entry: VotingGameConfigEntry) {
  if (submitting.value !== null) return
  submitting.value = entry.index
  error.value = ''
  try {
    const state = editState.value[entry.index]
    if (!state) return

    const formData: Record<string, string> = {
      GameType: state.gameType,
      MapPrefixes: state.mapPrefixes,
      Abbreviation: state.abbreviation,
      Name: state.name,
      Options: state.options,
      Update: 'Update',
    }
    // Mutators are sent as multiple values — submit the last selected
    if (state.mutators.length > 0) {
      formData['Mutators'] = state.mutators[state.mutators.length - 1]!
    }

    const html = await api.submitForm(
      `defaults_votinggameconfig?GameConfigIndex=${entry.index}`,
      formData,
    )
    data.value = parseVotingGameConfig(html)
    syncEditState()
    success.value = 'Config saved'
    setTimeout(() => { success.value = '' }, 3000)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    submitting.value = null
  }
}

async function deleteEntry(entry: VotingGameConfigEntry) {
  if (submitting.value !== null) return
  submitting.value = entry.index
  error.value = ''
  try {
    const html = await api.submitForm(
      `defaults_votinggameconfig?GameConfigIndex=${entry.index}`,
      { Delete: 'Delete' },
    )
    data.value = parseVotingGameConfig(html)
    syncEditState()
    success.value = 'Config deleted'
    setTimeout(() => { success.value = '' }, 3000)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    submitting.value = null
  }
}

watch(() => store.defaultsGameType, () => { load() })

onMounted(load)
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-['Orbitron'] font-bold text-white mb-6">
      <i class="ri-vote-line text-red-500 mr-2"></i>Voting GameConfig
    </h1>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 flex items-center gap-3">
        <i class="ri-loader-4-line animate-spin text-xl"></i>
        <span>Loading voting config...</span>
      </div>
    </div>

    <div v-else-if="error && !data" class="bg-red-900/20 border border-red-900/40 rounded-lg p-4 text-red-400">
      <i class="ri-error-warning-line mr-2"></i>{{ error }}
    </div>

    <div v-else-if="data">
      <p class="text-gray-400 text-sm mb-6">
        {{ data.description || 'The game configurations for map voting can be modified from this page.' }}
      </p>

      <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-red-900/10 text-left">
                <th class="px-4 py-3 text-gray-400 font-medium">Game Type</th>
                <th class="px-4 py-3 text-gray-400 font-medium">Map Prefixes</th>
                <th class="px-4 py-3 text-gray-400 font-medium">Abbreviation</th>
                <th class="px-4 py-3 text-gray-400 font-medium">Name</th>
                <th class="px-4 py-3 text-gray-400 font-medium">Mutators</th>
                <th class="px-4 py-3 text-gray-400 font-medium">Options</th>
                <th class="px-4 py-3 text-gray-400 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in data.entries"
                :key="entry.index"
                class="border-t border-red-900/10 hover:bg-white/5 transition-colors"
              >
                <template v-if="entry.isEditing && editState[entry.index]">
                  <!-- Edit mode — bind through a local alias to satisfy TS -->
                  <td class="px-4 py-3">
                    <select
                      v-model="editState[entry.index]!.gameType"
                      class="bg-black border border-red-900/30 rounded px-2 py-1.5 text-white text-sm focus:border-red-500 focus:outline-none"
                    >
                      <option
                        v-for="opt in entry.gameTypeOptions"
                        :key="opt.value"
                        :value="opt.value"
                      >{{ opt.label }}</option>
                    </select>
                  </td>
                  <td class="px-4 py-3">
                    <input
                      v-model="editState[entry.index]!.mapPrefixes"
                      type="text"
                      maxlength="50"
                      class="bg-black border border-red-900/30 rounded px-2 py-1.5 text-white text-sm focus:border-red-500 focus:outline-none w-28"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <input
                      v-model="editState[entry.index]!.abbreviation"
                      type="text"
                      maxlength="20"
                      class="bg-black border border-red-900/30 rounded px-2 py-1.5 text-white text-sm focus:border-red-500 focus:outline-none w-28"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <input
                      v-model="editState[entry.index]!.name"
                      type="text"
                      maxlength="50"
                      class="bg-black border border-red-900/30 rounded px-2 py-1.5 text-white text-sm focus:border-red-500 focus:outline-none w-28"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <select
                      v-model="editState[entry.index]!.mutators"
                      multiple
                      size="4"
                      class="bg-black border border-red-900/30 rounded px-2 py-1 text-white text-xs focus:border-red-500 focus:outline-none min-w-[160px]"
                    >
                      <option
                        v-for="opt in entry.mutatorOptions"
                        :key="opt.value"
                        :value="opt.value"
                      >{{ opt.label }}</option>
                    </select>
                  </td>
                  <td class="px-4 py-3">
                    <input
                      v-model="editState[entry.index]!.options"
                      type="text"
                      maxlength="255"
                      class="bg-black border border-red-900/30 rounded px-2 py-1.5 text-white text-sm focus:border-red-500 focus:outline-none w-28"
                    />
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center gap-2 justify-end">
                      <button
                        @click="updateEntry(entry)"
                        :disabled="submitting === entry.index"
                        class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <i class="ri-save-line"></i>Save
                      </button>
                      <button
                        @click="deleteEntry(entry)"
                        :disabled="submitting === entry.index"
                        class="bg-red-900/50 hover:bg-red-900/70 text-red-300 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <i class="ri-delete-bin-line"></i>Delete
                      </button>
                      <i
                        v-if="submitting === entry.index"
                        class="ri-loader-4-line animate-spin text-gray-400 ml-1"
                      ></i>
                    </div>
                  </td>
                </template>

                <template v-else>
                  <!-- View mode -->
                  <td class="px-4 py-3 text-gray-300">{{ entry.gameType }}</td>
                  <td class="px-4 py-3 text-gray-300 font-mono text-xs">{{ entry.mapPrefixes }}</td>
                  <td class="px-4 py-3 text-gray-300">{{ entry.abbreviation }}</td>
                  <td class="px-4 py-3 text-white font-medium">{{ entry.name }}</td>
                  <td class="px-4 py-3 text-gray-400 text-xs">-</td>
                  <td class="px-4 py-3 text-gray-300 font-mono text-xs">{{ entry.options }}</td>
                  <td class="px-4 py-3 text-right">
                    <button
                      @click="editEntry(entry)"
                      :disabled="submitting === entry.index"
                      class="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1 ml-auto"
                    >
                      <i class="ri-edit-line"></i>Edit
                    </button>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="data.entries.length === 0" class="p-12 text-center">
          <i class="ri-vote-line text-4xl text-gray-600 mb-3 block"></i>
          <p class="text-gray-500">No voting game configs defined</p>
          <p class="text-gray-600 text-xs mt-1">Click "New Config" to add one</p>
        </div>

        <!-- New button -->
        <div class="border-t border-red-900/10 p-4 flex items-center gap-4">
          <button
            @click="createNew"
            :disabled="submitting !== null"
            class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <i class="ri-add-line" :class="{ 'animate-pulse': submitting === -1 }"></i>
            New Config
          </button>
          <span class="text-gray-600 text-xs">
            <i class="ri-information-line mr-1"></i>
            Hold Ctrl/Cmd to select multiple mutators
          </span>
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
