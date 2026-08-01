# AstroShot Taiwan Roadmap

This roadmap describes product direction. Detailed acceptance criteria and
implementation constraints belong in the matching file under `docs/PLAN/`.

## Product Principles

- Deliver a visible, independently testable result in each version.
- Keep sky direction, time, and observing-location calculations trustworthy.
- Preserve responsive desktop and mobile interaction.
- Extend the existing rendering engine incrementally.
- Record sources, dates, licenses, and attribution for external data.
- Do not add accounts, social features, or complex infrastructure before the
  core observing experience is stable.

## Near-Term Releases

### V1.1 — Taiwan Observing Sites

Status: implemented, pending full local runtime verification.

- Select from seven Taiwan observing sites.
- Update the sky from the selected latitude and longitude.
- Restore the last selected site from browser storage.

### V1.2 — Traditional Chinese Localization

Status: implemented, pending full local runtime verification.

- Complete the Traditional Chinese interface.
- Establish consistent translation keys and Taiwan date/time formatting.
- Preserve English as a supported locale.

### V1.3 — Custom Locations

Status: implemented, pending full local runtime verification.

- Accept validated latitude and longitude input.
- Request browser geolocation only after explicit user action.
- Save custom and recently used locations locally.

## Sky Discovery

### V2.0 — Tonight's Sky

Status: Phase 1 implemented, pending full verification. Moon and planets remain
deferred until validated ephemeris calculations are available.

- Recommend visible objects for the selected place and time.
- Explain direction, altitude, brightness, and viewing equipment in plain
  language.
- Navigate the sky view to a selected recommendation.

### V2.1 — Object Search

Status: Phase 1 implemented, pending full browser verification. Dynamic planet
positions remain deferred until validated ephemeris calculations are available.

- Search Chinese and English names.
- Support stars, planets, constellations, and deep-sky objects.
- Smoothly guide the view to a result.

### V2.2 — Object Information

Status: Phase 1 implemented, pending full browser verification. Validated
transit and set times remain follow-up work.

- Reuse one information-card model across search, recommendations, and canvas
  selection.
- Show coordinates, magnitude, visibility, distance, and rise/transit/set data
  when available.

### V2.3 — Constellations

Status: Phase 1 implemented, pending full browser and visual verification.

- Add constellation lines and localized labels.
- Preprocess line data and avoid expensive per-frame matching.

## Observation and Photography

### V3.x

Status: V3.0 Phase 1 implemented, pending authoritative ephemeris comparison
and full browser verification.

- Moon phase, moonrise, moonset, and moonlight impact.
Status: V3.1 Phase 1 implemented, pending authoritative comparison and full
browser verification.

- Milky Way core direction and photography windows.
Status: V3.2 Phase 1 implemented, pending full browser verification.

- An overnight timeline with pause, playback, and time acceleration.

### V4.x

Status: V4.0 Phase 1 static Taiwan observing map implemented, pending full
browser verification and sourced expansion.

V4.1 Phase 1 weather conditions implemented with failure-tolerant cached
Open-Meteo forecast data, pending full browser verification.

V4.2 Phase 1 historical light-pollution comparison implemented with explicit
estimate ranges and source limitations, pending full browser verification.

- Taiwan observing-site map and static site information.
- Weather, cloud cover, and observing-condition summaries.
- Light-pollution data with explicit source dates and limitations.

### V5.x

Status: V5.0 Phase 1 camera field-of-view and composition planning implemented,
pending full browser and visual verification.

V5.1 Phase 1 local photo import, JPEG EXIF extraction, and privacy messaging
implemented, pending fixture and browser verification.

V5.2 Phase 1 EXIF confirmation and manual photo-to-sky alignment implemented,
pending full browser and real-photo verification.

V5.3 Phase 1 local star, Milky Way, and simulation-time star-trail overlays
implemented, pending full browser, visual, and performance verification.

V5.4 Phase 1 local plan/preview export and consent-gated provider-neutral AI
handoff implemented. No provider upload is configured.

- Photo selection and aligned sky or star-trail simulation using available
  EXIF plus user-confirmed GPS, approximate elevation, direction, orientation,
  focal length, and manual correction.
- Camera sensor, focal length, orientation, and field-of-view simulation.
- Exportable observing and photography plans.
- Optional external AI compositing workflow without coupling the simulator to a
  specific provider.
- No physical-camera control or live device-sensor integration.

Planned sequence:

- V5.1 — Local photo import, EXIF extraction, and privacy notice.
- V5.2 — GPS/time/direction confirmation and manual sky alignment.
- V5.3 — Star, Milky Way, and star-trail preview over the imported photo.
- V5.4 — Photography-plan export and separately consented external AI workflow.

### V6.0 — Installable PWA and Offline Foundation

Status: Phase 1 implemented and covered by static-export tests. Full installed-app,
offline-browser, update-cycle, and storage-pressure verification remains pending.

- Installable web app metadata for desktop and mobile browsers.
- A scoped service worker that caches the application shell, star catalog,
  Milky Way texture, icons, and same-origin runtime assets.
- Offline access to bundled observing sites and browser-local astronomy
  calculations.
- A visible offline state and explicit live-versus-cached weather labels with
  the age of the last successful update.
- Support for root deployments and configured static-export base paths.

Detailed status and acceptance criteria: `docs/PLAN/V6.0.md`.

### V6.1 — Offline Data and Update Management

Status: Phase 1 implemented, pending installed-app, real offline-browser,
storage-pressure, and service-worker replacement verification.

- Let users inspect, refresh, and remove downloaded offline data.
- Show service-worker update availability and apply an update after explicit
  user action.
- Report cache readiness, last refresh time, approximate storage use, and
  partial-download failures.
- Keep external forecast data optional and visibly stale when offline.
- Add installed-app and network-disconnection browser tests.

Detailed scope: `docs/PLAN/V6.1.md`.

### V6.2 — Field Plan Export and Sharing

Status: Phase 1 implemented, pending mobile share-sheet, clipboard-permission,
and browser print/PDF verification.

- Complete the field plan with Moon, cached-weather, and equipment summaries.
- Add localized print output for browser PDF saving.
- Share a privacy-reduced plan through Web Share or a URL-fragment link.
- Keep JSON, PNG, print, and shared values derived from one plan model.

Detailed scope: `docs/PLAN/V6.2.md`.

### V7.0 — Validated Solar-System Ephemerides

Status: Phase 1 implemented with a shared offline ephemeris API, pinned engine,
dynamic search/recommendations, information-card events, and a six-body JPL
fixture. The full 2020–2040 fixture matrix and renderer integration remain.

- Add validated positions for the Moon and major visible planets.
- Complete Moon and planet coverage in recommendations, search, and object
  information.
- Provide rise, transit, and set events from one shared calculation layer.
- Compare representative results against an authoritative reference and
  publish the supported accuracy and date range.

Detailed scope: `docs/PLAN/V7.0.md`.

## Deferred Follow-Up

- Expand Taiwan observing sites with sourced eastern-island and offshore-island
  data.
- Replace site-level light-pollution estimates with versioned, attributable
  coordinate sampling.
- Validate photo alignment with real fixtures and broaden EXIF coverage.
- Establish visual-regression, frame-rate, and memory-allocation baselines
  before restructuring the renderer.

## Technical Direction

- Extract stable UI controls before restructuring the renderer.
- Keep astronomy calculations pure and separate from interface components.
- Establish unit, visual-regression, FPS, and allocation baselines before
  splitting the animation loop.
- Delay broad state-management libraries until state genuinely spans many
  independent consumers.
