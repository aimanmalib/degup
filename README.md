# Degup

Can you feel your own heartbeat?

Degup is a three-minute desktop game for adults. Your webcam sees your heartbeat through the Presage SmartSpectra SDK. Then the
game checks whether you can feel that beat yourself, and shows how your breathing bends it.

<!-- izin mula -->
A body-awareness game, not a health test.
<!-- izin akhir -->

Built for the Presage SmartSpectra SDK Challenge on DEV (November 2026). First commit: `50def1be6dd669eac62371ec66c7c7c72d9648e3`
(9 Nov 2026).

## Status

Work in progress. The app is not ready to install yet. This README grows with the build.

## How it works

1. **See.** A light pulses with each heartbeat the camera detects.
2. **Feel.** The lights go out. Press Space whenever you feel a beat, for 40 seconds. Then you see your taps next to the real beats.
3. **Bend.** Breathe 4 seconds in and 6 seconds out while the gap between beats is drawn live.

## Stack

Electron and TypeScript, no UI framework. `@smartspectra/node-sdk` 3.4.0. esbuild, vitest, Playwright, electron-builder.

## Development

```bash
nvm use            # Node 22
npm ci
npm run gerbang    # size limits, tsc, unit tests, banned words, BM/EN parity, build, Electron flow tests
DEGUP_SUMBER=sim npm start   # open the app with the synthetic signal (no camera, no key)
```

Fonts: Bricolage Grotesque and Atkinson Hyperlegible Next (SIL Open Font License), bundled from `@fontsource`.

The SDK key lives in `.env` (see `.env.example`). It is never committed.

## Credits

The renderer owns the camera and hands the stream to the SDK, following the official `electron-quickstart` sample in
[Presage-Security/SmartSpectra](https://github.com/Presage-Security/SmartSpectra) (`nodejs/samples/electron-quickstart`).

## AI disclosure

Built with Claude Code. I test it, record it and make the calls.

## License

MIT. The Presage SmartSpectra SDK has its own license and terms.
