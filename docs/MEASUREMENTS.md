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

## What a tapper who feels nothing scores

A steady rhythm can fool a phase score, because human taps are rhythmic and the Rayleigh test assumes each tap is independent.
So the score was measured against tappers who feel nothing. Six seeded tapper models, 2,000 rounds per model (12,000 in all),
seed 2026, each round scored by the real `kiraSkor` from `src/core/score.ts` with the thresholds in `config/app.json`. The
beats are synthetic: 72 bpm mean, breathing swing of ±4 bpm at 0.1 Hz, drift of ±3 bpm over 45 s, 40 s round, every beat
clear. These are repo test numbers from a simulator, not readings from a person.

| Tapper model | "Too few taps to tell" | "Guessing" | "Some sense" | "In tune" | "Some sense" or above | Before K1: "Some sense" or above |
|---|---:|---:|---:|---:|---:|---:|
| Independent phase each beat (feels nothing) | 0.0% | 100.0% | 0.0% | 0.0% | 0.0% | 4.8% |
| Random gaps 650 to 1,150 ms (feels nothing) | 0.0% | 99.1% | 0.9% | 0.0% | 0.9% | 24.6% |
| Steady rhythm near pulse rate, 700 to 1,000 ms (feels nothing) | 0.0% | 92.8% | 6.3% | 0.9% | 7.2% | 25.8% |
| Steady rhythm at the mean pulse rate (feels nothing) | 0.0% | 85.5% | 11.1% | 3.5% | 14.6% | 53.0% |
| Feels weakly: 50% of beats, +150 ms (SD 80), plus 25% random taps | 0.0% | 12.2% | 62.9% | 24.9% | 87.8% | 99.7% |
| Feels clearly: 80% of beats, +150 ms (SD 60) | 0.0% | 0.0% | 0.0% | 100.0% | 100.0% | 100.0% |

2000 rounds per model, seed 2026, thresholds: selaras R ≥ 0.6, p < 0.01; ada_rasa R ≥ 0.45, p < 0.05; coverage ≥ 20 taps across ≥ 30 s.

What changed in K1: "Some sense" now also needs R ≥ 0.45 (it needed only p < 0.05 before), and a round whose taps are fewer
than 20 or cover less than 30 s gets "Too few taps to tell" instead of a band. The old fixed reveal line shown above
"Guessing" is gone; each band now has one plain sentence. A steady rhythm at exactly the simulated pulse rate is the hardest case and still
reaches "Some sense" in about 1 round in 7, which is why that sentence asks for another round.

Numbers quoted in the post come from this table only: 2,000 simulated rounds per model; taps at random moments (random gaps)
reach "Some sense" or above in 0.9% of rounds; a steady rhythm at the pulse rate reaches "Some sense" or above in 14.6% and
"In tune" in 3.5%.

Repeat: `node scripts/ukur-skor.mjs 2000 2026` (prints this table). The limits are enforced in
`tests/pengetuk-tidak-merasa.test.ts`: the three random tappers ≤ 10% "Some sense" or above, the pulse-rate rhythm ≤ 20%, "In tune"
≤ 5% for all four non-feeling tappers, weak feeling ≥ 80%, clear feeling ≥ 99%, and 12 rhythmic taps in 10 s = "Too few taps to tell".
