# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo for the Uliunai.lt Killing Floor community platform. Multiple apps under one domain using subdomains. Currently using test domains (`*.fezle.io`) until `uliunai.lt` is purchased. See [PLAN.md](PLAN.md) for the full master plan and phased roadmap.

**Live URLs (test domains):**
- Hub: `https://uliunai.fezle.io`
- KF1 Website: `https://kf1-uliunai.fezle.io`
- KF1 WebAdmin: `https://kf1-uliunai.fezle.io/webadmin/`

## Monorepo Layout

```
hub/                  -> Hub landing page (vanilla HTML/CSS/JS, no build step)
kf1/website/          -> KF1 website (React 19 + Vite 7 SPA)
kf1/webadmin/         -> KF1 admin panel (Vue 3 + Vite 7 SPA)
kf1/mutator/          -> UliunaiStats server mutator (UnrealScript)
kf1/tools/            -> Python utilities (map preview extraction)
kf1/statistics/       -> KF1 stats page (Phase 3 — not started, empty)
kf2/                  -> KF2 apps (future — empty)
```

## Phase Status

| Phase | Item | Status |
|-------|------|--------|
| 1 | Hub landing page | Done |
| 2 | KF1 Website | Done (frontend only, no backend) |
| — | KF1 WebAdmin SPA | Done (bonus, not in original plan) |
| — | UliunaiStats mutator | Done (bonus, live game state export) |
| — | Map preview extraction tool | Done (18/19 stock maps) |
| 3 | KF1 Statistics (PHP) | Not started |
| 4 | VIP System (Stripe) | Not started |
| 5 | KF2 apps | Not started |

---

## Hub (hub/)

Split-screen game chooser — gateway between KF1 and KF2. Vanilla HTML/CSS/JS (no build step).

**Files:** `index.html`, `styles.css`, `script.js`, `assets/` (4 images, ~1.6MB)

**Features:**
- Desktop: asymmetric hover panels (KF1 left, KF2 right) with dead-zone logic
- Mobile: horizontal snap-scroll carousel with dot navigation
- Ambient effects: 35 ember particles, scanlines, vignette, glitch text
- KF2 panel is grayed out with "Coming Soon" badge
- KF1 CTA links to `https://kf1-uliunai.fezle.io`

**Tech:** ES5 JavaScript, CSS custom properties, CSS Grid/Flexbox, keyframe animations. CDN: Google Fonts, Remix Icon 4.5.0, Font Awesome 6.4.0.

---

## KF1 Website (kf1/website/)

### Commands
```bash
cd kf1/website
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build -> dist/
npm run preview      # Preview production build
```

### Tech Stack
- **React 19.1** + **TypeScript 5.8** + **Vite 7.0** + **Tailwind CSS 3.4**
- **React Router DOM 7** — Single route `/` with section-based scroll navigation + 404
- **i18next** — Internationalization (loader ready at `src/i18n/local/[lang]/*.ts`, no translations yet)
- **Vanta.js + Three.js** — 3D fog background effect (`VantaFog` component)
- **Lucide React + Motion Icons React** — Icon libraries (+ CDN icons)
- **Recharts**, **Stripe**, **Supabase**, **Firebase** — installed but not yet used

### Path Alias
`@` -> `src/` (configured in `vite.config.ts` and `tsconfig.app.json`)

### Auto-Imports
`unplugin-auto-import` — React hooks, React Router hooks, and i18next (`useTranslation`) available without imports. See `auto-imports.d.ts`.

### Component Organization
- `src/components/base/` — Button (primary/secondary/danger/outline), Card (default/dark/blood)
- `src/components/feature/` — Navigation, Footer, LiveStats, VantaFog, AmbientEffects
- `src/hooks/` — useScrollReveal
- `src/pages/home/components/` — HeroSection, AboutSection, ServerInfoSection, GallerySection, NewsSection, AdminSection, VipSection, ContactSection
- `src/pages/NotFound.tsx` — 404 page

### Vite Globals
- `__BASE_PATH__` — from `BASE_PATH` env var (defaults to `/`)
- `__IS_PREVIEW__` — from `IS_PREVIEW` env var

### Live Data
- Polls `/map-api/game-state` for live server stats (from UliunaiStats mutator)
- Polls `/map-api/maps` for map images

### Known Issues
- IP address mismatch: HeroSection uses `51.195.117.236:9980` (old), LiveStats uses `94.130.51.236:7707` (current)
- ESLint installed but no config file or lint script
- No `.env` or `.env.example` file
- Readdy.ai widget in index.html has `PROJECT_ID_PLACEHOLDER`

---

## KF1 WebAdmin (kf1/webadmin/)

Modern Vue 3 SPA replacing the stock UE2 WebAdmin interface for KF1 server management.

### Commands
```bash
cd kf1/webadmin
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3002
npm run build        # Type-check + production build -> dist/
npm run preview      # Preview production build
```

### Tech Stack
- **Vue 3.5** + **TypeScript 5.9** + **Vite 7.3** + **Tailwind CSS 3.4**
- **Vue Router 5** — HTML5 history mode, base path `/webadmin/`
- **Pinia 3** — State management (auth in sessionStorage)

### Pages (11)
| Route | Page | Description |
|-------|------|-------------|
| `/overview` | OverviewPage | Dashboard with live stats, 5s auto-refresh |
| `/players` | PlayersPage | Player list, kick/ban actions |
| `/console` | ConsolePage | Server console, say/command modes, 2s refresh |
| `/mutators` | MutatorsPage | Mutator toggles and radio groups |
| `/bots` | BotsPage | Bot enable/disable by category |
| `/rules/:filter?` | RulesPage | Tabbed settings (Game/Chat/Voting/Sandbox/Server) |
| `/maps` | MapsPage | Drag-drop map rotation editor with multi-select |
| `/ip-policy` | IpPolicyPage | IP allow/deny rules |
| `/voting-gameconfig` | VotingGameConfigPage | Game voting configurations |
| `/map-images` | MapImagesPage | Map image upload/management grid |
| `/game` | — | Redirects to `/overview` |

### Architecture
- **Proxy pattern:** All requests go through the SPA's origin
  - `/ServerAdmin/*` -> KF1 game server WebAdmin (port 8075 in dev)
  - `/map-api/*` -> Node.js map images API (port 8076 in dev)
- **HTML parsing:** `src/services/parsers.ts` (707 lines) extracts typed data from raw UE2 WebAdmin HTML responses
- **Auth:** HTTP Basic Auth, credentials stored in sessionStorage (`kf1-webadmin-auth`)

### Key Files
- `src/services/api.ts` — HTTP client for UE2 WebAdmin + map API
- `src/services/parsers.ts` — HTML-to-TypeScript parsers for all page types
- `src/stores/server.ts` — Pinia store (auth, current map/game type)
- `src/types/index.ts` — All TypeScript interfaces (Player, GameState, RuleSetting, etc.)

---

## KF1 Mutator (kf1/mutator/)

Server-side UnrealScript mutator that exports live game state to JSON every 2 seconds.

### Output: `UliunaiStats.json`
```json
{
  "wave": { "current": 3, "total": 10, "inProgress": true, "traderTime": false },
  "zeds": { "alive": 12, "maxAtOnce": 16 },
  "difficulty": "Hard", "difficultyNum": 4,
  "map": "KF-BioticsLab",
  "players": [{ "name": "...", "perk": "Berserker", "perkLevel": 6, "kills": 45,
    "monsterKills": { "clot": 20, "gorefast": 5, ... },
    "cash": 1500, "health": 100, "maxHealth": 100, "deaths": 0, "ping": 30 }],
  "playerCount": 1
}
```

### Files
- `Classes/UliunaiStats.uc` — Main mutator (Mutator subclass, JSON export, timer)
- `Classes/UliunaiStatsRules.uc` — Kill tracking (GameRules subclass with ScoreKill)
- `UliunaiStats.u` — Compiled binary (deploy to server `System/`)
- `UliunaiStats.int` — Localization manifest

### Installation
1. Copy `.u` and `.int` to server's `System/` directory
2. Add `ServerActors=UliunaiStats.UliunaiStats` to `KillingFloor.ini` (survives map changes)
3. Do NOT use `?Mutator=` command line — it doesn't persist across map changes in KF1
4. Config auto-created: `UliunaiStats.ini` with `WriteInterval=2.0`

### Compilation
```bash
# KF1's Mutator class does NOT have ScoreKill — that's why we use GameRules subclass
# Must delete steam_appid.txt before ucc.exe or it crashes silently
# Must comment out EditPackages for KFGui/GoodKarma/KFMutators (no source available)
cd "D:/SteamLibrary/steamapps/common/KillingFloorBeta/System"
rm -f steam_appid.txt
# Temporarily comment KFGui/GoodKarma/KFMutators in KillingFloor.ini
./ucc.exe make
# Restore KFGui/GoodKarma/KFMutators after compile
```

---

## KF1 Tools (kf1/tools/)

### extract_map_previews.py
Parses UE2 binary `.rom` map files and extracts embedded preview textures as PNG.

**Requires:** Python 3 + Pillow (`pip install Pillow`)

```bash
python extract_map_previews.py                              # Extract all stock maps
python extract_map_previews.py --file KF-Custom.rom --list-textures  # Discover textures
python extract_map_previews.py --file KF-Custom.rom --texture-name "PreviewTex"
```

**Args:** `--maps-dir`, `--output`, `--file`, `--texture-name`, `--list-textures`, `--force`, `--no-overrides`

**Status:** 18/19 stock maps extracted in `extracted_previews/`. Upload to server: `scp *.png hetzner:/home/uliunai/kf1/map-images/uploads/`

---

## Design System

> **Canonical reference:** [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)

All subdomains share the same **horror/gaming theme**:
- **Fonts:** Orbitron (headings), Rajdhani (body) — Google Fonts CDN
- **Colors:** Blood reds (`#8B0000`, `#dc2626`) on black (`#000`), horror gray (`#1a1a1a`)
- **Effects:** Glitch text, red glow shadows, blood drip pseudo-elements, scanlines, ember particles
- **Tailwind tokens:** `blood-red`, `dark-red`, `horror-gray` colors; `red-glow`, `blood` shadows; `pulse-slow`, `bounce-slow` animations
- **Icons:** Remix Icon 4.5.0 + Font Awesome 6.4.0 (CDN)

---

## Deployment

### CI/CD (GitHub Actions)
**Trigger:** Push to `master` branch
**Pipeline:** `.github/workflows/deploy.yml`
1. Build kf1/website (`npm ci && npm run build`)
2. Build kf1/webadmin (`npm ci && npm run build`)
3. Rsync hub/, kf1/website/dist/, kf1/webadmin/dist/ to Hetzner `/home/uliunai/`

**Secrets required:** `DEPLOY_SSH_KEY`, `DEPLOY_HOST`, `DEPLOY_USER`

### Hetzner Server (94.130.51.236)
- All traffic via **Cloudflare Tunnel** (SSL at edge, no certbot)
- Caddy on localhost:8080 routes all subdomains
- **Caddy config:** `/home/uliunai/Caddyfile` (systemd service: `caddy-uliunai`)
- **Reload Caddy:** `systemctl reload caddy-uliunai` (NOT `caddy` — that's the default unused service)
- Ports: 8075 (KF1 WebAdmin proxy), 8076 (map images Node.js API)
- Map images service: `systemctl restart kf1-map-images`
- KF1 game server: `systemctl restart kf1-server`
- Server registry: `/root/SERVER_REGISTRY.md` (always read before changes)

### Manual Deploy Paths (CRITICAL — use the right target directory!)
```bash
# KF1 Website — Caddy serves from dist/, NOT the parent!
scp -r kf1/website/dist/* hetzner:/home/uliunai/kf1/website/dist/

# KF1 WebAdmin — same pattern
scp -r kf1/webadmin/dist/* hetzner:/home/uliunai/kf1/webadmin/dist/

# Hub — static files, no dist/
scp -r hub/* hetzner:/home/uliunai/hub/

# Mutator binary
scp kf1/mutator/UliunaiStats.u hetzner:/home/uliunai/kf-server/System/
```

---

## Local Development

Hosts file (`C:\Windows\System32\drivers\etc\hosts`) points subdomains to `127.0.0.1`. Caddy reverse proxy routes them.

```bash
# Terminal 1: KF1 website
cd kf1/website && npm run dev          # -> localhost:3000

# Terminal 2: KF1 webadmin
cd kf1/webadmin && npm run dev         # -> localhost:3002

# Terminal 3: Caddy (from repo root)
caddy run                              # reads Caddyfile
```

Browse:
- `http://uliunai.lt` -> Hub (static files)
- `http://kf1.uliunai.lt` -> KF1 website (proxy to :3000)
- `http://kf2.uliunai.lt` -> KF2 website (proxy to :3001, future)

---

## Code Conventions

- TypeScript strict mode — no unused locals or parameters
- Functional components only (React hooks / Vue Composition API)
- PascalCase components, camelCase functions/variables
- All styling via Tailwind utility classes
- Responsive mobile-first approach
- No monorepo package manager — each project manages its own deps
