<script setup lang="ts">
/**
 * @component App
 * @description Root application component. Shows a login form when not authenticated,
 * or the full admin layout (header + sidebar + router-view) when authenticated.
 * @returns The rendered application shell
 */
import { ref } from 'vue'
import { useServerStore } from '@/stores/server'
import AppHeader from '@/components/AppHeader.vue'
import AppSidebar from '@/components/AppSidebar.vue'
import { api } from '@/services/api'

const store = useServerStore()

// Login form state
const loginUsername = ref('')
const loginPassword = ref('')
const loginError = ref('')
const loginLoading = ref(false)

// Sidebar state (mobile)
const sidebarOpen = ref(false)

async function handleLogin() {
  loginError.value = ''
  loginLoading.value = true

  try {
    api.setCredentials(loginUsername.value, loginPassword.value)
    const ok = await api.testAuth()
    if (ok) {
      store.login(loginUsername.value, loginPassword.value)
    } else {
      loginError.value = 'Invalid username or password'
    }
  } catch (err) {
    loginError.value = err instanceof Error ? err.message : 'Authentication failed'
  } finally {
    loginLoading.value = false
  }
}

function handleLogout() {
  store.logout()
  loginUsername.value = ''
  loginPassword.value = ''
  loginError.value = ''
}

async function handleRestart() {
  // TODO: POST restart via api service
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <!-- Login screen -->
  <div
    v-if="!store.isAuthenticated"
    class="min-h-screen flex items-center justify-center px-4"
  >
    <div class="w-full max-w-sm bg-horror-gray border border-red-900/30 rounded-lg shadow-blood p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <i class="ri-skull-fill text-red-500 text-4xl mb-3 block"></i>
        <h1 class="font-heading font-bold text-xl text-white tracking-wide">
          KF1 WebAdmin
        </h1>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <input
            v-model="loginUsername"
            type="text"
            placeholder="Username"
            autocomplete="username"
            required
            class="w-full bg-black border border-red-900/50 text-white px-3 py-2.5 rounded-md text-sm focus:border-red-500 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <input
            v-model="loginPassword"
            type="password"
            placeholder="Password"
            autocomplete="current-password"
            required
            class="w-full bg-black border border-red-900/50 text-white px-3 py-2.5 rounded-md text-sm focus:border-red-500 focus:outline-none transition-colors"
          />
        </div>

        <!-- Error message -->
        <p v-if="loginError" class="text-red-400 text-sm">
          {{ loginError }}
        </p>

        <button
          type="submit"
          :disabled="loginLoading"
          class="w-full bg-blood-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-md text-sm transition-colors"
        >
          {{ loginLoading ? 'Authenticating...' : 'Login' }}
        </button>
      </form>
    </div>
  </div>

  <!-- Authenticated layout -->
  <div v-else class="min-h-screen">
    <AppHeader
      :map-name="store.currentMap"
      :game-type="store.currentGameType"
      @toggle-sidebar="toggleSidebar"
      @logout="handleLogout"
    />

    <AppSidebar
      :open="sidebarOpen"
      @restart="handleRestart"
      @close="sidebarOpen = false"
    />

    <!-- Main content area -->
    <main class="pt-14 md:pl-56 min-h-screen">
      <div class="p-6">
        <router-view />
      </div>
    </main>
  </div>
</template>
