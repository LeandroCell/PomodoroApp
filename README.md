# Pomodoro Brew ☕

A production-ready Pomodoro timer with a brewing coffee cup at its center — one codebase, running
natively on iOS and Android and as an installable offline-capable web app (PWA).

Built with **Expo + Expo Router (TypeScript, strict mode)**, **Zustand**, **NativeWind**
(Tailwind for React Native), **react-native-svg + react-native-reanimated** for the cup animation,
and **expo-notifications** / the **Web Notifications API + Service Worker** for cross-platform
phase-end alerts.

## Features

- Work → short break → long break cycle, with a configurable number of sessions before a long
  break (default: 25 / 5 / 15 min, 4 sessions).
- Start / Pause / Reset / Skip, with an optional "auto-start next phase" toggle.
- A brewing coffee cup: the liquid level drains linearly with the remaining time, its color
  changes per phase (dark roast for focus, green tea for short breaks, blue for long breaks), and
  gentle steam rises while the timer is running.
- **Drift-free, timestamp-based timer** — the countdown is always recomputed from an absolute
  target timestamp (`Date.now()` diff), never a decrementing `setInterval` counter. It stays
  correct across backgrounding, device sleep, tab throttling, and even catches up correctly if
  multiple phases would have completed while the app was closed.
- Local notifications + a sound when a phase ends, reliable even when the app is backgrounded, the
  browser tab is inactive, or the device is locked (native OS-scheduled notifications on
  iOS/Android; Notification API + Service Worker on web).
- Settings: per-phase durations, sessions-until-long-break, sound on/off + choice of built-in
  sound, auto-start, notifications on/off, and light/dark/system appearance.
- Stats: pomodoros completed today/this week, total focus time, a 7-day bar chart, streak
  tracking, full session history, and CSV export.
- An optional "what are you working on?" task label attached to each completed session.
- Fully offline: all data is stored locally (AsyncStorage on native, localStorage on web via the
  same abstraction); the web build is an installable PWA with an offline fallback page.
- Responsive from small phones to desktop browsers; keyboard shortcut (`Space` = start/pause) on
  web.
- Accessible: every control has a screen-reader label/role, and colors meet contrast guidelines in
  both light and dark mode.

## Project structure

```
src/
  app/                    Expo Router routes ((tabs)/index, stats, settings) + root layout, +html
  features/
    timer/                Pure timer engine (timerEngine.ts) + zustand store + useTimer hook
    stats/                History store, selectors (streak/week/CSV), 7-day bar chart
    settings/             Settings store + types
    coffee-cup/            The animated SVG coffee cup
  components/             Shared UI (Button, IconButton, SegmentedControl, Confetti, ...)
  lib/                    Storage abstraction, notifications (native/web), sound, formatting
public/                   PWA manifest, service worker, offline fallback page (web only)
scripts/generate-sounds.js  Regenerates the built-in notification sounds (no external assets)
```

The timer logic (`src/features/timer/timerEngine.ts`) is a pure, dependency-free module —
independently unit-tested in `timerEngine.test.ts` (17 tests covering pause/resume idempotency,
multi-phase catch-up after being backgrounded for a long time, clock jumps, and cycle/long-break
logic). `useTimer.ts` is the thin React/platform glue layer (interval ticking, `AppState`
handling, scheduling notifications, logging completed sessions, playing sounds).

## Getting started

```bash
npm install
```

### Run on the web

```bash
npm run web
```

Opens at `http://localhost:8081`. This is a standard client-rendered app — no backend required.

### Run on iOS

Requires Xcode and the iOS Simulator (or a physical device with Expo Go / a dev build):

```bash
npm run ios
```

### Run on Android

Requires Android Studio with an emulator configured (or a physical device with Expo Go / a dev
build):

```bash
npm run android
```

> All native modules used here (expo-notifications, expo-audio, expo-file-system, expo-sharing,
> react-native-svg, react-native-reanimated) work inside **Expo Go** for quick iteration. For a
> release build, or to test the exact production notification/sound behavior, create a
> [development build](https://docs.expo.dev/develop/development-builds/introduction/) with
> `npx expo run:ios` / `npx expo run:android`, or build with
> [EAS Build](https://docs.expo.dev/build/introduction/).

### Tests

```bash
npm test          # run once
npm run test:watch
```

### Type-check & lint

```bash
npx tsc --noEmit
npm run lint
```

### Production web build (PWA)

```bash
npx expo export --platform web
npx serve dist
```

This produces a static, installable PWA in `dist/` — a manifest, a service worker (offline
fallback + cached static assets), and a light/dark-aware HTML shell. The whole app is
client-rendered on top of an inert server-rendered shell (`src/app/_layout.tsx`) so there is no
hydration flash or mismatch to worry about, since all real state (timer/settings/stats) is
localStorage-backed and only ever known on the client.

## Notes & known limitations

- This environment doesn't have a configured Xcode/iOS Simulator or Android SDK, so the iOS
  Simulator and Android emulator runs described above haven't been exercised here — only the web
  build has been tested end-to-end (timer countdown, phase transitions, notifications wiring,
  sound, stats logging, dark mode, mobile-width responsiveness, and the production PWA build). The
  native code paths (expo-notifications scheduling, expo-audio playback) are written against the
  installed SDK's documented APIs but should be smoke-tested on a real device/simulator before
  shipping.
- Multiple coffee-cup themes (a "nice-to-have" in the original spec) were not implemented, to keep
  focus on the core feature set; the phase-based color theme (work/short break/long break) is
  implemented.
