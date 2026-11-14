# Laporan Audit Keamanan, Privasi, Aksesibilitas, dan Performa (Security, Privacy, Accessibility & Performance Review)

Dokumen ini menyajikan hasil evaluasi mendalam, pengujian otomatis, dan audit kepatuhan menyeluruh untuk **Issue #40 (Phase 06 Quality, Security & Release)** pada aplikasi Patemon — Bali Hindu Wedding Planner.

---

## 1. Ringkasan Eksekutif (Executive Summary)

Audit rilis MVP v1 difokuskan pada 4 pilar utama integritas platform:
1. **Keamanan Multi-Tenant (Database & RLS):** 100% tabel publik (`20/20` tabel) dilindungi kebijakan ketat Row Level Security (RLS) dan fungsi hirarki peran (`owner`, `editor`, `viewer`).
2. **Isolasi Rahasia & Kredensial:** Verifikasi menyeluruh memastikan kunci sensitif server (`SUPABASE_SERVICE_ROLE_KEY` dan `MIDTRANS_SERVER_KEY`) tidak pernah bocor ke bundel browser atau dipaparkan melalui variabel `NEXT_PUBLIC_*`.
3. **Privasi & Sanitasi Log PII (UU PDP No. 27/2022):** Mesin sanitasi payload otomatis menyamarkan kata sandi, token otentikasi, nomor kartu kredit/CVV, dan nomor telepon sebelum dicatat ke log observabilitas. Pertahanan terhadap OWASP CSV Formula Injection aktif pada seluruh alur ekspor data.
4. **Aksesibilitas (WCAG 2.1 AA Compliance):** Seluruh 15 komponen modal dialog di seluruh modul aplikasi telah diperbarui dengan atribut standar WAI-ARIA (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, dan tombol dismiss dengan `aria-label="Tutup"`).
5. **Kinerja & Kompilasi:** Lulus verifikasi Turbopack Next.js (25 rute ter-prerender bersih), zero TypeScript errors, zero ESLint warnings, dan 259 unit & integration tests passing (23 test files).

---

## 2. Matriks Keamanan Row Level Security (RLS) & Multi-Tenant

Setiap tabel di dalam skema database publik (`supabase/migrations/20261114000002_auth_and_rls.sql`) mengaktifkan `ENABLE ROW LEVEL SECURITY`. Akses data diatur melalui fungsi helper `public.has_wedding_role(p_wedding_id, p_required_role)` yang dievaluasi langsung oleh mesin Postgres:

| Nama Tabel | RLS Status | Hak Akses Owner | Hak Akses Editor | Hak Akses Viewer | Isolasi Tenant |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `profiles` | ✅ Aktif | CRUD Akun Pribadi | CRUD Akun Pribadi | Read Publik | Per `auth.uid()` |
| `weddings` | ✅ Aktif | Full CRUD & Soft-Delete | Read Only | Read Only | Anggota Aktif Saja |
| `wedding_members` | ✅ Aktif | Kelola Anggota & Kuota | Read Daftar Anggota | Read Daftar Anggota | Per `wedding_id` |
| `sources` | ✅ Aktif | Read Referensi Adat | Read Referensi Adat | Read Referensi Adat | Template Publik / Milik Bersama |
| `ceremony_templates`| ✅ Aktif | Read Rekomendasi Adat | Read Rekomendasi Adat| Read Rekomendasi Adat| Template Publik |
| `ritual_catalog` | ✅ Aktif | Read Katalog Banten | Read Katalog Banten | Read Katalog Banten | Katalog Publik |
| `task_templates` | ✅ Aktif | Read Template Checklist | Read Template Checklist| Read Template Checklist| Template Publik |
| `budget_item_templates`|✅ Aktif | Read Template Budget | Read Template Budget | Read Template Budget | Template Publik |
| `wedding_ceremonies`| ✅ Aktif | Full CRUD Rangkaian | Full CRUD Rangkaian | Read Only | Per `wedding_id` |
| `wedding_ritual_items`|✅ Aktif | Full CRUD Banten | Full CRUD Banten | Read Only | Per `wedding_id` |
| `wedding_tasks` | ✅ Aktif | Full CRUD Checklist | Full CRUD Checklist | Read Only | Per `wedding_id` |
| `vendors` | ✅ Aktif | Full CRUD Vendor | Full CRUD Vendor | Read Only | Per `wedding_id` |
| `budget_items` | ✅ Aktif | Full CRUD Anggaran | Full CRUD Anggaran | Read Only | Per `wedding_id` |
| `budget_payments` | ✅ Aktif | Full CRUD Pembayaran | Full CRUD Pembayaran | Read Only | Per `wedding_id` |
| `guests` | ✅ Aktif | Full CRUD Buku Tamu | Full CRUD Buku Tamu | Read Only | Per `wedding_id` |
| `rundown_events` | ✅ Aktif | Full CRUD Rundown | Full CRUD Rundown | Read Only | Per `wedding_id` |
| `checkout_orders` | ✅ Aktif | Create & Read Order | Read Only | Read Only | Per `wedding_id` + Owner |
| `payment_events` | ✅ Aktif | Service-Role Insert | Read Audit Event | Read Audit Event | Webhook & Admin Only |
| `access_grants` | ✅ Aktif | Read Status Lisensi | Read Status Lisensi | Read Status Lisensi | Per `wedding_id` |
| `activity_logs` | ✅ Aktif | Read Riwayat Log | Read Riwayat Log | Read Riwayat Log | Per `wedding_id` |

### Perlindungan Security Definer:
Fungsi `public.get_wedding_role` dan `public.has_wedding_role` berjalan dalam konteks `SECURITY DEFINER SET search_path = public` untuk mencegah eksploitasi jalur pencarian skema (*search_path injection*).

---

## 3. Isolasi Rahasia & Keamanan Bundel Klien (Secret Isolation)

Pengujian otomatis pada `tests/security-accessibility-audit.test.ts` memindai seluruh direktori proyek untuk menjamin pemisahan kredensial:

1. **Pemindaian Komponen Klien (`"use client"`):**
   - Tidak ada satu pun berkas komponen klien yang mengimpor atau membaca `process.env.SUPABASE_SERVICE_ROLE_KEY` atau `process.env.MIDTRANS_SERVER_KEY`.
   - Modul Supabase Admin (`src/lib/supabase/admin.ts`) dilindungi oleh deklarasi `import "server-only"`, memastikan pencegahan kompilasi jika tidak sengaja diimpor ke sisi browser.
2. **Pembersihan Berkas Contoh `.env.example`:**
   - Variabel rahasia menggunakan nilai placeholder deterministik (`"your-service-role-or-secret-key"`, `"SB-Mid-server-your-server-key"`).
   - Tidak ada awalan `NEXT_PUBLIC_` yang disematkan pada kredensial backend server.

---

## 4. Perlindungan Privasi Data & Sanitasi Log (UU PDP No. 27/2022)

Sebagai wujud kepatuhan terhadap prinsip perlindungan data pribadi dan pencegahan kebocoran log operasional:

1. **Mesin Sanitasi Payload (`src/lib/observability/sanitize.ts`):**
   - Kunci terlarang otomatis di-redact: `password`, `token`, `secret`, `authorization`, `creditCard`, `cvv`, `phone`.
   - Pola string sensitif berbasis regex disaring dari teks error log:
     - Pola kunci rahasia Supabase: `/sb_secret_[a-zA-Z0-9_\-]+/g`
     - Kunci token GitHub / penyedia: `/gh[pous]_[a-zA-Z0-9_\-]+/g`
     - Header otorisasi: `/Bearer\s+[a-zA-Z0-9_\.\-]+/gi`
   - Pembersihan payload dilakukan secara rekursif hingga tingkat kedalaman objek dan array terdalam.
2. **Mitigasi OWASP CSV Formula Injection (`src/lib/csv-export.ts`):**
   - Karakter berbahaya pemicu eksekusi rumus spreadsheet (`=`, `+`, `-`, `@`, tab, newline) dinetralkan secara otomatis dengan menambahkan prefiks tanda petik tunggal (`'`).
   - Angka negatif moneter reguler (seperti `-500000` atau `-12.50`) dipertahankan tanpa gangguan.
   - Semua sel dibungkus tanda kutip ganda standar RFC-4180 dan didahului Byte Order Mark UTF-8 (`\uFEFF`) agar aksara dan nama adat Bali terbaca sempurna di Microsoft Excel.
3. **Kedaulatan Data & Penghapusan Akun (Data Sovereignty & Right to Erasure):**
   - Pengguna memiliki hak penuh mengunduh berkas portabilitas data lengkap (*data takeout*) berformat JSON terenkripsi.
   - Alur penghapusan akun diverifikasi ganda dengan frasa konfirmasi `"HAPUS AKUN"` dan pencegahan penghapusan bagi *sole owner* workspace yang masih aktif untuk menghindari data yatim (*orphaned data*).

---

## 5. Audit Aksesibilitas (WCAG 2.1 AA Dialog Compliance)

Untuk memastikan pengalaman yang inklusif bagi seluruh anggota keluarga dan pengguna pembaca layar (*screen reader*), 15 komponen modal kustom telah distandarisasi:

| Modul | Komponen Modal | Atribut Dialog | `aria-modal` | Label Penutup Accessible |
| :--- | :--- | :---: | :---: | :---: |
| **Banten** | `BantenItemModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |
| **Banten** | `CatalogPickerModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |
| **Budget** | `BudgetItemModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |
| **Budget** | `PaymentModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |
| **Checklist**| `TaskModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |
| **Checklist**| `TaskTemplatePickerModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |
| **Buku Tamu**| `GuestModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |
| **Keluarga** | `InviteMemberModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |
| **Payment** | `CustomerSupportModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |
| **Payment** | `DigitalReceiptModal` | `role="dialog"` | `true` | `aria-label="Tutup Kuitansi"` |
| **Payment** | `UpgradePromptModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |
| **Profil** | `DeleteAccountModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |
| **Rundown** | `RundownModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |
| **Vendor** | `VendorModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |
| **Vendor** | `VendorStarterModal` | `role="dialog"` | `true` | `aria-label="Tutup"` |

Fitur Aksesibilitas Tambahan:
- **Tautan Judul Dialog:** Menggunakan `aria-labelledby` yang mereferensikan elemen judul modal (`h3` atau `CardTitle`).
- **Target Sentuh Ramah Ponsel:** Seluruh tombol tutup memiliki area sentuh minimum 36x36px dengan feedback visual hover dan fokus keyboard.
- **Backdrop Blur & Dimming:** Menegaskan pemisahan visual antara latar belakang aplikasi dan modal aktif (`bg-black/60` dengan filter `backdrop-blur`).

---

## 6. Audit Kinerja & Responsivitas Antarmuka Mobile

1. **Arsitektur Next.js App Router & Server Components:**
   - Seluruh halaman utama (`/w/[weddingId]/*`) dirender secara efisien di server (*Server Components*), hanya merender interaktivitas formulir dan modal sebagai *Client Components*.
   - Ukuran bundel JavaScript awal diminimalisir dengan pemecahan kode otomatis (*dynamic code-splitting*).
2. **Kesesuaian Tampilan Layar Ponsel Lapangan (360px - 430px):**
   - Modal memiliki tinggi maksimum `max-h-[90vh]` atau `max-h-[92vh]` dengan scroll vertikal otomatis (`overflow-y-auto`) agar tidak terpotong pada layar ponsel beresolusi rendah saat papan ketik virtual aktif.
   - Tabel responsif menyediakan mode kartu vertikal (*card list layout*) pada viewport mobile untuk modul Banten, Checklist, dan Anggaran.
3. **Pencetakan Kuitansi Tanpa Beban Tambahan (*Zero-Dependency Print View*):**
   - Kuitansi pembayaran memanfaatkan utilitas CSS media `@media print` (`print:hidden`, `print:bg-transparent`, `print:p-0`) untuk langsung menghasilkan cetakan fisik atau PDF tanpa memerlukan library pihak ketiga yang memperlambat halaman.

---

## 7. Verifikasi & Pengujian Otomatis

Seluruh poin audit di atas telah dipayungi oleh test suite otomatis baru:
- Berkas Tes: `tests/security-accessibility-audit.test.ts` (11 skenario pengujian)
- Status Pengujian: **11 Passed (100%)**
- Ringkasan Test Suite Proyek: **23 file tes, 259 total passing tests, 0 errors, 0 warnings**.
