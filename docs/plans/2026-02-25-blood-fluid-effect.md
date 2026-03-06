# Blood Fluid Effect Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the tsParticles-based BloodParticles component with a WebGL fluid simulation (webgl-fluid-enhanced) that renders dark, viscous blood-colored fluid as an interactive background effect.

**Architecture:** New `BloodFluid.tsx` component wraps a `<canvas>` element and initializes `webgl-fluid-enhanced` with blood-red color palette, transparent mode, and slow viscous settings. It replaces `BloodParticles.tsx` in `App.tsx`. The tsParticles dependencies are then removed from `package.json`.

**Tech Stack:** webgl-fluid-enhanced (zero-dep WebGL fluid sim), React 19, TypeScript

---

### Task 1: Install webgl-fluid-enhanced

**Files:**
- Modify: `kf1/website/package.json`

**Step 1: Install the package**

Run:
```bash
cd kf1/website && npm install webgl-fluid-enhanced
```

Expected: Package added to `dependencies` in `package.json`, lockfile updated.

**Step 2: Verify install**

Run:
```bash
cd kf1/website && node -e "require('webgl-fluid-enhanced'); console.log('OK')"
```

Expected: Prints `OK` without errors.

---

### Task 2: Create BloodFluid component

**Files:**
- Create: `kf1/website/src/components/feature/BloodFluid.tsx`

**Step 1: Create the component**

```tsx
import webGLFluidEnhanced from 'webgl-fluid-enhanced';

/**
 * Full-page blood-colored WebGL fluid simulation background.
 * Uses webgl-fluid-enhanced to render an interactive, viscous fluid effect
 * with a dark blood-red color palette. Transparent mode allows layering
 * over the existing Vanta fog and page background.
 * @component
 * @returns {JSX.Element} A fixed-position canvas with the fluid simulation
 */
export default function BloodFluid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    webGLFluidEnhanced.simulation(canvasRef.current, {
      COLOR_PALETTE: ['#8B0000', '#dc2626', '#b91c1c', '#4a0000', '#7f1d1d'],
      BACK_COLOR: '#000000',
      TRANSPARENT: true,
      DENSITY_DISSIPATION: 0.97,
      VELOCITY_DISSIPATION: 0.98,
      CURL: 15,
      SPLAT_RADIUS: 0.3,
      SPLAT_FORCE: 3000,
      PRESSURE: 0.8,
      BLOOM: true,
      BLOOM_INTENSITY: 0.4,
      BLOOM_THRESHOLD: 0.6,
      SUNRAYS: false,
      HOVER: true,
      BRIGHTNESS: 0.3,
      INITIAL: true,
      SPLAT_AMOUNT: 3,
      SHADING: true,
      COLORFUL: false,
      SPLAT_KEY: '',
    });
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
```

**Notes:**
- `COLORFUL: false` prevents rapid random color cycling — we want consistent blood reds
- `SPLAT_KEY: ''` disables spacebar triggering splats (would interfere with page scroll)
- `pointerEvents: 'none'` on the canvas ensures clicks pass through to content. However, `HOVER: true` won't work with pointer-events none. We need to handle this — see Task 3.

---

### Task 3: Fix hover interactivity with pointer-events passthrough

**Files:**
- Modify: `kf1/website/src/components/feature/BloodFluid.tsx`

The canvas needs `pointer-events: none` so users can click buttons/links, but the fluid should still react to mouse movement. Solution: listen to `mousemove` on `window` and programmatically trigger splats at the cursor position.

**Step 1: Update the component to use manual splats instead of HOVER**

Replace the component with:

```tsx
import webGLFluidEnhanced from 'webgl-fluid-enhanced';

/**
 * Full-page blood-colored WebGL fluid simulation background.
 * Uses webgl-fluid-enhanced to render an interactive, viscous fluid effect
 * with a dark blood-red color palette. Transparent mode allows layering
 * over the existing Vanta fog and page background.
 *
 * Mouse interaction is achieved by listening to window mousemove events
 * and programmatically creating splats, since the canvas has
 * pointer-events: none to allow click-through to page content.
 *
 * @component
 * @returns {JSX.Element} A fixed-position canvas with the fluid simulation
 */
export default function BloodFluid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    webGLFluidEnhanced.simulation(canvasRef.current, {
      COLOR_PALETTE: ['#8B0000', '#dc2626', '#b91c1c', '#4a0000', '#7f1d1d'],
      BACK_COLOR: '#000000',
      TRANSPARENT: true,
      DENSITY_DISSIPATION: 0.97,
      VELOCITY_DISSIPATION: 0.98,
      CURL: 15,
      SPLAT_RADIUS: 0.3,
      SPLAT_FORCE: 3000,
      PRESSURE: 0.8,
      BLOOM: true,
      BLOOM_INTENSITY: 0.4,
      BLOOM_THRESHOLD: 0.6,
      SUNRAYS: false,
      HOVER: false,
      BRIGHTNESS: 0.3,
      INITIAL: true,
      SPLAT_AMOUNT: 3,
      SHADING: true,
      COLORFUL: false,
      SPLAT_KEY: '',
    });

    const handleMouseMove = (e: MouseEvent) => {
      const prev = lastPos.current;
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      if (prev) {
        const dx = (e.clientX - prev.x) * 10;
        const dy = (e.clientY - prev.y) * 10;

        // Only splat if the mouse actually moved a meaningful distance
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          webGLFluidEnhanced.splat(x, y, dx, dy);
        }
      }

      lastPos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
}
```

---

### Task 4: Replace BloodParticles with BloodFluid in App.tsx

**Files:**
- Modify: `kf1/website/src/App.tsx`

**Step 1: Swap the import and component**

Change:
```tsx
import BloodParticles from './components/feature/BloodParticles'
```
to:
```tsx
import BloodFluid from './components/feature/BloodFluid'
```

Change `<BloodParticles />` to `<BloodFluid />` in the JSX.

---

### Task 5: Remove tsParticles dependencies

**Files:**
- Delete: `kf1/website/src/components/feature/BloodParticles.tsx`
- Modify: `kf1/website/package.json` (remove `@tsparticles/react`, `@tsparticles/slim`)

**Step 1: Delete the old component**

```bash
rm kf1/website/src/components/feature/BloodParticles.tsx
```

**Step 2: Uninstall tsParticles packages**

```bash
cd kf1/website && npm uninstall @tsparticles/react @tsparticles/slim
```

---

### Task 6: Add TypeScript declaration for webgl-fluid-enhanced

**Files:**
- Modify: `kf1/website/src/vite-env.d.ts`

The library may not ship types. If TypeScript complains, add a module declaration.

**Step 1: Add declaration if needed**

Append to `kf1/website/src/vite-env.d.ts`:

```ts
declare module 'webgl-fluid-enhanced' {
  interface FluidConfig {
    SIM_RESOLUTION?: number;
    DYE_RESOLUTION?: number;
    CAPTURE_RESOLUTION?: number;
    DENSITY_DISSIPATION?: number;
    VELOCITY_DISSIPATION?: number;
    PRESSURE?: number;
    PRESSURE_ITERATIONS?: number;
    CURL?: number;
    INITIAL?: boolean;
    SPLAT_AMOUNT?: number;
    SPLAT_RADIUS?: number;
    SPLAT_FORCE?: number;
    SPLAT_KEY?: string;
    SHADING?: boolean;
    COLORFUL?: boolean;
    COLOR_UPDATE_SPEED?: number;
    COLOR_PALETTE?: string[];
    HOVER?: boolean;
    BACK_COLOR?: string;
    TRANSPARENT?: boolean;
    BRIGHTNESS?: number;
    BLOOM?: boolean;
    BLOOM_ITERATIONS?: number;
    BLOOM_RESOLUTION?: number;
    BLOOM_INTENSITY?: number;
    BLOOM_THRESHOLD?: number;
    BLOOM_SOFT_KNEE?: number;
    SUNRAYS?: boolean;
    SUNRAYS_RESOLUTION?: number;
    SUNRAYS_WEIGHT?: number;
  }

  const webGLFluidEnhanced: {
    simulation: (canvas: HTMLCanvasElement, config?: FluidConfig) => void;
    config: (config: FluidConfig) => void;
    splats: () => void;
    splat: (x: number, y: number, dx: number, dy: number, color?: string) => void;
    pause: (drawWhilePaused?: boolean) => void;
    screenshot: () => void;
  };

  export default webGLFluidEnhanced;
}
```

---

### Task 7: Verify build and visual test

**Step 1: Run the build**

```bash
cd kf1/website && npm run build
```

Expected: Clean build, no TypeScript errors, no warnings about missing modules.

**Step 2: Run dev server and visual check**

```bash
cd kf1/website && npm run dev
```

Verify:
- Blood-red fluid renders behind content
- Mouse movement creates fluid disturbance
- VantaFog still visible underneath
- All buttons/links remain clickable
- HorrorDecorations (zombie hand, claw marks, splatter) still render on top
- No console errors about WebGL context conflicts

**Step 3: Commit**

```bash
git add kf1/website/src/components/feature/BloodFluid.tsx kf1/website/src/App.tsx kf1/website/src/vite-env.d.ts kf1/website/package.json kf1/website/package-lock.json
git commit -m "feat(kf1): replace tsParticles blood drops with WebGL fluid simulation

Swap BloodParticles (tsParticles red circles) for BloodFluid using
webgl-fluid-enhanced. Renders viscous blood-red fluid with interactive
mouse tracking, bloom glow, and transparent layering over VantaFog.

- Add BloodFluid.tsx with blood-red COLOR_PALETTE and slow dissipation
- Manual splat-on-mousemove for pointer-events passthrough
- Remove @tsparticles/react and @tsparticles/slim dependencies
- Add TypeScript declarations for webgl-fluid-enhanced"
```
