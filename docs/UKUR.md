# UKUR: Degup

Setiap larian SDK SEBENAR (kredit Presage) satu baris (PRD H8: ≤ 60 minit sebelum 18 Nov). Artifak (pemasang, video) dengan sha256.
Nama fail video pemilik sahaja, tiada laluan penuh, tiada imej.

## Larian SDK sebenar

| Tarikh (MYT) | Potongan | Tempoh (min) | Tujuan | Sumber (nama fail / kamera) | Keputusan |
|---|---|---|---|---|---|
| 19 Nov 2026 03:25 hingga 03:31 | P1a | ≈ 1.0 (12 + 12 s fail, 18.8 + 18.9 s app) | Asap laluan langsung tanpa muka: `headless-smoke.mjs` × 2 atas video corak `testsrc` 20 s (mktemp, dibuang) + `asap-live.mjs` × 2 (Electron, kamera palsu Chromium) | corak ujian, tiada orang | kunci diterima (kRunning, Data "Yes"); kNoFaceFound 118×; 0 payload metrics; 0 ralat; tiada CSP/konsol; Esc mematikan kamera |

Jumlah sebelum 18 Nov: 0 minit.

## Artifak

| Tarikh (MYT) | Fail (FILE DROP) | sha256 | Nota |
|---|---|---|---|

## Video ujian pemilik (`~/degup-rahsia/`)

| Nama fail | Tempoh (s) | sha256 | Diterima |
|---|---|---|---|

## README (angka diukur)

| Tarikh (MYT) | Angka dalam README | Arahan | Sumber |
|---|---|---|---|
| 17 Nov 2026 | 122 ujian unit (13 fail), 12 ujian Electron lulus, 1 dilangkau (`e2e/media-readme.spec.ts`) | `~/bin/gerbang-depot.sh .depot/workflows/gerbang.yml -- bash scripts/gerbang-ujian.sh` | Depot run `zgmnxvjc31` LULUS 259 s |
| 17 Nov 2026 | Ambang pengesan (≥ 95%, median < 40 ms, 55 hingga 95 BPM, 7 benih), LENTUR ±10%, skor jalur | ditegaskan oleh `tests/beats.test.ts`, `tests/rsa.test.ts`, `tests/score.test.ts` dalam larian yang sama | isyarat sintetik sahaja |
