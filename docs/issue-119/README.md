# #119 — Navigasi landing mobile

## Perubahan

- Satu navbar tetap tersedia sejak halaman dibuka; navbar hero duplikat dan logika sembunyi berbasis scroll dihapus.
- Toggle/panel/link desktop memakai breakpoint sama: mobile sampai 1280 px, desktop mulai 1281 px. Lebar ini menyediakan ruang untuk lima link dan CTA desktop.
- Tombol 44 × 44 px, `aria-expanded`, `aria-controls`, panel hanya dirender ketika terbuka. Escape menutup dan mengembalikan fokus; Tab keluar navbar menutup panel. Perubahan breakpoint mereset panel.
- Panel dibatasi `100dvh` dan dapat digulir. Warna teks navbar dibuat eksplisit karena CSS editorial menimpa warna tombol/link.
- Overflow kartu paket/CTA pada viewport kecil diperbaiki dengan pembungkusan teks dan grid satu kolom, bukan menyembunyikan overflow halaman.

## Verifikasi aktual

Chrome headless melalui DevTools Protocol, route `/`, anonymous, checkout lokal dengan perubahan lain yang belum di-commit:

- 320, 390, 768, 800, 820, 1000, 1024, 1440 px; posisi scroll 0, 150, 300 px.
- Satu navbar, tidak ada overflow horizontal halaman; hamburger/panel tampil pada breakpoint yang sama.
- Enter membuka panel; Tab ke link pertama, Shift+Tab kembali toggle; Escape menutup dan mengembalikan fokus. Link Masuk, Biaya & Paket, Bantuan tersedia di panel.
- Reflow setara viewport 200%: 720 × 450 CSS px pada skala 2; link terakhir terjangkau dan tidak ada overflow horizontal. Bukan pengujian zoom browser manual atau screen reader.
- Screenshot: [390 px](mobile.png), [800 px](tablet.png), [1440 px](desktop.png).
- `pnpm test`: 566 lulus / 46 file. `pnpm typecheck`: lulus. ESLint file tiket: lulus.
- `pnpm build`: lulus; peringatan middleware deprecated dan log prerender cron/admin masih ada. Pemeriksaan build mendahului penyesuaian CSS terakhir untuk reflow paket 720 px.
- `pnpm lint` global: gagal pada 12 error / 79 warning di file luar tiket; tidak diperbaiki dalam scope ini.

Regresi kecil tersimpan di `tests/landing-navigation.test.ts` (render awal, breakpoint, satu navbar di luar hero terpotong). Tes ini bukan pengganti pemeriksaan keyboard browser.

PR belum dibuat: tiga file landing juga berisi perubahan lokal sebelumnya, sementara `main` belum memuat landing yang diuji. Perubahan tidak di-commit bersama pekerjaan lain. Tiket tetap In Progress sampai diff terisolasi/PR dan verifikasi tersisa tersedia.
