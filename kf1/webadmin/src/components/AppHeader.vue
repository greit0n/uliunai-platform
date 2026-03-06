<script setup lang="ts">
/**
 * @component AppHeader
 * @description Fixed top header bar for the admin panel. Displays branding,
 * current server info, and navigation controls.
 * @param {string} mapName - Current map name from the server
 * @param {string} gameType - Current game type from the server
 * @returns The rendered header bar
 */

defineProps<{
  mapName: string
  gameType: string
}>()

const emit = defineEmits<{
  'toggle-sidebar': []
  'logout': []
}>()
</script>

<template>
  <header class="fixed top-0 left-0 right-0 h-14 bg-black/90 backdrop-blur-md border-b border-red-900/30 z-50 flex items-center justify-between px-4">
    <!-- Left: hamburger (mobile) + branding -->
    <div class="flex items-center gap-3">
      <button
        class="md:hidden text-gray-400 hover:text-white p-1"
        @click="emit('toggle-sidebar')"
      >
        <i class="ri-menu-line text-xl"></i>
      </button>
      <div class="flex items-center gap-2">
        <i class="ri-skull-fill text-red-500 text-xl"></i>
        <span class="font-heading font-bold text-lg text-white hidden sm:inline">KF1 WebAdmin</span>
      </div>
    </div>

    <!-- Center/Right: server info -->
    <div
      v-if="mapName || gameType"
      class="hidden sm:flex items-center gap-4 text-sm text-gray-400"
    >
      <div v-if="mapName" class="flex items-center gap-1.5">
        <i class="ri-map-line text-red-500/70"></i>
        <span class="text-gray-300">{{ mapName }}</span>
      </div>
      <div v-if="gameType" class="flex items-center gap-1.5">
        <i class="ri-gamepad-line text-red-500/70"></i>
        <span class="text-gray-300">{{ gameType }}</span>
      </div>
    </div>

    <!-- Far right: logout -->
    <button
      class="text-gray-400 hover:text-red-400 transition-colors p-1"
      title="Logout"
      @click="emit('logout')"
    >
      <i class="ri-logout-box-line text-xl"></i>
    </button>
  </header>
</template>
