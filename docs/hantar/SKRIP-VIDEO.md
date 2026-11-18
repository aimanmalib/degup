# Skrip video demo: DEV Presage SmartSpectra SDK Challenge (Degup)

> Sumber: papan cerita semakan pra-hantar kedua (PH§7.2) dan nota YouTube (PH§6). Tiada had rasmi panjang video; sasaran
> 110 hingga 120 s, 1080p, 16:9 (PH§7.1). Rakaman SEBENAR app dengan isyarat Presage langsung; label Simulation TIDAK
> kelihatan di mana-mana (LARANGAN). Setiap angka di skrin dan dalam narasi = dari fixture sesi pemilik itu (slot TBD diisi P8).

- **Sumber rakaman:** sesi laptop pemilik (P6, jalan A, perakam terbina tetingkap 1600x900) atau video telefon dibaca app
  melalui SDK (jalan B, P1c; narasi dan penerangan ikut Varian B dalam `HANTAR.md`).
- **Pembuka (0 hingga 10 s):** orang cuba merasa degupan, kemudian pratonton kamera, "Camera on" dan lencana Live sebelum 0:20.
- **Narasi:** klon suara pemilik (ElevenLabs, `POLISI-AI.md` keputusan 3), diisytihar pada kad akhir, pos dan YouTube.
  Kapsyen EN dibakar (pil kecil di bawah).
- **Audio:** kenyaringan -16 hingga -17 LUFS, puncak tidak melebihi -1.5 dBTP; tiada senyap atau hitam pada 15 s pertama.
  Perakam app tanpa bunyi: bunyi ketukan ditambah semasa sunting dari cap masa `ketukan` fixture.
- **Dua saat "aha" dalam minit pertama:** nadi naik selepas squat, dan pendedahan.

## Babak (120 s)

| Masa | Di skrin | Narasi / kapsyen (EN) |
|---|---|---|
| 0:00–0:08 | Kau duduk, mata tertutup, tangan di atas tetikus (B-roll telefon) | "Try to feel your heartbeat. No finger on your wrist. I couldn't. So I built a game that checks, with a normal webcam." |
| 0:08–0:20 | See, mod langsung: pratonton kamera, "Camera on", lencana Live, pelita berdenyut, nombor nadi | "This is Degup. The Presage SmartSpectra SDK reads my pulse from the camera. The lamp pulses on every beat it finds." |
| 0:20–0:32 | Potongan pantas 20 squat → See semula, nadi naik | "Twenty squats. <<TBD bpm rehat>> becomes <<TBD bpm selepas>>. The lamp keeps up." |
| 0:32–0:55 | Feel: pelita gelap, pembilang; gambar-dalam-gambar tangan mengetik | "Now the lamp goes dark. I press each time I feel a beat." |
| 0:55–1:12 | Pendedahan, zum ke garis masa dan skor | "The reveal. The camera saw <<TBD degupan dilihat>> beats. I tapped <<TBD ketukan>>. Score <<TBD skor video>>." |
| 1:12–1:32 | Bend: pelita memandu nafas, carta sela degupan | "I breathe in for four and out for six. Each out-breath stretches the gap between beats by about <<TBD ms lentur>> milliseconds." |
| 1:32–1:46 | Izin perkara 3, kemudian panel Data dengan kiraan sebenar | "One thing I can't switch off: the SDK sends derived measurements to Presage for AI Insights. The app says so before the camera turns on, and this panel counts it." |
| 1:46–1:56 | Kilas kod `live.ts` + larian ujian | "Cardio and breathing only. Telemetry off. The code is on GitHub." |
| 1:56–2:00 | Kad akhir: nama, `github.com/aimanmalib/degup`, "A body-awareness game, not a health test", "Narration: my voice clone (ElevenLabs)" | (tiada) |

Dua saat "aha" dalam minit pertama: nadi naik selepas squat, dan pendedahan. Jangan tunjuk label Simulation di mana-mana.

## YouTube

- **Tajuk:** `Degup demo: a webcam game about feeling your own heartbeat (Presage SmartSpectra SDK Challenge)`
- **Penerangan:** `One real session on my own laptop. The Presage SmartSpectra SDK reads my pulse and breathing from the webcam; the game checks if I can feel my own heartbeat. Code: github.com/aimanmalib/degup. Narration: my own voice, cloned with ElevenLabs. Footage and numbers are real. A body-awareness game, not a health test.`
- **Jalan B:** ganti "One real session on my own laptop" dengan `One real session, filmed on my phone and read by the app through the real SDK`.
- **Tetapan (pemilik):** Unlisted atau Public; "No, it's not made for kids"; tandakan kandungan diubah atau sintetik (suara klon).

## Cara menghasilkan semula

1. Rakaman mentah dan fixture sesi pemilik kekal dalam `~/degup-rahsia/` (0700); tidak ke git, Depot atau cloud.
2. Kapsyen = lajur narasi jadual di atas selepas slot TBD diisi dari fixture; `.srt` dijana dari jadual yang sama.
3. Narasi dijana semula dari teks lajur narasi sahaja (P8), kemudian dicantum atas rakaman yang sama tanpa merakam semula.
4. Pemegang tempat P8a (rakaman mod sim) untuk menguji saluran paip TIDAK keluar dari `~/degup-rahsia/` dan tidak didaftar.
