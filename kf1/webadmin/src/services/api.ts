/**
 * HTTP client for communicating with the UE2 WebAdmin server.
 *
 * The KF1 game server exposes an HTTP-based admin panel that uses
 * HTTP Basic Auth and serves HTML pages. This module wraps fetch()
 * with credential management, proper headers, and error handling.
 *
 * @module api
 */

import type { GameState } from '@/types'

const BASE_PATH = '/ServerAdmin/'

// ---------------------------------------------------------------------------
// Module-level credential storage
// ---------------------------------------------------------------------------
let _username = ''
let _password = ''

/**
 * Custom error thrown when the server responds with 401 Unauthorized.
 */
export class AuthError extends Error {
  constructor(message = 'Authentication failed') {
    super(message)
    this.name = 'AuthError'
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Build the `Authorization: Basic …` header value. */
function authHeader(): string {
  return 'Basic ' + btoa(`${_username}:${_password}`)
}

/** Shared response handler — throws AuthError on 401. */
async function handleResponse(response: Response): Promise<string> {
  if (response.status === 401) {
    throw new AuthError()
  }

  if (!response.ok) {
    throw new Error(`WebAdmin request failed: ${response.status} ${response.statusText}`)
  }

  return response.text()
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const api = {
  /**
   * Store credentials for all subsequent requests.
   *
   * @param username - WebAdmin username
   * @param password - WebAdmin password
   */
  setCredentials(username: string, password: string): void {
    _username = username
    _password = password
  },

  /**
   * GET an HTML page from the WebAdmin server.
   *
   * @param page   - Page path relative to /ServerAdmin/ (e.g. `"current_players"`)
   * @param params - Optional query-string parameters
   * @returns The response HTML as a string
   * @throws {AuthError} When the server responds with 401
   */
  async fetchPage(page: string, params?: Record<string, string>): Promise<string> {
    let url = `${BASE_PATH}${page}`

    if (params && Object.keys(params).length > 0) {
      const qs = new URLSearchParams(params).toString()
      url += `?${qs}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader(),
      },
    })

    return handleResponse(response)
  },

  /**
   * POST form data to a WebAdmin action endpoint.
   *
   * @param action - Action path relative to /ServerAdmin/ (e.g. `"defaults_rules"`)
   * @param data   - Key/value pairs to send as `application/x-www-form-urlencoded`
   * @returns The response HTML as a string
   * @throws {AuthError} When the server responds with 401
   */
  async submitForm(action: string, data: Record<string, string | string[]>): Promise<string> {
    const url = `${BASE_PATH}${action}`
    const body = new URLSearchParams()
    for (const [key, val] of Object.entries(data)) {
      if (Array.isArray(val)) {
        for (const v of val) body.append(key, v)
      } else {
        body.append(key, val)
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    return handleResponse(response)
  },

  /**
   * Quick authentication check — attempts to fetch the sidebar menu page.
   *
   * @returns `true` if credentials are valid, `false` otherwise
   */
  /** Fetch the map name → image URL mapping from the map images API. */
  async getMapImages(): Promise<Record<string, string>> {
    const res = await fetch('/map-api/maps')
    if (!res.ok) return {}
    return res.json()
  },

  /** Upload an image for a map. */
  async uploadMapImage(mapName: string, file: File): Promise<string> {
    const res = await fetch(`/map-api/upload/${encodeURIComponent(mapName)}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    return data.path
  },

  /** Delete the image for a map. */
  async deleteMapImage(mapName: string): Promise<void> {
    await fetch(`/map-api/upload/${encodeURIComponent(mapName)}`, { method: 'DELETE' })
  },

  /** Fetch server status (uptime + map change tracker). */
  async getServerStatus(): Promise<{ serverStartedAt: string | null; mapName: string | null; mapChangedAt: string | null }> {
    const res = await fetch('/map-api/server-status')
    if (!res.ok) return { serverStartedAt: null, mapName: null, mapChangedAt: null }
    return res.json()
  },

  /** Report current map name to the tracker (records timestamp on change). */
  async reportMapChange(mapName: string): Promise<void> {
    await fetch('/map-api/map-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapName }),
    })
  },

  /** Fetch live game state from the UliunaiStats mutator. */
  async getGameState(): Promise<GameState | null> {
    const res = await fetch('/map-api/game-state')
    if (!res.ok) return null
    const data = await res.json()
    if (data.error) return null
    return data
  },

  /** Sync the current map rotation to KillingFloor.ini so it survives server restarts. */
  async syncMaplist(gameType: string, maps: string[]): Promise<void> {
    await fetch('/map-api/sync-maplist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameType, maps }),
    })
  },

  async testAuth(): Promise<boolean> {
    try {
      await this.fetchPage('current_menu')
      return true
    } catch (error) {
      if (error instanceof AuthError) {
        return false
      }
      throw error
    }
  },
}
