# Measurements

Every number here comes from a run on this repo's own scripts or tests. Each run that uses Presage credit has its own
section below. The only measurement of a person is the owner's own phone video, in its own section below.

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
and of the key, not of the signal. The owner's own phone video is measured in the next section.

## Owner phone video, still part

Date: 22 November 2026 (MYT). The owner recorded a 3 minute phone video of their own face (iPhone, 182 seconds: still, then tapping
on each felt beat, then paced breathing) and uploaded it to the host. The video stays on the host in a private folder; it is not
in this repo, CI or any cloud service other than Presage itself. Host and SDK as in the section above.

**What ran**

1. `ffmpeg`: first 60 seconds (the still part) to H.264, constant 30 fps, 720 px high, no audio, no metadata.
2. `scripts/headless-smoke.mjs` on that 60 second clip (about 34 seconds of SDK time), then `scripts/gerbang-p1.mjs` on its summary.

**What it showed**

| Check | Result |
|---|---|
| Pulse samples arrived | yes, 10 (`cardio.pulseRate` values in `metrics`) |
| Time to the first `metrics` payload / first pulse sample | 6.6 s / 11.2 s of video time |
| `metrics` payloads | 227 |
| Breathing rate samples | 2 (first at 32.7 s) |
| Pulse samples the SDK marked stable (of those scored) | 6 of 8 |
| Dominant `validationStatus` | 0 (`kOk`), 512 times; `kNoFaceFound` once, at 0.17 s |
| Beats found in `cardio.arterialPressureTrace` (43 s of trace) | 58, against 65.7 expected from the pulse samples |
| SDK errors | 0 |
| Automatic Insights events from Presage | 1 |

`scripts/gerbang-p1.mjs` on this clip: H1 (pulse samples stable) passes; H2 (beat count and spacing from the trace) does not pass
its thresholds in `config/app.json` (count 11.7% low, spacing CV 0.32). The full H1/H2 study and the count-only mode trial were
skipped for lack of time. This answers one question only: the SDK sends a live pulse signal from the owner's own phone video.

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
