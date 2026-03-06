<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/services/api'
import { parseRules } from '@/services/parsers'
import { useServerStore } from '@/stores/server'
import type { RulesData } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useServerStore()
const data = ref<RulesData | null>(null)
const loading = ref(true)
const error = ref('')
const submitting = ref(false)

// Track form values
const formValues = ref<Record<string, string>>({})
const checkValues = ref<Record<string, boolean>>({})

/** Tabs configuration */
const tabs = [
  { slug: 'game', label: 'Game', filter: 'Game' },
  { slug: 'server', label: 'Server', filter: 'Server' },
  { slug: 'chat', label: 'Chat', filter: 'Chat' },
  { slug: 'kick-voting', label: 'Kick Voting', filter: 'Kick Voting' },
  { slug: 'map-voting', label: 'Map Voting', filter: 'Map Voting' },
  { slug: 'sandbox', label: 'Sandbox', filter: 'Sandbox' },
] as const

/** Current filter slug from route */
const currentSlug = computed(() => (route.params.filter as string) || 'game')

/** Map slug to API filter param */
function slugToFilter(slug: string): string {
  const tab = tabs.find((t) => t.slug === slug)
  return tab?.filter ?? 'Game'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const filterValue = slugToFilter(currentSlug.value)
    const html = await api.fetchPage('defaults_rules', {
      GameType: 'KFMod.KFGameType',
      Filter: filterValue,
    })
    data.value = parseRules(html)
    store.updateServerInfo(data.value.serverInfo.mapName, data.value.serverInfo.gameType)

    // Initialize form values from parsed data
    formValues.value = {}
    checkValues.value = {}
    for (const setting of data.value.settings) {
      if (setting.type === 'checkbox') {
        checkValues.value[setting.name] = setting.checked
      } else {
        formValues.value[setting.name] = setting.value
      }
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

    for (const setting of data.value.settings) {
      if (setting.type === 'checkbox') {
        if (checkValues.value[setting.name]) {
          formData[setting.name] = 'True'
        }
      } else {
        formData[setting.name] = formValues.value[setting.name] ?? setting.value
      }
    }

    formData['GameType'] = data.value.gameType
    formData['Filter'] = data.value.filter
    formData['Save'] = 'Accept'

    const html = await api.submitForm('defaults_rules', formData)
    data.value = parseRules(html)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    submitting.value = false
  }
}

function navigateTab(slug: string) {
  router.push(`/rules/${slug}`)
}

/** Security level badge color */
function securityColor(level: number): string {
  if (level >= 200) return 'text-red-400 bg-red-900/20'
  if (level >= 100) return 'text-orange-400 bg-orange-900/20'
  if (level >= 50) return 'text-yellow-400 bg-yellow-900/20'
  return 'text-green-400 bg-green-900/20'
}

// Watch for route param changes
watch(
  () => route.params.filter,
  () => {
    load()
  }
)

onMounted(load)
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-['Orbitron'] font-bold text-white mb-6">
      <i class="ri-settings-3-line text-red-500 mr-2"></i>Rules & Settings
    </h1>

    <!-- Filter Tabs -->
    <div class="flex gap-1 mb-6 border-b border-red-900/20 overflow-x-auto">
      <button
        v-for="tab in tabs"
        :key="tab.slug"
        @click="navigateTab(tab.slug)"
        class="px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors"
        :class="
          currentSlug === tab.slug
            ? 'bg-red-900/30 text-red-400 border-b-2 border-red-500'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        "
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 flex items-center gap-3">
        <i class="ri-loader-4-line animate-spin text-xl"></i>
        <span>Loading settings...</span>
      </div>
    </div>

    <div v-else-if="error && !data" class="bg-red-900/20 border border-red-900/40 rounded-lg p-4 text-red-400">
      <i class="ri-error-warning-line mr-2"></i>{{ error }}
    </div>

    <div v-else-if="data">
      <!-- Description -->
      <p v-if="data.description" class="text-gray-400 text-sm mb-6">
        {{ data.description }}
      </p>

      <!-- Settings Form -->
      <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-red-900/10 text-left">
                <th class="px-4 py-3 text-gray-400 font-medium">Setting</th>
                <th class="px-4 py-3 text-gray-400 font-medium">Value</th>
                <th class="px-4 py-3 text-gray-400 font-medium text-center w-20">Level</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="setting in data.settings"
                :key="setting.name"
                class="border-t border-red-900/10 hover:bg-white/5 transition-colors group"
              >
                <!-- Label -->
                <td class="px-4 py-3">
                  <span
                    class="text-gray-300 cursor-help"
                    :title="setting.tooltip"
                  >
                    {{ setting.label }}
                  </span>
                  <i
                    v-if="setting.tooltip"
                    class="ri-question-line text-gray-600 ml-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  ></i>
                </td>

                <!-- Input -->
                <td class="px-4 py-3">
                  <!-- Select -->
                  <select
                    v-if="setting.type === 'select'"
                    v-model="formValues[setting.name]"
                    class="bg-black border border-red-900/30 rounded px-3 py-1.5 text-white focus:border-red-500 focus:outline-none text-sm min-w-[180px]"
                  >
                    <option
                      v-for="opt in setting.options"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </option>
                  </select>

                  <!-- Text Input -->
                  <div v-else-if="setting.type === 'text'" class="flex items-center gap-2">
                    <input
                      v-model="formValues[setting.name]"
                      type="text"
                      class="bg-black border border-red-900/30 rounded px-3 py-1.5 text-white focus:border-red-500 focus:outline-none text-sm"
                    />
                    <span v-if="setting.range" class="text-gray-500 text-xs whitespace-nowrap">
                      {{ setting.range }}
                    </span>
                  </div>

                  <!-- Checkbox -->
                  <label v-else-if="setting.type === 'checkbox'" class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="checkValues[setting.name]"
                      class="accent-red-600"
                    />
                    <span class="text-gray-400 text-xs">Enabled</span>
                  </label>
                </td>

                <!-- Security Level -->
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-block px-2 py-0.5 rounded text-xs font-mono"
                    :class="securityColor(setting.securityLevel)"
                  >
                    {{ setting.securityLevel }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Submit -->
        <div class="border-t border-red-900/10 p-4 flex items-center gap-4">
          <button
            @click="submit"
            :disabled="submitting"
            class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <i class="ri-save-line" :class="{ 'animate-pulse': submitting }"></i>
            Save Settings
          </button>
          <span v-if="error" class="text-red-400 text-sm">
            <i class="ri-error-warning-line mr-1"></i>{{ error }}
          </span>
        </div>
      </div>

      <p class="text-gray-600 text-xs mt-4">
        <i class="ri-information-line mr-1"></i>
        Note: Some settings may affect more than one game type.
      </p>
    </div>
  </div>
</template>
