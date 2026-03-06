<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { api } from '@/services/api'
import { parseConsoleLog } from '@/services/parsers'
const lines = ref<string[]>([])
const loading = ref(true)
const error = ref('')
const commandText = ref('say ')
const logContainer = ref<HTMLElement | null>(null)
const sending = ref(false)

let refreshInterval: ReturnType<typeof setInterval> | null = null

async function loadLog() {
  try {
    const html = await api.fetchPage('current_console_log')
    lines.value = parseConsoleLog(html)
    await nextTick()
    scrollToBottom()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function scrollToBottom() {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}

watch(
  () => lines.value.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)

async function sendCommand() {
  if (!commandText.value.trim() || sending.value) return

  sending.value = true
  try {
    await api.submitForm('current_console', {
      SendText: commandText.value,
      Send: 'Send',
    })
    commandText.value = 'say '
    await loadLog()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    sending.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    sendCommand()
  }
}

onMounted(() => {
  loadLog()
  refreshInterval = setInterval(loadLog, 5000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
})
</script>

<template>
  <div class="p-6 flex flex-col h-full">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-['Orbitron'] font-bold text-white">
        <i class="ri-terminal-box-line text-red-500 mr-2"></i>Server Console
      </h1>
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500 flex items-center gap-1">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Auto-refresh: 5s
        </span>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="text-gray-500 flex items-center gap-3">
        <i class="ri-loader-4-line animate-spin text-xl"></i>
        <span>Loading console...</span>
      </div>
    </div>

    <div v-else-if="error && lines.length === 0" class="bg-red-900/20 border border-red-900/40 rounded-lg p-4 text-red-400">
      <i class="ri-error-warning-line mr-2"></i>{{ error }}
    </div>

    <template v-else>
      <!-- Console log area -->
      <div
        class="bg-[#0a0a0a] border border-red-900/20 rounded-t-lg flex-1 min-h-[400px] max-h-[600px] overflow-hidden flex flex-col"
      >
        <div class="flex items-center gap-2 px-4 py-2 bg-[#111] border-b border-red-900/10">
          <span class="w-3 h-3 rounded-full bg-red-600"></span>
          <span class="w-3 h-3 rounded-full bg-yellow-600"></span>
          <span class="w-3 h-3 rounded-full bg-green-600"></span>
          <span class="text-gray-500 text-xs ml-2 font-mono">server_console</span>
        </div>
        <div
          ref="logContainer"
          class="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed"
        >
          <div v-if="!lines.length" class="text-gray-600 italic">
            No console output yet...
          </div>
          <div
            v-for="(line, index) in lines"
            :key="index"
            class="text-gray-300 whitespace-pre-wrap break-all hover:bg-white/5 px-1 -mx-1 rounded"
          >{{ line }}</div>
        </div>
      </div>

      <!-- Command input -->
      <div class="bg-[#111] border border-t-0 border-red-900/20 rounded-b-lg p-3 flex gap-3">
        <div class="flex-1 relative">
          <i class="ri-terminal-line absolute left-3 top-1/2 -translate-y-1/2 text-red-500/50"></i>
          <input
            v-model="commandText"
            type="text"
            maxlength="200"
            @keydown="handleKeydown"
            placeholder="Enter command..."
            class="w-full bg-black border border-red-900/30 rounded px-3 py-2 pl-9 text-white font-mono focus:border-red-500 focus:outline-none"
          />
        </div>
        <button
          @click="sendCommand"
          :disabled="!commandText.trim() || sending"
          class="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <i class="ri-send-plane-fill" :class="{ 'animate-pulse': sending }"></i>
          Send
        </button>
      </div>

      <!-- Error toast (if log is loaded but later refresh fails) -->
      <div v-if="error && lines.length > 0" class="mt-2 text-red-400 text-sm flex items-center gap-1">
        <i class="ri-error-warning-line"></i>{{ error }}
      </div>
    </template>
  </div>
</template>
