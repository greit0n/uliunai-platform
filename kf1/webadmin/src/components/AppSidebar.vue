<script setup lang="ts">
/**
 * @component AppSidebar
 * @description Fixed left sidebar navigation for the admin panel. Contains links
 * to all admin pages grouped by category, plus a restart map action and external link.
 * @param {boolean} open - Whether the sidebar is visible on mobile
 * @returns The rendered sidebar navigation
 */
import { useRoute } from 'vue-router'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'restart': []
  'close': []
}>()

const route = useRoute()

interface NavItem {
  label: string
  icon: string
  to: string
}

const currentItems: NavItem[] = [
  { label: 'Players', icon: 'ri-group-line', to: '/players' },
  { label: 'Current Game', icon: 'ri-gamepad-line', to: '/game' },
  { label: 'Console', icon: 'ri-terminal-line', to: '/console' },
  { label: 'Mutators', icon: 'ri-flask-line', to: '/mutators' },
  { label: 'Bots', icon: 'ri-robot-line', to: '/bots' },
]

const defaultItems: NavItem[] = [
  { label: 'Game Rules', icon: 'ri-settings-3-line', to: '/rules/game' },
  { label: 'Maps', icon: 'ri-map-line', to: '/maps' },
  { label: 'Access Policy', icon: 'ri-shield-keyhole-line', to: '/ip-policy' },
]

function isActive(to: string): boolean {
  return route.path === to || route.path.startsWith(to + '/')
}
</script>

<template>
  <!-- Mobile overlay -->
  <div
    v-if="open"
    class="fixed inset-0 bg-black/60 z-30 md:hidden"
    @click="emit('close')"
  ></div>

  <aside
    :class="[
      'fixed top-14 left-0 bottom-0 w-56 bg-gray-950 border-r border-red-900/30 z-40 flex flex-col',
      'transition-transform duration-200 ease-in-out',
      open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
    ]"
  >
    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4">
      <!-- Current section -->
      <div class="px-4 mb-2">
        <span class="text-[10px] font-semibold text-red-500/60 uppercase tracking-wider">
          Current
        </span>
      </div>
      <router-link
        v-for="item in currentItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
          isActive(item.to)
            ? 'bg-red-900/20 text-red-400 border-l-2 border-blood-red'
            : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent',
        ]"
        @click="emit('close')"
      >
        <i :class="[item.icon, 'text-base']"></i>
        <span>{{ item.label }}</span>
      </router-link>

      <!-- Defaults section -->
      <div class="px-4 mt-6 mb-2">
        <span class="text-[10px] font-semibold text-red-500/60 uppercase tracking-wider">
          Defaults
        </span>
      </div>
      <router-link
        v-for="item in defaultItems"
        :key="item.to"
        :to="item.to"
        :class="[
          'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
          isActive(item.to)
            ? 'bg-red-900/20 text-red-400 border-l-2 border-blood-red'
            : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent',
        ]"
        @click="emit('close')"
      >
        <i :class="[item.icon, 'text-base']"></i>
        <span>{{ item.label }}</span>
      </router-link>

      <!-- Separator + Restart -->
      <div class="mx-4 my-4 border-t border-red-900/20"></div>
      <button
        class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent w-full transition-colors"
        @click="emit('restart')"
      >
        <i class="ri-restart-line text-base"></i>
        <span>Restart Map</span>
      </button>
    </nav>

    <!-- Bottom: back to site -->
    <div class="border-t border-red-900/20 p-3">
      <a
        href="https://kf1-uliunai.fezle.io"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-2 px-2 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <i class="ri-arrow-left-line text-base"></i>
        <span>Back to Site</span>
      </a>
    </div>
  </aside>
</template>
