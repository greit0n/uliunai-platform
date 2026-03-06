/**
 * HTML parsers for the UE2 WebAdmin pages.
 *
 * Each parser takes a raw HTML string from the game server, parses it
 * with DOMParser, and returns a typed data structure matching the
 * interfaces defined in `@/types`.
 *
 * @module parsers
 */

import type {
  ServerInfo,
  PlayersData,
  Player,
  GameData,
  PlayerStats,
  SelectOption,
  MutatorsData,
  MutatorOption,
  MutatorGroup,
  BotsData,
  BotCategory,
  BotEntry,
  RulesData,
  RuleSetting,
  MapsData,
  IpPolicyData,
  IpPolicy,
} from '@/types'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Parse an HTML string into a Document. */
function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

/**
 * Decode `&nbsp;` sequences in a title attribute back to regular spaces.
 * The UE2 WebAdmin uses `&nbsp;` in tooltip titles instead of real spaces.
 * DOMParser converts `&nbsp;` to U+00A0 (non-breaking space).
 */
function decodeNbsp(raw: string): string {
  return raw.replace(/\u00a0/g, ' ').trim()
}

/**
 * Extract server info from the common header pattern.
 * The first `td.ttext` contains text like "Killing Floor in KF-BioticsLab "
 */
function extractServerInfo(doc: Document): ServerInfo {
  const ttext = doc.querySelector('td.ttext')
  const raw = decodeNbsp(ttext?.textContent ?? '')

  // Pattern: "GameType in MapName"
  const match = raw.match(/^(.+?)\s+in\s+(.+)$/)
  if (match) {
    return {
      gameType: (match[1] ?? '').trim(),
      mapName: (match[2] ?? '').trim(),
    }
  }

  return { gameType: '', mapName: '' }
}

/**
 * Parse all `<option>` children of a `<select>` element into SelectOption[].
 */
function parseSelectOptions(select: HTMLSelectElement | null): SelectOption[] {
  if (!select) return []
  return Array.from(select.options).map((opt) => ({
    value: opt.value,
    label: opt.textContent?.trim() ?? '',
    selected: opt.selected,
  }))
}

/**
 * Extract the security level number from the third `<td>` in a rules row.
 * The pattern is a span containing just a number like "     0".
 */
function parseSecurityLevel(td: Element | undefined | null): number {
  if (!td) return 0
  const text = td.textContent?.trim() ?? ''
  const num = parseInt(text, 10)
  return isNaN(num) ? 0 : num
}

/**
 * Extract the range hint from text content following an input.
 * e.g. " (0 - 300)" -> "0 - 300"
 */
function parseRange(td: Element | undefined | null): string {
  if (!td) return ''
  const text = td.textContent ?? ''
  const match = text.match(/\(([^)]+)\)/)
  return match?.[1]?.trim() ?? ''
}

// ---------------------------------------------------------------------------
// Public parsers
// ---------------------------------------------------------------------------

/**
 * Parse the common server info from any page with the standard header.
 *
 * @param html - Raw HTML string
 * @returns ServerInfo with gameType and mapName
 */
export function parseServerInfo(html: string): ServerInfo {
  const doc = parse(html)
  return extractServerInfo(doc)
}

/**
 * Parse the Player List page (`current_players`).
 *
 * The page contains a table with columns: Kick, Session, Ban, Name, Team,
 * Ping, Score, Team Kills, IP, Global ID. When no players are connected,
 * a single row with "** No Players Connected **" is shown instead.
 *
 * @param html - Raw HTML from `current_players`
 * @returns PlayersData
 */
export function parsePlayers(html: string): PlayersData {
  const doc = parse(html)
  const serverInfo = extractServerInfo(doc)

  // Extract MinPlayers value from the text input
  const minPlayersInput = doc.querySelector<HTMLInputElement>('input[name="MinPlayers"]')
  const minPlayers = minPlayersInput ? parseInt(minPlayersInput.value, 10) || 0 : 0

  // Check for "No Players" message
  let noPlayersMessage: string | null = null
  const allTds = Array.from(doc.querySelectorAll('td'))
  for (const td of allTds) {
    const text = td.textContent?.trim() ?? ''
    if (text.includes('** No Players Connected **')) {
      noPlayersMessage = '** No Players Connected **'
      break
    }
  }

  const players: Player[] = []

  if (!noPlayersMessage) {
    // Find the data table — it's the table inside the form with the column headers
    const form = doc.querySelector('form[action="current_players"]')
    if (form) {
      // The second table inside the form has the player rows
      const tables = form.querySelectorAll('table')
      const dataTable = tables[1] ?? null

      if (dataTable) {
        const rows = Array.from(dataTable.querySelectorAll('tr'))
        // Skip header row (index 0), parse player rows
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          if (!row) continue
          const cells = Array.from(row.querySelectorAll('td'))
          // Player rows have 10 cells: Kick, Session, Ban, Name, Team, Ping, Score, Team Kills, IP, Global ID
          if (cells.length >= 10) {
            players.push({
              name: cells[3]?.textContent?.trim() ?? '',
              team: cells[4]?.textContent?.trim() ?? '',
              ping: parseInt(cells[5]?.textContent?.trim() ?? '0', 10) || 0,
              score: parseInt(cells[6]?.textContent?.trim() ?? '0', 10) || 0,
              teamKills: parseInt(cells[7]?.textContent?.trim() ?? '0', 10) || 0,
              ip: cells[8]?.textContent?.trim() ?? '',
              globalId: cells[9]?.textContent?.trim() ?? '',
            })
          }
        }
      }
    }
  }

  return { serverInfo, players, minPlayers, noPlayersMessage }
}

/**
 * Parse the Current Game page (`current_game`).
 *
 * Contains game type select, map select, and a player stats table with
 * columns: Player Name, KILLS, TEAM KILLS, DEATHS, SUICIDES.
 *
 * @param html - Raw HTML from `current_game`
 * @returns GameData
 */
export function parseGame(html: string): GameData {
  const doc = parse(html)
  const serverInfo = extractServerInfo(doc)

  // Game type select
  const gameTypeSelect = doc.querySelector<HTMLSelectElement>('select[name="GameTypeSelect"]')
  const gameTypes = parseSelectOptions(gameTypeSelect)

  // Map select
  const mapSelect = doc.querySelector<HTMLSelectElement>('select[name="MapSelect"]')
  const maps = parseSelectOptions(mapSelect)

  // Player stats table
  const players: PlayerStats[] = []

  // Find the nested stats table — it has border="1"
  const statsTable = doc.querySelector('table[border="1"]')
  if (statsTable) {
    const rows = Array.from(statsTable.querySelectorAll('tr'))
    // Skip header row (index 0), check for "No Players" or parse data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row) continue
      const rowText = row.textContent?.trim() ?? ''

      // Skip "No Players Connected" row
      if (rowText.includes('** No Players Connected **')) continue

      const cells = Array.from(row.querySelectorAll('td'))
      // Player stats rows: Name, Kills, Team Kills, Deaths, Suicides
      if (cells.length >= 5) {
        players.push({
          name: cells[0]?.textContent?.trim() ?? '',
          kills: parseInt(cells[1]?.textContent?.trim() ?? '0', 10) || 0,
          teamKills: parseInt(cells[2]?.textContent?.trim() ?? '0', 10) || 0,
          deaths: parseInt(cells[3]?.textContent?.trim() ?? '0', 10) || 0,
          suicides: parseInt(cells[4]?.textContent?.trim() ?? '0', 10) || 0,
        })
      }
    }
  }

  return { serverInfo, gameTypes, maps, players }
}

/**
 * Parse the Console Log page (`current_console_log`).
 *
 * The console log content is plain text between the body content area
 * and the `#END` anchor. Lines are separated by `<br>` tags or newlines.
 *
 * @param html - Raw HTML from `current_console_log`
 * @returns Array of log lines
 */
export function parseConsoleLog(html: string): string[] {
  const doc = parse(html)

  // The log content is in the cell that contains the <a name="END"> anchor.
  const endAnchor = doc.querySelector('a[name="END"]')
  if (!endAnchor?.parentElement) return []

  const contentCell = endAnchor.parentElement

  // Get the HTML content of the cell and extract text before the anchor
  const cellHtml = contentCell.innerHTML
  const anchorIdx = cellHtml.indexOf('<a ')
  const logHtml = anchorIdx >= 0 ? cellHtml.substring(0, anchorIdx) : cellHtml

  // Split by <br> tags and filter out empty lines
  const lines = logHtml
    .split(/<br\s*\/?>/i)
    .map((line) => line.replace(/<[^>]*>/g, '').trim())
    .filter((line) => line.length > 0)

  return lines
}

/**
 * Parse the Mutators page (`current_mutators`).
 *
 * Radio inputs are grouped by their `name` attribute (e.g. "KF-MonsterMut").
 * Standalone checkboxes each represent an individual mutator toggle.
 *
 * @param html - Raw HTML from `current_mutators`
 * @returns MutatorsData
 */
export function parseMutators(html: string): MutatorsData {
  const doc = parse(html)
  const serverInfo = extractServerInfo(doc)

  const radioGroups: MutatorGroup[] = []
  const checkboxes: MutatorOption[] = []

  // Collect all radio inputs, group them by name
  const radioInputs = Array.from(doc.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
  const groupMap = new Map<string, MutatorOption[]>()
  const groupOrder: string[] = []

  for (const radio of radioInputs) {
    const inputName = radio.name
    const value = radio.value
    const checked = radio.checked

    // The radio's row: <tr><td>&nbsp;&nbsp;&nbsp;&nbsp;<input ...>&nbsp;LabelText</td><td>Description</td></tr>
    const row = radio.closest('tr')
    if (!row) continue

    const cells = Array.from(row.querySelectorAll('td'))
    const labelCell = cells[0]
    const descCell = cells[1]

    // Extract label — get text content of label cell and remove leading whitespace/nbsp
    const rawText = decodeNbsp(labelCell?.textContent ?? '')
    // The label is everything after the "None" / radio value marker
    // Just take the full trimmed text (it starts with the label since input has no textContent)
    const label = rawText
    const description = descCell?.textContent?.trim() ?? ''

    const option: MutatorOption = {
      inputName,
      value,
      label,
      description,
      checked,
    }

    if (!groupMap.has(inputName)) {
      groupMap.set(inputName, [])
      groupOrder.push(inputName)
    }
    groupMap.get(inputName)!.push(option)
  }

  // Convert radio group map to array, preserving insertion order
  for (const name of groupOrder) {
    const options = groupMap.get(name)
    if (options) {
      radioGroups.push({ name, options })
    }
  }

  // Collect all checkbox inputs
  const checkboxInputs = Array.from(doc.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
  for (const cb of checkboxInputs) {
    const inputName = cb.name
    const value = cb.value
    const checked = cb.checked

    const row = cb.closest('tr')
    if (!row) continue

    const cells = Array.from(row.querySelectorAll('td'))
    const labelCell = cells[0]
    const descCell = cells[1]

    // Extract label from the cell text content
    const rawLabel = decodeNbsp(labelCell?.textContent ?? '')
    const description = descCell?.textContent?.trim() ?? ''

    checkboxes.push({
      inputName,
      value,
      label: rawLabel,
      description,
      checked,
    })
  }

  return { serverInfo, radioGroups, checkboxes }
}

/**
 * Parse the Bots page (`current_bots`).
 *
 * Bots are organized in categories, each in a separate inner table.
 * Category names appear in cells with `bgcolor=#444444`.
 * Each bot row has a hidden input and a checkbox input.
 *
 * @param html - Raw HTML from `current_bots`
 * @returns BotsData
 */
export function parseBots(html: string): BotsData {
  const doc = parse(html)
  const serverInfo = extractServerInfo(doc)

  const categories: BotCategory[] = []

  // Find all category header cells (bgcolor=#444444)
  // The HTML uses unquoted attribute: bgcolor=#444444
  // DOMParser normalizes this; search all tds for the bgcolor attribute
  const allTds = Array.from(doc.querySelectorAll('td'))
  const headerTds = allTds.filter((td) => {
    const bg = td.getAttribute('bgcolor')
    return bg !== null && bg.replace('#', '') === '444444'
  })

  for (const headerTd of headerTds) {
    const categoryName = headerTd.textContent?.trim() ?? ''
    const categoryTable = headerTd.closest('table')
    if (!categoryTable) continue

    const bots: BotEntry[] = []
    const rows = Array.from(categoryTable.querySelectorAll('tr'))

    for (const row of rows) {
      const hidden = row.querySelector<HTMLInputElement>('input[type="hidden"]')
      const checkbox = row.querySelector<HTMLInputElement>('input[type="checkbox"]')

      if (hidden && checkbox) {
        bots.push({
          name: checkbox.value,
          value: checkbox.value,
          inputName: checkbox.name,
          hiddenName: hidden.name,
          disabled: checkbox.disabled,
          checked: checkbox.checked,
        })
      }
    }

    if (bots.length > 0) {
      categories.push({ name: categoryName, bots })
    }
  }

  return { serverInfo, categories }
}

/**
 * Parse a Rules/Settings page (`defaults_rules` with various Filter values).
 *
 * Each setting row has 3 columns:
 * 1. Label span with tooltip in the `title` attribute
 * 2. Input (select, text, or checkbox) with optional range hint
 * 3. Security level number
 *
 * Hidden fields contain the `GameType` and `Filter` values.
 *
 * @param html - Raw HTML from `defaults_rules?GameType=...&Filter=...`
 * @returns RulesData
 */
export function parseRules(html: string): RulesData {
  const doc = parse(html)
  const serverInfo = extractServerInfo(doc)

  // Title is in td.ttitle
  const titleEl = doc.querySelector('td.ttitle')
  const title = titleEl?.textContent?.trim() ?? ''

  // Description is in the second td.ttext
  const ttextEls = Array.from(doc.querySelectorAll('td.ttext'))
  const description = ttextEls[1]?.textContent?.trim() ?? ''

  // Hidden fields
  const gameTypeInput = doc.querySelector<HTMLInputElement>('input[name="GameType"]')
  const filterInput = doc.querySelector<HTMLInputElement>('input[name="Filter"]')
  const gameType = gameTypeInput?.value ?? ''
  const filter = filterInput?.value ?? ''

  const settings: RuleSetting[] = []

  // Find the form's main table
  const form = doc.querySelector('form[action="defaults_rules"]')
  if (!form) return { serverInfo, title, description, settings, gameType, filter }

  const table = form.querySelector('table')
  if (!table) return { serverInfo, title, description, settings, gameType, filter }

  const rows = Array.from(table.querySelectorAll('tr'))

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td'))
    if (cells.length < 2) continue

    const labelCell = cells[0]
    const inputCell = cells[1]
    const securityCell = cells[2]

    if (!labelCell || !inputCell) continue

    // Label and tooltip from span.location
    const labelSpan = labelCell.querySelector('span.location')
    if (!labelSpan) continue

    const label = decodeNbsp(labelSpan.textContent ?? '')
    const tooltip = decodeNbsp(labelSpan.getAttribute('title') ?? '')

    // Skip the "Required Security Level" spans used in the third column
    if (tooltip === 'Required Security Level') continue

    // Security level
    const securityLevel = parseSecurityLevel(securityCell)

    // Determine input type and extract value
    const select = inputCell.querySelector<HTMLSelectElement>('select')
    const checkbox = inputCell.querySelector<HTMLInputElement>('input[type="checkbox"]')
    const textInput = inputCell.querySelector<HTMLInputElement>('input[type="text"]')

    if (select) {
      settings.push({
        label,
        tooltip,
        type: 'select',
        name: select.name,
        value: select.value,
        checked: false,
        options: parseSelectOptions(select),
        range: '',
        securityLevel,
      })
    } else if (checkbox) {
      settings.push({
        label,
        tooltip,
        type: 'checkbox',
        name: checkbox.name,
        value: checkbox.value,
        checked: checkbox.checked,
        options: [],
        range: '',
        securityLevel,
      })
    } else if (textInput) {
      settings.push({
        label,
        tooltip,
        type: 'text',
        name: textInput.name,
        value: textInput.value,
        checked: false,
        options: [],
        range: parseRange(inputCell),
        securityLevel,
      })
    }
  }

  return { serverInfo, title, description, settings, gameType, filter }
}

/**
 * Parse the Maps page (`defaults_maps`).
 *
 * Contains two multi-select lists: `ExcludeMapsSelect` (maps not in cycle)
 * and `IncludeMapsSelect` (maps in cycle), plus a `MapListNum` select for
 * managing map lists.
 *
 * @param html - Raw HTML from `defaults_maps`
 * @returns MapsData
 */
export function parseMaps(html: string): MapsData {
  const doc = parse(html)
  const serverInfo = extractServerInfo(doc)

  const excludeSelect = doc.querySelector<HTMLSelectElement>('select[name="ExcludeMapsSelect"]')
  const includeSelect = doc.querySelector<HTMLSelectElement>('select[name="IncludeMapsSelect"]')
  const mapListSelect = doc.querySelector<HTMLSelectElement>('select[name="MapListNum"]')

  const excludedMaps = parseSelectOptions(excludeSelect)
  const includedMaps = parseSelectOptions(includeSelect)
  const mapLists = parseSelectOptions(mapListSelect)

  // Filter out the "*** None ***" placeholder from included maps
  const filteredIncluded = includedMaps.filter((m) => m.value !== '' || m.label !== '*** None ***')

  return { serverInfo, excludedMaps, includedMaps: filteredIncluded, mapLists }
}

/**
 * Parse the IP Policy page (`defaults_ippolicy`).
 *
 * Each IP policy row is its own `<form>` with action `defaults_ippolicy?IpNo=N`.
 * Each form contains Accept/Deny radios and an IP mask text input.
 * The last form (with a "New" button instead of "Update") is the "add new" row.
 *
 * @param html - Raw HTML from `defaults_ippolicy`
 * @returns IpPolicyData
 */
export function parseIpPolicies(html: string): IpPolicyData {
  const doc = parse(html)
  const serverInfo = extractServerInfo(doc)

  const policies: IpPolicy[] = []

  // Each policy is in its own form with action="defaults_ippolicy?IpNo=N"
  const forms = Array.from(doc.querySelectorAll('form[action^="defaults_ippolicy"]'))

  for (const form of forms) {
    const actionAttr = form.getAttribute('action') ?? ''
    const ipNoMatch = actionAttr.match(/IpNo=(\d+)/)
    const index = ipNoMatch ? parseInt(ipNoMatch[1] ?? '0', 10) : 0

    // Determine ACCEPT or DENY from radio buttons
    const denyRadio = form.querySelector<HTMLInputElement>('input[name="AcceptDeny"][value="DENY"]')
    const action: 'ACCEPT' | 'DENY' = denyRadio?.checked ? 'DENY' : 'ACCEPT'

    // IP mask
    const ipMaskInput = form.querySelector<HTMLInputElement>('input[name="IPMask"]')
    const ipMask = ipMaskInput?.value ?? ''

    // Determine if this is the "new" row — it has a "New" submit button instead of "Update"
    const newButton = form.querySelector<HTMLInputElement>('input[type="Submit"][value="New"], input[type="submit"][value="New"]')
    const isNew = newButton !== null

    policies.push({ index, action, ipMask, isNew })
  }

  return { serverInfo, policies }
}
