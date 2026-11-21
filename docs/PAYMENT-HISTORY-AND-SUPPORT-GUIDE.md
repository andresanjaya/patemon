# Panduan Riwayat Pembayaran, Status Akses & Layanan Pelanggan (Payment History, Access States & Customer Support)

Dokumen ini menjelaskan implementasi teknis dan arsitektur untuk **Issue #38 (Phase 05 Payment & Commercial Launch)** pada aplikasi Patemon — Bali Hindu Wedding Planner.

---

## 1. Ikhtisar Solusi (Overview)

Sistem komersial dan monetisasi Patemon dirancang dengan prinsip **kedaulatan data penuh (data sovereignty)** bagi pasangan dan keluarga. Setelah transaksi berhasil melalui Midtrans Payment Gateway, pengguna mendapatkan kuitansi resmi digital, transparansi status akses secara real-time, serta jalur dukungan pelanggan kontekstual melalui WhatsApp resmi.

### Komponen Utama:
1. **Official Digital Receipt (`DigitalReceiptModal`):**
   - Kuitansi digital berstempel resmi "LUNAS / VERIFIED".
   - Nomor kuitansi terstandardisasi: `KW-${order.orderNumber}`.
   - Format cetak ramah printer / Save as PDF (`window.print()`).
2. **Indikator Siklus Hidup Akses Workspace (`calculateAccessStateDetails`):**
   - Transparansi status akses (*Active Lifetime*, *Expiring Soon*, *Critical Expiring*, *Read-Only Archive*, *Revoked*, *Free Preview*).
   - Penjelasan jaminan kedaulatan data: data tidak pernah dihapus pasca-upacara; akses baca dan ekspor CSV/JSON selalu tersedia selamanya.
3. **Integrasi Bantuan Pelanggan Kontekstual (`CustomerSupportModal` & WhatsApp Linker):**
   - Generator tautan WhatsApp resmi (`https://wa.me/62...`) dengan metadata otomatis: ID Pawiwahan, Nama Mempelai, Nomor Pesanan, dan Kategori Kendala.
   - 6 kategori dukungan: Kendala Pembayaran, Aktivasi Lisensi, Konsultasi Adat Pawiwahan, Bantuan Teknis & Fitur, Kebijakan Garansi & Refund, dan Pertanyaan Umum.
   - Terintegrasi di kartu status lisensi workspace, tabel riwayat pesanan, halaman pricing (`/pricing`), dan footer website.

---

## 2. Kuitansi Pembayaran Digital (`DigitalReceiptModal`)

### 2.1 Metadata Kuitansi
- **No. Kuitansi:** Diformat menggunakan fungsi murni `formatReceiptNumber(orderNumber)` (menghasilkan awalan `KW-` tanpa duplikasi).
- **ID Transaksi Midtrans:** Nomor pesanan unik terverifikasi (e.g. `PATEMON-WED123-MWGGZ54X-WRWH`).
- **Waktu Transaksi:** Format tanggal lokal Indonesia dengan zona waktu WITA (e.g., *Sabtu, 14 November 2026, 21:50 WITA*).
- **Rincian Pembelian:** Lisensi Akses Penuh Pawiwahan Patemon (1x Bayar / Lifetime).
- **Nominal:** Rp 199.000 (bersih tanpa biaya tersembunyi).
- **Metode Pembayaran:** Midtrans Snap (QRIS, Virtual Account, Kartu Kredit).
- **Stempel Digital Sah:** Elemen visual stempel hijau "PATEMON VERIFIED / LUNAS" dengan hash potongan ID transaksi.

### 2.2 Dukungan Cetak (Print & Save as PDF)
Menggunakan utility CSS `@media print` (`print:hidden`, `print:border-none`, `print:p-0`) sehingga ketika tombol cetak ditekan, backdrop modal dan tombol aksi disembunyikan, menyisakan dokumen kuitansi yang bersih dan proporsional untuk dicetak atau disimpan sebagai PDF.

---

## 3. Siklus Hidup Akses & Kedaulatan Data (Access States)

Sistem memetakan entitas `WorkspaceEntitlement` ke dalam enam status tampilan menggunakan `calculateAccessStateDetails()`:

| State Key | Kondisi Bisnis | Edit & Simpan | Undang Keluarga | Ekspor CSV/JSON | Penjelasan Kedaulatan Data |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `active_lifetime` | Lisensi penuh berbayar aktif tanpa batas waktu (`validUntil === null`). | ✅ Aktif | ✅ Hingga 15 Anggota | ✅ Selamanya | Penyimpanan privat terenkripsi seumur hidup. |
| `expiring_soon` | Sisa masa aktif 15 s.d. 30 hari lagi. | ✅ Aktif | ✅ Aktif | ✅ Selamanya | Peringatan informatif; data tetap aman saat bertransisi ke arsip. |
| `critical_expiring` | Sisa masa aktif 14 hari atau kurang. | ✅ Aktif | ✅ Aktif | ✅ Selamanya | Alert oranye; pengingat bahwa workspace akan beralih ke arsip baca-saja. |
| `expired_archive` | Masa aktif penyusunan pawiwahan telah usai. | 🔒 Terkunci | 🔒 Terkunci | ✅ Selamanya | **Mode Arsip Permanen:** Seluruh catatan tersimpan utuh dan tidak pernah dihapus. Pengguna dapat membaca dan mengekspor kapan saja. |
| `revoked` | Akses dicabut akibat permohonan refund atau pembatalan transaksi. | 🔒 Terkunci | 🔒 Terkunci | ✅ Selamanya | Akses fitur edit dinonaktifkan, tombol bantuan WhatsApp disediakan untuk resolusi. |
| `free_preview` | Belum diaktivasi atau workspace demo interaktif. | ✅ Draf / Terbatas | 🔒 Terkunci | ✅ Selamanya | Pengguna dapat mencoba navigasi ritual dan mengekspor CSV contoh. |

> **Prinsip Fundamental Patemon:** `canExportCSV` **selalu bernilai `true`** di semua status akses untuk menjamin pengguna tidak pernah kehilangan kendali atas data pernikahan dan keluarga mereka.

---

## 4. Jalur Layanan Pelanggan WhatsApp (`CustomerSupportModal`)

### 4.1 Pembersihan Nomor Telepon (`sanitizeWhatsAppPhone`)
- Mendukung format lokal (`0812...`), dengan tanda baca (`0812-3456-7890`), maupun format internasional (`+62 812...`).
- Menghasilkan format angka murni `62812...` yang kompatibel dengan protokol tautan `wa.me`.
- Menggunakan fallback variabel lingkungan `NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER` atau nomor default `6289670356218`.

### 4.2 Format Pesan Otomatis
Pesan WhatsApp dirangkum secara terstruktur dengan salam pembuka khas Bali yang santun:
```text
Om Swastyastu Tim Bantuan Patemon Bali,

Saya membutuhkan bantuan perihal: *[Kategori Bantuan]*

📋 *Detail Workspace & Akun:*
• ID Pawiwahan: [weddingId]
• Mempelai: [coupleNames]
• No. Pesanan / Order ID: [orderNumber]

💬 *Pesan / Kendala yang dialami:*
[userMessage]

Mohon bantuannya untuk menindaklanjuti hal ini. Sukseme / Terima kasih.
```

---

## 5. Titik Integrasi Antarmuka (UI Integration)

1. **Halaman Pengaturan Workspace (`/workspace/[weddingId]/settings`):**
   - Kartu `LicenseStatusCard` menampilkan status real-time, sisa hari aktif, kapabilitas workspace, banner pengingat, dan riwayat pesanan Midtrans.
   - Kolom aksi tabel riwayat pesanan:
     - Pesanan `settlement`: Tombol "Kuitansi" membuka `DigitalReceiptModal`.
     - Pesanan lain (pending/expire/cancel): Tombol "Bantuan" membuka `CustomerSupportModal` dengan nomor pesanan terisi otomatis.
2. **Halaman Biaya & Lisensi Publik (`/pricing`):**
   - Callout layanan pelanggan di bawah tabel FAQ untuk tanya-jawab seputar variasi upacara adat, pembayaran, atau kedaulatan data.
3. **Footer Global (`Footer`):**
   - Tautan langsung "Bantuan WhatsApp" bersanding dengan dokumentasi PRD dan repository.

---

## 6. Verifikasi & Pengujian Otomatis

Seluruh pengujian unit dan integrasi terpusat pada file `tests/payment-history-support.test.ts` (15 pengujian terverifikasi):
```bash
# Menjalankan pengujian spesifik riwayat pembayaran & support
pnpm test tests/payment-history-support.test.ts

# Menjalankan seluruh rangkaian tes (20 test files, 223 tests passing)
pnpm test

# Verifikasi kepatuhan TypeScript & Linter
pnpm typecheck
pnpm lint
pnpm format:check

# Verifikasi build produksi Next.js & Turbopack
pnpm build
```
