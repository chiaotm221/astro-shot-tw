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

- Search Chinese and English names.
- Support stars, planets, constellations, and deep-sky objects.
- Smoothly guide the view to a result.

### V2.2 — Object Information

- Reuse one information-card model across search, recommendations, and canvas
  selection.
- Show coordinates, magnitude, visibility, distance, and rise/transit/set data
  when available.

### V2.3 — Constellations

- Add constellation lines and localized labels.
- Preprocess line data and avoid expensive per-frame matching.

## Observation and Photography

### V3.x

- Moon phase, moonrise, moonset, and moonlight impact.
- Milky Way core direction and photography windows.
- An overnight timeline with pause, playback, and time acceleration.

### V4.x

- Taiwan observing-site map and static site information.
- Weather, cloud cover, and observing-condition summaries.
- Light-pollution data with explicit source dates and limitations.

### V5.x

- Photo selection and aligned sky or star-trail simulation using available
  EXIF plus user-confirmed GPS, approximate elevation, direction, orientation,
  focal length, and manual correction.
- Camera sensor, focal length, orientation, and field-of-view simulation.
- Exportable observing and photography plans.
- Optional external AI compositing workflow without coupling the simulator to a
  specific provider.
- No physical-camera control or live device-sensor integration.

### V6.x

- Installable PWA and carefully scoped offline support.
- Cached core assets, star data, and clearly labeled stale external data.

## Technical Direction

- Extract stable UI controls before restructuring the renderer.
- Keep astronomy calculations pure and separate from interface components.
- Establish unit, visual-regression, FPS, and allocation baselines before
  splitting the animation loop.
- Delay broad state-management libraries until state genuinely spans many
  independent consumers.
