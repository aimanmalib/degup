# NEXT: Degup

Keadaan penuh: blok ⭐ dalam PELAN di LUAR repo, `/home/claude/ops/autopilot/projek/presage-degup/PELAN-presage-2026.md` (KP1, D17).
Jangan salin PELAN ke repo (`/docs/PELAN-*.md` diabaikan git).

- **Seterusnya: J7** (lihat baris PELAN). Tertib pindaan #2842: J7, P8a, lalu pintu pemilik P6.
- J4 siap (D25): README peta kod + glosari (EN + BM), komen kepala EN pada 8 fail, pengisytiharan AI tanpa klausa P6 (P8 melengkapkan).
- J3 siap (D24): `docs/hantar/HANTAR.md` = pos PH§6 verbatim antara `<!-- pos mula -->`/`<!-- pos akhir -->`, slot TBD kekal
  (P8 mengisi); kata larangan dalam pos hanya dalam blok `<!-- izin mula -->`. HANTAR.md tidak didaftar dalam hantar.json `teks` sebelum P8.
- J6b siap (D23): tag `v0.9.0` = `f6f85b7`; FILE DROP `hackathon-degup-kit-v0.9.0.zip` (+ `.sha256`, `hackathon-degup-kit-LANGKAH.md`);
  sha256 dalam `docs/UKUR.md`. NSIS dilangkau. P6b membaca `KIT-COMMIT` dari log pemilik untuk tag `rakaman-akhir`.
- J6a siap (D22): `bash scripts/kit/bina-kit.sh <tag> [folder]` → `hackathon-degup-kit-<tag>.zip` + `.sha256` (lalai `~/portal/uploads`);
  `config/kit.json` ditindih dalam zip sahaja. Log kit `userData/logs/degup-<tarikh>.log`. Tetingkap rakaman `DEGUP_TETINGKAP=rakam`.
  Xvfb gerbang 1920×1080 (`-s "-screen 0 1920x1080x24"`) untuk ujian 1600×900.
- P1a siap (D21): kunci diterima SDK. `scripts/asap-live.mjs --out f.json` melalui `ujian-pelayar.sh xvfb-run -a -n <paparan bebas>`
  (Electron live + kamera palsu; keputusan = medan `rc` JSON). Angka awam `docs/MEASUREMENTS.md`; `docs/UKUR.md` ≈ 1 min.
- J5 siap (D20): `node scripts/headless-smoke.mjs <video> --out r.json [--fixture f.json]` lalu `node scripts/gerbang-p1.mjs r.json`
  (rc 0 mod penuh, 1 R2). Kod keluar asap 3 = kunci ditolak, 4 = kredit habis. Ambang `config.p1`. Pendengar SDK = `pasangPendengar`.
- J2 siap (D19): ayat kebetulan ±0.125 + paras kebetulan dikira; tak cukup ketukan tidak menyalahkan cahaya; LENTUR tanpa "normal";
  lencana "Live · SmartSpectra SDK 3.4.0"; bahasa lalai ikut locale OS (undur EN); izin (d) rekod penggunaan + tempoh simpan; suis History dibuang.
- J1 siap (D18): tiada bacaan `pulse.*`; degupan setiap nafas = `cardio.pulseRate` ÷ `breathing.rate` dikira dalam `PengumpulLentur`;
  fixture skema 2 (`kadar_nafas`); `tests/bentuk-metrics.test.ts` mengunci bentuk terhadap pakej SDK; Depot `7m3kh0vmj7` hijau.
- J0 siap: `hantar.json` entri `video: []` + `teks: []` (KP2; P8 memulihkan senarai sebenar + `"piawai": 2`); gerbang-hantar rc 0.
- Setiap potongan: semak `~/portal/uploads/` aras atas untuk video telefon pemilik (KP9). Ada = O2 ✅ dan P1 seterusnya.
- O1 siap: kunci dalam `.env` (diterima SDK, P1a). S1 hingga S8 = lalai PRD §6 (D14).
- NSIS (jika dibina kemudian): electron-builder mesti `asarUnpack` pakej `@smartspectra/*` (laluan pustaka asli, `src/main/sdk.ts`).
