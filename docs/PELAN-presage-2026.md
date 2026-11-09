# PELAN: Degup, entri DEV Presage SmartSpectra SDK Challenge

> Perancang autopilot #1561, 8 Nov 2026. Sumber kebenaran = `docs/PRD-presage-2026.md` (peringkat 3, diluluskan pemilik `sahkan bina`).
> PELAN ini memecah PRD §9 kepada potongan; **ia tidak mengubah keputusan PRD §5 (K1 hingga K15) atau gerbang PRD §2/§9**. Setiap
> potongan merujuk bahagian PRD. Rujukan luar repo (baca, jangan salin ke repo): `~/PASTE-DEV-PRESAGE-2026-FABLE.md` (sebab),
> `~/PASTE-DEV-PRESAGE-2026-FAKTA.md` ("F§" dalam PRD), `~/hackathon/entri/2026-dev-presage-challenge-smartspectra-sdk/`.

## Matlamat (bahasa pemilik)

Satu app desktop "Degup" (Electron) untuk orang dewasa: kamera web melihat degupan jantung kau melalui SDK Presage SmartSpectra,
kemudian menguji sama ada kau boleh RASA degupan itu sendiri, dan menunjukkan bagaimana nafas melenturkan jantung. Tiga minit, tiga
babak (LIHAT, RASA, LENTUR). Permainan rasa tubuh, bukan ujian kesihatan. BM dan EN. Dihantar sebagai satu pos DEV + repo awam + video
demo sebelum **23 Nov 2026 15:59 MYT** (sasaran terbit pemilik 21 Nov ≤ 22:00 MYT). Pemilik: beri kunci Presage, rakam dua video ujian,
raptai 18 Nov, rakaman akhir 20 Nov, terbit 21 Nov. Autopilot membina semua yang lain.

## Skop / bukan skop

Skop = PRD §3 "Skop (wajib sebelum beku 18 Nov)" 1 hingga 8 dan spesifikasi PRD §4. Skop pilihan (P-lanjut 1 hingga 3) hanya selepas
P5 hijau DAN masa masih ada sebelum beku, ikut susunan PRD; tiada baris pelan untuknya (rekod D-n bila dibuat).
Bukan skop = PRD §3 "Bukan skop" (tiada akaun, awan, DB, telefon, web awam, `requestInsight`, muka/ekspresi/EDA, HRV sebagai skor, ayat
kesihatan, sesi ejen dalam pos; F2 Degup Web hanya jika S1 memaksa, PRD §7 R1).

## Rujukan (langkah 1b: jangan bina apa yang sudah ada)

- **Guna terus:** `@smartspectra/node-sdk@3.4.0` (wajib acara; terma Presage, bukan OSS) dan corak sampel rasmi `electron-quickstart`
  dalam `Presage-Security/SmartSpectra` (renderer memiliki kamera → `useMediaStream`; DIKREDITKAN dalam README + `02-DECISIONS.md`,
  dibenarkan PRD §0). Electron, esbuild, vitest, Playwright, electron-builder = MIT/Apache.
- **Tiada yang sesuai, bina sendiri (sebab):** pengesan degupan atas `arterial_pressure_trace` (PRD §4.3), skor fasa Rayleigh (§4.4) dan
  RSA (§4.5) ialah ~300 baris matematik yang PRD tetapkan langkah demi langkah; carian `gh search repos` (8 Nov) untuk interoception /
  heartbeat perception / rPPG peak detection tidak memulangkan pustaka JS yang diselenggara. Pustaka DSP luar menambah kebergantungan
  untuk satu biquad tertib 2. Entri DEV lain yang memakai SDK (cth `xbill9/retro-techno-generator`, MIT) = bacaan sahaja, TIDAK disalin
  (projek mesti baharu, tiada kod repo lain).

## ⭐ MULA DI SINI — keadaan

(Pembina: GANTI blok ini setiap potongan; jangan tambah blok bertarikh.)

- **P0, P2a, P2b ✅ (9 Nov MYT).** Rangka, gerbang, teras (beats, score, rsa, fixture, i18n), sumber sim + replay (D1 hingga D8).
- **P3a ✅ (9 Nov MYT).** Cangkerang Electron (main, preload, renderer izin/Tetapan/Data, BM/EN). Arah visual "pelita" (D9)
  **diluluskan pemilik 9 Nov 08:39 UTC** ("ok, teruskan rupa ini").
- **P3b ✅ (9 Nov MYT).** LIHAT penuh, RASA, pendedahan, jeda petunjuk SDK 15 kod (D10).
- **P3c ✅ (9 Nov MYT).** LENTUR (pelita jadi panduan nafas 4/6 s, jalur sela degupan hidup dilorek tarik/hembus, ringkasan ms + PRQ +
  ayat RSA), skrin keputusan (kad = skor, jalur, N/n, ms, nisbah, nadi purata, tarikh), "Simpan kad PNG" tempatan, "Main lagi"; replay
  berulang; skala masa ujian untuk replay (D12). H3: `e2e/aliran.spec.ts` aliran penuh dalam `sim` DAN `replay`. Teras `src/core/lentur.ts`.
- **P4a ✅ (9 Nov MYT).** Sumber `live` (`src/sumber/live.ts`, SDK disuntik; kilang sebenar `src/renderer/sdk-live.ts`): strim kamera
  renderer → `useMediaStream`, cardio + breathing, telemetri + output terkumpul mati, SATU pendengar `metrics`, tiada `requestInsight`.
  Main memuat SDK malas (`src/main/sdk.ts`: lavapipe, `SMARTSPECTRA_CAPI_PATH` bila dipakej). Ralat SDK → ayat di skrin izin; panel Data
  mengira pengesahan + insight. Perakam demo (tetingkap sendiri ikut ID, webm → Video/Degup, RAKAM di bar, berhenti sendiri selepas
  keputusan) + perakam fixture (`config.rakam_fixture`, angka sahaja). D13. Belum ada larian SDK sebenar (P1).
- **Seterusnya O1** (pemilik ≤ 10 Nov 22:00): pembina menyemak kunci (`.env` / nota `presage key`) ikut baris O1; tiada = TERSEKAT.
  Kemudian O2 (dua video) → P1 (larian SDK sebenar pertama; P4b mesti `asarUnpack` `@smartspectra/*`, D13).
- Jawapan pemilik S1 hingga S8: belum (lalai direkod pada O1).

## Peraturan setiap potongan

1. Baca bahagian PRD yang dirujuk baris potongan; jangan reka semula spesifikasi §4. Perkara teknikal yang PRD tidak putuskan = putus
   sendiri, rekod `docs/02-DECISIONS.md` (D-n: keputusan · sebab · undur). PRD menyebut `docs/02-KEPUTUSAN.md`; pagar rumah hanya
   mengenali `docs/02-DECISIONS.md`, jadi rekod hidup di situ (tajuk "Keputusan"; K1 hingga K15 PRD disalin sebagai D-K1 hingga D-K15).
   Penamaan sahaja, bukan perubahan keputusan.
2. Komit kecil, mesej bermakna (≤ 1,500 baris tambah satu komit; lockfile dikecualikan); jangan squash (sejarah = bukti projek baharu).
3. Ganti blok ⭐, tanda ✅ dalam lajur **Status** baris potongan, kemas `NEXT.md` (langkah seterusnya sahaja).
4. Teks UI hanya `lang/ms.json` + `lang/en.json` (kunci sama); nilai yang berubah dalam `config/app.json`. Kod membaca; kod tidak menyimpan.
5. Gerbang tempatan sebelum komit: `bash scripts/gerbang-ujian.sh` (wujud selepas P0; tsc, vitest, kata larangan, pariti i18n, build,
   Playwright Electron bila ada). Di hos Electron/Playwright melalui `~/ops/autopilot/bin/ujian-pelayar.sh <arahan>`.
6. Node 22/24 dari nvm (`/usr/bin/node` = v18, jangan). Larian SDK SEBENAR (kredit) direkod setiap kali dalam `docs/UKUR.md`
   (tarikh, tempoh, tujuan; H8 ≤ 60 minit sebelum 18 Nov). Selain P1, P4b dan P6, guna sumber `sim`/`replay` sahaja.
7. **Pintu rupa:** folder `src/renderer/` dicipta pertama kali dalam P3a (pelari memakai folder itu untuk pintu rupa pemilik). P0, P2a, P2b
   tidak menyentuh `src/renderer/`.
8. Kunci API, video pemilik, `.env`: tidak pernah ke git, log, transkrip, isu atau mesej komit (PRD §0 kekangan rumah, K12).

## Kemajuan

| # | Siapa | Bila (MYT) | Kerja (PRD) | Bukti SIAP | Status |
|---|---|---|---|---|---|
| P0 | agen | 9 Nov | `[hos]` (§9 P0, §0 kekangan rumah, §4.11 struktur) Pasang 3 fail `ke-repo/`. Rangka: `package.json` (Electron stabil ≥ 28, `@smartspectra/node-sdk` **tepat** `3.4.0`, esbuild, TypeScript, vitest, `@playwright/test`, electron-builder; `engines.node >=20`) + `package-lock.json` (npm, stack Depot `npm`), `tsconfig.json`, `.gitignore` (`node_modules dist out .env *.mp4 *.mov *.webm *.mkv`), `.env.example` (`SMARTSPECTRA_API_KEY=`), `LICENSE` MIT, `README.md` rangka (BI; ayat "built for the Presage SmartSpectra SDK Challenge on DEV (November 2026)" + hash komit pertama + "AI disclosure: Built with Claude Code"), `CLAUDE.md` (≤ 200 baris, peraturan + perangkap), `NEXT.md`, `docs/02-DECISIONS.md` (D-K1 hingga D-K15 dari PRD §5 + kredit `electron-quickstart`), `docs/UKUR.md` (jadual kosong), `config/app.json` (semua nilai §4.1 hingga §4.5), `lang/ms.json` + `lang/en.json` (kunci awal), `scripts/gerbang-ujian.sh` (tsc `--noEmit`, vitest, `tests/kata-larangan` §4.8, pariti kunci lang, fail ≤ 800 baris; Playwright dilangkau sehingga wujud; `xvfb-run` dipasang sendiri bila tiada). Lejar: `python3 ~/hackathon/entri.py status 2026-dev-presage-challenge-smartspectra-sdk masuk --repo ~/degup`; `entri.py hantar 2026-dev-presage-challenge-smartspectra-sdk --pasang-repo` (→ `docs/hantar/`); `entri.py pemilik … --komit` untuk SETIAP baris FABLE §8 (kunci + S1–S8 `2026-11-10T22:00`; 2 video ujian `2026-11-12T22:00`; raptai `2026-11-18T21:00`; rakaman akhir `2026-11-20T21:00`; terbit `2026-11-21T22:00`; pantau e-mel `2026-12-10T12:00`); `~/hackathon/data/semakan.json` `polisi_ai` ikut PRD §8 (komit ikut laluan dalam ~/hackathon). `npm install` di hos: `df -h /` dahulu. | Fail di atas dalam HEAD; `npm ci && bash scripts/gerbang-ujian.sh` hijau tempatan + Depot; entri `masuk` dengan repo `~/degup`; `entri.json` ada ≥ 6 baris `pemilik` | ✅ |
| P2a | agen | 10 Nov | (§4.3, §4.10 `sim`, H2 sintetik) `src/core/beats.ts` (buffer 12 s, sampel semula 30 Hz, detrend 1.0 s, biquad 3 Hz kausal, ambang adaptif, refraktori 330 ms, parabola, ragu/jurang, kualiti, semakan kendiri 10 s, sandaran `pulse.trace` > 5 s) + `src/sumber/sim.ts` (penjana sintetik: sinus + harmonik + hingar, 55–95 BPM, hanyut, RSA 6 nafas/min; payload berbentuk `decodeMetrics`, cap masa µs) + `tests/beats.test.ts`. Semua parameter dari `config/app.json`. Tiada SDK sebenar. | Ujian: ≥ 95% degupan dikesan, ralat masa median < 40 ms, sifar puncak berganda dalam refraktori, atas ≥ 5 benih dan julat nadi penuh; Depot hijau | ✅ |
| P2b | agen | 10–11 Nov | (§4.4, §4.5, §4.10 `replay`) `src/core/score.ts` (fasa, R, Rayleigh, syarat n ≥ 10 + kualiti ≥ 60%, jalur dari `config.rasa.jalur`, fasa min → ms), `src/core/rsa.ts` (IBI, kitaran panduan atau `upper_trace`, maks−min ≥ 4 degupan, median, PRQ satu perpuluhan), `src/core/fixture.ts` (skema {meta, jejak, nadi, nafas, prq, ketukan}; pengesah), `src/sumber/replay.ts`, `src/core/i18n.ts`; `fixtures/sim-contoh.json` (dijana `sim`, dilabel simulasi) + ujian. | vitest: jalur betul atas ketukan sefasa / rawak / separa; "tak cukup data"; RSA ms dalam ±10% atas sim RSA diketahui; fixture contoh lulus pengesah; pariti i18n; Depot hijau | ✅ |
| P3a | agen | 11–12 Nov | (§4.6, §4.7, §4.11, §4.8) Cangkerang Electron: `src/main/` (tetingkap 1280×800 min 1024×640, kebenaran kamera, `safeStorage`, fail tempatan), `src/preload/`, `src/renderer/` (bundel esbuild): skrin izin (7 perkara §4.6 BM+EN, kotak 18+, "Hidupkan kamera"/"Tidak sekarang"), tetapan §4.7, panel Data §4.6 (kiraan peristiwa sebenar sesi), petunjuk kamera hidup. Reka bentuk disengajakan (skil `impeccable`/`frontend-design`): gelap, satu aksen, tipografi jelas; papan kekunci sahaja boleh. **Potongan UI pertama = pintu rupa pemilik (pelari).** Playwright `_electron` asap dalam `DEGUP_SUMBER=sim`: izin → tetapan → Data, tukar bahasa. | Playwright hijau di Depot (xvfb); tangkapan izin + tetapan BM dan EN 1280×800 → `~/ops/autopilot/bin/simpan-gambar.sh bukti presage-degup <fail>` | ✅ |
| P3b | agen | 12–13 Nov | (§4.1, §4.2 LIHAT + RASA + pendedahan, §4.4) Skrin LIHAT (bulatan berdenyut 120 ms setiap degupan, BPM + cincin keyakinan, "Sedia" selepas ≥ 15 s stabil, lanjut maks 90 s), RASA (gelap, Space/klik/sentuh, cap masa µs epoch, bunyi lembut boleh dimatikan, pembilang 40 s), pendedahan (garis masa degupan/ketukan, jalur kualiti, N/n, skor + jalur + ayat statistik, ayat tetap). Jeda petunjuk `validationStatus` diterjemah (15 kod) + ulang pusingan bila jeda > 20 s; Esc keluar + kamera mati. Animasi tanpa `filter`/`backdrop-filter` beranimasi. | Playwright `sim`: LIHAT → RASA (ketukan diskrip sefasa → jalur "Selaras"; rawak → "Meneka") → pendedahan; ujian jeda petunjuk; Depot hijau | ✅ |
| P3c | agen | 13–14 Nov | (§4.2 LENTUR + Keputusan, §4.5, H3) LENTUR (panduan nafas 4/6 s dari config, jalur IBI hidup dilorek fasa, angka hidup, ringkasan ms + PRQ, ayat RSA tanpa penilaian) + skrin keputusan + "Simpan kad PNG" tempatan + "Main lagi". Aliran penuh. | H3: Playwright aliran penuh izin → LIHAT → RASA → LENTUR → keputusan dalam `sim` DAN `replay` (`fixtures/sim-contoh.json`), hijau di Depot setiap push | ✅ |
| P4a | agen | 14 Nov | (§4.9, §4.10, §4.11, §3.3) Sumber `live` (`src/sumber/live.ts`: `getUserMedia` → `useMediaStream` dari `@smartspectra/node-sdk/renderer`, `requestedMetrics` cardio + breathing sahaja, `enableTelemetry: false`, `enableAccumulatedOutput: false`, SATU pendengar `metrics`, pilih kamera `enumerateDevices`, `SMARTSPECTRA_CAPI_PATH` bila dipakej); kunci API dalam tetapan → `safeStorage`; perakam demo (`desktopCapturer` tetingkap sendiri + `MediaRecorder` VP9 → `~/Videos/Degup/`, petunjuk RAKAM, berhenti auto di keputusan); perakam fixture bila `config.rakam_fixture` (angka sahaja). Ujian unit dengan SDK tiruan (bentuk payload). | Ujian: konfigurasi SDK tepat (telemetri mati, tiada `requestInsight`, satu pendengar); perakam fixture menulis skema P2b tanpa imej; Depot hijau | ✅ |
| O1 | **pemilik** | ≤ 10 Nov 22:00 | (§0 kunci, §6 S1–S8, FABLE §8) Daftar akaun pembangun Presage percuma, hantar kunci ke bot Telegram sebagai nota bertajuk `presage key`; jawab S1 (laptop + kamera) hingga S8 (lalai di bawah dipakai jika diam). **Pembina, bila giliran:** jika `~/degup/.env` sudah ada `SMARTSPECTRA_API_KEY` bukan kosong → ✅. Jika nota `presage key` ada dalam `~/portal/data/notes.json` → salin nilai ke `~/degup/.env` (0600, tanpa cetak), sahkan dengan satu `scripts/headless-smoke.mjs --semak-kunci` (atau panggilan pengesahan SDK terkecil; rekod dalam `docs/UKUR.md`), padam nota ikut peraturan portal (dict + tmp + `os.replace`, bukan tulis semula keseluruhan), ✅. Jika tiada → TERSEKAT (≤ 5 baris: apa, kenapa, tarikh, jawapan diterima). Jawapan S1–S8 yang sampai → `docs/02-DECISIONS.md`. | `~/degup/.env` 0600 ada kunci (tidak dikomit); nota dipadam; S-jawapan atau lalai direkod D-n | ⬜ |
| O2 | **pemilik** | ≤ 12 Nov | (§0 biometrik, FABLE §8, R4) Rakam DUA video iPhone 13 (kamera depan, disandar, diam, cahaya depan): (1) 90 s diam; (2) 60 s sambil menekan meja lembut. Muat naik ke FILE DROP. **Pembina, bila giliran:** cari dua fail video baharu (≥ 9 Nov) dalam `~/portal/uploads/` (aras atas); ada → pindah ke `~/degup-rahsia/` (0700, luar repo), rekod nama + tempoh + sha256 dalam `docs/UKUR.md` (tiada imej, tiada laluan ke git selain nama), ✅. Tiada → TERSEKAT (≤ 5 baris). | Dua video dalam `~/degup-rahsia/`, direkod dalam `docs/UKUR.md` | ⬜ |
| P1 | agen | 12–13 Nov | `[hos]` (§9 P1, §2 H1 + H2, §4.11 Vulkan, R5) `scripts/headless-smoke.mjs` (`useFile()` ikut dokumen rasmi; `DEGUP_VIDEO_UJIAN`; kunci dari `.env`) + `scripts/gerbang-p1.mjs` → `docs/UKUR-P1.md`: H1 (`stable` ≥ 70% selepas 15 s), H2 (puncak lawan `pulse_rate × tempoh` ±10%, CV IBI < 25%, tiada jurang > 2 s), klip 2 `EXCESSIVE_MOTION` (R4). Vulkan tiada → `VK_ICD_FILENAMES` lavapipe, kemudian SwiftShader; rekod yang berjaya. Fixture angka dari larian → `fixtures/ujian-hos-<tarikh>.json` (dilabel). Rekod kredit `docs/UKUR.md`. Keputusan: H1+H2 lulus → mod penuh (D-n); gagal → K-undur R2 direkod D-n dan P1b dijalankan. | `docs/UKUR-P1.md` dengan angka sebenar H1/H2 + arahan yang dijalankan; D-n mod penuh atau R2; tiada video/imej dalam git | ⬜ |
| P1b | agen | 13–14 Nov | (§7 R2, bersyarat) **Hanya jika P1 merekod R2.** Mod kira: RASA bandingkan bilangan ketukan dengan `pulse_rate × tempoh` + garis masa tanpa fasa; LENTUR nadi + nafas tanpa IBI; LIHAT denyut ikut kadar dengan label "ikut kadar, bukan degupan sebenar"; teks jujur BM+EN; Playwright `sim` untuk mod kira. Jika P1 = mod penuh: tanda ✅ dengan "tidak perlu (H2 lulus, D-n)" tanpa kod. | R2: Playwright mod kira hijau; mod penuh: D-n merujuk `docs/UKUR-P1.md` | ⬜ |
| P4b | agen | 15–17 Nov | `[hos]` (§3.6, §4.11 pemasang, R6, R10) Pemasang untuk OS S1 (lalai Windows x64): `scripts/bina-win.sh` (electron-builder dalam Docker `electronuserland/builder:wine`, `nsis` + `portable`, tidak ditandatangani; `df -h /` sebelum, buang imej selepas) ATAU zip `darwin-arm64` jika S1 = Mac Apple Silicon. Artifak → `~/portal/uploads/hackathon-degup-<versi>.<ext>` + sha256 dalam `docs/UKUR.md`. Sandaran R6: zip portable + `mula.bat`. Asap SATU larian `live` di hos dengan video ujian sebagai kamera tiruan (Chromium `--use-file-for-fake-video-capture`, video ditukar ke `.y4m` dalam `~/degup-rahsia/`) melalui `ujian-pelayar.sh`; rekod kredit. README §Install (Windows/Mac, SmartScreen / klik kanan Open) + §Rakam (Win+G / QuickTime). | Artifak + sha256 di FILE DROP; log asap `live` (isyarat nadi muncul) dalam `docs/UKUR.md`; README pasang | ⬜ |
| P5 | agen | ≤ 18 Nov 23:59 | (§9 P5) **Beku ciri.** Semakan akhir semua skop wajib §3 (senarai tanda dalam ⭐), `gerbang-ujian.sh` hijau, tag `v0.9.0` ditolak. Selepas ini pepijat + teks sahaja. | `git ls-remote --tags origin v0.9.0`; Depot hijau pada tag | ⬜ |
| P6 | **pemilik** | 18 Nov malam | (§9 P6, H4, FABLE §8) Raptai: pasang Degup dari FILE DROP, masukkan kunci, tiga babak sekali, tekan "Rakam demo"; laporkan apa yang mengelirukan (Telegram) + muat naik fixture (`~/Documents/Degup/fixtures/*.json` atau folder yang README sebut) dan rakaman ke FILE DROP. **Pembina, bila giliran (bukan sebelum 18 Nov 21:00 MYT):** fail fixture/rakaman baharu ≥ 18 Nov dalam `~/portal/uploads/` atau maklum balas dalam jawapan flag → ✅ dan teruskan P6b; tiada → TERSEKAT (≤ 5 baris). | Fixture pemilik atau maklum balas diterima | ⬜ |
| P6b | agen | 19 Nov | (§9 P6–P7, §4.10) Fixture pemilik → `fixtures/pemilik-<tarikh>.json` (angka sahaja; pengesah P2b; label UI "Main semula: sesi <tarikh>, pemilik"); pembaikan maklum balas raptai (pepijat/teks sahaja, D-n); rakaman raptai → `~/degup-rahsia/` (tidak ke git). Pemasang dibina semula jika ada pembaikan → FILE DROP + sha256. | Fixture pemilik lulus pengesah + Playwright `replay` atasnya; senarai maklum balas → D-n | ⬜ |
| P7 | agen | 19–20 Nov | `[hos]` (§8, §9 P7, H6, peringkat 4) Baca jawapan peringkat 4 (pra-hantar Fable, `sahkan pantau`) bila ada. Draf `docs/hantar/HANTAR.md` (templat rasmi §8, BI 900–1,400 patah, angka sebenar dari fixture pemilik), `SKRIP-VIDEO.md`, `POLISI-AI.md`, `GALERI.md`, `NARATOR.md` (S3); README penuh §8; `~/hackathon/entri/…/hantar.json` §8. Tangkapan README → `docs/media/` (PNG dari mod `replay`). `~/gilap` gaya README + HANTAR rc 0; `~/legasi/bin/legasi semak --kandidat docs/hantar` rc 0 (rc 1/2 = TERSEKAT, kecuali positif palsu frasa "legasi semak" PRD §0). Draf → FILE DROP `hackathon-degup-draf-pos.md` untuk pemilik baca 20 Nov. | gilap + legasi rc 0 (output dalam log); ujian kata larangan hijau; draf di FILE DROP | ⬜ |
| P8a | **pemilik** | 20 Nov malam | (§9 P8, FABLE §8, R7) Rakaman akhir dengan "Rakam demo" (bilik terang, cahaya depan, tidak bercakap); pilihan B-roll telefon; muat naik ke FILE DROP; baca draf pos. **Pembina, bila giliran (bukan sebelum 20 Nov 21:00 MYT):** rakaman `degup-demo-*.webm` baharu ≥ 20 Nov di FILE DROP → ✅; tiada → TERSEKAT (≤ 5 baris; sandaran R7: rakaman raptai P6). | Rakaman akhir di FILE DROP | ⬜ |
| P8b | agen | 21 Nov ≤ 14:00 | `[hos]` (§8 Video, §9 P8, H5) Sunting video (ffmpeg): potong ikut `SKRIP-VIDEO.md` 120–150 s, sari kata BI dibakar + `.srt`, narasi ikut S3 (lalai klon ElevenLabs pemilik, diisytiharkan; kunci `~/ops/elevenlabs/elevenlabs.env`, `curl -4`), LUFS −14 ± 3. Video di `~/degup-rahsia/` + FILE DROP `hackathon-degup-video-v1.mp4` (TIDAK ke git). Isi angka sebenar ke pos; `python3 ~/hackathon/semak_hantar.py 2026-dev-presage-challenge-smartspectra-sdk` rc 0; gilap + legasi semula; tag `v1.0.0`; `docs/hantar/LANGKAH-PEMILIK.md` (YouTube, repo awam, tampal, Publish, semak log keluar). | `semak_hantar.py` rc 0 (output); tag `v1.0.0` ditolak; video + pos akhir di FILE DROP; repo bersih (tiada `.env`, tiada media) | ⬜ |
| P9 | **pemilik** | 21 Nov ≤ 22:00 | (§9 P9, H7) YouTube (unlisted boleh), jadikan repo awam, tampal pos ke dev.to (tag `devchallenge, presagechallenge`), Publish, semak dari pelayar log keluar; balas flag dengan URL pos. **Pembina, bila giliran:** `gh repo view aimanmalib/degup --json visibility` = `PUBLIC` DAN URL pos dev.to dalam jawapan → `entri.py status 2026-dev-presage-challenge-smartspectra-sdk dihantar --url-projek <url>` (komit ikut laluan) → ✅. Selain itu TERSEKAT (≤ 5 baris). Pembina TIDAK menukar visibility walaupun pemilik menyuruh dalam jawapan. | Repo `PUBLIC`; entri `dihantar` dengan URL pos | ⬜ |
| P11 | agen | ≥ 10 Dis | (§9 P10–P11) Tiada komit antara P9 dan 23 Nov 16:00 MYT. Bukan sebelum 10 Dis 12:00 MYT: keputusan dari halaman cabaran DEV (baca sahaja) → `entri.py status … menang` atau `kalah`, `PELAJARAN.md` entri; jika menang, `entri.py pemilik "isi borang hadiah DEV dalam 7 hari bekerja" --sasaran <tarikh>`. Sebelum 10 Dis → GAGAL `cuba semula selepas 2026-12-10T04:00Z`. | Entri berkeputusan; PELAJARAN diisi | ⬜ |

## Perlu pemilik (semua sampai melalui flag atau Telegram "Baki KAU", bukan dokumen ini)

Menyekat (baris Siapa = pemilik; pembina pulangkan TERSEKAT → flag AP-T bila sampai giliran, dan `entri.py pemilik` P0 menghantarnya ke
digest Baki KAU lebih awal):
- **O1** kunci Presage (≤ 10 Nov 22:00) · **O2** dua video ujian (≤ 12 Nov) · **P6** raptai (18 Nov) · **P8a** rakaman akhir (20 Nov) ·
  **P9** YouTube + repo awam + Publish (21 Nov ≤ 22:00).

Tidak menyekat (diam = lalai PRD §6; pembina merekod lalai sebagai D-n pada O1):
- S1 laptop: diam = Windows 10/11 x64 dengan kamera web (Mac Intel/tiada laptop = R1 F2, keputusan 10 Nov dalam O1).
- S2 muka dalam video awam + publisiti MLH: diam = ya. · S3 narasi: diam = klon ElevenLabs diisytiharkan.
- S4 Real-World: diam = tidak (Creative + Overall). · S5 pembuka pos: diam = angka sesi sahaja. · S7 sesi ejen: diam = langkau.
- S8 lejar rahsia: diam = tiada (lejar `dilepaskan`). · K14 nama "Degup": pemilik boleh tukar sebelum P6.
- Pintu rupa (P3a): pelari berhenti sendiri dan menghantar flag; bukan baris pelan.
