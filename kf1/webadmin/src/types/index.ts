// Shared types for KF1 WebAdmin SPA
// All services and pages import from here

export interface Credentials {
  username: string
  password: string
}

export interface SelectOption {
  value: string
  label: string
  selected: boolean
}

export interface ServerInfo {
  gameType: string
  mapName: string
}

// Players page
export interface Player {
  name: string
  team: string
  ping: number
  score: number
  teamKills: number
  ip: string
  globalId: string
}

export interface PlayersData {
  serverInfo: ServerInfo
  players: Player[]
  minPlayers: number
  noPlayersMessage: string | null
}

// Current Game page
export interface PlayerStats {
  name: string
  kills: number
  teamKills: number
  deaths: number
  suicides: number
}

export interface GameData {
  serverInfo: ServerInfo
  gameTypes: SelectOption[]
  maps: SelectOption[]
  players: PlayerStats[]
}

// Console page
export interface ConsoleData {
  serverInfo: ServerInfo
  lines: string[]
}

// Mutators page
export interface MutatorOption {
  inputName: string
  value: string
  label: string
  description: string
  checked: boolean
}

export interface MutatorGroup {
  name: string
  options: MutatorOption[]
}

export interface MutatorsData {
  serverInfo: ServerInfo
  radioGroups: MutatorGroup[]
  checkboxes: MutatorOption[]
}

// Bots page
export interface BotEntry {
  name: string
  value: string
  inputName: string
  hiddenName: string
  disabled: boolean
  checked: boolean
}

export interface BotCategory {
  name: string
  bots: BotEntry[]
}

export interface BotsData {
  serverInfo: ServerInfo
  categories: BotCategory[]
}

// Rules/Settings pages (Game, Server, Chat, Kick Voting, Map Voting, Sandbox)
export interface RuleSetting {
  label: string
  tooltip: string
  type: 'select' | 'text' | 'checkbox'
  name: string
  value: string
  checked: boolean
  options: SelectOption[]
  range: string
  securityLevel: number
}

export interface RulesData {
  serverInfo: ServerInfo
  title: string
  description: string
  settings: RuleSetting[]
  gameType: string
  filter: string
}

// Maps page
export interface MapsData {
  serverInfo: ServerInfo
  excludedMaps: SelectOption[]
  includedMaps: SelectOption[]
  mapLists: SelectOption[]
}

// IP Policy page
export interface IpPolicy {
  index: number
  action: 'ACCEPT' | 'DENY'
  ipMask: string
  isNew: boolean
}

export interface IpPolicyData {
  serverInfo: ServerInfo
  policies: IpPolicy[]
}

// Rule filter types
export type RuleFilter = 'Game' | 'Server' | 'Chat' | 'Kick Voting' | 'Map Voting' | 'Sandbox'

export const RULE_FILTERS: RuleFilter[] = ['Game', 'Server', 'Chat', 'Kick Voting', 'Map Voting', 'Sandbox']
