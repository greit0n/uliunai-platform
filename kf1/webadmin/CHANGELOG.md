# KF1 WebAdmin — Changelog

Complete rework of the KF1 Killing Floor server admin panel. Replaced the stock UE2 HTML WebAdmin with a modern Vue 3 SPA that proxies to the original server backend.

## Tech Stack

- **Vue 3** + TypeScript + Vite
- **Tailwind CSS** — dark horror/gaming theme matching the main site
- **Vue Router** — SPA with sidebar navigation
- Proxied through **Caddy** at `/webadmin/` → static SPA, `/ServerAdmin/` → game server

## Pages

### Overview (Dashboard)
- Live server dashboard with 5-second auto-refresh
- Map hero card showing current map preview image (extracted from game files)
- Player count, game type, and current map at a glance
- Player list preview (top 5 with ping)
- Game info card (map, rotation size, min players)
- Console log preview (last 5 lines)
- Player stats table (kills, deaths, TK, suicides)
- Links to detailed pages from each card

### Game (Live)
- Switch map and game type via dropdowns
- Player stats table for current round

### Players (Live)
- Full player list with name, team, ping, score, team kills, IP, global ID
- Kick, session ban, and permanent ban checkboxes per player
- Set minimum players

### Console (Live)
- Full scrollable console log output
- Send commands to the server
- Auto-scroll to bottom on new output

### Mutators (Live)
- Radio groups for mutator variants (e.g., monster mutator options)
- Checkbox toggles for individual mutators
- Grouped display with descriptions

### Bots (Live)
- Bot categories with individual bot toggles
- Enable/disable bots per category

### Map Rotation (Config)
- Dual-list UI: "Not In Cycle" (left) ↔ "In Cycle" (right)
- Single arrows move only selected maps, double arrows move all
- **Multi-select** with Ctrl+click (toggle) and Shift+click (range)
- **Drag-and-drop** reordering in the cycle list with visual drop indicator
- Map preview image on selection (extracted from game files)
- Replaced the original Up/Down buttons with drag-and-drop

### Game Rules (Config)
- Tabbed UI for rule categories: Game, Chat, Kick Voting, Map Voting, Sandbox, Server
- Text inputs, dropdowns, and checkboxes with range hints
- Security level indicators per setting
- Tooltip descriptions from the server

### Voting Config (Config)
- View/edit game voting configurations
- Inline editing with game type dropdown, map prefixes, mutator multi-select
- Add new / delete entries

### Access Policy (Config)
- IP allow/deny rules management
- Add, update, and delete IP policies
- Accept/Deny radio per rule

### Map Images (Config)
- Grid view of ALL maps (not just cycle — all 34+)
- Upload/replace/delete preview images per map
- Hover overlay with action buttons
- Supports JPG, PNG, WebP up to 5MB

## Navigation

Sidebar reorganized by usage frequency:

```
Overview
── LIVE ──────────────
  Game
  Players
  Console
  Mutators
  Bots
── SERVER CONFIG ─────
  [Game Type dropdown]
  Map Rotation
  Game Rules
  Voting Config
  Access Policy
  Map Images
──────────────────────
  Restart Map
  Back to Site
```

## Map Image Extraction

Instead of requiring manual screenshot uploads, map preview textures are extracted directly from the KF1 game files (`.rom` UE2 packages):

- Custom Python script: `kf1/tools/extract_map_previews.py`
- Parses UE2 binary package format (signature `0x9E2A83C2`, version 128)
- Supports DXT1/DXT3/DXT5/RGBA8 texture decompression
- 18/19 stock maps extracted automatically (KF-Menu has no preview)
- For community maps: use `--list-textures` to discover texture names, `--texture-name` to specify manually
- Images served via Node.js API on the server (`kf1-map-images` systemd service)

## Infrastructure

- SPA deployed to `/home/uliunai/kf1/webadmin/dist/` on Hetzner
- Caddy reverse proxy handles routing:
  - `/webadmin/*` → static SPA files
  - `/ServerAdmin/*` → KF1 game server on port 8075
  - `/map-api/*` → map images API on port 8076
- Cloudflare Tunnel for SSL and ingress (no direct port exposure)
- HTTP Basic Auth passed through to the game server (Caddy strips `WWW-Authenticate` to prevent browser popup)

## TODO

- [ ] **Open-source release** — Extract webadmin into its own public GitHub repo, share with KF1 community
  - Write a proper README with screenshots, feature list, and setup instructions
  - Make server proxy config generic (not hardcoded to uliunai domain)
  - Document how to point it at any KF1 dedicated server
  - Add LICENSE (MIT?)
  - Clean up any hardcoded credentials/URLs
