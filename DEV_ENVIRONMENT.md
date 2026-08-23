# Development environment

This repo includes a Nix flake for NixOS/Linux development.

## Enter the shell

```bash
cd /home/laufan/Projects/MyStarQuest
nix develop
```

If you use `direnv`:

```bash
direnv allow
```

## First-time install

```bash
npm ci
(cd functions && npm ci)
```

## Common commands

```bash
npm run dev          # Vite dev server
npm run build        # TypeScript + Vite production build
npm run lint         # ESLint
npm run test         # Vitest
npm run test:e2e     # Playwright tests
firebase emulators:start
```

## Android / Capacitor

The shell provides Node 22, Firebase CLI, JDK 21, Gradle, Android platform tools, and Android SDK platform/build-tools 36.

```bash
npm run cap:build
npm run cap:open
# or
cd android && ./gradlew assembleDebug
```
