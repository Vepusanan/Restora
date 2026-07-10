# Restora

Production-ready React Native (Expo) TypeScript starter for restaurant operations — Firebase Auth/Firestore/Storage, protected navigation, and **secure Gemini AI** via Cloud Functions.

## Tech stack

| Layer | Choice |
|-------|--------|
| App | Expo SDK **54**, React Native 0.81, TypeScript (strict) |
| Navigation | Expo Router (file-based, React Navigation under the hood) |
| Backend | Firebase Auth, Firestore, Storage, Cloud Functions |
| AI | Google Gemini — **server-side only** (Cloud Functions) |
| State | **Zustand** (lightweight auth/session store) |
| Forms | React Hook Form + Zod |
| UI | Custom component kit (StyleSheet) — no heavy UI lock-in |
| Storage | AsyncStorage (auth persistence), Expo SecureStore available |

### Why Zustand?

Redux Toolkit is excellent for large multi-slice apps. Restora’s first needs are auth session + a few feature stores. Zustand keeps boilerplate low, works cleanly with TypeScript, and is easy to grow later without a provider tree rewrite.

### Why Expo?

Expo gives Android + web from one codebase, OTA-friendly workflows, and SDK-aligned native modules. Bare React Native is unnecessary until you need custom native modules Expo cannot cover.

## Prerequisites

- Node.js 20+ (22 recommended)
- npm
- Android Studio / Android SDK (for Android)
- Firebase CLI (`npm i -g firebase-tools`)
- Xcode (optional — only for iOS)

## Installation

```bash
cd Restora
npm install
cd functions && npm install && cd ..
cp .env.example .env
cp functions/.env.example functions/.env
```

## Environment setup

### Public (safe in the mobile client)

Set these in `.env` with the `EXPO_PUBLIC_` prefix (bundled into the app):

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION` (default `us-central1`)

Firebase web config is public by design. Protect data with **Firestore / Storage Security Rules** and App Check.

### Private (never in the mobile app)

- `GEMINI_API_KEY` — Cloud Functions / Secret Manager only
- Service account JSON, Admin SDK credentials

## Firebase setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
2. Add a **Web** app and copy config into `.env`
3. Enable **Email/Password** authentication
4. Create a Firestore database
5. (Optional) Enable Storage
6. Deploy rules before production traffic

```bash
firebase login
firebase use <your-project-id>
```

## Gemini setup (secure)

Architecture:

```
Mobile App  →  Firebase Callable Function (generateContent)  →  Gemini API
```

1. Get an API key from [Google AI Studio](https://aistudio.google.com/)
2. Store it as a Functions secret (recommended):

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

3. Build and deploy functions:

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

4. From the app, call `generateAIResponse(prompt)` — it uses `httpsCallable`, never the Gemini SDK.

## Running the application

```bash
npm start          # Expo dev server
npm run android    # Android emulator / device
npm run web        # Web
npm run lint
npm run typecheck
npm run test
```

## Folder structure

```
app/                      # Expo Router screens (auth + protected app)
src/
  assets/                 # App-specific static assets
  components/             # Reusable UI and feature components
  screens/                # Non-route screen compositions
  navigation/             # Route constants / helpers
  services/
    firebase/             # Firebase init + Auth/Firestore/Storage accessors
    gemini/               # Client AI service (calls Cloud Functions only)
    api/                  # Generic HTTP helpers
  hooks/                  # Shared React hooks
  context/                # Providers (e.g. AuthProvider)
  store/                  # Zustand stores
  utils/                  # Validators, error mapping, helpers
  constants/              # Theme, auth constants
  types/                  # Shared TypeScript types
  config/                 # Env and app configuration
functions/
  src/gemini/             # Secure Gemini proxy + config
```

### Purpose of each `src/` folder

- **assets** — images/fonts scoped to the app logic layer
- **components** — presentational + reusable interactive UI
- **screens** — composed views reused outside route files
- **navigation** — route names and navigation helpers
- **services** — all external I/O (Firebase, AI, HTTP); UI never talks to SDKs directly
- **hooks** — reusable stateful logic
- **context** — React context providers
- **store** — global client state (Zustand)
- **utils** — pure helpers
- **constants** — shared literals
- **types** — domain types
- **config** — environment and feature flags

## Inventory Management

Module 3.2 (FR-011–FR-020) is implemented:

- Create / edit / consume / archive (admin) inventory batches
- FIFO grouping by ingredient with a single FIFO badge per group
- Derived expiry tones (green / amber / red) — never persisted
- Realtime Firestore listeners + client-side search/filter/sort
- Audit logs for create, edit, consume, archive

Collection: `inventoryBatches`  
Audit: `auditLogs`  
Index: `restaurantId ASC, dateReceived ASC`

Restora implements Module 3.1 end-to-end:

- Admin registration creates a restaurant + unique `RST-XXXXXX` code
- Staff registration validates the code **before** creating an Auth user
- Pending staff are gated to a waiting screen (UI + routes + Firestore rules)
- Admins approve / reject / deactivate staff with realtime listeners
- Approved staff are redirected to Inventory automatically (no re-login)
- RBAC: Admin full access; Staff operational only (no Cost / Analytics)
- Password reset via Firebase email link (1-hour expiry configured in Firebase Auth)
- Session persistence via Firebase Auth + AsyncStorage; deactivation forces logout

### Manual Firebase setup

1. Authentication → Email/Password enabled
2. Firestore rules + indexes deployed (`firebase deploy --only firestore`)
3. Storage → Get Started (for profile photos)
4. (Optional, Blaze plan) Deploy `deactivateStaff` for refresh-token revocation:
   `firebase deploy --only functions:deactivateStaff`
5. Auth email templates → Password reset link expiry (default 1 hour)

Without Blaze, deactivation still sets `status=deactivated` and the app logs the user out via the profile listener; token revoke is best-effort until the function is deployed.

## Coding standards

- Service layer for Firebase and AI — no SDK calls inside UI
- Strict TypeScript + path aliases (`@components/*`, `@services/*`, `@/types`, …)
- Loading, empty, and error states; root `ErrorBoundary`
- Secrets only in Functions / CI — never `EXPO_PUBLIC_` for private keys

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Expo |
| `npm run android` | Open Android |
| `npm run web` | Open web |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Jest |

## License

Private — Restora.
