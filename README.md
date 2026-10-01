# Agencyrenting — Mobile

React Native mobile app (Expo) for **Agencyrenting**.

Part of [Chaowalit Greepoke](https://bookchaowalit.com)'s 101 Portfolio Projects.

## Tech Stack

- **Framework:** Expo SDK 53 + Expo Router
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **UI:** React Native + Ionicons

## Features

- **Rental listings** (home tab): browse agency rental listings, search by
  title/area/agency, filter by maximum monthly rent and minimum bedrooms, and
  sort by price or size.
- **Move-in cost**: tap a listing to see first month + deposit + agency fee.
- Listings are bundled sample data (`lib/rentals.ts`); no backend yet.

## Getting Started

```bash
npm ci
npx expo start
```

## Validation

```bash
npm run validate   # expo lint + tsc --noEmit + vitest
npx expo export --platform android --output-dir dist   # bundle smoke check
```

Pure logic lives in `lib/` and is unit-tested with Vitest (`lib/*.test.ts`).
CI (`.github/workflows/build.yml`) runs all of the above and fails on errors;
the EAS preview build is owner-triggered (`workflow_dispatch`) and needs the
`EXPO_TOKEN` secret plus the committed `eas.json`.

## Build

```bash
# Android
npx eas build --platform android --profile preview

# iOS
npx eas build --platform ios --profile preview
```

## Related

- **Frontend:** [bookchaowalit-website/agencyrenting-frontend](https://github.com/bookchaowalit-website/agencyrenting-frontend)
- **Portfolio:** [bookchaowalit.com](https://bookchaowalit.com)

## License

MIT
