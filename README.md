# Restora

Recovery and wellness mobile app built with Expo SDK 54, Firebase, and Google Gemini.

## Tech stack

- React Native (Expo SDK 54) + TypeScript
- Firebase Auth + Firestore (JavaScript SDK)
- Expo Notifications (push in Expo Go; native FCM via dev build)
- Victory Native (charts — requires development build)
- Google Gemini API

## Project structure

```
app/                  # Expo Router screens
src/
  components/         # Shared UI (charts, etc.)
  config/             # Environment config
  constants/          # App constants
  context/            # React context providers
  hooks/              # Custom hooks
  providers/          # Root providers
  services/           # Firebase, Gemini, notifications
  types/              # TypeScript types
  utils/              # Helpers
components/           # Expo template UI components
hooks/                # Expo template hooks
constants/            # Expo template theme constants
docs/                 # Project documentation (SRS)
```

## Environment variables

Copy `.env.example` to `.env` and fill in:

- `EXPO_PUBLIC_FIREBASE_*` — Firebase web config
- `EXPO_PUBLIC_GEMINI_API_KEY` — Google AI Studio API key

## Commands

```bash
npm start          # Start Expo dev server
npm run android    # Open on Android
npm run lint       # Run ESLint
```

## Notes

- **Expo Go**: Auth, Firestore, Gemini, and Expo push tokens work in Expo Go.
- **Victory Native**: Requires `@shopify/react-native-skia` — use `npx expo prebuild` + `npx expo run:android` for charts.
- **Native FCM**: `google-services.json` is configured for when you create a development build.
