<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'
import { parseMutators } from '@/services/parsers'
import { useServerStore } from '@/stores/server'
import type { MutatorsData } from '@/types'

const store = useServerStore()
const data = ref<MutatorsData | null>(null)
const loading = ref(true)
const error = ref('')
const submitting = ref(false)
const success = ref('')

// Track selections
const radioSelections = ref<Record<string, string>>({})
const checkboxSelections = ref<Record<string, boolean>>({})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const html = await api.fetchPage('current_mutators')
    data.value = parseMutators(html)
    store.updateServerInfo(data.value.serverInfo.mapName, data.value.serverInfo.gameType)

    // Initialize selections from parsed data
    for (const group of data.value.radioGroups) {
      const checked = group.options.find((o) => o.checked)
      radioSelections.value[group.name] = checked?.value ?? 'None'
    }
    for (const cb of data.value.checkboxes) {
      checkboxSelections.value[cb.inputName] = cb.checked
    }
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!data.value || submitting.value) return

  submitting.value = true
  error.value = ''

  try {
    const formData: Record<string, string> = {}

    // Add radio group selections
    for (const [groupName, value] of Object.entries(radioSelections.value)) {
      formData[groupName] = value
    }

    // Add checkbox selections
    for (const [inputName, checked] of Object.entries(checkboxSelections.value)) {
      if (checked) {
        formData[inputName] = 'True'
      }
    }

    formData['setmutes'] = 'Set Selected Mutators'

    const html = await api.submitForm('current_mutators', formData)
    data.value = parseMutators(html)
    success.value = 'Mutators saved! Takes effect on next map change.'
    setTimeout(() => { success.value = '' }, 4000)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    submitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-['Orbitron'] font-bold text-white mb-6">
      <i class="ri-flask-line text-red-500 mr-2"></i>Mutators
    </h1>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 flex items-center gap-3">
        <i class="ri-loader-4-line animate-spin text-xl"></i>
        <span>Loading mutators...</span>
      </div>
    </div>

    <div v-else-if="error && !data" class="bg-red-900/20 border border-red-900/40 rounded-lg p-4 text-red-400">
      <i class="ri-error-warning-line mr-2"></i>{{ error }}
    </div>

    <div v-else-if="data" class="space-y-6">
      <p class="text-gray-400 text-sm">
        Select which mutators you want to be used when you restart the server.
      </p>

      <!-- Radio Groups -->
      <div
        v-for="group in data.radioGroups"
        :key="group.name"
        class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg overflow-hidden"
      >
        <div class="px-6 py-3 bg-red-900/10 border-b border-red-900/10">
          <h2 class="text-white font-semibold flex items-center gap-2">
            <i class="ri-radio-button-line text-red-400 text-sm"></i>
            {{ group.name }}
          </h2>
        </div>
        <div class="p-4 space-y-1">
          <label
            v-for="option in group.options"
            :key="option.value"
            class="flex items-start gap-3 px-3 py-2 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            <input
              type="radio"
              :name="group.name"
              :value="option.value"
              v-model="radioSelections[group.name]"
              class="accent-red-600 mt-1 shrink-0"
            />
            <div class="min-w-0">
              <span class="text-white text-sm font-medium">{{ option.label }}</span>
              <p v-if="option.description" class="text-gray-500 text-xs mt-0.5">{{ option.description }}</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Checkboxes -->
      <div
        v-if="data.checkboxes.length > 0"
        class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg overflow-hidden"
      >
        <div class="px-6 py-3 bg-red-900/10 border-b border-red-900/10">
          <h2 class="text-white font-semibold flex items-center gap-2">
            <i class="ri-checkbox-line text-red-400 text-sm"></i>
            Individual Mutators
          </h2>
        </div>
        <div class="p-4 space-y-1">
          <label
            v-for="cb in data.checkboxes"
            :key="cb.inputName"
            class="flex items-start gap-3 px-3 py-2 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              v-model="checkboxSelections[cb.inputName]"
              class="accent-red-600 mt-1 shrink-0"
            />
            <div class="min-w-0">
              <span class="text-white text-sm font-medium">{{ cb.label }}</span>
              <p v-if="cb.description" class="text-gray-500 text-xs mt-0.5">{{ cb.description }}</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex items-center gap-4">
        <button
          @click="submit"
          :disabled="submitting"
          class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <i class="ri-save-line" :class="{ 'animate-pulse': submitting }"></i>
          Set Selected Mutators
        </button>
        <span v-if="success" class="text-green-400 text-sm flex items-center gap-1">
          <i class="ri-checkbox-circle-line"></i>{{ success }}
        </span>
        <span v-else-if="error" class="text-red-400 text-sm">
          <i class="ri-error-warning-line mr-1"></i>{{ error }}
        </span>
      </div>
    </div>
  </div>
</template>
