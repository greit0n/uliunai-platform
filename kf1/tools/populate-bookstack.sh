#!/bin/bash
# Populate BookStack with Uliunai documentation
# BookStack structure: Shelves > Books > Chapters > Pages

API="https://wiki-uliunai.fezle.io/api"
TOKEN="Token 5262260399c3ec202656761f9f8a8df3:8609dc0e4e842e189bd4b9607b6f7c050761be6a13bff5b19505f1a240680d66"

create() {
  local endpoint="$1"
  local data="$2"
  curl -s -X POST "$API/$endpoint" \
    -H "Authorization: $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$data"
}

# ============================================================
# SHELF: Uliunai Platform
# ============================================================
echo "Creating shelf..."
SHELF=$(create "shelves" '{"name":"Uliunai Platform","description":"Documentation for the Uliunai.lt Killing Floor community platform"}')
SHELF_ID=$(echo "$SHELF" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Shelf ID: $SHELF_ID"

# ============================================================
# BOOK 1: Getting Started
# ============================================================
echo "Creating Book: Getting Started..."
BOOK1=$(create "books" "{\"name\":\"Getting Started\",\"description\":\"Development environment setup and project overview\"}")
BOOK1_ID=$(echo "$BOOK1" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# Page: Welcome
create "pages" "{\"book_id\":$BOOK1_ID,\"name\":\"Welcome\",\"markdown\":\"# Welcome to Uliunai Platform\\n\\nDocumentation for the **Uliunai.lt Killing Floor Community Platform**.\\n\\n## What is Uliunai?\\n\\nUliunai is a Lithuanian Killing Floor gaming community platform. We run dedicated game servers and build web tools for server administration, live statistics, and community engagement.\\n\\n## Live URLs (Test Domains)\\n\\n| Service | URL |\\n|---------|-----|\\n| Hub (Landing Page) | [uliunai.fezle.io](https://uliunai.fezle.io) |\\n| KF1 Website | [kf1-uliunai.fezle.io](https://kf1-uliunai.fezle.io) |\\n| KF1 WebAdmin | [kf1-uliunai.fezle.io/webadmin/](https://kf1-uliunai.fezle.io/webadmin/) |\\n| This Wiki | [wiki-uliunai.fezle.io](https://wiki-uliunai.fezle.io) |\\n\\n> These are temporary test domains. Final production domains will be under \`*.uliunai.lt\`.\\n\\n## Project Status\\n\\n| Phase | Item | Status |\\n|-------|------|--------|\\n| 1 | Hub landing page | Done |\\n| 2 | KF1 Website (React SPA) | Done (frontend) |\\n| - | KF1 WebAdmin (Vue SPA) | Done |\\n| - | UliunaiStats Mutator | Done |\\n| - | Map Preview Tool | Done |\\n| 3 | KF1 Statistics (PHP) | Not started |\\n| 4 | VIP System (Stripe) | Not started |\\n| 5 | KF2 Apps | Not started |\\n\\n## Repository\\n\\nMonorepo: \`uliunai-platform\` on GitHub\\n\\n\`\`\`\\nhub/                  - Hub landing page (vanilla HTML/CSS/JS)\\nkf1/website/          - KF1 website (React 19 + Vite 7)\\nkf1/webadmin/         - KF1 admin panel (Vue 3 + Vite 7)\\nkf1/mutator/          - UliunaiStats server mutator (UnrealScript)\\nkf1/tools/            - Python utilities (map preview extraction)\\nkf1/statistics/       - KF1 stats page (Phase 3 - not started)\\nkf2/                  - KF2 apps (future - empty)\\n\`\`\`\"}" > /dev/null
echo "  + Welcome page"

# Page: Dev Setup
create "pages" "{\"book_id\":$BOOK1_ID,\"name\":\"Development Setup\",\"markdown\":\"# Development Setup\\n\\n## Prerequisites\\n\\n- **Node.js 22+** (for website and webadmin)\\n- **Python 3+** with Pillow (for map tools)\\n- **Git**\\n- **Caddy** (reverse proxy for subdomain simulation)\\n\\n## 1. Clone the Repository\\n\\n\`\`\`bash\\ngit clone <repo-url> uliunai-platform\\ncd uliunai-platform\\n\`\`\`\\n\\n## 2. Set Up Hosts File\\n\\nAdd to \`C:\\\\\\\\Windows\\\\\\\\System32\\\\\\\\drivers\\\\\\\\etc\\\\\\\\hosts\` (Administrator):\\n\\n\`\`\`\\n127.0.0.1   uliunai.lt\\n127.0.0.1   kf1.uliunai.lt\\n127.0.0.1   kf2.uliunai.lt\\n\`\`\`\\n\\n## 3. Install Dependencies\\n\\n\`\`\`bash\\ncd kf1/website && npm install\\ncd ../webadmin && npm install\\n\`\`\`\\n\\n## 4. Start Dev Servers\\n\\nOpen 3 terminals:\\n\\n\`\`\`bash\\n# Terminal 1: KF1 Website (port 3000)\\ncd kf1/website && npm run dev\\n\\n# Terminal 2: KF1 WebAdmin (port 3002)\\ncd kf1/webadmin && npm run dev\\n\\n# Terminal 3: Caddy reverse proxy\\ncaddy run\\n\`\`\`\\n\\n## 5. Browse\\n\\n| URL | What |\\n|-----|------|\\n| http://uliunai.lt | Hub landing page |\\n| http://kf1.uliunai.lt | KF1 website |\\n\\n## Build for Production\\n\\n\`\`\`bash\\ncd kf1/website && npm run build\\ncd kf1/webadmin && npm run build\\n\`\`\`\"}" > /dev/null
echo "  + Development Setup page"

# ============================================================
# BOOK 2: Architecture
# ============================================================
echo "Creating Book: Architecture..."
BOOK2=$(create "books" "{\"name\":\"Architecture\",\"description\":\"System architecture, infrastructure, and deployment\"}")
BOOK2_ID=$(echo "$BOOK2" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

create "pages" "{\"book_id\":$BOOK2_ID,\"name\":\"Infrastructure\",\"markdown\":\"# Infrastructure\\n\\nThe platform runs on a **Hetzner dedicated server** with traffic routed through **Cloudflare Tunnel**.\\n\\n| Component | Details |\\n|-----------|---------|\\n| Server | Hetzner (94.130.51.236), Ubuntu 24.04, 16 CPU, 61GB RAM |\\n| Ingress | Cloudflare Tunnel (SSL at edge, no certbot) |\\n| Reverse Proxy | Caddy on localhost:8080 |\\n| CI/CD | GitHub Actions -> rsync to server |\\n\\n## Port Allocation\\n\\n| Port | Service | Notes |\\n|------|---------|-------|\\n| 8075 | KF1 Game Server WebAdmin | Proxied via Caddy |\\n| 8076 | Map Images API (Node.js) | systemd: \`kf1-map-images\` |\\n| 8080 | Caddy (main reverse proxy) | systemd: \`caddy-uliunai\` |\\n| 8082 | BookStack Wiki (Docker) | container: \`uliunai-bookstack\` |\\n\\n> **Ports 80/443 belong to Fezle (nginx in Docker). NEVER touch.**\\n\\n## Traffic Flow\\n\\n\`\`\`\\nUser -> Cloudflare (SSL) -> Tunnel -> Caddy (:8080) -> Service\\n                                        |-- /             -> hub/ static files\\n                                        |-- /webadmin/    -> kf1/webadmin/dist/\\n                                        |-- /ServerAdmin/ -> localhost:8075\\n                                        +-- /map-api/     -> localhost:8076\\n\`\`\`\\n\\n## Systemd Services\\n\\n\`\`\`bash\\nsystemctl status caddy-uliunai     # Main reverse proxy\\nsystemctl status kf1-map-images    # Map images API\\nsystemctl status kf1-server        # KF1 game server\\nsystemctl status cloudflared       # Cloudflare Tunnel\\n\`\`\`\\n\\n> **Always read \`/root/SERVER_REGISTRY.md\` before making infrastructure changes.**\"}" > /dev/null
echo "  + Infrastructure page"

create "pages" "{\"book_id\":$BOOK2_ID,\"name\":\"Deployment\",\"markdown\":\"# Deployment\\n\\n## CI/CD Pipeline (GitHub Actions)\\n\\n**Trigger:** Push to \`master\` branch\\n**File:** \`.github/workflows/deploy.yml\`\\n\\n1. Builds KF1 Website (\`npm ci && npm run build\`)\\n2. Builds KF1 WebAdmin (\`npm ci && npm run build\`)\\n3. Rsyncs to Hetzner \`/home/uliunai/\`\\n\\n### Required Secrets\\n\\n| Secret | Description |\\n|--------|-------------|\\n| \`DEPLOY_SSH_KEY\` | SSH private key for Hetzner |\\n| \`DEPLOY_HOST\` | Server IP (94.130.51.236) |\\n| \`DEPLOY_USER\` | SSH user |\\n\\n## Manual Deploy (SCP)\\n\\n> **CRITICAL: Deploy to the right directory!** Caddy serves from \`dist/\`, not the parent.\\n\\n\`\`\`bash\\n# KF1 Website\\nscp -r dist/* hetzner:/home/uliunai/kf1/website/dist/\\n\\n# KF1 WebAdmin\\nscp -r dist/* hetzner:/home/uliunai/kf1/webadmin/dist/\\n\\n# Hub (static, no build)\\nscp -r hub/* hetzner:/home/uliunai/hub/\\n\\n# Mutator binary\\nscp kf1/mutator/UliunaiStats.u hetzner:/home/uliunai/kf-server/System/\\n\`\`\`\\n\\n## Caddy\\n\\n**Config:** \`/home/uliunai/Caddyfile\`\\n**Service:** \`caddy-uliunai\` (NOT \`caddy\`)\\n\\n\`\`\`bash\\nsystemctl reload caddy-uliunai\\n\`\`\`\"}" > /dev/null
echo "  + Deployment page"

# ============================================================
# BOOK 3: KF1 Website
# ============================================================
echo "Creating Book: KF1 Website..."
BOOK3=$(create "books" "{\"name\":\"KF1 Website\",\"description\":\"React 19 SPA for the KF1 community\"}")
BOOK3_ID=$(echo "$BOOK3" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

create "pages" "{\"book_id\":$BOOK3_ID,\"name\":\"Overview\",\"markdown\":\"# KF1 Website\\n\\nReact single-page application for the Killing Floor 1 community.\\n\\n> **Screenshot TODO:** Add screenshot of the hero section\\n\\n## Tech Stack\\n\\n| Technology | Version | Purpose |\\n|------------|---------|---------|\\n| React | 19.1 | UI framework |\\n| TypeScript | 5.8 | Type safety |\\n| Vite | 7.0 | Build tool, dev server on port 3000 |\\n| Tailwind CSS | 3.4 | Utility-first styling |\\n| React Router DOM | 7 | SPA routing |\\n| i18next | 25.4 | i18n (ready, no translations yet) |\\n| Vanta.js + Three.js | - | 3D fog background |\\n| Lucide React | - | Icon library |\\n\\n## Commands\\n\\n\`\`\`bash\\ncd kf1/website\\nnpm install          # Install dependencies\\nnpm run dev          # Dev server at localhost:3000\\nnpm run build        # Production build -> dist/\\nnpm run preview      # Preview production build\\n\`\`\`\\n\\n## Key Features\\n\\n- **Section-based navigation** - single page with smooth scroll\\n- **Live server stats** - polls \`/map-api/game-state\`\\n- **Horror theme** - glitch text, embers, scanlines, Vanta.js fog\\n- **Auto-imports** - React hooks available without imports\"}" > /dev/null
echo "  + Overview page"

create "pages" "{\"book_id\":$BOOK3_ID,\"name\":\"Component Structure\",\"markdown\":\"# Component Structure\\n\\n\`\`\`\\nsrc/\\n|-- components/\\n|   |-- base/           # Button, Card (with variants)\\n|   +-- feature/        # Navigation, Footer, LiveStats, VantaFog, AmbientEffects\\n|-- hooks/              # useScrollReveal\\n|-- pages/\\n|   |-- home/\\n|   |   |-- page.tsx    # Main landing page\\n|   |   +-- components/ # HeroSection, AboutSection, ServerInfoSection,\\n|   |                   # GallerySection, NewsSection, AdminSection,\\n|   |                   # VipSection, ContactSection\\n|   +-- NotFound.tsx    # 404 page\\n|-- router/             # Route config (/ and 404)\\n|-- i18n/               # Internationalization loader\\n+-- index.css           # Global styles + 18 custom CSS effects\\n\`\`\`\\n\\n## Path Alias\\n\\n\`@\` -> \`src/\` (in vite.config.ts and tsconfig.app.json)\\n\\n## Known Issues\\n\\n- IP mismatch: HeroSection uses old IP \`51.195.117.236:9980\`\\n- ESLint installed but no config or lint script\\n- Readdy.ai widget has \`PROJECT_ID_PLACEHOLDER\`\\n- Stripe, Supabase, Firebase installed but unused\"}" > /dev/null
echo "  + Component Structure page"

# ============================================================
# BOOK 4: KF1 WebAdmin
# ============================================================
echo "Creating Book: KF1 WebAdmin..."
BOOK4=$(create "books" "{\"name\":\"KF1 WebAdmin\",\"description\":\"Vue 3 SPA for KF1 server administration\"}")
BOOK4_ID=$(echo "$BOOK4" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

create "pages" "{\"book_id\":$BOOK4_ID,\"name\":\"Overview\",\"markdown\":\"# KF1 WebAdmin\\n\\nModern Vue 3 SPA replacing the stock UE2 WebAdmin.\\n\\n> **Screenshot TODO:** Add screenshots of dashboard, maps, console, players\\n\\n## Tech Stack\\n\\n| Technology | Version | Purpose |\\n|------------|---------|---------|\\n| Vue | 3.5 | UI framework (Composition API) |\\n| TypeScript | 5.9 | Type safety |\\n| Vite | 7.3 | Build tool, dev server on port 3002 |\\n| Tailwind CSS | 3.4 | Styling |\\n| Vue Router | 5 | SPA routing (base: \`/webadmin/\`) |\\n| Pinia | 3 | State management |\\n\\n## Commands\\n\\n\`\`\`bash\\ncd kf1/webadmin\\nnpm install\\nnpm run dev          # Dev server at localhost:3002\\nnpm run build        # Type-check + production build\\n\`\`\`\"}" > /dev/null
echo "  + Overview page"

create "pages" "{\"book_id\":$BOOK4_ID,\"name\":\"Pages\",\"markdown\":\"# WebAdmin Pages (11 total)\\n\\n| Route | Page | Description |\\n|-------|------|-------------|\\n| \`/overview\` | OverviewPage | Dashboard with live stats, 5s auto-refresh |\\n| \`/players\` | PlayersPage | Player list with kick/ban actions |\\n| \`/console\` | ConsolePage | Server console, say/command modes, 2s refresh |\\n| \`/mutators\` | MutatorsPage | Mutator toggles and radio groups |\\n| \`/bots\` | BotsPage | Bot enable/disable by category |\\n| \`/rules/:filter?\` | RulesPage | Tabbed settings (Game/Chat/Voting/Sandbox/Server) |\\n| \`/maps\` | MapsPage | Drag-and-drop map rotation editor |\\n| \`/ip-policy\` | IpPolicyPage | IP allow/deny rules |\\n| \`/voting-gameconfig\` | VotingGameConfigPage | Game voting configs |\\n| \`/map-images\` | MapImagesPage | Map image upload/management |\\n| \`/game\` | - | Redirects to \`/overview\` |\\n\\n## Advanced UI Features\\n\\n- **Drag-and-drop** map reordering\\n- **Multi-select** with Ctrl+click and Shift+click\\n- **Dual-list** map rotation editor\\n- **Terminal emulation** in console\\n- **Hover-overlay** upload for map images\\n- **Tab-based** rule filtering\"}" > /dev/null
echo "  + Pages page"

create "pages" "{\"book_id\":$BOOK4_ID,\"name\":\"Architecture\",\"markdown\":\"# WebAdmin Architecture\\n\\n## Proxy Pattern\\n\\n\`\`\`\\nBrowser -> Caddy (:8080)\\n            |-- /webadmin/*       -> Vue SPA static files\\n            |-- /ServerAdmin/*    -> KF1 game server (:8075)\\n            +-- /map-api/*        -> Node.js API (:8076)\\n\`\`\`\\n\\n## HTML Parsing\\n\\nThe stock KF1 WebAdmin returns raw HTML. Our \`parsers.ts\` (707 lines) extracts typed data:\\n\\n\`\`\`\\nfetchPage('current_players')  ->  HTML  ->  parsePlayers()  ->  PlayersData\\nfetchPage('defaults_maps')    ->  HTML  ->  parseMaps()     ->  MapsData\\nfetchPage('defaults_rules')   ->  HTML  ->  parseRules()    ->  RulesData\\n\`\`\`\\n\\n## Authentication\\n\\nHTTP Basic Auth. Credentials in \`sessionStorage\` (key: \`kf1-webadmin-auth\`).\\n\\n## Key Files\\n\\n| File | Purpose |\\n|------|---------|\\n| \`src/services/api.ts\` | HTTP client for WebAdmin + map API |\\n| \`src/services/parsers.ts\` | HTML -> TypeScript parsers |\\n| \`src/stores/server.ts\` | Pinia store (auth, game state) |\\n| \`src/types/index.ts\` | All TypeScript interfaces |\"}" > /dev/null
echo "  + Architecture page"

# ============================================================
# BOOK 5: KF1 Server & Tools
# ============================================================
echo "Creating Book: KF1 Server & Tools..."
BOOK5=$(create "books" "{\"name\":\"KF1 Server \\u0026 Tools\",\"description\":\"Game server management, mutator, and utilities\"}")
BOOK5_ID=$(echo "$BOOK5" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

create "pages" "{\"book_id\":$BOOK5_ID,\"name\":\"UliunaiStats Mutator\",\"markdown\":\"# UliunaiStats Mutator\\n\\nCustom **UnrealScript** mutator that exports live game state to JSON every 2 seconds.\\n\\n## JSON Output\\n\\nFile: \`<KF_DIR>/UliunaiStats.json\`\\n\\n\`\`\`json\\n{\\n  \\\"wave\\\": { \\\"current\\\": 3, \\\"total\\\": 10, \\\"inProgress\\\": true, \\\"traderTime\\\": false },\\n  \\\"zeds\\\": { \\\"alive\\\": 12, \\\"maxAtOnce\\\": 16 },\\n  \\\"difficulty\\\": \\\"Hard\\\",\\n  \\\"map\\\": \\\"KF-BioticsLab\\\",\\n  \\\"players\\\": [{\\n    \\\"name\\\": \\\"Player1\\\", \\\"perk\\\": \\\"Berserker\\\", \\\"perkLevel\\\": 6,\\n    \\\"kills\\\": 45, \\\"cash\\\": 1500, \\\"health\\\": 100, \\\"deaths\\\": 0, \\\"ping\\\": 30\\n  }],\\n  \\\"playerCount\\\": 1\\n}\\n\`\`\`\\n\\n## Files\\n\\n| File | Purpose |\\n|------|---------|\\n| \`Classes/UliunaiStats.uc\` | Main mutator (JSON export, timer) |\\n| \`Classes/UliunaiStatsRules.uc\` | Kill tracking (GameRules subclass) |\\n| \`UliunaiStats.u\` | Compiled binary - deploy this |\\n| \`UliunaiStats.int\` | Localization manifest |\\n\\n## Installation\\n\\n1. Copy \`.u\` and \`.int\` to server \`System/\` directory\\n2. Add to \`KillingFloor.ini\`: \`ServerActors=UliunaiStats.UliunaiStats\`\\n3. **Do NOT use \`?Mutator=\`** - doesn't persist across map changes\\n4. Config auto-created: \`UliunaiStats.ini\` with \`WriteInterval=2.0\`\\n\\n## Compilation\\n\\n\`\`\`bash\\ncd \\\"D:/SteamLibrary/steamapps/common/KillingFloorBeta/System\\\"\\nrm -f steam_appid.txt    # MUST delete or ucc.exe crashes\\n./ucc.exe make\\n\`\`\`\"}" > /dev/null
echo "  + Mutator page"

create "pages" "{\"book_id\":$BOOK5_ID,\"name\":\"Map Preview Tool\",\"markdown\":\"# Map Preview Extraction Tool\\n\\nPython script that parses UE2 binary \`.rom\` map files and extracts preview textures as PNG.\\n\\n## Requirements\\n\\n\`\`\`bash\\npip install Pillow\\n\`\`\`\\n\\n## Usage\\n\\n\`\`\`bash\\n# Extract all stock maps\\npython extract_map_previews.py\\n\\n# Single map\\npython extract_map_previews.py --file KF-Custom.rom\\n\\n# Discover textures\\npython extract_map_previews.py --file KF-Custom.rom --list-textures\\n\\n# Specific texture\\npython extract_map_previews.py --file KF-Custom.rom --texture-name PreviewTex\\n\`\`\`\\n\\n## Arguments\\n\\n| Argument | Description |\\n|----------|-------------|\\n| \`--maps-dir\` | Directory with .rom files |\\n| \`--output\` | Output directory for PNGs |\\n| \`--file\` | Single .rom file |\\n| \`--texture-name\` | Exact texture name |\\n| \`--list-textures\` | List all textures |\\n| \`--force\` | Overwrite existing |\\n\\nSupports DXT1, DXT3, DXT5, RGBA8. 18/19 stock maps extracted.\\n\\n## Upload to Server\\n\\n\`\`\`bash\\nscp extracted_previews/*.png hetzner:/home/uliunai/kf1/map-images/uploads/\\n\`\`\`\"}" > /dev/null
echo "  + Map Preview Tool page"

create "pages" "{\"book_id\":$BOOK5_ID,\"name\":\"Server Management\",\"markdown\":\"# KF1 Server Management\\n\\n| Property | Value |\\n|----------|-------|\\n| IP | 94.130.51.236 |\\n| Game Port | 7707 |\\n| WebAdmin Port | 8075 |\\n| systemd Service | \`kf1-server\` |\\n\\n## Commands\\n\\n\`\`\`bash\\nssh hetzner\\nsystemctl status kf1-server\\nsystemctl restart kf1-server\\njournalctl -u kf1-server -f\\n\`\`\`\\n\\n## Connect\\n\\n\`\`\`\\nsteam://connect/94.130.51.236:7707\\n\`\`\`\\n\\n## Map Images API (port 8076)\\n\\n| Endpoint | Method | Description |\\n|----------|--------|-------------|\\n| \`/map-api/maps\` | GET | List map images |\\n| \`/map-api/game-state\` | GET | Live game state |\\n| \`/map-api/server-status\` | GET | Server uptime |\\n| \`/map-api/upload/:map\` | POST | Upload image |\\n| \`/map-api/sync-maplist\` | POST | Sync rotation |\\n\\n## Quirks\\n\\n- Delete \`steam_appid.txt\` before \`ucc.exe\` or it crashes\\n- Use \`ServerActors=\` in .ini, not \`?Mutator=\` on cmdline\"}" > /dev/null
echo "  + Server Management page"

# ============================================================
# BOOK 6: Design System
# ============================================================
echo "Creating Book: Design System..."
BOOK6=$(create "books" "{\"name\":\"Design System\",\"description\":\"Visual identity - colors, fonts, effects, Tailwind tokens\"}")
BOOK6_ID=$(echo "$BOOK6" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

create "pages" "{\"book_id\":$BOOK6_ID,\"name\":\"Theme Reference\",\"markdown\":\"# Design System\\n\\nAll subdomains share the same **horror/gaming** visual identity.\\n\\n## Fonts\\n\\n| Font | Usage | Weight |\\n|------|-------|--------|\\n| **Orbitron** | Headings, titles | 400, 700, 900 |\\n| **Rajdhani** | Body text, UI | 400, 600, 700 |\\n\\nLoaded via Google Fonts CDN.\\n\\n## Color Palette\\n\\n| Token | Hex | Usage |\\n|-------|-----|-------|\\n| \`blood-red\` | \`#8B0000\` | Primary accent, gradients |\\n| \`dark-red\` | \`#4A0000\` | Gradient endpoints |\\n| bright red | \`#dc2626\` | Buttons, highlights |\\n| \`horror-gray\` | \`#1a1a1a\` | Surface backgrounds |\\n| black | \`#000000\` | Page backgrounds |\\n\\n## Tailwind Tokens\\n\\n\`\`\`javascript\\n// Colors\\n'blood-red': '#8B0000',\\n'dark-red': '#4A0000',\\n'horror-gray': '#1a1a1a',\\n\\n// Shadows\\n'red-glow': '0 0 20px rgba(220, 38, 38, 0.3)',\\n'blood': '0 4px 20px rgba(139, 0, 0, 0.4)',\\n\\n// Animations\\n'pulse-slow': 'pulse 3s ease infinite',\\n'bounce-slow': 'bounce 2s infinite',\\n\`\`\`\\n\\n## CSS Effects (18+ categories)\\n\\n| Effect | Description |\\n|--------|-------------|\\n| Glitch text | RGB chromatic aberration |\\n| Scanlines | CRT overlay with red line |\\n| Blood drip | Pseudo-element gradients |\\n| Floating embers | 35 rising particles |\\n| Vignette | Radial dark edges |\\n| Scroll reveal | Fade-in with movement |\\n| Horror card hover | Glow + lift |\\n| Screen flicker | Rare red flash |\\n\\n## Icons\\n\\n| Library | Version | Source |\\n|---------|---------|--------|\\n| Remix Icon | 4.5.0 | CDN |\\n| Font Awesome | 6.4.0 | CDN |\\n| Lucide React | latest | npm |\"}" > /dev/null
echo "  + Theme Reference page"

# ============================================================
# BOOK 7: Troubleshooting
# ============================================================
echo "Creating Book: Troubleshooting..."
BOOK7=$(create "books" "{\"name\":\"Troubleshooting\",\"description\":\"Common issues and their solutions\"}")
BOOK7_ID=$(echo "$BOOK7" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

create "pages" "{\"book_id\":$BOOK7_ID,\"name\":\"Common Issues\",\"markdown\":\"# Troubleshooting\\n\\n## KF1 Server\\n\\n### ucc.exe crashes silently\\n**Cause:** \`steam_appid.txt\` exists.\\n\`\`\`bash\\nrm -f steam_appid.txt && ./ucc.exe make\\n\`\`\`\\n\\n### Mutator doesn't persist\\nUse \`ServerActors=\` in .ini, not \`?Mutator=\` on cmdline.\\n\\n### EditPackages errors\\nComment out KFGui/GoodKarma/KFMutators before compile, restore after.\\n\\n## Website\\n\\n### IP address mismatch\\nHeroSection: \`51.195.117.236:9980\` (old). LiveStats: \`94.130.51.236:7707\` (current).\\n\\n### Readdy.ai widget\\n\`PROJECT_ID_PLACEHOLDER\` in index.html needs real ID.\\n\\n## Deployment\\n\\n### Changes not showing\\n1. Right directory? Caddy serves from \`dist/\`\\n2. Clear cache (Ctrl+Shift+R)\\n3. Check \`systemctl status caddy-uliunai\`\\n\\n### Caddy not reloading\\nUse \`systemctl reload caddy-uliunai\` (NOT \`caddy\`)\\n\\n### Tunnel down\\n\`\`\`bash\\nsystemctl restart cloudflared\\n\`\`\`\\nWarning: brief interruption to ALL tunneled sites.\\n\\n## Wiki (BookStack)\\n\\n### Forgot password\\n\`\`\`bash\\nssh hetzner\\ndocker exec uliunai-bookstack php /app/www/artisan bookstack:create-admin --email=you@email.com --name=Admin --password=NewPass\\n\`\`\`\\n\\n## Domain Migration\\n\\nWhen \`uliunai.lt\` is purchased:\\n1. Update tunnel ingress (\`/etc/cloudflared/config.yml\`)\\n2. Update hub links, website nav, webadmin sidebar\\n3. Update BookStack APP_URL\\n4. See \`/home/uliunai/DOMAIN_MIGRATION.md\`\"}" > /dev/null
echo "  + Common Issues page"

# ============================================================
# Assign all books to the shelf
# ============================================================
echo "Assigning books to shelf..."
create "shelves/$SHELF_ID" "{\"books\":[$BOOK1_ID,$BOOK2_ID,$BOOK3_ID,$BOOK4_ID,$BOOK5_ID,$BOOK6_ID,$BOOK7_ID]}" > /dev/null 2>&1
# Use PUT to assign books
curl -s -X PUT "$API/shelves/$SHELF_ID" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"books\":[$BOOK1_ID,$BOOK2_ID,$BOOK3_ID,$BOOK4_ID,$BOOK5_ID,$BOOK6_ID,$BOOK7_ID]}" > /dev/null

echo ""
echo "=== DONE ==="
echo "BookStack populated with 7 books, 12 pages"
echo "Visit: https://wiki-uliunai.fezle.io"
echo "Login: damyanov95@gmail.com / UliunaiAdmin2026!"
