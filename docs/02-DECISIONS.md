# Keputusan: Degup

PRD menyebut `docs/02-KEPUTUSAN.md`; pagar rumah mengenali nama ini, jadi rekod hidup di sini (PELAN "Peraturan setiap potongan" 1).
Format D-n: keputusan · sebab · undur. D-K1 hingga D-K15 = salinan PRD §5 (diputuskan; JANGAN buka semula).

## Keputusan PRD (PRD §5, disalin 9 Nov 2026)

| # | Keputusan | Sebab | Undur |
|---|---|---|---|
| D-K1 | Konsep = permainan persepsi degupan (Degup), bukan jurulatih nafas/overlay penstrim | Unik dalam medan, dalam sampul kad model, tiada larangan ToS | Jika P1 gagal: mod kira (PRD §7 R2) |
| D-K2 | Electron desktop pada laptop pemilik; SDK di peranti | Platform rasmi dengan sampel; privasi terbaik | F2 Degup Web hanya jika S1 memaksa |
| D-K3 | Masa degupan dari `arterial_pressure_trace` dengan pengesan puncak sendiri | Payload tiada penanda degupan | `pulse.trace`; kemudian mod kira |
| D-K4 | Skor = ketekalan fasa (statistik bulatan), bukan kelewatan atau kiraan | Prinsip PAT: sesaran tetap tidak penting | Paparkan nisbah n/N sebagai maklumat |
| D-K5 | Tiga babak, LIHAT dahulu | Tindak balas masa nyata kelihatan dalam 30 s pertama video | Susunan berubah hanya dengan K baharu |
| D-K6 | Tiada muka/ekspresi/EDA; tiada `requestInsight` | Tidak perlu; risiko ToS dan Vulkan; Insights berbayar | — |
| D-K7 | Telemetri mati; Insights automatik DIDEDAHKAN sebagai tidak boleh dimatikan | Dasar Privasi SDK 3 Nov §4.2/§7.4 | Jika Presage menambah suis Insights: hidupkan "mati" dan kemas teks |
| D-K8 | Simpanan tempatan lalai: tiada; sejarah opt-in; kunci `safeStorage` | Izin bertaraf Real-World | — |
| D-K9 | Kategori: Creative + Overall; Real-World hanya S4 = ya + eksport CSV + peringkat 4 lulus | Teks kategori dipaksa melemahkan pos | — |
| D-K10 | Pos dan README ditulis pembina dalam suara pemilik, BI, deklarasi AI benar; narasi = klon EL pemilik diisytiharkan (S3) | Polisi acara membenarkan AI | S3 lain |
| D-K11 | Sesi ejen tidak dibenam | Transkrip hos memuatkan konteks pelayan | S7 = sesi bersih khas |
| D-K12 | Fixture = angka terbitan sahaja; video pemilik di luar repo | Biometrik tidak ke git | — |
| D-K13 | Lesen MIT; repo awam oleh pemilik 21 Nov; paten tidak | Lejar `dilepaskan`; seni terdahulu PAT | — |
| D-K14 | Nama "Degup"; subtajuk EN "Can you feel your own heartbeat?" | Pendek, BM; soalan = cangkuk | Pemilik boleh tukar nama sebelum P6 |
| D-K15 | Perakam demo dalam app | Pemilik bukan teknikal; video = faktor menang | Perakam OS |

## Keputusan pembina

### D1 (P0, 9 Nov 2026) Kredit sampel rasmi `electron-quickstart`
- **Keputusan:** corak "renderer memiliki kamera → `useMediaStream` dari `@smartspectra/node-sdk/renderer`; `main` mengurus tetingkap,
  kebenaran, `safeStorage`" diikut dari sampel rasmi `Presage-Security/SmartSpectra` `nodejs/samples/electron-quickstart`, dikreditkan
  dalam README §Credits. Kod ditulis sendiri; tiada fail disalin.
- **Sebab:** PRD §0 dan §4.11 membenarkan corak sampel rasmi yang dikreditkan; projek mesti baharu.
- **Undur:** tiada (kredit kekal).

### D2 (P0) Versi dipin tepat
- **Keputusan:** `@smartspectra/node-sdk` 3.4.0 (PRD), Electron 45.2.3 (stabil terkini 8 Nov, ≥ 28), TypeScript 7.0.2, esbuild 0.28.2,
  vitest 5.1.0, `@playwright/test` 1.65.0, electron-builder 26.18.0, `@types/node` 22.20.5. Semua tanpa `^`. Node 22 (`.nvmrc`;
  Depot `setup-node` 22), `engines.node >=20` (SDK), `engine-strict` dalam `.npmrc`.
- **Sebab:** binaan boleh diulang hingga beku 18 Nov; tiada naik taraf senyap selepas `v0.9.0`.
- **Undur:** turunkan satu pakej ke versi utama sebelumnya (cth TypeScript 5.9) dengan D-n jika alat bertembung.

### D3 (P0) Ujian kata larangan dengan senarai benar sempit
- **Keputusan:** `tests/kata-larangan.json` = perkataan PRD §4.8 + padanan BM (stres, kebimbangan, aritmia, tidak normal, mendiagnosis,
  perubatan, ujian kesihatan, penyakit jantung, kecemasan). Padanan tanpa huruf besar pada sempadan perkataan. `senarai_benar` memetakan
  SATU kunci lang → perkataan yang dibenarkan untuknya sahaja: `izin.perkara.3.teks` (HRV), `izin.perkara.6.tajuk`/`.teks`
  (medical/perubatan, diagnose/diagnosis/mendiagnosis), `izin.perkara.7.teks` (diagnosis), `umum.penafian` (health test/ujian kesihatan;
  ayat tetap PRD §4.2), `lentur.penerangan` (arrhythmia/aritmia; ayat RSA PRD §4.2). Markdown (README, HANTAR): hanya blok
  `<!-- izin mula -->` … `<!-- izin akhir -->` boleh memakai `markdown_izin` (HRV, medical, diagnose, diagnosis, health test: salinan teks izin §4.6 dan ayat tetap §4.2). Ujian membuktikan perkataan sama di kunci lain ditolak.
- **Sebab:** teks izin wajib PRD §4.6 dan ayat RSA bertembung dengan senarai larangan §4.8; arahan projek menuntut senarai benar sempit.
- **Undur:** buang kunci dari senarai benar bila teks wajib berubah; menambah kunci = D-n baharu.

### D4 (P0) Jalur RASA sebagai senarai padanan pertama dalam config
- **Keputusan:** `config.rasa.jalur` = `[selaras: R ≥ 0.6 dan p < 0.01] → [ada_rasa: p < 0.05] → [meneka]`, padanan pertama menang.
- **Sebab:** PRD §4.4 meninggalkan jurang (R ≥ 0.6 dengan 0.01 ≤ p < 0.05); susunan ini meletakkannya dalam "Ada rasa" (p < 0.05,
  belum cukup kuat untuk "Selaras") tanpa mengubah tiga syarat PRD.
- **Undur:** ubah susunan atau ambang dalam config sahaja.

### D5 (P0) Templat bahan hantar dan lejar
- **Keputusan:** `docs/hantar/*.md` dipasang oleh `entri.py hantar --pasang-repo` (templat ~/hackathon; diisi P7). Entri `masuk` dengan
  repo `~/degup`; ciptaan didaftar dalam `~/legasi/config/ciptaan-daftar.json` oleh `entri.py`. Status lejar (`dilepaskan`, paten tidak,
  S8 lalai) dibina oleh cron `legasi segerak` dan pengesahan pemilik, tidak ditulis tangan.
- **Sebab:** D24/D48 rumah; lejar ialah output mesin.
- **Undur:** S8 = ya → berhenti, lapor pemilik (PRD §6).

### D6 (P2a) Pembetulan kelewatan penapis dan bentuk sim
- **Keputusan:** detrend PRD §4.3 = purata bergerak KAUSAL 1.0 s (bukan berpusat, supaya LIHAT tidak lewat 0.5 s). Kelewatan fasa rantai
  detrend + biquad dikira secara analitik pada nadi semasa (`kelewatanFasa`, `src/core/isyarat.ts`) dan ditolak dari masa puncak.
  Tanpa pembetulan masa puncak lewat ~60–80 ms (ralat median melepasi 40 ms §4.3). Nadi untuk pengiraan = `pulse_rate` stabil terkini,
  kemudian terkini, kemudian `config.beats.nadi_lalai_bpm`. Penjana `sim` memakai cos(2πφ) + h·cos(4πφ) supaya degupan sebenar = φ
  integer (masa rujukan tepat untuk ujian). Jurang mentah > `jurang_s` memulakan semula penapis (tiada interpolasi merentas jurang).
- **Sebab:** §4.3 menuntut ralat median < 40 ms dan penapis kausal; kelewatan ini hampir malar dalam julat 55–95 BPM tetapi bukan sifar.
  Diukur: 72 kes (55–95 BPM × 8 benih, 60 s) = 100% dikesan, median terburuk 15.8 ms.
- **Undur:** buang penolakan `kelewatanUs()` dalam `beats.ts` (fasa RASA tetap konsisten; hanya ralat masa mutlak naik).

### D7 (P2b) Julat LENTUR setiap kitaran = puncak-ke-lembah sinus muat
- **Keputusan:** `config.lentur.julat_kaedah = "sinus"`: dalam setiap kitaran nafas, IBI dimuat kuasa dua terkecil kepada
  a + b·cos(ωt) + c·sin(ωt) (ω = 2π / tempoh kitaran), julat = 2·√(b² + c²). Syarat ≥ `min_degupan_kitaran` degupan sah dan
  ringkasan = median kitaran kekal ikut PRD §4.5. `"maks_min"` = IBI maks − min mentah (bacaan literal PRD) masih tersedia.
- **Sebab:** hingar masa degupan (sisihan ~10 ms pada `sim.hingar` 0.15) menaikkan maks − min secara sistematik: diukur +20% hingga +34%
  atas sim RSA diketahui (72±4, 85±3 BPM). Purata bergerak 3 degupan mengecilkan RSA sebenar −15% pada 60 BPM. Sinus muat: −9.7% hingga
  +5.9% berbanding nilai analitik atas 25 kes (55–95 BPM, RSA 3–6 BPM, 5 benih).
- **Undur:** `julat_kaedah: "maks_min"` dalam config.

### D8 (P2b) Skor, fixture dan sumber replay: butiran yang PRD tidak putuskan
- **Degupan sah (§4.4 "kualiti ≥ 40"):** saat yang mengandungi degupan mesti mempunyai pecahan sampel berkeyakinan ≥ 40 sekurang-kurangnya
  `rasa.kualiti_saat_min` (0.5). Ketukan dikira hanya antara dua degupan sah BERTURUT-TURUT dalam tetingkap.
- **p Rayleigh = exp(−nR²)** seperti PRD; n < `n_min` tidak diskor jadi pembetulan sampel kecil tidak dipakai.
- **Fasa min → ms** = sudut min ([0, 2π)) × median IBI sah dalam tetingkap. Ayat statistik memakai `samaDaripada10` = ketukan dalam
  ± `rasa.ayat_separuh_kitaran` (0.25) kitaran dari fasa min, dibulatkan per 10.
- **Kitaran jejak nafas** (§4.5 "detrend yang sama"): jejak atas disampel semula 10 Hz, dilicin purata berpusat 1 s, min ditolak, puncak
  > 0 dengan sela ≥ 2 s; dipakai hanya bila ≥ 80% sampel stabil dan ≥ 2 kitaran, jika tidak panduan 4 + 6 s. Detrend 1 s §4.3 memadam
  gelombang nafas 0.1 Hz, jadi tidak dipakai di sini. Nilai dalam `config.lentur.nafas_*`.
- **Skema fixture 1** (`src/core/fixture.ts`): `prq` = [{t, v, c}]; `nafas` boleh ada `s` (stabil, boolean); `meta` = {skema, jenis
  simulasi|pemilik|ujian, label ≤ 60, tarikh YYYY-MM-DD, babak? (saat relatif), jana? (nombor sahaja)}. Pengesah menolak kunci asing dan
  rentetan dalam data (tiada imej/laluan). Main semula menganjak cap masa supaya sampel pertama = jam semasa.
- **`pulse.pulseRespirationQuotient`** dibaca sebagai satu ukuran ATAU senarai sehingga P1 mengukur bentuk sebenar. Sim kini menghantar
  PRQ = nadi purata / nafas per minit supaya replay dan sim menunjukkan nisbah.
- **`fixtures/sim-contoh.json`** dijana `node scripts/jana-fixture-sim.mjs`; `meta.jana` menyimpan semua parameter dan ujian menjana
  semula dan membanding tepat (perubahan penjana tanpa jana semula = merah).
- **Undur:** setiap nilai dalam config; skema naik ke 2 bila medan berubah (pengesah menolak skema lain).

### D9 (P3a) Cangkerang Electron, arah visual "pelita", kunci API dan ujian
- **Arah visual "pelita dalam bilik gelap":** latar dakwat biru malam (`#0f1626`), SATU aksen amber pelita (`#f4b860`); merah hanya
  untuk petunjuk kamera hidup (semantik, bukan aksen). Bulatan cahaya §4.2 = "pelita" (gradien berlapis, skala/kelegapan sahaja).
  Tipografi: Bricolage Grotesque (paparan; tanda kata "Degup" besar) + Atkinson Hyperlegible Next (badan, kebolehbacaan teks izin
  panjang). Fon OFL dibundel dari `@fontsource` (tiada rangkaian; CSP `font-src 'self'`). Token dalam `src/renderer/gaya.css :root`.
  Belum diluluskan pemilik (pintu rupa pelari). Undur: tukar token `:root`.
- **Tetapan dan Data = helaian sisi `<dialog>` modal** (fokus terkurung, Esc menutup) di atas skrin semasa, supaya ia boleh dibuka
  dari mana-mana babak tanpa kehilangan keadaan. Esc tanpa helaian = berhenti (kamera mati, kembali ke izin).
- **"Rakam demo" (§4.7, §4.9) ditambah bersama perakam dalam P4a**, bukan butang kosong dalam P3a. Pilihan "Sumber isyarat" dalam
  tetapan = Kamera / Main semula; `sim` hanya melalui `DEGUP_SUMBER` (ujian), dipaparkan sebagai lencana "Simulasi".
- **Kunci API:** `safeStorage` sahaja; bila storan terenkripsi tiada (Linux tanpa keyring) app MENOLAK menyimpan dan berkata begitu,
  tidak menulis teks biasa. Ujian Electron di xvfb memakai `--password-store=basic` + `DEGUP_UJI_STORAN_ASAS=1`
  (`setUsePlainTextEncryption`, Linux sahaja). Kunci tidak pernah dihantar balik ke renderer dalam P3a; P4a memberinya kepada SDK.
- **Keselamatan tetingkap:** `contextIsolation`, `sandbox`, tiada `nodeIntegration`; preload mendedahkan 7 fungsi sahaja (8 sejak P3b, D10: `bacaFixture`; 15 sejak P4a, D13)
  (`src/preload/api.ts`); kebenaran `media` video sahaja untuk tetingkap app; navigasi dan `window.open` disekat; pautan luar hanya id
  dalam `config.pautan` (https).
- **Folder data:** `app.getPath("userData")`; env `DEGUP_DATA` menindih (ujian). "Padam semua data Degup" membuang `tetapan.json`,
  `kunci.bin`, `sejarah.json` sahaja. Panel Data menyenaraikan fail yang ditulis sesi ini (dikira proses main).
- **TypeScript dua projek:** `tsconfig.json` (teras, sumber, main, preload, ujian, tanpa DOM: teras kekal tulen) +
  `tsconfig.renderer.json` (DOM). Binaan `esbuild.config.mjs` → `dist/` (main/preload CJS, renderer IIFE).

### D10 (P3b) LIHAT, RASA, pendedahan: butiran yang PRD tidak putuskan

- **Babak berkeadaan:** setiap babak (`src/renderer/skrin/lihat.ts`, `rasa.ts`, `dedah.ts`) memegang pemasa dan langganannya sendiri;
  tukar bahasa membina DOM semula tanpa menetap semula masa, ketukan atau skor. Satu `SesiUkur` (`src/renderer/sesi.ts`) memegang SATU
  pendengar metrik sumber, pengesan degupan, penjejak nadi dan penjejak jeda; babak melanggan di situ.
- **LIHAT tidak maju sendiri.** "Sedia" dibuka bila jejak stabil ≥ `lihat_sedia_selepas_stabil_s` tanpa jeda; selepas `lihat_s` butang
  ditonjolkan; bila `lihat_maks_s` berlalu tanpa stabil, "Sedia" dibuka dengan nota jujur (skor mungkin tak cukup data). Sebab: RASA
  menuntut perhatian penuh, jadi pengguna memilih bila mula. Stabil = ukuran nadi `stable` DAN keyakinan ≥ `beats.keyakinan_stabil`.
  Pelita berdenyut (`denyut_ms`, `denyut_skala`, transform sahaja; kurang gerak = kelegapan) hanya bila stabil dan tidak dijeda.
- **Petunjuk SDK:** teks dari `lang/` ikut KOD `ValidationCode` 3.4.0 (`src/core/petunjuk.ts`), bukan `hint` Inggeris SDK (BM perlu
  terjemahan). Sebarang kod bukan OK = jeda. RASA: masa pusingan beku semasa jeda, ketukan semasa jeda tidak dikira; jeda >
  `jeda_ulang_pusingan_s` membuang ketukan dan pusingan bermula semula bila petunjuk OK. Jeda menetap semula kiraan stabil LIHAT.
- **Ketukan:** cap masa = `performance.timeOrigin + event.timeStamp` (masa peristiwa, bukan masa pengendali) → µs. Space (bukan ulang
  autokekunci), `pointerdown` (tetikus + sentuh). Bunyi = satu nada pendek Web Audio (`rasa.bunyi`), ikut tetapan Bunyi. Riak pada
  ketukan sahaja; tiada maklum balas tentang degupan. Skor dikira `tunggu_akhir_ms` selepas tetingkap tamat (puncak terakhir disahkan).
- **Pendedahan:** ayat sesaran fasa hanya dipapar bila jalur bukan "Meneka" (purata fasa rawak ialah hingar). Saat tanpa sampel = berlorek.
- **"Teruskan" sementara:** sehingga LENTUR (P3c), "Teruskan" menamatkan sesi (kamera mati) dan kembali ke izin.
- **Main semula dalam renderer:** IPC baharu `bacaFixture(nama)`; main hanya membaca nama yang tersenarai dalam `fixtures/` dan
  mengesahkannya dengan pengesah P2b. Sumber `live` disambung dalam P4a (sehingga itu LIHAT live kekal "Membaca nadi…").
- **Cangkuk ujian (`src/renderer/uji.ts`):** `window.degupUji` (petunjuk tiruan, ketukan sefasa / fasa tersebar ikut degupan dikesan)
  dan skala masa `DEGUP_SKALA_MASA` HANYA bila `DEGUP_SUMBER=sim` (main memaksa 1 untuk sumber lain). Ketukan Playwright masa nyata
  tidak boleh mendahului degupan yang belum dikesan, jadi jalur diuji dengan ketukan bertulis; Space sebenar diuji untuk kiraan.
  Undur: buang `uji.ts` + `uji` dalam config; ujian jalur kembali ke vitest sahaja.

### D12 (P3c) LENTUR, keputusan, kad PNG: butiran yang PRD tidak putuskan

- **Panduan nafas = pelita** (mod `nafas`): Web Animations `transform: scale` (`lentur.pelita_skala_hembus` → `pelita_skala_tarik`
  dalam `tarik_s`, kembali dalam `hembus_s`); kurang gerak = kelegapan. Rentak nafas TIDAK diskala oleh `DEGUP_SKALA_MASA` (fisiologi);
  hanya tempoh babak diskala. Label "Tarik"/"Hembus" dari `fasaPanduan`. Bina semula DOM (tukar bahasa) menetapkan `currentTime`
  animasi supaya kekal sefasa dengan panduan yang dipakai `kiraLentur`.
- **Jeda petunjuk dalam LENTUR:** masa babak beku, panduan nafas terus berjalan (orang terus bernafas; kitaran panduan kekal berlabuh
  pada `mula`). Tiada ulang pusingan (PRD hanya menuntutnya untuk RASA). Degupan semasa jeda ditapis oleh kualiti seperti biasa.
- **Lorek jalur IBI:** `segmenFasa` (`src/core/lentur.ts`) memilih jejak nafas atas bila `licinNafas` lulus syarat stabil
  (`nafas_stabil_min`): cerun jejak dilicinkan naik = tarik, turun = hembus; jika tidak, segmen panduan. `licinNafas` diekstrak dari
  `kitaranJejak` (satu pelicin untuk kitaran dan lorek). Jalur = lorek lembut penuh tinggi + bar fasa di dasar (tarik = warna pelita).
- **Hujung LENTUR:** `kiraLentur` dijalankan `lentur.tunggu_akhir_ms` selepas masa tamat (degupan terakhir disahkan), kemudian babak
  yang sama melukis ringkasan (ms besar, ayat ringkasan, nisbah PRQ bila ada, ayat RSA tetap, penafian) dan butang "Lihat keputusan".
- **Keputusan:** kamera + sesi ditutup sebaik masuk skrin keputusan (babak ukur sudah tamat; perakam demo P4a berhenti di sini).
  Kad skrin dan PNG dibina dari `barisKad` yang sama. Nadi purata = purata ukuran nadi stabil dari mula sesi hingga akhir LENTUR.
  Esc dari keputusan kembali ke izin.
- **Kad PNG:** dilukis renderer di kanvas (`kad.lebar`×`kad.tinggi`, warna dari token CSS, fon app); bait ke main melalui IPC
  `simpanKad`; main menyemak tandatangan PNG + `kad.maks_bait`, menamakan fail sendiri `<awalan>YYYYMMDD-HHMMSS[-n].png` (tiada tindih)
  dalam `Gambar/<kad.folder>`, tulis atomik; laluan dicatat dalam panel Data (fail ditulis sesi ini). Tiada dialog simpan (satu klik,
  boleh diuji); "Buka folder" = `shell.openPath`. `DEGUP_DATA` (mudah alih/ujian) juga memindah Gambar ke `<DEGUP_DATA>/gambar`.
- **Replay berulang:** fixture habis = pusingan baharu disauh pada jam semasa (cap masa terus menaik). Sebab: fixture contoh 130 s;
  pengguna/juri yang lama di LIHAT akan tiba di LENTUR tanpa data. Undur: kembalikan `henti()` bila `pusingan() > 0`.
- **Skala masa ujian untuk replay juga** (meminda D10): `DEGUP_SKALA_MASA` kini dipakai bila sumber `sim` ATAU `replay` (H3 menuntut
  aliran penuh replay di Depot setiap push; 1× = > 2 min). Data replay tetap masa nyata; hanya tempoh babak dipendekkan. Live = 1 sentiasa.
  Cangkuk `window.degupUji` kekal sim sahaja.

### D13 (P4a) Sumber live, perakam demo, perakam fixture: butiran yang PRD tidak putuskan

- **SDK disuntik:** `src/sumber/live.ts` (`SumberLive`) menerima `KilangSdk` (pembina + `decodeMetrics` + kod kumpulan metrik);
  kilang sebenar `src/renderer/sdk-live.ts` mengimport `@smartspectra/node-sdk/renderer` + `/messages`. Sebab: sumber diuji vitest dengan
  SDK tiruan (`tests/live.test.ts`) tanpa jambatan preload atau pustaka asli. Opsyen dibina `opsyenSdk` dari `config.sdk.metrik`;
  kumpulan selain `cardio`/`breathing` = ralat (bukan diabaikan). `cardioMetrics` SDK 3.4.0 termasuk kod HRV (17): diminta kerana PRD
  §4.11 menamakan `cardioMetrics`, tetapi tidak dibaca atau dipapar (HRV bukan skor, §3).
- **Strim kamera dimiliki renderer:** `Kamera.buka` (ideal `config.sdk.kamera` 1280×720/30) → strim yang sama ke pratonton dan
  `useMediaStream` sebelum `start()`. Ujian memastikan urutan, SATU pendengar `metrics`, tiada `requestInsight`, `stop`+`destroy` bila
  henti (destroy tetap bila stop gagal), dan carian teks dalam `src/` (tiada `requestInsight(`, tiada telemetri/output terkumpul hidup,
  tepat satu `.on("metrics"`).
- **Main memuat SDK MALAS:** `bindSmartSpectraIpc(win)` hanya bila renderer meminta `sediaLive` (pakej SDK memuat pustaka asli semasa
  `require`; sim/replay, Depot CI dan juri tanpa kunci tidak menyentuhnya). Sebelum muat: `VK_ICD_FILENAMES` lavapipe (Linux, bila
  fail wujud dan pengguna belum menetapkan) dan `SMARTSPECTRA_CAPI_PATH` = pakej platform dalam `app.asar.unpacked` bila dipakej
  (P4b mesti `asarUnpack` pakej `@smartspectra/*`). esbuild main: SDK + `koffi` external; preload membundel jambatan rasmi SDK.
- **Kunci ke renderer:** `sediaLive` memulangkan kunci yang dibuka `safeStorage` kepada renderer (pembina SDK renderer memerlukannya;
  ia kembali ke main melalui jambatan SDK). App tidak dipakej boleh memakai env `SMARTSPECTRA_API_KEY` (pembangunan); app dipakej tidak.
  Tiada kunci = ralat "kunci" di skrin izin tanpa memuat SDK (diuji e2e dengan kamera tiruan Chromium).
- **Ralat SDK:** `SmartSpectraErrorCode` → kategori UI (kunci, kredit, rangkaian, kamera, sdk); semasa babak = berhenti (kamera mati) +
  ayat jujur di skrin izin yang menunjuk ke Main semula. Panel Data: pengesahan = ya bila `processingStatus` kRunning, tidak bila
  kAuthenticationFailed; peristiwa `insight` automatik DIKIRA sahaja (kandungan tidak dibaca; K7 pendedahan).
- **Perakam demo:** main memberi ID media tetingkap Degup (`win.getMediaSourceId()`, format desktopCapturer) bersama nama fail;
  renderer `getUserMedia` `chromeMediaSource: desktop` ikut ID itu (tiada pemilih skrin, tiada audio, tiada tetingkap lain). Diukur
  9 Nov: `desktopCapturer.getSources` di xvfb tanpa pengurus tetingkap TIDAK menyenaraikan tetingkap (hanya skrin), jadi corak
  "senarai + padan" gagal di CI; ID terus berfungsi. Kebenaran `display-capture` dibenarkan untuk tetingkap app sahaja.
  `MediaRecorder` (`config.perakam.mime`, sandaran `video/webm`) ketul setiap `ketul_ms` → IPC → main menambah `.<nama>.part`, dinamakan
  `degup-demo-YYYYMMDD-HHMMSS.webm` bila tamat; had ketul + jumlah dalam config; rakaman kosong dibuang. Petunjuk merah "RAKAM" + henti
  di bar atas; butang dalam Tetapan dan skrin izin; berhenti sendiri `henti_selepas_keputusan_ms` selepas skrin keputusan (kad kelihatan
  dalam video). Fail dicatat panel Data; tidak dipadam "Padam semua" (sama seperti kad PNG). `DEGUP_DATA` memindah Video dan Dokumen.
  Sandaran OS (Win+G / QuickTime) = README §Rakam dalam P4b.
- **Perakam fixture:** hanya bila `config.rakam_fixture` DAN sumber live; `SesiUkur` mengumpul payload dengan `PengumpulFixture` +
  ketukan RASA + `meta.babak` (masa babak µs → saat relatif). Jenis `ujian`, label `<label_awalan><tarikh>`; P6b melabel semula pemilik.
  Main menulis ke `Dokumen/Degup/fixtures/degup-fixture-<masa>.json` HANYA bila lulus `sahkanFixture` (angka sahaja).
- **Undur:** `DEGUP_SUMBER=replay` atau tetapan Main semula memintas semua di atas; perakam boleh diganti perakam OS (D-K15 undur).
