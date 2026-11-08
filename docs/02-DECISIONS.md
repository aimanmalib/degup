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
  `<!-- izin mula -->` … `<!-- izin akhir -->` boleh memakai `markdown_izin`. Ujian membuktikan perkataan sama di kunci lain ditolak.
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
