# V7.0 Phase 2

## Added

- Normative JPL Horizons fixture configuration and USNO event-definition
  cross-check policy
- Explicit coordinate, time-scale, horizon, and refraction contracts
- Per-body angular, illumination, and event-time error budgets
- A 2020–2040 validation range, fixture matrix, provenance requirements, and
  dependency decision gate
- A pinned, zero-dependency Astronomy Engine 2.1.19 calculation layer
- Dynamic Moon, Mercury, Venus, Mars, Jupiter, and Saturn positions in search
  and Tonight's Sky
- Daily rise, transit, and set events in solar-system information cards
- The first provenance-bearing six-body JPL Horizons observer fixture
- Dynamic Moon and planet rendering and hit testing in the sky Canvas
- Solar-system azimuth, elevation, illumination, and magnitude in plan exports
- JPL Horizons rise, transit, and set fixture checks for the Moon and Jupiter

# V6.2

## Added

- Localized field-plan print view for printing or browser PDF saving
- Moon, cached-weather, and recommended-equipment planning summaries
- Web Share support with clipboard fallback
- URL-fragment plan links with Unicode-safe deterministic serialization
- Printable-value escaping and privacy-reduced share-link tests

## Changed

- Shared plans exclude original EXIF and confirmed capture data
- Replaced corrupted localized strings in the plan export panel

# V6.1

## Added

- Offline-data readiness panel for the application shell and star catalog
- Manual offline-data download, refresh, and AstroShot-scoped removal actions
- Browser storage usage and last-prepared-time reporting when supported
- User-controlled application update prompt for waiting service workers
- Partial-download and unsupported-browser feedback in English and Traditional
  Chinese

## Changed

- New service-worker versions wait for explicit user action before replacing an
  active version
- Offline refresh retries missing resources and reports individual failures
- Offline readiness now requires the exported page's discovered hashed scripts
  and styles, not only the entry point and data files

# V6.0

## Added

- Installable PWA manifest and Apple web-app metadata
- Service worker caching for the application shell, star catalog, Milky Way
  texture, and runtime assets
- Offline connectivity status with continued access to local astronomy tools
- Automated coverage for PWA assets and base-path deployments

## Changed

- Weather conditions now distinguish live data from offline cached data and
  show the age of the last successful update

# V2.0

## Added

- Tonight's Sky recommendations for bright stars and deep-sky objects
- Visibility status, direction, altitude, rise delay, and equipment guidance
- View navigation from a recommendation to its sky position

## Changed

- Exposed the renderer's sidereal angle through a stable ref for low-frequency
  recommendation calculations

## Fixed

- Recommendations do not use unverified fixed positions for planets or the Moon

# V1.3

## Added

- Custom observing-location names and coordinates
- Explicit browser geolocation request
- Local storage for up to eight recent custom locations

## Changed

- Expanded the observing-site selector to include saved custom locations
- Updated coordinate display to support all hemispheres

## Fixed

- Invalid or corrupted custom-location data now falls back safely
- Removed the original project GitHub link from the application interface

# V1.2

## Added

- Traditional Chinese (`zh-TW`) as the Chinese interface locale
- Migration for saved Simplified Chinese locale preferences

## Changed

- Converted sky controls, camera controls, status messages, and accessibility
  labels to Traditional Chinese
- Updated XHS language metadata and its default locale to `zh-TW`

## Fixed

- Locale metadata now matches the Traditional Chinese interface
- Legacy `zh-CN` settings safely resolve to `zh-TW`

# V1.1

## Added

- Taiwan observing sites
- Observing-site selector
- Traditional Chinese site and region labels
- Local storage for the last selected site

## Changed

- Updated `SkySimulator` to use the selected site's coordinates
- Expanded `observing-sites` with seven Taiwan locations
- Changed the default observing site to Taipei

## Fixed

- Coordinate updates when switching observing sites
- Longitude adjustment in the sidereal-time flow
- Safe fallback for invalid saved site IDs
