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
