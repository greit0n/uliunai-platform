import { defineStore } from 'pinia'
import { api } from '@/services/api'

const SESSION_KEY = 'kf1-webadmin-auth'

function saveSession(username: string, password: string) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ username, password }))
}

function loadSession(): { username: string; password: string } | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

export const useServerStore = defineStore('server', {
  state: () => {
    const saved = loadSession()
    if (saved) {
      api.setCredentials(saved.username, saved.password)
    }
    return {
      username: saved?.username ?? '',
      password: saved?.password ?? '',
      isAuthenticated: !!saved,
      currentMap: '',
      currentGameType: '',
      defaultsGameType: 'KFMod.KFGameType',
    }
  },
  getters: {
    credentials: (state) => ({ username: state.username, password: state.password }),
  },
  actions: {
    login(username: string, password: string) {
      this.username = username
      this.password = password
      this.isAuthenticated = true
      saveSession(username, password)
    },
    logout() {
      this.username = ''
      this.password = ''
      this.isAuthenticated = false
      this.currentMap = ''
      this.currentGameType = ''
      clearSession()
    },
    updateServerInfo(mapName: string, gameType: string) {
      this.currentMap = mapName
      this.currentGameType = gameType
    },
  },
})
