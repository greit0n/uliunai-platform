import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('/webadmin/'),
  routes: [
    { path: '/', redirect: '/overview' },
    { path: '/overview', name: 'overview', component: () => import('@/pages/OverviewPage.vue') },
    { path: '/players', name: 'players', component: () => import('@/pages/PlayersPage.vue') },
    { path: '/game', redirect: '/overview' },
    { path: '/console', name: 'console', component: () => import('@/pages/ConsolePage.vue') },
    { path: '/mutators', name: 'mutators', component: () => import('@/pages/MutatorsPage.vue') },
    { path: '/bots', name: 'bots', component: () => import('@/pages/BotsPage.vue') },
    { path: '/rules/:filter?', name: 'rules', component: () => import('@/pages/RulesPage.vue') },
    { path: '/maps', name: 'maps', component: () => import('@/pages/MapsPage.vue') },
    { path: '/ip-policy', name: 'ip-policy', component: () => import('@/pages/IpPolicyPage.vue') },
    { path: '/voting-gameconfig', name: 'voting-gameconfig', component: () => import('@/pages/VotingGameConfigPage.vue') },
    { path: '/map-images', name: 'map-images', component: () => import('@/pages/MapImagesPage.vue') },
  ],
})

export default router
