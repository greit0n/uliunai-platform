import { defineStore } from 'pinia'

export const useServerStore = defineStore('server', {
  state: () => ({
    username: '',
    password: '',
    isAuthenticated: false,
    currentMap: '',
    currentGameType: '',
  }),
  getters: {
    credentials: (state) => ({ username: state.username, password: state.password }),
  },
  actions: {
    login(username: string, password: string) {
      this.username = username
      this.password = password
      this.isAuthenticated = true
    },
    logout() {
      this.username = ''
      this.password = ''
      this.isAuthenticated = false
      this.currentMap = ''
      this.currentGameType = ''
    },
    updateServerInfo(mapName: string, gameType: string) {
      this.currentMap = mapName
      this.currentGameType = gameType
    },
  },
})
