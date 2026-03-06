# Uliunai.lt Design System

Canonical design reference for all subdomains (`hub`, `kf1`, `kf2`, etc.).
Extracted from the KF1 website implementation (`kf1/website/tailwind.config.ts`, `kf1/website/src/index.css`, `kf1/website/index.html`).
Every subdomain **must** use these tokens to maintain a consistent horror/gaming identity across `*.uliunai.lt`.

---

## Table of Contents

1. [Fonts](#fonts)
2. [Colors](#colors)
3. [Gradients](#gradients)
4. [Shadows](#shadows)
5. [Animations & Effects](#animations--effects)
6. [Scrollbar](#scrollbar)
7. [Focus Styles](#focus-styles)
8. [Selection](#selection)
9. [Icons](#icons)
10. [CSS Custom Properties (Copy-Paste Block)](#css-custom-properties)
11. [Full Effect CSS (Copy-Paste Block)](#full-effect-css)

---

## Fonts

| Role     | Family    | Weights        | Fallback    |
|----------|-----------|----------------|-------------|
| Headings | Orbitron  | 400, 700, 900  | `monospace` |
| Body     | Rajdhani  | 400, 600, 700  | `sans-serif`|

### Google Fonts CDN

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet">
```

### CSS Usage

```css
font-family: 'Orbitron', monospace;   /* headings */
font-family: 'Rajdhani', sans-serif;  /* body */
```

### Tailwind Classes

```
font-orbitron   /* headings */
font-rajdhani   /* body */
```

---

## Colors

### Brand / Theme Colors

| Token         | Hex        | Usage                              |
|---------------|------------|------------------------------------|
| `blood-red`   | `#8B0000`  | Primary brand red, accents         |
| `dark-red`    | `#4A0000`  | Gradient end, deep backgrounds     |
| `horror-gray` | `#1a1a1a`  | Surface / card backgrounds         |
| `black`       | `#000000`  | Page background                    |

### Red Scale (Tailwind defaults used across the site)

| Token      | Hex        | Usage                           |
|------------|------------|---------------------------------|
| `red-500`  | `#ef4444`  | Lighter accent, hover states    |
| `red-600`  | `#dc2626`  | Interactive elements, scrollbar |
| `red-700`  | `#b91c1c`  | Hover on interactive elements   |
| `red-900`  | `#7f1d1d`  | Muted red backgrounds           |

### Text Colors

| Token            | Value                      | Usage             |
|------------------|----------------------------|-------------------|
| `text-primary`   | `rgba(255, 255, 255, 0.87)`| Default body text |
| `text-secondary` | `#9ca3af`                  | Descriptions, labels |
| `text-muted`     | `#4b5563`                  | Disabled, hints   |

---

## Gradients

| Token             | Value                                               | Usage                |
|-------------------|-----------------------------------------------------|----------------------|
| `blood-gradient`  | `linear-gradient(135deg, #8B0000 0%, #4A0000 100%)` | Buttons, banners     |
| `dark-gradient`   | `linear-gradient(135deg, #000000 0%, #1a1a1a 100%)` | Section backgrounds  |

### Tailwind Classes

```
bg-blood-gradient
bg-dark-gradient
```

---

## Shadows

| Token      | Value                                   | Usage                     |
|------------|-----------------------------------------|---------------------------|
| `red-glow` | `0 0 20px rgba(220, 38, 38, 0.3)`      | Hover glow on cards/buttons |
| `blood`    | `0 4px 20px rgba(139, 0, 0, 0.4)`      | Elevated cards, modals    |

### Tailwind Classes

```
shadow-red-glow
shadow-blood
```

---

## Animations & Effects

### pulse-slow

Fades opacity between 1 and 0.5 on a 3-second loop. Used for loading states and subtle attention.

```css
/* Tailwind: animate-pulse-slow */
animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

### bounce-slow

Standard Tailwind bounce on a 2-second loop.

```css
/* Tailwind: animate-bounce-slow */
animation: bounce 2s infinite;
```

### Glitch Text Effect

Chromatic-aberration text glitch on a 1-second loop.

```css
.glitch {
  animation: glitch 1s linear infinite;
}

@keyframes glitch {
  0% {
    text-shadow: 0.05em 0 0 #dc2626, -0.05em -0.025em 0 #00ff00, 0.025em 0.05em 0 #0000ff;
  }
  15% {
    text-shadow: 0.05em 0 0 #dc2626, -0.05em -0.025em 0 #00ff00, 0.025em 0.05em 0 #0000ff;
  }
  16% {
    text-shadow: -0.05em -0.025em 0 #dc2626, 0.025em 0.025em 0 #00ff00, -0.05em -0.05em 0 #0000ff;
  }
  49% {
    text-shadow: -0.05em -0.025em 0 #dc2626, 0.025em 0.025em 0 #00ff00, -0.05em -0.05em 0 #0000ff;
  }
  50% {
    text-shadow: 0.025em 0.05em 0 #dc2626, 0.05em 0 0 #00ff00, 0 -0.05em 0 #0000ff;
  }
  99% {
    text-shadow: 0.025em 0.05em 0 #dc2626, 0.05em 0 0 #00ff00, 0 -0.05em 0 #0000ff;
  }
  100% {
    text-shadow: -0.025em 0 0 #dc2626, -0.025em -0.025em 0 #00ff00, -0.025em -0.05em 0 #0000ff;
  }
}
```

### Blood Drip Pseudo-Element

A thin red drip that hangs beneath an element. Requires the parent to have `position: relative`.

```css
.blood-drip {
  position: relative;
}

.blood-drip::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 10px;
  background: linear-gradient(to bottom, #dc2626, transparent);
  border-radius: 0 0 50% 50%;
}
```

---

## Scrollbar

Custom WebKit scrollbar styled to match the theme.

```css
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background: #dc2626;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #b91c1c;
}
```

| Part          | Value      |
|---------------|------------|
| Width         | `8px`      |
| Track         | `#1a1a1a`  |
| Thumb         | `#dc2626`  |
| Thumb (hover) | `#b91c1c`  |

---

## Focus Styles

All interactive elements use a red outline for keyboard focus.

```css
button:focus,
input:focus,
textarea:focus,
select:focus {
  outline: 2px solid #dc2626;
  outline-offset: 2px;
}
```

| Property       | Value              |
|----------------|--------------------|
| Outline width  | `2px`              |
| Outline style  | `solid`            |
| Outline color  | `#dc2626`          |
| Outline offset | `2px`              |

---

## Selection

```css
::selection {
  background-color: #dc2626;
  color: white;
}
```

---

## Icons

Two icon libraries loaded via CDN. Use both throughout the platform.

### Remix Icon 4.5.0

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.5.0/remixicon.min.css">
```

Usage: `<i class="ri-home-line"></i>` -- see [remixicon.com](https://remixicon.com/)

### Font Awesome 6.4.0

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

Usage: `<i class="fas fa-skull"></i>` -- see [fontawesome.com](https://fontawesome.com/icons)

---

## CSS Custom Properties

Copy-paste this `:root` block into any plain CSS file to get all design tokens as custom properties.

```css
:root {
  /* ── Fonts ────────────────────────────────────── */
  --font-heading: 'Orbitron', monospace;
  --font-body: 'Rajdhani', sans-serif;

  /* ── Brand Colors ─────────────────────────────── */
  --color-blood-red: #8B0000;
  --color-dark-red: #4A0000;
  --color-horror-gray: #1a1a1a;
  --color-black: #000000;

  /* ── Red Scale ────────────────────────────────── */
  --color-red-500: #ef4444;
  --color-red-600: #dc2626;
  --color-red-700: #b91c1c;
  --color-red-900: #7f1d1d;

  /* ── Text Colors ──────────────────────────────── */
  --color-text-primary: rgba(255, 255, 255, 0.87);
  --color-text-secondary: #9ca3af;
  --color-text-muted: #4b5563;

  /* ── Gradients ────────────────────────────────── */
  --gradient-blood: linear-gradient(135deg, #8B0000 0%, #4A0000 100%);
  --gradient-dark: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);

  /* ── Shadows ──────────────────────────────────── */
  --shadow-red-glow: 0 0 20px rgba(220, 38, 38, 0.3);
  --shadow-blood: 0 4px 20px rgba(139, 0, 0, 0.4);

  /* ── Scrollbar ────────────────────────────────── */
  --scrollbar-width: 8px;
  --scrollbar-track: #1a1a1a;
  --scrollbar-thumb: #dc2626;
  --scrollbar-thumb-hover: #b91c1c;

  /* ── Focus ────────────────────────────────────── */
  --focus-outline: 2px solid #dc2626;
  --focus-offset: 2px;

  /* ── Selection ────────────────────────────────── */
  --selection-bg: #dc2626;
  --selection-color: #ffffff;

  /* ── Animation Durations ──────────────────────── */
  --duration-pulse-slow: 3s;
  --duration-bounce-slow: 2s;
  --duration-glitch: 1s;

  /* ── Base Styles ──────────────────────────────── */
  font-family: var(--font-body);
  line-height: 1.5;
  font-weight: 400;
  color-scheme: dark;
  color: var(--color-text-primary);
  background-color: var(--color-black);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## Full Effect CSS

Complete copy-paste block with all effects, scrollbar, focus, selection, and keyframes.
Drop this into a stylesheet alongside the `:root` block above.

```css
/* ── Smooth Scrolling ───────────────────────────── */
html {
  scroll-behavior: smooth;
}

/* ── Scrollbar ──────────────────────────────────── */
::-webkit-scrollbar {
  width: var(--scrollbar-width, 8px);
}

::-webkit-scrollbar-track {
  background: var(--scrollbar-track, #1a1a1a);
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, #dc2626);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, #b91c1c);
}

/* ── Selection ──────────────────────────────────── */
::selection {
  background-color: var(--selection-bg, #dc2626);
  color: var(--selection-color, #ffffff);
}

/* ── Focus ──────────────────────────────────────── */
button:focus,
input:focus,
textarea:focus,
select:focus {
  outline: var(--focus-outline, 2px solid #dc2626);
  outline-offset: var(--focus-offset, 2px);
}

/* ── Pulse Keyframes ────────────────────────────── */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse-slow {
  animation: pulse var(--duration-pulse-slow, 3s) cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* ── Glitch Keyframes ───────────────────────────── */
@keyframes glitch {
  0% {
    text-shadow: 0.05em 0 0 #dc2626, -0.05em -0.025em 0 #00ff00, 0.025em 0.05em 0 #0000ff;
  }
  15% {
    text-shadow: 0.05em 0 0 #dc2626, -0.05em -0.025em 0 #00ff00, 0.025em 0.05em 0 #0000ff;
  }
  16% {
    text-shadow: -0.05em -0.025em 0 #dc2626, 0.025em 0.025em 0 #00ff00, -0.05em -0.05em 0 #0000ff;
  }
  49% {
    text-shadow: -0.05em -0.025em 0 #dc2626, 0.025em 0.025em 0 #00ff00, -0.05em -0.05em 0 #0000ff;
  }
  50% {
    text-shadow: 0.025em 0.05em 0 #dc2626, 0.05em 0 0 #00ff00, 0 -0.05em 0 #0000ff;
  }
  99% {
    text-shadow: 0.025em 0.05em 0 #dc2626, 0.05em 0 0 #00ff00, 0 -0.05em 0 #0000ff;
  }
  100% {
    text-shadow: -0.025em 0 0 #dc2626, -0.025em -0.025em 0 #00ff00, -0.025em -0.05em 0 #0000ff;
  }
}

.glitch {
  animation: glitch var(--duration-glitch, 1s) linear infinite;
}

/* ── Blood Drip ─────────────────────────────────── */
.blood-drip {
  position: relative;
}

.blood-drip::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 10px;
  background: linear-gradient(to bottom, #dc2626, transparent);
  border-radius: 0 0 50% 50%;
}
```
