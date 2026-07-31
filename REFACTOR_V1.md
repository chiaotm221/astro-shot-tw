# AstroShot Core Refactor V1

This refactor reorganizes core configuration data without intentionally changing the UI or simulation behavior.

## Extracted modules

- `app/simulation/settings.ts`
  - `Settings`
  - `View`
  - `DEFAULT_SETTINGS`
  - `DEFAULT_VIEW`
- `app/simulation/astronomy-time.ts`
  - angle constants
  - sidereal-day rate
  - Julian-date conversion
  - sidereal-angle calculation
- `app/simulation/observing-sites.ts`
  - reusable observing-site type
  - initial Taiwan observing-site dataset; not connected to the UI yet
- `app/i18n/types.ts`
  - locale type
- `app/i18n/translations.ts`
  - Chinese and English UI copy

## Updated file

- `app/SkySimulator.tsx`
  - imports the extracted settings, astronomy-time, and translation modules
  - retains rendering, meteor, interaction, and component logic

## Validation status

- Static source inspection completed.
- Node.js version in the validation environment: 22.16.0.
- `npm ci` could not complete because the execution environment's package mirror returned HTTP 404 for `zod-validation-error-4.0.2.tgz`.
- A complete Next.js build therefore could not be performed in this environment.
- Run `npm ci && npm run build` in Google AI Studio, Codespaces, or a normal npm environment before merging or deployment.
