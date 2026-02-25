# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo for the Uliunai.lt Killing Floor community platform. Multiple apps under one domain using subdomains (`*.uliunai.lt`). See [PLAN.md](PLAN.md) for the full master plan, architecture decisions, and phased roadmap.

## Monorepo Layout

```
hub/                → uliunai.lt (main landing — Phase 1)
kf1/website/        → kf1.uliunai.lt (React + Vite SPA — Phase 2)
kf1/statistics/     → kf1.uliunai.lt/statistics (PHP stats — Phase 3)
kf1/admin/          → kf1.uliunai.lt/admin (future)
kf2/                → kf2.uliunai.lt/* (future, mirrors kf1 structure)
shared/             → Design tokens, shared configs (future)
cdn/                → Static assets via Cloudflare (future)
```

## KF1 Website (kf1/website/)

### Commands
```bash
cd kf1/website
npm install          # Install dependencies
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build → dist/
npm run preview      # Preview production build
```

### Tech Stack
- **React 19** + **TypeScript 5.8** + **Vite 7** + **Tailwind CSS 3.4**
- **React Router DOM 7** — SPA routing (currently single route `/` with section-based navigation)
- **i18next** — Internationalization (translations in `src/i18n/local/[lang]/`)
- **Stripe**, **Supabase**, **Firebase** — installed but not yet connected

### Path Alias
`@` → `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`)

### Auto-Imports
`unplugin-auto-import` is configured — React hooks (`useState`, `useEffect`, etc.), React Router hooks (`useNavigate`, `useParams`, etc.), and i18next (`useTranslation`) are available without explicit imports. See `auto-imports.d.ts` for the full list.

### Component Organization
- `src/components/base/` — Reusable primitives (Button, Card) with variant/size props
- `src/components/feature/` — Composite components (Navigation, Footer, LiveStats)
- `src/pages/home/components/` — Section components for the home page (Hero, About, ServerInfo, Gallery, News, Admin, Vip, Contact)

### Routing
Routes defined in `src/router/config.tsx`. Global navigation function stored on `window.REACT_APP_NAVIGATE` for use outside React components.

## KF1 Statistics (kf1/statistics/) — Future

PHP + vanilla JS. Reads `ServerPerksStat.ini` via FTP from the game server. See PLAN.md "Data Flow (Statistics)" for the architecture.

## Design System

All subdomains share the same visual identity — **horror/gaming theme**:

- **Fonts:** Orbitron (headings), Rajdhani (body) — loaded via Google Fonts CDN
- **Colors:** Blood reds (`#8B0000`, `#dc2626`) on black (`#000`), horror gray (`#1a1a1a`) surfaces
- **Effects:** Glitch text animation, red glow shadows, blood drip pseudo-elements, scanlines overlay
- **Tailwind custom tokens:** `blood-red`, `dark-red`, `horror-gray` colors; `red-glow`, `blood` shadows; `pulse-slow`, `bounce-slow` animations (defined in `kf1/website/tailwind.config.ts`)
- **Icons:** Remix Icon 4.5.0 + Font Awesome 6.4.0 (CDN in `index.html`)

## Code Conventions

- TypeScript strict mode — no unused locals or parameters
- Functional components only (React hooks, no class components)
- JSDoc comments on all components with `@component`, `@param`, `@returns`
- PascalCase components, camelCase functions/variables
- All styling via Tailwind utility classes (no CSS modules or styled-components)
- Responsive mobile-first approach
