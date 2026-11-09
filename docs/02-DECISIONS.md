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
- **Keselamatan tetingkap:** `contextIsolation`, `sandbox`, tiada `nodeIntegration`; preload mendedahkan 7 fungsi sahaja
  (`src/preload/api.ts`); kebenaran `media` video sahaja untuk tetingkap app; navigasi dan `window.open` disekat; pautan luar hanya id
  dalam `config.pautan` (https).
- **Folder data:** `app.getPath("userData")`; env `DEGUP_DATA` menindih (ujian). "Padam semua data Degup" membuang `tetapan.json`,
  `kunci.bin`, `sejarah.json` sahaja. Panel Data menyenaraikan fail yang ditulis sesi ini (dikira proses main).
- **TypeScript dua projek:** `tsconfig.json` (teras, sumber, main, preload, ujian, tanpa DOM: teras kekal tulen) +
  `tsconfig.renderer.json` (DOM). Binaan `esbuild.config.mjs` → `dist/` (main/preload CJS, renderer IIFE).
