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
