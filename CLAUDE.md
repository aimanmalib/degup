# Degup (`~/degup`): peraturan dan perangkap

Entri DEV Presage SmartSpectra SDK Challenge. Sumber kebenaran: `docs/PRD-presage-2026.md` (BACA SAHAJA, sha256 disemak gerbang)
dan `docs/PELAN-presage-2026.md` (potongan + blok ⭐). Keputusan: `docs/02-DECISIONS.md` (D-K1 hingga D-K15 = PRD §5, D-n baharu).

## Peraturan

- Teks UI hanya `lang/ms.json` + `lang/en.json` (kunci sama, pemegang `{x}` sama; ujian `tests/pariti-lang.test.ts`).
- Nilai yang berubah (tempoh, ambang, jalur, rentak nafas, saiz, pautan) hanya dalam `config/app.json`. Kod membaca.
- `src/core/` tulen: tiada DOM, tiada SDK. `src/sumber/` = `live` | `replay` | `sim` dengan antara muka sama.
- `@smartspectra/node-sdk` dipin TEPAT `3.4.0`. `requestedMetrics` cardio + breathing sahaja; `enableTelemetry: false`;
  `enableAccumulatedOutput: false`; SATU pendengar `metrics`. Tiada `requestInsight`, muka/ekspresi/EDA, LLM dalam app.
- Kata larangan PRD §4.8 (`tests/kata-larangan.json`): dibenarkan HANYA pada kunci izin/penafian/RSA dalam `senarai_benar`.
  Menambah kunci ke senarai benar = D-n dahulu. Jangan buang perkataan dari teks izin wajib.
- Fail ≤ 800 baris. Komit ≤ 1,500 baris tambah (lockfile/fixture dikecualikan). Jangan squash.
- `src/renderer/` hanya mulai P3a (pintu rupa pemilik).
- Gerbang sebelum komit: `bash scripts/gerbang-ujian.sh`. Ujian Electron/Playwright di hos melalui
  `~/ops/autopilot/bin/ujian-pelayar.sh`.

## Rahsia dan biometrik

- Kunci: `.env` (0600, gitignored) `SMARTSPECTRA_API_KEY=`. Jangan cetak kunci ke log, transkrip, komit atau isu.
- Video pemilik: `~/degup-rahsia/` (0700) sahaja. Tidak ke git, Depot, cloud. Fixture = angka terbitan, tiada imej.
- Imej repo: PNG dalam `docs/media/` (mod replay/sim) dan ikon dalam `build/` sahaja.

## Perangkap

- Node dari nvm (22 atau 24). `/usr/bin/node` = v18 (cron) dan tidak lulus `engines`.
- SDK memasang pakej asli SEMUA platform (~370 MB dalam `node_modules`). `df -h /` sebelum `npm ci` atau binaan Docker.
- Exhale (SDK): pendengar `metrics` kedua MENGGANTIKAN yang pertama. Satu pendengar, sebar sendiri.
- Payload SDK tiada penanda degupan: masa degupan dikira sendiri dari `cardio.arterial_pressure_trace` (PRD §4.3).
- Cap masa SDK = µs sejak epoch. Ketukan: `performance.timeOrigin + performance.now()` → µs.
- Animasi: transform/opacity sahaja. `filter`/`backdrop-filter` beranimasi = crash WebKit/GPU (gerbang menolak).
- Jangan `pkill -f electron`/`next`: bunuh ikut PID atau port.
- Linux tanpa Vulkan: `VK_ICD_FILENAMES` lavapipe (nilai dalam `config/app.json` `sdk.vulkan_icd_linux`).

## Larangan (pemilik sahaja)

Repo kekal PRIVATE hingga pemilik menukarnya (P9). Tiada dev.to/DEV, YouTube, Discord, MLH. Tiada salinan kod repo lain selain
corak sampel `electron-quickstart` yang dikreditkan.
