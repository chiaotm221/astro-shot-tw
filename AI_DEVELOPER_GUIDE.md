# AI Developer Guide

This document defines how AI development agents should analyze, modify, and
verify AstroShot Taiwan. Product scope and version requirements belong in the
relevant roadmap or version plan; this guide defines the engineering workflow.

## 1. Project Overview

AstroShot is an interactive sky and meteor simulator built with Next.js 16,
React 19, and TypeScript. It uses the Next.js App Router and also supports Vite,
vinext and Cloudflare builds.

Important files:

- `app/page.tsx`: application entry page.
- `app/SkySimulator.tsx`: main sky state, interaction, and render lifecycle.
- `app/CameraSystem.tsx`: image, video, and long-exposure capture behavior.
- `app/LiquidGlassMenu.tsx`: WebGL-backed settings menu.
- `app/rendering-helpers.mjs`: celestial projection helpers.
- `app/simulation/astronomy-time.ts`: sidereal-time calculations.
- `app/simulation/observing-sites.ts`: observing-site data.
- `app/simulation/settings.ts`: simulation settings and initial view.
- `app/i18n/`: interface copy and locale types.

## 2. Required Workflow

For every implementation task:

1. Read the relevant version plan and repository instructions.
2. Inspect the current implementation before proposing changes.
3. Trace the complete data flow affected by the feature.
4. Summarize the current behavior and identify compatibility constraints.
5. List the files expected to change before editing them.
6. Implement only the requested scope.
7. Review the final diff for unrelated changes and generated files.
8. Run the available verification commands.
9. Report changed files, decisions, command results, and remaining risks.

Do not begin with a broad refactor. Prefer the smallest coherent change that
delivers a testable result.

## 3. Rendering Boundaries

The sky renderer combines Canvas 2D and WebGL. Changes must preserve:

- the single `requestAnimationFrame` loop;
- Canvas initialization, resize behavior, and cleanup;
- the Milky Way WebGL renderer and its fallback behavior;
- star catalogue loading for the standard build;
- camera capture from the source canvas;
- pointer, wheel, keyboard, and pinch interaction;
- static export and Cloudflare compatibility.

Do not introduce React state updates inside the animation loop. Values needed by
the loop should normally be read from stable refs. Avoid allocating new objects
inside each frame unless the existing design already requires them and the cost
has been measured.

Do not change celestial projection formulas as part of a UI feature. Projection
changes require dedicated tests and visual comparison at fixed locations,
dates, times, and view directions.

## 4. React State and Browser APIs

- Use React state for values that must update rendered UI.
- Use refs for mutable values consumed by the animation loop.
- Keep callbacks stable when they are passed through frequently rendered UI.
- Access `window`, `document`, and `localStorage` only on the client.
- Keep server output and the first client render deterministic to avoid
  hydration mismatches.
- Treat browser storage as optional. Invalid data or storage failures must fall
  back safely without blocking the simulator.
- Do not restart the Canvas or WebGL lifecycle for ordinary setting changes.

Use memoization only when props are stable and avoided work is meaningful.
Small controls do not require `memo` by default.

## 5. Module Boundaries

Safe candidates for gradual extraction:

- React panels and reusable controls under `app/components/`;
- feature state under `app/hooks/` when it has multiple consumers or meaningful
  browser persistence logic;
- pure astronomy calculations under `app/simulation/`;
- pure vector and projection utilities under `app/rendering/` after tests exist.

Keep these areas together until tests and performance baselines are available:

- the main animation lifecycle;
- Canvas and WebGL initialization and disposal;
- the meteor creation, update, projection, and drawing pipeline;
- tightly coupled drawing functions that share render-loop closure state.

Move a renderer as a complete subsystem rather than scattering its shaders,
resources, lifecycle, and draw calls across several modules.

## 6. Version Timing

Do not build abstractions for features that do not exist yet.

- V1.x may extract established UI controls and small persistence hooks.
- V2.0 should define visibility and recommendation models when the "Tonight's
  Sky" feature is implemented.
- V2.1 and V2.2 should establish a shared celestial-object selection model for
  search, canvas picking, recommendations, and information cards.
- V2.3 should introduce constellation and label rendering with explicit
  performance controls.
- Animation-loop restructuring should wait for unit tests, visual regression
  coverage, and FPS or allocation measurements.

## 7. Code and Content Rules

- Use English for source identifiers, comments, developer documentation, tests,
  configuration, and Git content.
- Product localization strings may use the language required by the interface.
- Keep TypeScript strict and avoid unnecessary `any`.
- Do not add dependencies unless the feature cannot reasonably be implemented
  with the existing stack.
- Preserve existing public behavior unless the version plan explicitly changes
  it.
- Keep temporary files under `tmp/`.
- Do not place generated previews or scratch files in application or public
  directories.
- Do not edit unrelated files or reformat large untouched regions.

## 8. Verification

Run the commands available for the task, normally:

```text
npm install
npx tsc --noEmit
npm run lint
npm test
npm run build
```

Also verify when possible:

- no hydration warnings;
- no Canvas or WebGL console errors;
- desktop and mobile interaction;
- camera and long-exposure capture;
- locale and localStorage restoration;
- standard and Cloudflare build compatibility;
- stable visual output at fixed simulation inputs.

If a command cannot run, report the exact environmental blocker. Never describe
an unexecuted check as passing.

## 9. Performance Review

For rendering-related work, review:

- React render count for user actions;
- state updates that could be refs;
- effect dependencies and resource cleanup;
- per-frame object and array allocation;
- star catalogue traversal;
- Canvas draw-call volume;
- WebGL resource initialization and disposal;
- mobile frame rate and memory use.

Optimize only after identifying a real cost. Preserve correctness and visual
behavior before reducing allocations or reorganizing render code.

## 10. Completion Report

Every completed implementation report should include:

- the outcome visible to the user;
- files added or changed;
- important architectural decisions;
- commands executed and their results;
- tests that could not be performed;
- remaining compatibility, performance, or visual risks.

Do not commit, push, deploy, install global software, or modify external systems
unless the user explicitly requests that action.
