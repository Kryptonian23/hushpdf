# Testing HushPDF

## Toolchains

- Node.js 22.13.0 (declared in `.nvmrc`)
- Rust stable with the minimal profile (declared in `rust-toolchain.toml`)

With `nvm` and `rustup` installed:

```bash
nvm use
rustup show
npm ci
```

## Web checks

Run the same web checks used by CI:

```bash
npm run check
```

This runs TypeScript validation, ESLint, and the complete Vitest suite. Useful
individual commands are:

```bash
npm run typecheck
npm run lint
npm test
npm run test:watch
npm run test:coverage
```

The linter currently reports legacy warnings, primarily around untyped PDF and
WebAssembly APIs. They remain visible but do not block unrelated changes.

## Tauri checks on Linux

Tauri requires native development packages in addition to Rust. On Ubuntu or
Debian, install them once:

```bash
sudo apt-get update
sudo apt-get install -y pkg-config libdbus-1-dev libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

Then validate the Rust backend:

```bash
npm run check:tauri
```

The `Build Tauri` GitHub Actions workflow performs full desktop builds on
Linux, macOS, and Windows.
