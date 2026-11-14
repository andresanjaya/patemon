# Panduan Model Bisnis, Harga & Pembatasan Fitur (Pricing, Free Preview & Entitlements)

Dokumen ini menjelaskan implementasi teknis dan filosofis model bisnis Patemon: Bali Hindu Wedding Planner, sesuai PRD Section 5.4, 7.1, dan 10.

---

## 1. Filosofi Monetisasi & Nilai Adat (PRD 5.4)

Perencanaan pernikahan Hindu Bali (*pawiwahan*) adalah peristiwa sakral sekali seumur hidup yang melibatkan adat, banjar, serati banten, dan keluarga besar. 

### Prinsip Utama:
1. **Satu Kali Bayar (One-Time Fee):**
   - **Harga Peluncuran MVP:** **Rp 199.000** (Harga Normal: Rp 249.000).
   - **Masa Aktif:** Berlaku penuh untuk 1 workspace pernikahan hingga rangkaian upacara selesai (365 hari sejak aktivasi).
   - **Tanpa Biaya Berulang:** Tidak ada tagihan bulanan atau perpanjangan tersembunyi.
2. **Kedaulatan Data & Arsip Abadi (Permanent Read-Only Archive):**
   - Setelah acara pernikahan selesai atau masa lisensi berakhir, pasangan pengantin dan keluarga **TIDAK PERNAH** kehilangan akses.
   - Workspace beralih secara anggun (*graceful fallback*) ke mode **Arsip Baca Permanen (Read-Only)**.
   - Fitur ekspor data kontingensi (**CSV & JSON Takeout**) tetap dapat diunduh kapan saja tanpa batas waktu.
3. **Gratis Coba & Penjelajahan (Free Preview / Demo Sandbox):**
   - Pengguna baru dapat membuat akun dan menjelajahi fitur utama melalui Demo Sandbox (`/workspace/demo`) atau workspace baru sebelum memutuskan membayar.

---

## 2. Matriks Fitur: Free Preview vs. Akses Penuh

| Modul / Kemampuan | Free Preview / Belum Bayar | Akses Penuh Pawiwahan (Rp 199.000) |
| :--- | :---: | :---: |
| **Harga** | Rp 0 | Rp 199.000 (Bayar 1x) |
| **Workspace Privat** | 1 Workspace Percobaan | 1 Workspace Privat Penuh |
| **Rangkaian Upacara** | Eksplorasi & Lihat Template | Kustomisasi Tanpa Batas (*Memadik, Ngerorod, Nyentana*) |
| **Perencana Banten** | Baca Katalog Banten Standar | Pelacakan Pengadaan Lengkap (*Ngayah, Serati, Beli*) |
| **Buku Anggaran Adat** | Pratinjau Alokasi | Kelola Pengeluaran (*Purusa, Pradana, Bersama*) |
| **Checklist Persiapan** | Template Standar | Tambah, Edit & Tugaskan PIC Keluarga |
| **Manajemen Vendor** | Pratinjau Daftar | Kelola Kontak, Kesepakatan & Link WA |
| **Rundown Hari-H** | Pratinjau Timeline | Susun Jadwal Menit demi Menit (WITA) |
| **Manajemen Tamu Undangan** | Eksplorasi Tamu Demo | Kelola Banjar/Dadia & Status Kehadiran |
| **Undang Anggota / Keluarga** | ❌ Terkunci (Perlu Lisensi) | ✅ Hingga 15 Anggota (*Owner, Editor, Viewer*) |
| **Ekspor CSV Kontingensi** | ✅ Tersedia untuk Keamanan | ✅ Tersedia Lengkap Semua Modul |
| **Masa Berlaku** | Penjelajahan | 365 Hari + Arsip Baca Selamanya |

---

## 3. Arsitektur Teknis Entitlement Engine

Implementasi terletak di [`src/features/payments/entitlements.ts`](file:///c:/Andre/My%20Code/patemon/src/features/payments/entitlements.ts).

### Alur Pengecekan Hak Akses (`getWorkspaceEntitlement`):
1. **Pemeriksaan Demo Sandbox:** Jika `weddingId === "demo"`, entitlement secara otomatis diatur ke `free_preview` dengan batasan edit & undang anggota dimatikan.
2. **Kueri Tabel `access_grants`:** Memeriksa apakah ada lisensi dengan status `active` yang terhubung ke `wedding_id`.
3. **Pemeriksaan Kedaluwarsa:**
   - Jika `expires_at` berada di masa lalu, status beralih menjadi `expired`.
   - `canEdit` dan `canInviteMembers` menjadi `false`.
   - `canExportCSV` dan hak membaca data tetap `true`.
4. **Pencegahan Bypass Server-Side (`checkFeatureAccess`):**
   - Server Actions memvalidasi hak akses sebelum mutasi data dilakukan:
   ```ts
   const access = await checkFeatureAccess(weddingId, "invite");
   if (!access.allowed) {
     return { success: false, error: access.reason };
   }
   ```

---

## 4. Komponen Antarmuka Pengguna (UI)

1. **`PricingSection` (`src/features/payments/components/pricing-section.tsx`):**
   - Ditampilkan di halaman depan (`/`) dan halaman khusus `/pricing`.
   - Menampilkan komparasi paket, promo peluncuran, dan filosofi adat Bali.
2. **`WorkspaceEntitlementBanner` (`src/features/payments/components/entitlement-banner.tsx`):**
   - Banner kontekstual di bagian atas workspace.
   - Mengingatkan pengguna jika workspace masih dalam mode Free Preview, masa aktif mendekati akhir (14 hari), atau telah masuk mode Arsip Baca.
3. **`UpgradePromptModal` (`src/features/payments/components/upgrade-prompt-modal.tsx`):**
   - Modal responsif yang muncul saat pengguna mencoba mengakses fitur berbayar (misal: mengundang anggota keluarga).
4. **`LicenseStatusCard` (`src/features/payments/components/license-status-card.tsx`):**
   - Terintegrasi di halaman pengaturan workspace (`/workspace/[weddingId]/settings`).
   - Menampilkan status lisensi aktif, tanggal berlaku, dan kapabilitas sistem.

