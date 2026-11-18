# Measurements

Every number here comes from a run on this repo's own scripts or tests. Each run that uses Presage credit has its own
section below. Nothing here is a measurement of a person.

## Live path smoke test, no face

Date: 19 November 2026 (MYT). Host: Linux under xvfb, Mesa lavapipe for Vulkan, `@smartspectra/node-sdk` 3.4.0, the owner's own
Presage key. Total SDK time across the four runs below: about 62 seconds.

**What ran**

1. `scripts/asap-live.mjs`, twice. It starts the real Electron app in `live` mode. The camera is Chromium's fake device
   (`--use-fake-device-for-media-stream`): a moving test pattern, no person in the frame.
2. `scripts/headless-smoke.mjs`, twice, on a 20 second `ffmpeg testsrc` pattern video made in a temporary folder and deleted after.

**What it confirmed**

| Check | Result |
|---|---|
| Preload bridge from the SDK (`window.__smartspectraBridge`) is present | yes |
| `bindSmartSpectraIpc` bound in the main process (new IPC channel `smartspectra:attach` after Start) | yes |
| Key accepted by Presage: Data panel shows "API key validation with Presage: Yes" | yes |
| SDK reached `kRunning` in the second file run (`processingStatus` seen: 1, 2, 3, 4; the first run did not record this yet) | yes |
| `validationStatus` code 1 (`kNoFaceFound`) arrives and the app shows "Paused. No face in view. Look at the camera." | yes |
| Content Security Policy violations or console errors in the window | none |
| Esc turns the camera off and returns to the consent screen | yes |
| SDK error codes 2, 4, 5 and 6 map to the key, credit and network sentences in both languages | unit test with a fake SDK (`tests/live.test.ts`) |

Second file run: `kNoFaceFound` was reported 118 times, `metrics` payloads 0, automatic Insights 0, SDK errors 0.
Live app run: 18.9 seconds of SDK time from Start to Esc.

**What it does not show**

No pulse, breathing rate or beat was measured. There was no face, so the SDK sent no metrics. This is a check of the code path
and of the key, not of the signal. Measurements on the owner's own face are added here after they are recorded.
