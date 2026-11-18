# Polisi AI: DEV Presage SmartSpectra SDK Challenge (dibaca: 2026-11-18)

> Tujuan: putuskan SIAPA boleh menulis teks hantar dan narasi APA dibenarkan dalam video, dari teks RASMI, bukan andaian.
> Sumber petikan = semakan pra-hantar kedua juri bebas (PH§1, dibaca semula 18 Nov 2026 16:10 UTC; teks ketiga-tiga halaman
> sama dengan salinan 17 Nov, cincangan teks dibanding). Rumusan satu ayat sudah ada dalam `~/hackathon/data/semakan.json`
> `acara[https://dev.to/challenges/presage-2026-11-04].polisi_ai` (gerbang-hantar: `polisi_ai` LULUS).

## Petikan

| # | Sumber (URL, tarikh baca) | Teks (verbatim) | Kesan |
|---|---|---|---|
| A1 | FAQ halaman cabaran, https://dev.to/challenges/presage-2026-11-04 (18 Nov 2026) | "Use of AI is allowed as long as all other rules are followed." | Teks pos dan kod dibantu AI dibenarkan |
| A2 | Jawapan staf DEV dalam komen pos pelancaran, 6 Nov 2026 (dibaca 18 Nov 2026) | "Disclose any AI service your app uses." | App mesti mendedahkan Insights automatik Presage (Anthropic); pos bahagian Consent + AI services |
| A3 | Templat pos rasmi, halaman cabaran (18 Nov 2026) | Tajuk ketujuh: "Agent Session" (pilihan, digalakkan) | Sesi ejen pilihan; kita tulis perenggan jujur tanpa transkrip (KP6) |
| A4 | Contest Rules, https://dev.to/page/presage-2026-11-04-contest-rules (18 Nov 2026) | "An explanation of how the app obtains camera consent and handles data, including disclosure of any storage, sharing, retention, deletion, SDK telemetry, or optional AI service use" | Bahagian Consent and Data Handling wajib menamakan Insights dan tempoh simpan |
| A5 | General Official Rules, https://dev.to/page/official-hackathon-rules (kemas kini 25 Feb 2026; dibaca 18 Nov 2026) | Tiada larangan teks atau suara dijana AI ditemui | Narasi klon suara dibenarkan bila diisytihar |

**Tidak ditemui:** larangan teks dibantu AI; kewajipan transkrip sesi ejen; larangan suara sintetik; had panjang video; had patah pos.

## Keputusan

1. **Teks hantar:** agen tulis penuh dalam suara pemilik (PH§6 verbatim, KP6), pemilik membaca dan menekan Publish. Sebab: A1.
2. **Video:** rakaman sebenar app dengan isyarat Presage langsung sahaja; tiada video atau pos mod Simulation sahaja. Sebab: syarat
   wajib 2 dan ayat pengesahan juri (PH§1).
3. **Narasi:** klon suara pemilik (ElevenLabs), diisytihar dalam pos, video dan penerangan YouTube. Sebab: A1, A5.
4. **AI dalam produk:** app sendiri tidak memanggil model AI; Insights automatik Presage (Anthropic) didedahkan sebelum kamera hidup
   dan dikira dalam panel Data. JANGAN dakwa "tiada AI" atau "tiada data keluar". Sebab: A2, A4.
5. **Penyerahan:** pemilik menekan Publish sendiri di DEV (tiada automasi, tiada API dev.to).

Undur: teks rasmi baharu yang bercanggah = baca semula, kemas petikan dan keputusan, kemas `semakan.json`.
