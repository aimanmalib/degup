# PRD: DEV Presage SmartSpectra SDK Challenge. Degup (repo `~/degup`, GitHub `aimanmalib/degup`)

> Ditulis 8 Nov 2026 oleh peringkat 3 sesi pengesahan (Fable 5.1, effort max). Pemilik meluluskannya dengan `sahkan bina presage`.
> Pembina: jangan tulis semula PRD ini atau ubah keputusan §5. Salin ke `docs/PRD-presage-2026.md` dalam repo dan pecahkan jadi
> `docs/PELAN-presage-2026.md`. Rujukan: `~/PASTE-DEV-PRESAGE-2026-FABLE.md` (jawapan dan sebab), `~/PASTE-DEV-PRESAGE-2026-FAKTA.md`
> (fakta; "F§" di bawah merujuk fail itu), `~/hackathon/entri/2026-dev-presage-challenge-smartspectra-sdk/README.md`.
> Tiada kerja sedia ada: ini PRD pertama, bukan perubahan.

## 0. Fakta pertandingan yang mengikat kerja ini (disahkan 8 Nov 2026; F§2 hingga F§4)

- Tutup: 22 Nov 2026 11:59 PM PST = **23 Nov 2026 15:59 MYT**. Sasaran dalaman: beku ciri **18 Nov 23:59 MYT**; larian pemilik
  pertama 18 Nov malam; rakaman akhir 20 Nov malam; pemilik terbit pos **21 Nov ≤ 22:00 MYT**; 22 hingga 23 Nov penimbal, tiada
  suntingan selepas terbit.
- Entri = SATU pos DEV (templat rasmi, tag `devchallenge, presagechallenge`) + repo awam + arahan pasang + video demo + bahagian
  "Consent and Data Handling". Hanya pos PERTAMA yang bertag dikira: **jangan terbitkan apa-apa pos bertag sebelum pos akhir**.
  Pemilik yang menekan Publish; pembina tidak menyentuh dev.to.
- Projek mesti BAHARU: komit pertama ≥ 9 Nov 2026; tiada kod dari repo lain (corak generik dan sampel rasmi `electron-quickstart`
  dibenarkan dan DIKREDITKAN dalam README). Individu sahaja; pos dalam BI.
- Wajib: app berfungsi yang memakai SDK SmartSpectra dengan ≥ 1 isyarat LANGSUNG dari kamera; juri mengesahkan melalui repo dan video.
- Dilarang (batal): dakwaan diagnosis/rawatan, keputusan perubatan, pemantauan tersembunyi atau tanpa izin. Terma Presage (2 Nov
  2026) tambah: tiada pengguna bawah 18; tiada inferens emosi di tempat kerja/pendidikan; app mesti memberitahu pengguna bahawa SDK
  menghantar ukuran ke Presage untuk Insights; terma app menafikan waranti bagi pihak Presage dan melarang guna diagnosis/rawatan
  dan kejuruteraan terbalik (ToS §30.1(g)).
- Kriteria: Use of Underlying Technology · Usability and UX · Originality and Creativity (tiada pemberat). Kategori: Overall (4),
  Most Creative or Delightful Use (3), Best Thoughtful Real-World Use (3). **Degup memasuki Creative + Overall.** Real-World hanya
  jika §6 S4 = ya DAN peringkat 4 meluluskan teksnya.
- **Polisi AI acara:** AI dibenarkan secara bertulis (FAQ; staf DEV 6 Nov). D49: pembina menulis teks pos dan README dalam suara
  pemilik (ayat pendek, angka sebenar dari sesi pemilik, tiada bunyi AI), deklarasi AI benar. Sesi ejen: langkau (S7).
- Platform SDK Node/Electron: `win32-x64`, `darwin-arm64`, `linux-x64` (glibc ≥ 2.35; hos VPS 2.39 OK), Node ≥ 20 (24 LTS disyor),
  Electron ≥ 28, pakej `@smartspectra/node-sdk@3.4.0` (BUKAN rc). Tiada SDK pelayar; tiada Mac Intel.
- Muatan SDK yang dipakai: `cardio.pulse_rate` (nilai, keyakinan, `stable` = keyakinan ≥ 40), `cardio.arterial_pressure_trace`
  (gelombang tanpa unit, keyakinan setiap sampel, `stable` ≥ 40), `pulse.trace` (sandaran), `pulse.pulse_respiration_quotient`,
  `breathing.rate` dan `breathing.upper_trace` (nama medan ikut `decodeMetrics` dari `@smartspectra/node-sdk/messages`), peristiwa
  `validationStatus` (15 kod dengan `hint`), `processingStatus`, `insight` (dikira sahaja), `error`. **Tiada sela degupan atau penanda
  degupan dalam payload**: masa degupan dikira sendiri (§4.3). Cap masa = µs sejak epoch.
- Kredit: percubaan percuma Presage, had tidak didokumenkan, 429/`kCreditExhausted` bila habis (F§4.5). Pembangunan atas simulasi dan
  fixture; larian SDK sebenar dikira dalam `docs/UKUR.md`.

Kekangan rumah yang terpakai:

- Repo baharu `~/degup` melalui `~/bin/repo-baharu.sh ~/degup` (GitHub private `aimanmalib`, cermin bare, Depot app, pagar init;
  workflow `.depot/workflows/gerbang.yml` dijana `~/bin/depot-workflow.sh` templat `gerbang-npm.yml`). Repo dijadikan AWAM oleh
  PEMILIK pada 21 Nov (§9 P9); pembina tidak menjalankan `gh repo edit --visibility public`. Lesen MIT.
- Lejar paten: `python3 ~/hackathon/entri.py status 2026-dev-presage-challenge-smartspectra-sdk masuk --repo ~/degup` pada P0 (D24).
  Tanda peringkat 3: **paten: tidak**. Sebelum bahan awam: `~/legasi/bin/legasi semak --kandidat <folder bahan>` keluar 0; rc 1 atau 2
  = berhenti dan lapor (rc 2 yang satu-satunya padanan ialah frasa "legasi semak" = positif palsu yang diketahui).
- **Biometrik pemilik tidak masuk git:** video muka pemilik (ujian P1 dan rakaman demo) kekal di `~/portal/uploads/` atau
  `~/degup-rahsia/` (di luar repo), dirujuk melalui env `DEGUP_VIDEO_UJIAN`; `.gitignore` menolak `*.mp4 *.mov *.webm`. Fixture dalam
  repo = ANGKA terbitan sahaja (jejak, keyakinan, cap masa, ketukan), tiada imej.
- Kunci API: `~/degup/.env` (gitignored, 0600) `SMARTSPECTRA_API_KEY=`; `.env.example` dikomit. Kunci datang dari nota Telegram
  pemilik bertajuk `presage key` (portal) → pindahkan, kemudian padam nota. Jangan cetak kunci ke log, transkrip atau isu.
  `projek.json` autopilot: `rahsia_benar` menunjuk ke `~/degup/.env` sahaja.
- Teks awam (README, deskripsi dan topik repo, pos DEV) lulus `~/gilap` gaya dan topik sebelum pemilik membacanya. Tiada sengkang
  panjang, tiada tanda seru, tiada emoji, tiada frasa pemasaran.
- Nilai tetap rumah: BM dan EN dari hari pertama (`lang/ms.json`, `lang/en.json`; ujian pariti kunci); UI bertaraf produk; nilai
  yang berubah dalam `config/app.json`; modul kecil (fail ≤ 800 baris); keputusan dalam `docs/02-KEPUTUSAN.md`; `NEXT.md`;
  `CLAUDE.md` repo ≤ 200 baris (peraturan dan perangkap sahaja).
- Ujian pelayar/Electron dalam sesi autopilot melalui `~/ops/autopilot/bin/ujian-pelayar.sh <arahan>`; potongan yang perlu kamera
  tiruan, Vulkan hos atau video pemilik ditanda `[hos]`. Node 22 atau 24 dari nvm (`/usr/bin/node` cron = v18, jangan guna).
- Komit kecil setiap potongan dengan mesej bermakna; README menyebut "built for the Presage SmartSpectra SDK Challenge on DEV
  (November 2026)" dan hash komit pertama; `semak_hantar.py` menuntut README menyebut nama acara + frasa pengisytiharan AI
  (`profil.json hantar.semak.kata_pengisytiharan_ai`, contoh "Built with Claude Code").
- Langkah yang HANYA pemilik boleh buat direkod `python3 ~/hackathon/entri.py pemilik 2026-dev-presage-challenge-smartspectra-sdk
  "<tindakan>" --sasaran <YYYY-MM-DDTHH:MM> --fail <pautan> --komit` pada P0 (D48), bukan dalam NEXT.md sahaja.

## 1. Masalah dan pengguna

**Pengguna 1: juri** (pasukan DEV, Presage, juri sukarela MLH). Mereka membaca pos, menonton video 2 hingga 3 minit, membuka repo,
jarang memasang. Mereka mahu: nampak isyarat Presage LANGSUNG dalam video, integrasi yang jelas dalam kod, UX yang boleh dinilai dari
video, Consent yang tepat, dan sesuatu yang belum mereka lihat dalam 60 hingga 100 entri lain.

**Pengguna 2: orang dewasa yang ingin tahu** (peserta DEV, kawan pemilik), duduk depan laptop dengan kamera web, 3 minit, satu
kali atau beberapa kali. Soalan mereka: "Boleh tak aku rasa degupan jantung aku sendiri?" Mereka tidak mahu akaun, wearable, atau
kuliah kesihatan.

**Pengguna 3: pemilik.** Bukan teknikal, iPhone 13, laptop (OS = S1), 45 hingga 60 minit pada 18 dan 20 Nov. Penguji, pelakon video
dan pemutus.

**Masalah yang diselesaikan:** kebanyakan orang tidak tahu sama ada mereka benar-benar merasai degupan jantung sendiri atau hanya
meneka; alat kajian untuk ini (Phase Adjustment Task) memerlukan jari di atas kamera telefon. Degup menunjukkan degupan sebenar
dari kamera muka tanpa sentuhan, menguji rasa pengguna, dan menunjukkan bagaimana nafas melenturkan jantung. Permainan kesedaran
tubuh, bukan ujian kesihatan.

## 2. Hasil yang diukur

| # | Hasil | Cara ukur | Sasaran |
|---|---|---|---|
| H1 | SDK berjalan di VPS tanpa kamera atas video pemilik | `scripts/headless-smoke.mjs` dengan `useFile()` (dokumen rasmi) + `scripts/gerbang-p1.mjs` menulis `docs/UKUR-P1.md` | Nadi dan nafas muncul; jejak `stable` ≥ 70% sampel selepas 15 s pertama |
| H2 | Pengesan degupan boleh dipercayai | Atas video pemilik: bilangan puncak lawan `pulse_rate × tempoh` dalam ±10%; CV sela degupan < 25%; tiada jurang > 2 s dalam bahagian stabil. Atas isyarat sintetik (ujian unit): ≥ 95% degupan dikesan, ralat masa < 40 ms | Lulus = mod penuh; gagal = §7 R2 |
| H3 | Aliran penuh tanpa kamera | Playwright Electron dalam mod simulasi: izin → LIHAT → RASA → LENTUR → keputusan; dalam mod main semula fixture | Lulus di Depot CI setiap push |
| H4 | Pemilik boleh pasang dan jalan sendiri | Larian 18 Nov: pasang dari FILE DROP, masukkan kunci, habiskan tiga babak, tekan "Rakam demo", tanpa bantuan teks | Ya, dengan ≤ 2 soalan |
| H5 | Video demo lulus gerbang mesin | `python3 ~/hackathon/semak_hantar.py 2026-dev-presage-challenge-smartspectra-sdk` rc 0: ≤ 180 s, LUFS −14 ± 3, 15 s pertama tiada hitam/beku > 12 s, sari kata ada | rc 0 |
| H6 | Teks awam bersih | `gilap gaya` rc 0 untuk README + pos; `legasi semak --kandidat` rc 0; tiada kata larangan §4.8 | rc 0 |
| H7 | Pos diterbitkan dan kelihatan | Pemilik: pos muncul di `dev.to/t/presagechallenge` dari pelayar log keluar ≤ 21 Nov 22:00 MYT | Ya |
| H8 | Kredit SDK terkawal | `docs/UKUR.md` mencatat setiap larian SDK sebenar (tarikh, tempoh, tujuan) | ≤ 60 minit larian sebenar sebelum 18 Nov |

## 3. Skop dan bukan skop

**Skop (wajib sebelum beku 18 Nov):**
1. App Electron "Degup": skrin izin, tiga babak (LIHAT, RASA, LENTUR), skrin keputusan + kad kongsi PNG tempatan, panel Data, tetapan.
2. Pengesan degupan dari jejak + penskoran ketekalan fasa + analisis sela degupan lawan nafas (§4.3 hingga §4.5), dengan ujian unit.
3. Tiga sumber isyarat yang boleh ditukar: `live` (kamera melalui `useMediaStream`, ikut `electron-quickstart`), `replay` (fixture
   angka), `sim` (penjana sintetik untuk ujian).
4. BM + EN penuh; petunjuk `ValidationStatus` diterjemah; `config/app.json` untuk semua tempoh, ambang, jalur dan rentak nafas.
5. Perakam demo dalam app (tetingkap app + pratonton kamera → `.webm` tempatan).
6. Pemasang untuk OS pemilik (S1): Windows NSIS/portable dibina di hos dengan Docker `electronuserland/builder:wine`, atau zip
   `darwin-arm64` tanpa tandatangan; artifak ke FILE DROP `~/portal/uploads/hackathon-degup-<versi>.<ext>` (aras atas, awalan
   `hackathon-`).
7. Skrip P1 `[hos]`: `useFile()` atas video pemilik, laporan `docs/UKUR-P1.md`; perakam fixture dari larian sebenar.
8. Bahan hantar: README BI, `docs/hantar/HANTAR.md` (pos DEV sedia tampal), `SKRIP-VIDEO.md`, `POLISI-AI.md`, `GALERI.md`,
   `NARATOR.md` (dari `python3 ~/hackathon/entri.py hantar <slug> --pasang-repo`), `hantar.json` diisi; video disunting dengan
   sari kata BI dibakar.

**Skop pilihan (hanya selepas semua wajib siap dan ujian hijau; ikut susunan):**
- P-lanjut 1: penekan di telefon melalui LAN (QR → halaman web tempatan → ketukan dengan cap masa pelayan) jika P1 menunjukkan
  ketukan papan kekunci menggoncang kamera.
- P-lanjut 2: eksport CSV sesi (degupan, ketukan, nafas) untuk penyelidik dewasa; membuka pilihan Real-World (S4).
- P-lanjut 3: sejarah tempatan dengan graf kemajuan (lalai mati).

**Bukan skop:** akaun, awan, pangkalan data, telefon (iOS/Android), web awam, Insights/prompt LLM (tiada `requestInsight`),
ekspresi muka, kelipan, EDA, HRV sebagai skor, perbandingan antara orang, sebarang ayat kesihatan, sesi ejen dalam pos, laluan
F2 Degup Web (hanya jika S1 memaksa; §7 R1).

## 4. Spesifikasi (pembina mengikut, tidak mereka semula)

### 4.1 Aliran dan masa (semua nilai dalam `config/app.json`)

```
izin → LIHAT (30 s, lanjut sendiri hingga jejak stabil, maks 90 s) → RASA (40 s) → pendedahan → LENTUR (60 s) → keputusan
```
- Keluar bila-bila masa dengan Esc; kamera dimatikan serta-merta; petunjuk "kamera hidup" (titik merah + teks) sentiasa kelihatan
  bila kamera hidup.
- Muka hilang / dua muka / gerakan besar: babak dijeda dengan petunjuk SDK diterjemah ("Satu muka sahaja", "Duduk diam"); sambung
  bila OK; jeda > 20 s dalam RASA = pusingan diulang.

### 4.2 Babak

**LIHAT.** Pratonton kamera kecil (dicermin), bulatan cahaya besar di tengah. Sehingga jejak stabil: lingkaran "Membaca nadi…" dan
petunjuk SDK. Bila stabil: bulatan mengembang 120 ms pada setiap degupan yang dikesan (§4.3), nadi semasa (BPM) + keyakinan sebagai
cincin nipis. Teks: "Ini degupan jantung kau, dilihat kamera. Perhatikan 30 saat." Butang "Sedia" aktif selepas ≥ 15 s stabil.

**RASA.** Bulatan padam; skrin gelap; arahan: "Tekan Space (atau klik) setiap kali kau RASA jantung berdegup. Jangan sentuh nadi,
jangan tahan nafas." Pembilang 40 s halus. Kamera terus mengukur; tiada maklum balas visual tentang degupan. Ketukan: `keydown` Space,
klik tetikus, atau sentuh; cap masa `performance.timeOrigin + performance.now()` ditukar ke µs epoch (asas sama dengan SDK). Bunyi
klik lembut setiap ketukan (boleh dimatikan).

**Pendedahan.** Garis masa 40 s: tanda menegak = degupan sebenar, titik = ketukan; kualiti jejak sebagai jalur kelabu di bawah
(bahagian keyakinan < 40 berlorek dan tidak dikira). Angka: "Kamera nampak N degupan. Kau ketuk n." Skor keselarasan 0 hingga 100
(§4.4) dengan jalur: "Meneka" / "Ada rasa" / "Selaras". Satu ayat penerangan statistik bahasa biasa (contoh: "Ketukan kau jatuh pada
bahagian kitaran yang sama 7 kali daripada 10. Itu bukan kebetulan."). Ayat tetap: "Permainan rasa tubuh, bukan ujian kesihatan."
Butang: "Cuba lagi" · "Teruskan".

**LENTUR.** Panduan nafas (bulatan mengembang 4 s tarik, mengecil 6 s hembus; `config.lentur.tarik_s`, `hembus_s`). Di bawahnya,
jalur masa nyata: sela antara degupan (ms) sebagai titik bersambung, dilorek ikut fasa nafas (tarik/hembus dari panduan; jika
`breathing.upper_trace` stabil, fasa sebenar dari jejak nafas diutamakan). Angka hidup: "Sela degupan: 812 → 905 ms". Di hujung:
"Jantung kau melambat kira-kira X ms setiap kali hembus" (median perbezaan maks−min sela dalam setiap kitaran nafas) dan, jika ada,
nisbah nadi-nafas SDK ("kira-kira 4 degupan setiap nafas"). Teks: "Ini normal. Namanya aritmia sinus pernafasan: jantung mengikut
nafas. Kami menamakannya, tidak menilainya."

**Keputusan.** Kad: skor RASA + jalur, N/n, perlambatan LENTUR (ms), nadi purata, tarikh; butang "Simpan kad PNG" (tempatan),
"Main lagi", "Data", "Tetapan". Tiada perkongsian automatik.

### 4.3 Pengesan degupan (`src/core/beats.ts`; tiada keputusan reka bentuk ditinggalkan kepada pembina)

Input: sampel `cardio.arterial_pressure_trace` (nilai, keyakinan, cap masa µs); jika kosong selama > 5 s, guna `pulse.trace` (tanpa
keyakinan; anggap keyakinan = `pulse_rate` terkini).
1. Buffer gelongsor 12 s; sampel semula seragam 30 Hz (interpolasi linear) ikut cap masa SDK.
2. Detrend: tolak purata bergerak 1.0 s; kemudian low-pass 3 Hz (biquad Butterworth tertib 2, kausal; kelewatan tetap sama untuk
   semua degupan, tidak menjejaskan ketekalan fasa).
3. Puncak: maksimum tempatan > ambang adaptif (purata + 0.5 × sisihan piawai atas 3 s terakhir), tempoh refraktori 330 ms
   (≤ 180 BPM). Masa puncak dihalusi dengan interpolasi parabola tiga titik.
4. Kemunasabahan: sela yang dijangka = 60 / `pulse_rate` terkini (jika stabil). Puncak dengan sela < 0.6× atau > 1.5× dijangka
   ditanda "ragu" dan tidak dipakai untuk fasa; jurang > 2 s ditanda "jurang".
5. Kualiti setiap saat = pecahan sampel dengan keyakinan ≥ 40. Semakan kendiri setiap 10 s: degupan/min dari puncak lawan
   `pulse_rate` SDK; beza > 10% → amaran "bacaan kamera bising" dan bahagian itu dikecualikan dari skor.
Ujian unit: isyarat sintetik (sinus + harmonik + hingar putih, nadi 55 hingga 95 BPM dengan hanyut dan RSA 6 nafas/min): ≥ 95%
degupan dikesan, ralat masa median < 40 ms, sifar puncak berganda dalam refraktori. Ujian ke atas fixture pemilik (P1) sebagai ujian
integrasi `[hos]`.

### 4.4 Skor RASA (`src/core/score.ts`)

- Hanya degupan "sah" (bukan ragu, bukan jurang, kualiti ≥ 40) dan ketukan yang jatuh antara dua degupan sah berturut-turut.
- Fasa ketukan: φ = 2π (t_ketuk − b_i) / (b_{i+1} − b_i).
- R = |Σ e^{iφ}| / n (panjang resultan min); ujian Rayleigh z = nR², p ≈ exp(−z) (cukup untuk n ≤ 50; gunakan pembetulan Rayleigh
  standard jika n < 10 tidak dipakai).
- Syarat data: n ≥ 10 ketukan sah DAN kualiti tetingkap ≥ 60% → jika tidak: "Tak cukup data: cuba lagi dengan cahaya depan".
- Jalur (`config.rasa.jalur`): p ≥ 0.05 → "Meneka" ; p < 0.05 dan R < 0.6 → "Ada rasa" ; R ≥ 0.6 dan p < 0.01 → "Selaras".
- Skor paparan = bulat(R × 100). Fasa min dipaparkan sebagai "kau rasa degupan kira-kira X ms selepas kamera melihatnya"; ayat
  penerangan menyatakan sesaran tetap tidak penting (prinsip PAT). Nisbah n/N dipaparkan sebagai maklumat, bukan skor.
- Pendedahan berlaku SELEPAS tetingkap, dengan cap masa SDK dan jam sistem yang sama; kependaman paip SDK tidak menjejaskan skor.

### 4.5 LENTUR (`src/core/rsa.ts`)

- Sela degupan (IBI) dari degupan sah; kitaran nafas = dari panduan (tarik+hembus = 10 s) atau dari jejak nafas stabil (puncak ke
  puncak `upper_trace` dengan detrend yang sama).
- Setiap kitaran: IBI maks − IBI min (ms) jika ≥ 4 degupan sah dalam kitaran; ringkasan = median kitaran; paparan hidup setiap degupan.
- `pulse_respiration_quotient` SDK dipaparkan sebagai nisbah bulat satu perpuluhan bila stabil.
- Tiada pentafsiran "baik/buruk". Tiada perkataan stres, HRV, kecemasan.

### 4.6 Izin, data, terma (teks wajib; BM + EN dalam `lang/`)

Skrin izin (sebelum `getUserMedia`):
1. **Apa yang diukur:** nadi dan gelombang nadi, kadar nafas dan gelombang nafas, dari video kamera. Tiada rakaman video disimpan.
2. **Apa yang kekal dalam komputer:** semua pemprosesan video berlaku dalam SDK di komputer ini. Video dan imej tidak dihantar ke
   mana-mana.
3. **Apa yang dihantar keluar (oleh SDK Presage):** (a) pengesahan kunci API dan muat turun model ke Presage; (b) ukuran terbitan
   (nadi, nafas, HRV) + pengecam sesi dihantar automatik ke Presage untuk ciri "Insights", yang dijana dengan Anthropic; ini tidak
   boleh dimatikan oleh Degup (Dasar Privasi SDK SmartSpectra, 3 Nov 2026, §4.2 dan §7.4); Degup tidak menghantar sebarang teks
   prompt; (c) telemetri agregat SDK DIMATIKAN (`enableTelemetry: false`). Pautan ke dasar Presage.
4. **Apa yang Degup simpan:** tiada, melainkan kau hidupkan "Sejarah" (skor sahaja, fail tempatan, boleh dipadam satu klik).
   Kunci API disimpan terenkripsi dengan `safeStorage` Electron dalam folder pengguna.
5. **Siapa:** untuk orang dewasa 18 tahun ke atas (kotak tanda). Satu orang dalam bingkai.
6. **Bukan alat perubatan:** permainan kesedaran tubuh; tidak mendiagnosis, merawat atau memantau apa-apa keadaan. Ukuran SDK untuk
   tujuan kesejahteraan am; tidak diluluskan FDA untuk diagnosis.
7. **Terma ringkas** (ToS Presage §30.1(g)): tiada waranti, bagi pihak Degup dan Presage; dilarang kejuruteraan terbalik SDK;
   dilarang guna untuk diagnosis atau rawatan.
Butang: "Hidupkan kamera" (utama) · "Tidak sekarang". Petunjuk kamera hidup sentiasa; "Matikan kamera" sentiasa boleh ditekan.

Panel Data (dalam sesi): kiraan peristiwa SDK sebenar sesi ini: pengesahan OK (ya/tidak), bilangan `insight` automatik yang diterima,
telemetri: mati, bingkai video dihantar: 0 (fakta reka bentuk), fail tempatan ditulis (senarai). Ini "egress yang diukur", bukan
dakwaan.

### 4.7 Tetapan

Bahasa (BM/EN) · kamera (senarai `enumerateDevices`) · kunci API (medan, disimpan `safeStorage`; pautan "dapatkan kunci percuma") ·
Sejarah (mati lalai) · Bunyi ketukan · Sumber isyarat: Kamera / Main semula (pilih fixture) · "Rakam demo" (§4.9) · "Padam semua data
Degup" · Versi + pautan repo + lesen.

### 4.8 Bahasa dan kata larangan

Semua teks UI dan pos: tiada perkataan anxiety, stress, Stress Index, arrhythmia, irregular, abnormal, diagnose, diagnosis, health
test, medical, heart condition, HRV (dalam UI), "100% on-device", "never leaves your machine", "no AI service". Ujian `tests/kata-larangan`
memeriksa `lang/*.json`, README dan `docs/hantar/HANTAR.md`. Nama SDK disebut sebagai teks ("Presage SmartSpectra SDK"); tiada logo
Presage.

### 4.9 Perakam demo

Butang "Rakam demo" (tetapan dan skrin izin): `desktopCapturer` tetingkap app sendiri + `MediaRecorder` (VP9/webm, 30 fps, 1920×1080
jika ada) → `~/Videos/Degup/degup-demo-<tarikh>.webm` (atau folder pengguna setara), petunjuk merah "RAKAM", berhenti dengan butang
atau automatik pada skrin keputusan. Pratonton kamera dalam UI mesti kelihatan supaya rakaman menunjukkan manusia + isyarat. Sandaran
jika gagal pada OS pemilik: arahan Xbox Game Bar (Win+G) / QuickTime dalam README §Rakam.

### 4.10 Mod main semula dan simulasi

- `replay`: fail `fixtures/<nama>.json` = {meta, jejak[{t, v, c}], nadi[{t, v, c}], nafas[{t, v}], prq[], ketukan[t]} dari larian
  sebenar pemilik (dirakam oleh app bila `config.rakam_fixture` hidup; TIADA imej). Fixture dilabel jelas dalam UI ("Main semula:
  sesi 18 Nov, pemilik"). Juri tanpa kunci boleh melihat semua babak.
- `sim`: penjana sintetik (§4.3 ujian) dengan kawalan nadi dan RSA; dipakai Playwright; UI menanda "Simulasi".
- Pemilihan: tetapan atau env `DEGUP_SUMBER=live|replay|sim`.

### 4.11 Teknologi dan struktur

- Electron (stabil terkini ≥ 28), `@smartspectra/node-sdk@3.4.0`, esbuild untuk bundle renderer, TypeScript, tanpa rangka kerja UI
  (DOM + kanvas); vitest untuk unit; Playwright (`_electron`) untuk aliran; electron-builder untuk pemasang.
- Ikut `electron-quickstart`: renderer memiliki kamera (`getUserMedia` → `useMediaStream`), SDK dari `@smartspectra/node-sdk/renderer`,
  `main` mengurus tetingkap, kebenaran kamera, `safeStorage`, fail tempatan, `SMARTSPECTRA_CAPI_PATH` bila dipakej. Kredit sampel dalam
  README dan `docs/02-KEPUTUSAN.md`.
- `requestedMetrics`: `cardioMetrics` + `breathingMetrics` sahaja (tiada muka, tiada EDA); `enableTelemetry: false`;
  `enableAccumulatedOutput: false`; pendengar `metrics` TUNGGAL (Exhale: pendengar kedua menggantikan yang pertama).
- Struktur: `src/main/`, `src/preload/`, `src/renderer/` (skrin: izin, lihat, rasa, lentur, keputusan, data, tetapan), `src/core/`
  (beats, score, rsa, i18n, fixture), `src/sumber/` (live, replay, sim), `config/app.json`, `lang/ms.json`, `lang/en.json`,
  `fixtures/`, `scripts/` (headless-smoke.mjs, gerbang-p1.mjs, bina-win.sh), `tests/`, `docs/`.
- Linux hos: jika SDK melapor Vulkan tiada, `VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/lvp_icd.json` (Mesa lavapipe ada di hos; isu
  SDK #16 memakai SwiftShader). Rekod yang berjaya dalam `docs/UKUR-P1.md`.
- Pemasang: Windows → `scripts/bina-win.sh` menjalankan electron-builder dalam Docker `electronuserland/builder:wine` (`df -h /`
  dahulu; imej ~2 GB); target `nsis` + `portable`; tidak ditandatangani (README: SmartScreen "More info → Run anyway"). Mac arm64 →
  `electron-builder --mac zip --arm64` tanpa tandatangan (README: klik kanan → Open; atau `xattr -d com.apple.quarantine`). Artifak ke
  FILE DROP dengan sha256 dalam `docs/UKUR.md`.
- Saiz tetingkap lalai 1280×800, minimum 1024×640; semua skrin boleh dikendalikan papan kekunci sahaja.

## 5. Keputusan (sudah diputuskan; sebab; undur)

| # | Keputusan | Sebab | Undur |
|---|---|---|---|
| K1 | Konsep = permainan persepsi degupan (Degup), bukan jurulatih nafas/overlay penstrim | Unik dalam medan (0 pesaing DEV/Devpost), dalam sampul kad model (diam, senyap, satu muka), tiada larangan ToS; FABLE §4.4 | Jika P1 gagal: mod kira (§7 R2) |
| K2 | Electron desktop pada laptop pemilik; SDK di peranti | Platform rasmi dengan sampel; privasi terbaik; juri mengesahkan dari video + repo | F2 Degup Web hanya jika S1 memaksa |
| K3 | Masa degupan dari `arterial_pressure_trace` dengan pengesan puncak sendiri | Payload tiada penanda degupan; dokumen: jejak = "heartbeat timing" | `pulse.trace`; kemudian mod kira |
| K4 | Skor = ketekalan fasa (statistik bulatan), bukan kelewatan atau kiraan | Prinsip PAT: sesaran tetap tidak penting; kiraan degupan dikritik dalam literatur | Paparkan nisbah n/N sebagai maklumat |
| K5 | Tiga babak, LIHAT dahulu | Tindak balas masa nyata kelihatan dalam 30 s pertama video (kriteria Overall); pengguna percaya kamera sebelum diuji | Susunan boleh diubah hanya dengan K baharu |
| K6 | Tiada muka/ekspresi/EDA; tiada `requestInsight` | Tidak perlu; ekspresi = risiko ToS dan Vulkan; Insights berbayar dan menghantar prompt | — |
| K7 | Telemetri mati; Insights automatik DIDEDAHKAN sebagai tidak boleh dimatikan | Dasar Privasi SDK 3 Nov §4.2/§7.4; ≥ 9 pesaing tersilap | Jika Presage menambah suis Insights: hidupkan "mati" dan kemas teks |
| K8 | Simpanan tempatan lalai: tiada; sejarah opt-in; kunci `safeStorage` | Real-World-grade consent walau tidak memasuki kategori itu | — |
| K9 | Kategori: Creative + Overall; Real-World hanya S4 = ya + eksport CSV + peringkat 4 lulus | Teks kategori yang dipaksa melemahkan pos | — |
| K10 | Pos dan README ditulis pembina dalam suara pemilik, BI, deklarasi AI benar; narasi = klon EL pemilik diisytiharkan (S3) | Polisi acara membenarkan AI; D49 | S3 lain |
| K11 | Sesi ejen tidak dibenam | Transkrip hos memuatkan `~/CLAUDE.md` (projek, pelayan) | S7 = sesi bersih khas |
| K12 | Fixture = angka terbitan sahaja; video pemilik di luar repo | Biometrik tidak ke git (peraturan rumah suara-aiman D1) | — |
| K13 | Lesen MIT; repo awam oleh pemilik 21 Nov; paten tidak | Lejar `dilepaskan`; seni terdahulu PAT; niat baik komuniti | — |
| K14 | Nama "Degup"; subtajuk EN "Can you feel your own heartbeat?" | Pendek, BM, boleh dimiliki; soalan = cangkuk | Pemilik boleh tukar nama sebelum P6 |
| K15 | Perakam demo dalam app | Pemilik bukan teknikal; video = faktor menang | OS recorder |

## 6. Soalan untuk pemilik (hanya yang mengubah kerja) dan jawapan lalai

| # | Soalan | Lalai jika diam | Mengubah |
|---|---|---|---|
| S1 | Laptop: Windows 10/11 x64 / Mac Apple Silicon / Mac Intel / Linux; ada kamera web? | Windows x64 | Sasaran pemasang; Mac Intel atau tiada laptop → F2 (§7 R1) pada 10 Nov |
| S2 | Muka dalam video awam dan publisiti MLH? | Ya | Jika tidak: video dengan pratonton kamera dikaburkan + B-roll tangan sahaja; peluang turun |
| S3 | Narasi: klon EL diisytiharkan / suara sendiri / sari kata sahaja | Klon EL diisytiharkan | `NARATOR.md` jika suara sendiri |
| S4 | Masuk Real-World juga (perlu eksport CSV P-lanjut 2)? | Tidak | Bahagian Prize Categories |
| S5 | Satu ayat kisah benar pembuka pos? | Tiada; pos dibuka dengan angka sesi | Pembuka pos |
| S7 | Sesi ejen dalam pos? | Langkau | Sesi bersih dalam repo jika ya |
| S8 | Lejar rahsia menyentuh persepsi degupan/permainan nadi? | Tiada | Jika ya: berhenti, lapor pemilik |

Jawapan pemilik selepas bina bermula pergi ke repo (`docs/02-KEPUTUSAN.md`) atau flag autopilot, bukan README entri.

## 7. Risiko dan undur

| # | Risiko | Kesan | Mitigasi dan undur |
|---|---|---|---|
| R1 | Laptop pemilik tidak disokong (Mac Intel / tiada) | Tiada demo isyarat hidup | Keputusan 10 Nov. Undur F2 "Degup Web": pelayar iPhone (Safari) menghantar bingkai JPEG 640×480 ≥ 25 fps melalui WebSocket ke pelayan Node di VPS (`useCustomInput().sendFrame()`, cap masa monoton, jurang > 2 s = sesi baharu), bingkai dibuang serta-merta, keputusan kembali ke pelayar; Consent menyatakan video dihantar ke pelayan pemilik di Johor dan tidak disimpan; URL hanya untuk pemilik + juri dengan kod. Skop babak sama; perakam = rakaman skrin iPhone. Ini menurunkan markah privasi; hanya bila terpaksa |
| R2 | Pengesan degupan gagal gerbang H2 pada video pemilik | Skor fasa tidak sah | Mod kira: RASA membandingkan bilangan ketukan dengan `pulse_rate × tempoh` dan menunjukkan garis masa tanpa fasa; LENTUR memaparkan nadi + nafas tanpa IBI; teks jujur. LIHAT berdenyut ikut kadar nadi (sintesis) dengan label "ikut kadar, bukan degupan sebenar" |
| R3 | Kredit percubaan habis | Pembangunan terhenti | Simulasi dan fixture untuk semua UI; larian sebenar hanya P1 dan larian pemilik; kira dalam `docs/UKUR.md`; pemilik minta kredit di Discord bila 429 |
| R4 | Ketukan menggoncang kamera laptop | `EXCESSIVE_MOTION` semasa RASA | Ukur P1 klip 2; arahan "tekan lembut" + klik tetikus; P-lanjut 1 penekan telefon LAN |
| R5 | Vulkan/ICD di hos untuk ujian headless | P1 gagal bermula | `VK_ICD_FILENAMES` lavapipe; jika masih gagal, SwiftShader ICD seperti isu #16; rekod |
| R6 | Pemasang Windows gagal dibina di Linux (wine) | Pemilik tidak boleh pasang | Sandaran: zip portable + `mula.bat` (semak Node 24, `npm install`, `npm start`) dengan arahan 5 langkah; atau Depot CI pelari Windows |
| R7 | Kualiti rakaman pemilik | Video lemah | Senarai semak rakaman dalam `SKRIP-VIDEO.md`; raptai 18 Nov; rakam semula 21 Nov pagi |
| R8 | Pos dianggap "idea kecil" | Markah Originality rendah | Gilapan UI, angka sebenar, satu batasan jujur, dua "aha" dalam 60 s pertama video |
| R9 | Teks hanyut ke perubatan | Batal | Ujian kata larangan §4.8; peringkat 4 |
| R10 | Cakera hos (imej Docker wine ~2 GB, `node_modules` SDK beberapa ratus MB) | Deploy lain terjejas | `df -h /` sebelum; buang imej selepas pemasang dibina |

## 8. Bahan hantar (`docs/hantar/`, disiapkan P8; pemilik tampal dan tekan)

- **Pos DEV** (`HANTAR.md`, BI, 900 hingga 1,400 patah; templat rasmi): front matter `tags: devchallenge, presagechallenge`; baris
  "*This is a submission for the Presage SmartSpectra SDK Challenge*"; **What I Built** (3 ayat apa, untuk siapa, 3 babak);
  **Demo** (`{% youtube ID %}` + satu ayat: semua angka dari satu sesi sebenar pada tarikh X; narasi = suara klon saya,
  diisytiharkan); **Code** (repo, pasang 3 langkah, kunci percuma, mod main semula); **How It Responds to Human Signals** (jadual
  isyarat → kegunaan; pengesan degupan; skor fasa; LENTUR; dua pengajaran SDK yang diukur, contoh kadar bingkai, pendengar tunggal);
  **Prize Categories** (Creative: apa yang tidak dijangka; Overall tersirat; Real-World hanya S4); **Consent and Data Handling**
  (teks §4.6 dalam BI, dengan nama dan tarikh dasar Presage, kiraan egress dari panel Data sesi pemilik); **AI disclosure** (dibina
  dengan Claude Code; saya menguji, merakam, memutuskan; app tidak memanggil AI selain Insights automatik Presage); bahagian Agent
  Session dibuang. Suara pemilik: ayat pendek, angka sebenar, satu batasan jujur (contoh: peratus degupan hilang pada cahaya malap).
  Gambar kulit = skrin pendedahan.
- **Video** 120 hingga 150 s (≤ 180): 0–10 s cangkuk ("Can you feel your own heartbeat? Most people can't. Let's check, with just a
  webcam."); 10–20 s skrin izin; 20–40 s LIHAT berdenyut dengan kamera pemilik kelihatan; 40–80 s RASA + pendedahan dengan angka
  sebenar; 80–110 s LENTUR; 110–125 s panel Data + sekilas kod (`beats.ts`, `useMediaStream`); 125–140 s penutup jujur + batasan.
  Sari kata BI dibakar; LUFS −14 ± 3; tiada muzik di atas narasi > −20 dB; 15 s pertama tiada bingkai beku > 12 s.
- **README** (BI): apa, gambar, pasang (Windows/Mac), kunci percuma, mod main semula, Consent & Data (ringkas + pautan dasar),
  seni bina, ujian, kredit (`electron-quickstart`, PAT Plans 2021 dan PAT 2.0 2026 sebagai inspirasi, bukan pengesahan),
  AI disclosure, lesen MIT, "built for the Presage SmartSpectra SDK Challenge on DEV (November 2026)", hash komit pertama.
- **hantar.json**: `video.had_saat` 180; `youtube`; `teks` = `HANTAR.md` bahagian "## What I Built" had 1,500 patah min 500;
  `nama_acara` ["Presage SmartSpectra SDK Challenge"]. `data/semakan.json` acara URL cabaran: `polisi_ai` = "AI dibenarkan (FAQ 'Use
  of AI is allowed as long as all other rules are followed'; staf DEV 6 Nov); agen tulis teks suara manusia; AI dalam app
  didedahkan dalam Consent".
- Gerbang sebelum pemilik: `semak_hantar.py` rc 0 · `gilap gaya` README + HANTAR rc 0 · `legasi semak --kandidat docs/hantar`
  rc 0 · ujian kata larangan hijau · repo bersih, tiada `.env`, tiada media.

## 9. Fasa cadangan (perancang boleh menyusun semula potongan, bukan gerbang)

| P | Bila (MYT) | Kerja | Gerbang keluar |
|---|---|---|---|
| P0 | 9 Nov | `repo-baharu.sh ~/degup`; salin PRD; PELAN; `02-KEPUTUSAN.md` K1–K15; `entri.py status … masuk --repo ~/degup`; `entri.py hantar --pasang-repo`; rekod `entri.py pemilik` untuk setiap baris FABLE §8 (kunci API 10 Nov 22:00, jawapan S1–S8 10 Nov 22:00, video ujian 12 Nov, raptai 18 Nov, rakaman 20 Nov, terbit 21 Nov 22:00, pantau e-mel 10 Dis); `semakan.json` polisi_ai; `.gitignore` media + `.env` | Komit pertama; Baki KAU kelihatan dalam `sahkan` |
| P1 `[hos]` | 10–13 Nov | `npm install` SDK 3.4.0; `scripts/headless-smoke.mjs` (dokumen rasmi) atas video pemilik dengan kunci; Vulkan ICD jika perlu; `scripts/gerbang-p1.mjs` → `docs/UKUR-P1.md` (H1, H2, klip ketukan); `beats.ts` + ujian sintetik | H1 + H2 lulus → mod penuh; gagal → K-undur R2 direkod |
| P2 | 10–14 Nov | `src/core` (beats, score, rsa, i18n), sumber `sim` + `replay`, ujian unit; `config/app.json`; `lang/` | vitest hijau; pariti kunci BM/EN |
| P3 | 12–16 Nov | Renderer: izin, LIHAT, RASA, pendedahan, LENTUR, keputusan, Data, tetapan; reka bentuk disengajakan (skil `impeccable`/`frontend-design`), gelap, satu aksen, tipografi jelas 1280×800; Playwright aliran penuh dalam `sim` | H3 hijau di Depot |
| P4 `[hos]` | 14–17 Nov | Sumber `live` (`useMediaStream`, kebenaran, kamera pilih); perakam demo; perakam fixture; `safeStorage` kunci; pemasang untuk S1 (`bina-win.sh` atau zip mac) → FILE DROP + sha256; README pasang | Pemasang dibuka pada VM/pelari? Jika tiada, semakan statik + larian pemilik 18 Nov |
| P5 | 18 Nov ≤ 23:59 | **Beku ciri.** Pepijat sahaja selepas ini | Tag `v0.9.0` |
| P6 | 18 Nov malam | Pemilik: raptai (pasang, kunci, tiga babak, "Rakam demo"); fixture sebenar masuk `fixtures/`; maklum balas → pembaikan ≤ 19 Nov | H4 |
| P7 | 19 Nov | Pengerasan; draf `HANTAR.md` + `SKRIP-VIDEO.md` + `POLISI-AI.md`; `gilap`; `legasi semak` | Draf sedia dibaca pemilik 20 Nov |
| P8 | 20–21 Nov | Pemilik rakam akhir (20 Nov malam) → FILE DROP; pembina sunting video (potong, sari kata BI, narasi S3, LUFS), isi angka sebenar ke pos, `semak_hantar.py` rc 0; artifak akhir ke FILE DROP; tag `v1.0.0` | H5, H6 |
| P9 | 21 Nov ≤ 22:00 | Pemilik: YouTube, repo awam, tampal pos, Publish, semak log keluar; pembina: `entri.py status … dihantar --url-projek <pos>` selepas pemilik sahkan | H7 |
| P10 | 22–23 Nov | Tiada perubahan pada pos/repo yang dinilai. Pantau komen pos (jawab soalan juri jika ada, tanpa mengubah entri) | Tutup 23 Nov 15:59 |
| P11 | 10 Dis | Keputusan → `entri.py status … menang|kalah`; `PELAJARAN.md`; Baki KAU bayaran | — |

Peringkat 4 (pra-hantar Fable) dilancar sendiri oleh `sahkan pantau` bila entri `masuk` + repo + tutup ≤ 7 hari (≈ 16 Nov); jawapannya
dibaca pembina sebelum P7.

## English summary (for the builder, same decisions as above)

Degup is a 3-minute Electron desktop game for adults built on the Presage SmartSpectra Node SDK (3.4.0): consent screen first; SEE
(a light pulses with each heartbeat the camera detects); FEEL (lights off, press Space whenever you feel a beat for 40 s, then a
reveal with real beats vs taps and a phase-consistency score using circular statistics, bands Guessing / Some sense / In tune);
BEND (paced breathing 4 s in / 6 s out while inter-beat intervals are drawn live, ending with "your heart slowed about X ms on each
exhale"). Beat times come from our own peak detector on `cardio.arterial_pressure_trace` (spec §4.3; gate on the owner's 90 s
video via `useFile()` on the VPS by 13 Nov; fallback = count mode). Requested metrics: cardio + breathing only; telemetry off;
the automatic Insights upload to Presage (generated with Anthropic, not disableable) is disclosed exactly; no storage by default;
18+; no medical language (banned-word test). Sources: live camera via `useMediaStream` (electron-quickstart pattern, credited),
replay fixtures (derived numbers only, never video), and a synthetic simulator for Playwright. In-app demo recorder. Installer for
the owner's OS (default Windows x64) built on the host. Categories: Creative + Overall. The owner registers the Presage key, records
two test clips by 12 Nov, rehearses 18 Nov, records 20 Nov, publishes the DEV post 21 Nov by 22:00 MYT; the post and README are
written by the builder in the owner's voice with a true AI disclosure. Repo private until the owner makes it public on 21 Nov; MIT.

<!-- SIAP-SAHKAN -->
