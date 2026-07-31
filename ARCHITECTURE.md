# Architecture

## Overview

AstroShot is a client-rendered sky simulator delivered through Next.js. React
owns interface state and browser lifecycle, while a persistent Canvas animation
loop renders the sky independently of React renders.

## Runtime Layers

### Application and UI

- `app/page.tsx` mounts `SkySimulator`.
- `app/SkySimulator.tsx` coordinates simulation state, interactions, and the
  rendering lifecycle.
- `app/components/` contains feature controls such as the observing-site
  selector.
- `app/CameraSystem.tsx` captures still images, video, and long exposures from
  the sky canvas.
- `app/LiquidGlassMenu.tsx` provides the WebGL-backed settings surface.
- `app/i18n/` stores locale types and interface copy.

### Simulation

- `app/simulation/settings.ts` defines simulation settings and the initial view.
- `app/simulation/astronomy-time.ts` converts time and longitude into sidereal
  angle values.
- `app/simulation/observing-sites.ts` defines Taiwan site coordinates and
  lookup behavior.
- `app/rendering-helpers.mjs` performs reusable celestial coordinate and screen
  projection calculations.

### Rendering

The main canvas uses Canvas 2D for the sky gradient, stars, meteors, horizon,
and sensor noise. A dedicated WebGL renderer projects the Milky Way panorama
onto an offscreen canvas, which is composited into the main canvas.

The render lifecycle is intentionally persistent:

```text
React state
    ↓ synchronize
stable refs
    ↓ read each frame
requestAnimationFrame loop
    ↓
Canvas 2D + offscreen WebGL
    ↓
camera capture
```

React state must not be updated every frame. UI-visible settings use state and
are mirrored into refs for the renderer.

## Observing-Site Data Flow

```text
ObservingSiteSelector
    ↓ site ID
SkySimulator callback
    ├─ selected site state → UI
    ├─ latitude setting → star and Milky Way projection
    ├─ longitude ref → sidereal-angle adjustment
    └─ localStorage → restoration after hydration
```

The server and first client render use Taipei. Browser storage is read only in a
client effect, preventing server/client markup differences.

## Data and Assets

- `public/data/stars.json` contains the generated star catalogue.
- `public/textures/` contains the Milky Way panorama.
- `scripts/build-star-catalog.mjs` prepares catalogue data.
- XHS builds bundle required runtime data and asset paths.

External datasets and media must retain their license and attribution records.

## Build Targets

- Next.js development and static export.
- GitHub Pages deployment from the static output.
- Optional Sites/Cloudflare build through vinext.
- XHS offline package through Vite.

Changes must not assume a server-only runtime unless a version plan explicitly
changes deployment architecture.

## Current Constraints

- `SkySimulator.tsx` still contains UI controls, meteor physics, projection,
  and drawing code.
- `basisForView` allocates a basis object and three arrays per frame.
- The main animation-loop closure owns many resources and should not be split
  before tests and performance baselines exist.
- Runtime verification requires Node.js 22.13 or later and installed packages.

See `AI_DEVELOPER_GUIDE.md` for modification rules and `ROADMAP.md` for planned
architecture evolution.
