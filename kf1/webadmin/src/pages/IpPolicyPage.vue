<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/services/api'
import { parseIpPolicies } from '@/services/parsers'
import { useServerStore } from '@/stores/server'
import type { IpPolicyData, IpPolicy } from '@/types'

const store = useServerStore()
const data = ref<IpPolicyData | null>(null)
const loading = ref(true)
const error = ref('')
const submittingRow = ref<number | null>(null)

// Local editable copies of policy rows
const editedPolicies = ref<Array<{ action: 'ACCEPT' | 'DENY'; ipMask: string }>>([])

async function load() {
  loading.value = true
  error.value = ''
  try {
    const html = await api.fetchPage('defaults_ippolicy')
    data.value = parseIpPolicies(html)
    store.updateServerInfo(data.value.serverInfo.mapName, data.value.serverInfo.gameType)
    syncEdited()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function syncEdited() {
  if (!data.value) return
  editedPolicies.value = data.value.policies.map((p) => ({
    action: p.action,
    ipMask: p.ipMask,
  }))
}

async function submitRow(policy: IpPolicy, index: number, buttonAction: 'Update' | 'Delete' | 'New') {
  if (submittingRow.value !== null) return
  submittingRow.value = index
  error.value = ''

  try {
    const edited = editedPolicies.value[index]!
    const formData: Record<string, string> = {
      AcceptDeny: edited.action,
      IPMask: edited.ipMask,
    }

    // The button value matches the displayed text
    const buttonValue = buttonAction === 'New' ? 'New' : buttonAction
    if (buttonAction === 'Delete') {
      formData['Delete'] = buttonValue
    } else {
      formData['Update'] = buttonValue
    }

    const html = await api.submitForm(`defaults_ippolicy?IpNo=${policy.index}`, formData)
    data.value = parseIpPolicies(html)
    syncEdited()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    submittingRow.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <h1 class="text-2xl font-['Orbitron'] font-bold text-white mb-6">
      <i class="ri-shield-keyhole-line text-red-500 mr-2"></i>IP Access Policies
    </h1>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 flex items-center gap-3">
        <i class="ri-loader-4-line animate-spin text-xl"></i>
        <span>Loading policies...</span>
      </div>
    </div>

    <div v-else-if="error && !data" class="bg-red-900/20 border border-red-900/40 rounded-lg p-4 text-red-400">
      <i class="ri-error-warning-line mr-2"></i>{{ error }}
    </div>

    <div v-else-if="data">
      <p class="text-gray-400 text-sm mb-6">
        Manage IP access policies. Banned players are automatically added to this list.
        You can manually add IP-based rules below.
      </p>

      <div class="bg-[#1a1a1a]/50 border border-red-900/20 rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-red-900/10 text-left">
                <th class="px-4 py-3 text-gray-400 font-medium w-8 text-center">#</th>
                <th class="px-4 py-3 text-gray-400 font-medium">Policy Action</th>
                <th class="px-4 py-3 text-gray-400 font-medium">IP Mask</th>
                <th class="px-4 py-3 text-gray-400 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(policy, index) in data.policies"
                :key="index"
                class="border-t border-red-900/10 hover:bg-white/5 transition-colors"
                :class="{ 'bg-green-900/5': policy.isNew }"
              >
                <!-- Index -->
                <td class="px-4 py-3 text-gray-500 text-center font-mono text-xs">
                  {{ policy.isNew ? '+' : policy.index }}
                </td>

                <!-- Accept/Deny radios -->
                <td class="px-4 py-3">
                  <div class="flex items-center gap-4">
                    <label v-if="editedPolicies[index]" class="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        :name="'action_' + index"
                        value="ACCEPT"
                        v-model="editedPolicies[index].action"
                        class="accent-red-600"
                      />
                      <span class="text-green-400 text-sm flex items-center gap-1">
                        <i class="ri-check-line text-xs"></i>Accept
                      </span>
                    </label>
                    <label v-if="editedPolicies[index]" class="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        :name="'action_' + index"
                        value="DENY"
                        v-model="editedPolicies[index].action"
                        class="accent-red-600"
                      />
                      <span class="text-red-400 text-sm flex items-center gap-1">
                        <i class="ri-close-line text-xs"></i>Deny
                      </span>
                    </label>
                  </div>
                </td>

                <!-- IP Mask -->
                <td v-if="editedPolicies[index]" class="px-4 py-3">
                  <input
                    v-model="editedPolicies[index].ipMask"
                    type="text"
                    maxlength="25"
                    placeholder="e.g., 192.168.1.*"
                    class="bg-black border border-red-900/30 rounded px-3 py-1.5 text-white font-mono focus:border-red-500 focus:outline-none text-sm w-full max-w-[200px]"
                  />
                </td>

                <!-- Actions -->
                <td class="px-4 py-3 text-right">
                  <div class="flex items-center gap-2 justify-end">
                    <template v-if="policy.isNew">
                      <button
                        @click="submitRow(policy, index, 'New')"
                        :disabled="submittingRow === index"
                        class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <i class="ri-add-line"></i>Add
                      </button>
                    </template>
                    <template v-else>
                      <button
                        @click="submitRow(policy, index, 'Update')"
                        :disabled="submittingRow === index"
                        class="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <i class="ri-save-line"></i>Update
                      </button>
                      <button
                        @click="submitRow(policy, index, 'Delete')"
                        :disabled="submittingRow === index"
                        class="bg-red-900/50 hover:bg-red-900/70 text-red-300 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <i class="ri-delete-bin-line"></i>Delete
                      </button>
                    </template>
                    <i
                      v-if="submittingRow === index"
                      class="ri-loader-4-line animate-spin text-gray-400 ml-1"
                    ></i>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="data.policies.length === 0" class="p-12 text-center">
          <i class="ri-shield-line text-4xl text-gray-600 mb-3 block"></i>
          <p class="text-gray-500">No IP policies configured</p>
        </div>
      </div>

      <div v-if="error" class="mt-4 text-red-400 text-sm">
        <i class="ri-error-warning-line mr-1"></i>{{ error }}
      </div>
    </div>
  </div>
</template>
