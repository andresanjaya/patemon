# Verifikasi #126 — Skor kesiapan

## Temuan dan perubahan

- Caller aktif: `src/app/(dashboard)/workspace/[weddingId]/page.tsx`, melalui `OverviewDashboard` ke `ReadinessCard`.
- Reproduksi sebelum perbaikan dengan render komponen: skor workspace kosong 0%, tetapi segmen “Berjalan” memiliki lebar 40%. Tujuh kasus regresi baru gagal sebelum perbaikan.
- Setelah perbaikan: satu bar “Skor kesiapan”; nilai teks, lebar dan nilai aksesibilitas memakai angka sama dalam rentang 0–100. Caption menjelaskan skor berbobot enam modul, bukan persentase jumlah tugas selesai.
- Rumus bisnis `calculateReadinessScore` tidak berubah. Tidak ada status pekerjaan yang disimpulkan dari sisa skor.

## Bukti browser

Chrome headless, 20 November 2026. Screenshot dari build production checkout lokal yang juga memiliki perubahan pengguna di luar tiket; bukan bukti seluruh aplikasi pada branch PR identik secara visual.

| Kasus | Hasil aktual | Bukti |
| --- | --- | --- |
| `/workspace/demo`, anonymous, 1440 × 1000 | Teks/ARIA/bar 68%; tanpa overflow horizontal halaman | [Desktop](demo-desktop.png) |
| `/workspace/demo`, anonymous, 390 × 844 | Teks/ARIA/bar 68%; caption terbaca; tanpa overflow horizontal halaman | [Mobile](demo-mobile.png) |
| Dataset kosong, fixture komponen asli + CSS build, 390 × 844 | 0%, satu fill 0%, tanpa legend/segmen Berjalan | [Kosong](empty-mobile.png) |

Fixture kosong memakai hasil `calculateReadinessScore({})`, bukan mutasi DOM atau data pelanggan. Bukan pengujian end-to-end workspace berbayar kosong. Accessibility tree Chrome untuk fixture: role `progressbar`, nama “Skor kesiapan”, nilai numerik 0. Kartu tidak menambah kontrol interaktif/tab stop. Navigasi keyboard penuh dan screen reader manual belum diuji.

## Check otomatis

- `tests/readiness-card.test.ts`: render markup React untuk 0, 37, 100, -10, 110, NaN dan Infinity; periksa teks/bar/ARIA konsisten, caption, dan ketiadaan legend dekoratif.
- Hasil checkout lokal: `pnpm test` 553 lulus / 44 file; `pnpm typecheck` lulus; `pnpm build` lulus dengan peringatan middleware deprecated dan log prerender cron/admin.
- `pnpm lint` checkout lokal gagal: 12 error / 79 warning di file di luar tiket. Lint dua file tiket lulus. Perubahan di luar tiket tidak diperbaiki atau disertakan.

## Branch PR terisolasi dari `origin/main`

- `pnpm test`: 523 lulus, 1 dilewati / 41 file, termasuk 7 kasus baru.
- `pnpm lint`: lulus. Lint kedua file tiket juga lulus.
- `pnpm typecheck`: gagal pada kode bawaan `main`, `src/features/overview/components/banten-overview-card.tsx:18` (TS2367, status `purchased` tidak ada dalam tipe). File tersebut tidak diubah oleh tiket ini.
- `pnpm build`: kompilasi berhasil, lalu gagal pada TS2367 yang sama. Tidak dinyatakan lulus.

Screenshot bukan bukti pengujian izin, RLS, atau perubahan rumus readiness; semuanya di luar scope perubahan presentasi ini. Pemeriksaan keyboard/screen reader manual dan integrasi setelah blocker `main` diperbaiki masih perlu dilakukan sebelum tiket ditutup.
