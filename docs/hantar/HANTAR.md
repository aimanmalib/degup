# Teks pos DEV: Presage SmartSpectra SDK Challenge (Degup)

> Nota dalaman (BM), di luar penanda. Blok antara `<!-- pos mula -->` dan `<!-- pos akhir -->` = teks pos verbatim
> semakan pra-hantar kedua (PH§6, KP6, D24). Pemilik menampal blok itu ke editor DEV dan menekan Publish sendiri.
> Komen `izin mula` / `izin akhir` dalam blok hanya untuk ujian kata larangan; DEV tidak memaparkannya.
> Slot `<<TBD ...>>` KEKAL sehingga P8 mengisinya dari sesi pemilik. Selagi ada TBD, pos JANGAN diterbit.
> Fail ini TIDAK didaftar dalam `hantar.json` `teks` sebelum P8 (KP2).

<!-- pos mula -->
---
title: "Degup: a three-minute webcam game that checks if you can feel your own heartbeat"
published: false
tags: devchallenge, presagechallenge, electron, gamedev
---

*This is a submission for the [Presage SmartSpectra SDK Challenge](https://dev.to/challenges/presage-2026-11-04)*

## What I Built

Sit still and try to feel your heart beating. No finger on the wrist, no hand on the chest. Many people cannot do it. I tried, and my first sync score was <<TBD skor pertama>> out of 100. The app's word for that was "<<TBD jalur pertama>>".

**Degup** is a desktop game for adults that runs this check with a normal webcam. "Degup" is the Malay word for a heartbeat. The Presage SmartSpectra SDK reads my pulse and my breathing from the camera. The game asks me to tap whenever I feel a beat, then shows my taps next to the beats the camera saw.

One round takes about three minutes.

| Scene | What you do | What the live signal does |
|---|---|---|
| **See** (30 s) | Watch a lamp on the screen | The lamp pulses once for every beat found in the SDK's pulse waveform |
| **Feel** (40 s) | The lamp goes dark. Press Space each time you feel a beat | Each tap is placed inside its beat cycle and the pattern is scored |
| **Bend** (60 s) | Breathe in for 4 seconds and out for 6 | A live chart draws the gap between beats and shades it by your breath |

The result is one card: the sync score, beats seen, taps, how many milliseconds the heart slowed on each out-breath, and the average pulse. You can save the card as a PNG on your own computer. Nothing is uploaded.

![The reveal screen: my taps drawn under the beats the camera saw](<<TBD url imej pendedahan>>)

<!-- izin mula -->
Degup is a body-awareness game. It is not a health test, and every result screen says so.
<!-- izin akhir -->

The app is in English and Bahasa Melayu. Every string lives in two language files with the same keys.

## Demo

{% embed https://youtu.be/<<TBD id youtube>> %}

The video is one real session on my own laptop, a <<TBD model laptop>> with its built-in webcam, recorded on <<TBD tarikh sesi>> with the app's own recorder. The camera preview in the corner is me. Every number on screen is the SDK's output in that session: <<TBD degupan dilihat>> beats seen, <<TBD ketukan>> taps, sync score <<TBD skor video>>.

At <<TBD minit bukti>> I do 20 squats and sit down again. The pulse reading climbs from <<TBD bpm rehat>> to <<TBD bpm selepas>> beats per minute and the lamp speeds up with it.

The narration is a clone of my own voice, made with ElevenLabs. The footage and the numbers are real.

## Code

**[github.com/aimanmalib/degup](https://github.com/aimanmalib/degup)** (MIT)

You can try the full game without a camera or an API key. It runs on a built-in synthetic signal, and every screen is labelled "Simulation". You need Git and Node.js 22.

```bash
git clone https://github.com/aimanmalib/degup.git && cd degup && npm ci && DEGUP_SUMBER=sim npm start
```

On Windows PowerShell:

```powershell
git clone https://github.com/aimanmalib/degup.git; cd degup; npm ci; $env:DEGUP_SUMBER = "sim"; npm start
```

There is also a replay of my own recorded session. It holds numbers only, no images, and is labelled as a replay.

For live mode, get a free key at [physiology.presagetech.com](https://physiology.presagetech.com/auth/register), run `npm start`, open **Settings**, paste the key and save. The README has the full steps, the Linux sandbox note and the limits.

Where to look:

| File | What it holds |
|---|---|
| [`src/sumber/live.ts`](https://github.com/aimanmalib/degup/blob/main/src/sumber/live.ts) | SDK setup: metric groups, telemetry off, one `metrics` listener, error mapping |
| [`src/core/beats.ts`](https://github.com/aimanmalib/degup/blob/main/src/core/beats.ts) | Beat detection on the raw waveform |
| [`src/core/score.ts`](https://github.com/aimanmalib/degup/blob/main/src/core/score.ts) | Sync score and the chance test |
| [`src/core/rsa.ts`](https://github.com/aimanmalib/degup/blob/main/src/core/rsa.ts) | Breath and beat-gap maths for Bend |
| [`lang/en.json`](https://github.com/aimanmalib/degup/blob/main/lang/en.json) | The consent text, word for word |

The repo has <<TBD ujian unit>> unit tests and <<TBD ujian electron>> Electron tests that drive the built app.

Variable names and code comments are in Malay, the working language of my studio. The README has a code map and a short glossary for reviewers.

## How It Responds to Human Signals

Degup asks the SDK for two metric groups, cardio and breathing. It asks for nothing about the face.

| Live Presage signal | What Degup does with it, in real time |
|---|---|
| `cardio.arterialPressureTrace` | Finds each heartbeat. Drives the lamp in See, the scoring in Feel and the beat gaps in Bend |
| `cardio.pulseRate` | The number beside the lamp. Also a self-check: if my own beat count drifts more than 10% from it, those beats are marked noisy and not scored |
| `breathing.upperTrace` | Shades the Bend chart with my real breath when the trace is steady |
| `breathing.rate` | With the pulse rate, gives "about N beats per breath" on the result card |
| `confidence` and `stable` on each sample | Weak seconds are shaded on the timeline and left out of the score |
| `validationStatus` | The game pauses and says what to fix, for example more light or less movement |

**Finding single beats.** The SDK gives a pulse rate, but a game about feeling one beat needs the moment of each beat. So Degup looks for them in the raw waveform. It removes slow drift with a one-second moving average, low-pass filters at 3 Hz, picks peaks above an adaptive threshold, and ignores anything within 330 ms of the last beat. On synthetic signals from 55 to 95 beats per minute the tests require at least 95% of beats found and a median timing error under 40 ms. On my own face, in the session above, it found <<TBD degupan pengesan>> beats in <<TBD saat ukur>> seconds, where the SDK's pulse rate predicts <<TBD degupan jangkaan>>.

**Scoring a feeling.** The score rewards consistency, not speed. Each tap gets a position inside its beat cycle. If the taps land at the same position again and again, I am feeling something. If they are spread around the cycle, I am guessing. The score is the mean resultant length of those positions times 100. A Rayleigh test decides whether the pattern could be chance, so a lucky round is not called a skill. A steady lag does not cost points. Cameras add delay and so do fingers.

**One clock.** SDK samples carry timestamps in microseconds since the Unix epoch. Taps are stamped on the same clock. The score does not depend on how fast the video pipeline is.

<!-- izin mula -->
**Breath bends the beat.** In Bend the lamp becomes a breathing guide. The chart shows each gap between beats in milliseconds, shaded by breath in and breath out. In my session the gap grew by about <<TBD ms lentur>> ms on each out-breath. The textbook name for this is respiratory sinus arrhythmia, and most hearts do it. The game shows it and makes no judgement about it.
<!-- izin akhir -->

The integration follows the official `electron-quickstart` sample. The renderer owns the camera and hands the stream to the SDK.

```ts
// src/sumber/live.ts, trimmed, names translated from Malay
const sdk = new SmartSpectraSDK({
  apiKey,
  requestedMetrics: [...cardioMetrics, ...breathingMetrics],
  enableTelemetry: false,
  enableAccumulatedOutput: false,
});
sdk.useMediaStream(cameraStream);
sdk.on("metrics", (buf) => emit(decodeMetrics(buf)));      // exactly one listener
sdk.on("validationStatus", (code, tUs) => showHint(code, tUs));
sdk.on("insight", () => counts.insight++);                 // counted, never read
await sdk.start();
```

### What the SDK taught me

1. **The `Metrics` message has no `pulse` field in 3.4.0.** The proto defines a `Pulse` message with a pulse-respiration quotient, and my first build read it. The simulator produced it, so every test passed. A pre-submission review caught it by reading the generated types inside the package. Degup now divides the SDK's pulse rate by its breathing rate, and a test builds a real `Metrics` object from the package so the shape cannot drift again.
2. **Insights fire on their own.** With cardio and breathing both requested, the SDK sends vitals snapshots to Presage for LLM Insights without being asked. The first goes out when the pulse rate settles. More follow as the breathing rate and heart rate variability settle, and then one goes out every 60 seconds. Turning telemetry off does not stop them. Degup never calls `requestInsight`, but it cannot switch the automatic ones off. So it tells the player before the camera starts, and a Data panel counts every Insight that comes back. In my session the count was <<TBD kiraan insight>>.
3. <<TBD pengajaran live 1>>
4. <<TBD pengajaran live 2>>

## Prize Categories

I am entering **Most Creative or Delightful Use** and **Best Thoughtful Real-World Use**.

**Most Creative or Delightful Use.** Most camera-vitals demos show you your numbers. Degup hides them and asks what you feel first. The idea comes from lab work on interoception, the sense of your own body from the inside. Researchers test it with tapping tasks such as the Phase Adjustment Task ([Plans et al., 2021](https://doi.org/10.1016/j.biopsycho.2021.108171)), which need a sensor on the body. Here the laptop camera is the sensor. Degup is inspired by that work and is not a validated version of it. The moment the game is built around is the reveal, when your taps appear under the beats and you find out whether you were feeling or guessing.

**Best Thoughtful Real-World Use.** Degup is a game, so I am not claiming it fixes a problem in someone's day. The part I think carries over to real products is how it asks for the camera and what it admits. The consent screen names what the SDK sends out, including the automatic Insights. The Data panel counts what happened in this session, not what a policy says should happen. A weak reading is shown as weak, and a round with too little data gets no score. The whole app works in two languages.

## Consent and Data Handling

- **Consent.** The camera stays off until the player has seen seven plain points and ticked "I am 18 or older". "Not now" leaves the camera off. While the camera is on, the top bar says "Camera on" with a button to turn it off, and Esc turns it off at once. One person in the frame. Nothing runs in the background.
- **What is measured.** Pulse rate, pulse waveform, breathing rate and breathing waveform. The SDK's cardio group also computes heart rate variability; Degup does not show it. Degup does not request face metrics.
- **Where video goes.** Frames go from the camera into the SDK on the same computer. Presage's SDK privacy policy (3 November 2026, section 3.1) says images and video are processed on the device and are not sent to Presage. Degup does not save or send frames. The optional demo recorder saves a video of the app window, with the camera preview in it, to the local Videos folder, and only when you press Record demo.
- **What the SDK sends to Presage.** API key and device checks, model downloads, and usage records such as session times and counts (sections 4.3 and 4.4). It also sends derived measurements automatically during each session, namely heart rate, breathing rate and heart rate variability, with a session identifier, so that Presage can generate AI Insights (section 4.2). Presage generates Insights using Anthropic (section 7.1). Developers and end users cannot turn this off at present (section 7.4). Degup sends no prompt text, never requests an Insight, and does not read the Insights that come back. It only counts them.
- **SDK telemetry.** Off (`enableTelemetry: false`). The policy says this does not turn off authentication, model delivery or Insights.
- **Retention at Presage.** Insights requests and responses are kept while the developer account behind the API key is active, and deleted within 60 days after that account closes (section 10.1). In Degup you use your own free key, so that account is yours.
- **What Degup stores.** Two small local files: your settings (language, camera, sound) and your API key, encrypted with Electron `safeStorage`. It keeps no scores. A result card is saved only when you press Save, and a demo video only when you press Record demo. "Delete all Degup data" in Settings removes the settings and the key.
- **AI services.** Degup itself calls no AI model. The only AI involved is Presage's automatic Insights described above.
<!-- izin mula -->
- **Limits of use.** Degup is not a medical device. It does not diagnose, treat or monitor any condition, and it is not for medical decisions. Presage states that SDK measurements are for general wellness and are not FDA cleared.
<!-- izin akhir -->

## Agent Session

I did not embed a session. The build ran as many Claude Code sessions on my own server, and the transcripts carry that server's private setup.

Here is how the work was split. Degup was built with Claude Code. Claude agents, working under my standing project rules, wrote the spec, the code, the tests and the first draft of this post. A separate Claude session reviewed the work before I submitted. I approved the look of the app, ran it on my own laptop and face, recorded the demo, and checked every number in this post against my own session files.
<!-- pos akhir -->

<!--
Jadual slot (PH§6). 21 slot TBD mesti diisi dari sesi pemilik sebelum terbit.

| Slot | Diisi dari |
|---|---|
| skor pertama, jalur pertama | Pusingan PERTAMA pemilik (fixture atau kad PNG pertama). Jangan pilih pusingan terbaik |
| degupan dilihat, ketukan, skor video, ms lentur | Kad keputusan pusingan yang masuk video |
| bpm rehat, bpm selepas, minit bukti | Klip 20 squat (PH§7.3) dan cap masa dalam video akhir |
| degupan pengesan, saat ukur, degupan jangkaan | Fixture: bilangan degupan pengesan dalam babak See lawan pulseRate purata x tempoh |
| kiraan insight | Panel Data pada akhir sesi (Automatic Insights received from Presage) |
| model laptop, tarikh sesi | Model laptop pemilik (sahkan kamera terbina) dan tarikh sesi |
| pengajaran live 1, 2 | Dua perkara yang benar-benar berlaku. Tiada = padam butir |
| ujian unit, ujian electron | Larian gerbang terakhir |
| id youtube, url imej pendedahan | Selepas muat naik; imej = https://raw.githubusercontent.com/aimanmalib/degup/main/docs/media/reveal-live.png |

Ayat bersyarat (P8 menyemak setiap baris sebelum terbit):

| Ayat dalam pos | Benar hanya selepas | Jika tidak siap |
|---|---|---|
| Pengajaran 1 (pulse rate dibahagi breathing rate, ujian membina Metrics sebenar) dan baris breathing.rate | J1 (siap) | padam pengajaran 1 dan frasa beats per breath |
| The README has a code map and a short glossary for reviewers. | J4 | padam ayat |
| There is also a replay of my own recorded session. | P6b atau P1c | padam ayat |
| Perenggan Demo (one real session on my own laptop, pratonton is me) | P6 jalan A | ganti dengan Varian B |
| Perenggan squat | klip squat dalam P6 | padam perenggan |
| What Degup stores dan top bar says Camera on | J2 butir 7 (siap) | pulihkan ayat History semakan pertama |
| Agent Session (ran it on my own laptop and face, recorded the demo, checked every number) | P6 dan bacaan pemilik sebelum Publish | jalan B: Varian B |

Varian B (jalan B sahaja). Ganti perenggan pertama Demo dengan:
The video is one real session, made in two steps. I filmed my face on my phone for three minutes: sitting still, then tapping the table each time I felt a beat, then breathing in for four seconds and out for six. Degup then read that recording as its camera, through the real SmartSpectra SDK in real time, and my taps were replayed at the moments I made them. Every number on screen is the SDK's output on that recording. I have not yet recorded a clean session with a live webcam.
Padam perenggan squat. Dalam Agent Session ganti "ran it on my own laptop and face, recorded the demo" dengan "recorded my face and my taps on my phone".

Keputusan kecil pemilik: (a) Prize Categories menyebut kedua-dua kategori (KP6; tidak setuju = padam perenggan kedua sebelum Publish).
(b) Agent Session tanpa transkrip. (c) Narasi = klon suara pemilik, diisytihar.

Gambar kulit: skrin pendedahan sesi sebenar, 1000x420, tanpa label Simulation (GALERI.md).

GitHub About: Can you feel your own heartbeat? A three-minute webcam game built on the Presage SmartSpectra SDK.
Topik: presage, smartspectra, electron, interoception, rppg, devchallenge.
YouTube: lihat SKRIP-VIDEO.md.
-->
