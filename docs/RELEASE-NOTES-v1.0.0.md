# Catatan Rilis Patemon v1.0.0 (MVP v1 Official Release Notes)

**Tanggal Rilis:** 14 November 2026  
**Status Rilis:** Produksi (General Availability - GA)  
**Target Rilis:** MVP v1 — Bali Hindu Wedding Planner  
**Repositori Resmi:** `https://github.com/andresanjaya/patemon`  
**Lisensi Per-Wedding:** Rp 199.000 (Satu kali bayar per ruang kerja pernikahan)

---

## 1. Visi Produk & Ringkasan Rilis (Executive Summary)

**Patemon** adalah platform perencanaan pernikahan Hindu Bali (*Pawiwahan*) pertama yang menggabungkan presisi manajemen modern dengan penghormatan mendalam terhadap tradisi luhur Bali. Dibangun berlandaskan prinsip **Desa, Kala, Patra** (tempat, waktu, situasi) dan **Desa Mawacara** (menghormati dresta adat setempat), Patemon hadir membantu calon mempelai, keluarga besar (*dadia*), krama banjar, dan serati banten mengorganisir seluruh persiapan pernikahan secara transparan, tenang, dan berkeadaban.

Rilis **v1.0.0** menandai selesainya 100% cakupan ruang lingkup **Product Requirement Document (PRD MVP v1)** di seluruh 6 fase pengembangan.

---

## 2. Fitur Utama yang Dihadirkan (Delivered Features)

### 2.1 Otentikasi & Profil Pengguna Berkeamanan Tinggi
- Masuk dan daftar dengan **Email & Kata Sandi** atau **Google One-Tap / OAuth 2.0**.
- Validasi nomor WhatsApp format Indonesia (`+62` / `08...`).
- Perlindungan privasi penuh sesuai UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP).

### 2.2 Ruang Kerja & Pemilihan Bentuk Perkawinan Adat
- Dukungan lengkap bentuk perkawinan adat: **Memadik / Mepadik** (Purusa-led), **Nyentana / Sentana Rajeg** (Pradana-led), dan **Ngerorod / Mangkir**.
- Pemilihan wilayah dresta kabupaten di Bali (Gianyar, Badung, Denpasar, Tabanan, Buleleng, Karangasem, Klungkung, Bangli, Jembrana).
- Penetapan target anggaran pernikahan dalam angka bulat integer IDR.

### 2.3 Onboarding Prosesi Adat & Rekomendasi Non-Dogmatis
- Katalog 10+ prosesi upacara adat Bali (Medelokan, Ngekeb, Mabyakala / Madengen-dengen, Mewidhi Widana, Mepejati, Mejajar Pagar).
- Bebas menambah prosesi adat kustom keluarga, mengedit nama lokal, atau mengubah urutan waktu tanpa doktrin kaku.

### 2.4 Katalog Banten & Pelacak Pengadaan (Banten Planner)
- Katalog bawaan 30+ sarana banten dan upakara dengan sitasi naskah/literatur adat terpercaya.
- Klasifikasi metode pengadaan: **Ngayah Keluarga**, **Pesan ke Serati**, dan **Beli di Pasar**.
- Aturan anti *double-counting* finansial antara banten paket borongan dan banten satuan.

### 2.5 Daftar Tugas & Pembagian Peran Keluarga (Checklist)
- Penugasan penanggung jawab (PIC) ke keluarga purusa, keluarga pradana, prajuru banjar, dan seksi pemuda STT.
- Pengelompokan tugas berdasarkan tenggat waktu: H-90, H-30, H-7, hingga Hari-H.

### 2.6 Buku Anggaran Presisi Integer IDR
- Perhitungan keuangan murni dalam bilangan bulat Rupiah tanpa floating-point drift.
- Pembagian beban transparan antara pihak Purusa (Pria) dan Pradana (Wanita).
- Pencatatan uang muka (DP), tanggal jatuh tempo, dan sisa pelunasan.

### 2.7 Rekanan & Vendor Pawiwahan (Vendor CRM)
- Manajemen direktori vendor (Payas Agung & MUA, Dekorasi, Gong/Sound, Katering Megibung, Foto/Video).
- Generator pesan WhatsApp santun dengan format salam adat (*"Om Swastyastu..."*).

### 2.8 Buku Tamu & Rekonsiliasi Headcount
- Pengelompokan tamu berdasarkan banjar, dadia, rekan kerja, dan keluarga besar.
- Rekonsiliasi total *pax* pihak pria vs pihak wanita secara *real-time*.

### 2.9 Susunan Acara Hari-H (Day-of Rundown)
- Manajemen jadwal waktu berbasis jam WITA, lokasi ritual (merajan, bale dangin, natahmah), dan PIC seksi acara.
- Ringkasan durasi menit otomatis untuk kelancaran pemangku dan panitia.

### 2.10 Dasbor Kesiapan Holistik & Countdown H-Min
- Indikator hitung mundur hari baik (*Dewasa Ayu*).
- Kalkulator Skor Kesiapan 6 Dimensi (Banten, Upacara, Tugas, Anggaran, Vendor, Rundown) dengan status visual intuitif.

### 2.11 Kolaborasi Multi-Pengguna & Kuota 15 Anggota
- Undangan kolaborasi via email dengan hirarki peran ketat: **Owner** (Pemilik), **Editor** (Panitia Pelaksana), dan **Viewer** (Keluarga Pemerhati).
- Batas kuota 15 anggota untuk mencegah spam dan kebisingan komunikasi.

### 2.12 Monetisasi Midtrans Snap, Kuitansi Digital & Kedaulatan Data
- Checkout terintegrasi Midtrans Snap (QRIS, VA Bank, Kartu Kredit).
- Kuitansi Digital resmi berstempel lunas dengan format nomor unik `KW-...` yang siap cetak fisik atau PDF.
- Garansi 14 hari pengembalian dana (*14-day refund guarantee*).
- Kedaulatan data utuh: Ekspor data lengkap CSV (ber-BOM UTF-8 dan anti-formula injection) dan JSON cadangan offline.
- Transisi otomatis ke **Mode Arsip Permanen (Baca-Saja)** tanpa biaya langganan bulanan setelah upacara selesai.

---

## 3. Metrik Kualitas & Jaminan Teknis (Quality Gates)

| Parameter Kualitas | Hasil Verifikasi | Keterangan |
| :--- | :---: | :--- |
| **Total Test Suite** | **26 file / 285 tests** | 100% Lulus (Pass) dengan Vitest Runner (~2 detik) |
| **TypeScript Strict** | **0 Errors** | `tsc --noEmit` lolos tanpa kompromi |
| **ESLint Rules** | **0 Warnings / 0 Errors** | Aturan ketat `@typescript-eslint/no-explicit-any` terpenuhi |
| **Prettier Formatting** | **100% Compliant** | Terverifikasi otomatis pada seluruh berkas |
| **Next.js Turbopack** | **29 Rute Prerendered** | Kompilasi bersih termasuk rute `/api/health`, `/faq`, `/privacy`, `/terms` |
| **Aksesibilitas (a11y)** | **WCAG 2.1 AA Compliant** | 15 modal dialog dilengkapi `role="dialog"`, `aria-modal="true"`, dan `aria-label="Tutup"` |
| **Isolasi Database (RLS)**| **20 / 20 Tabel Publik** | Kebijakan Row Level Security aktif penuh dengan fungsi security definer |
| **Pencegahan Kebocoran** | **100% Isolated** | Kunci rahasia server tidak pernah terpapar ke bundel klien |

---

## 4. Tautan Berkas Panduan & Operasional

- **Panduan Operasional Produksi:** [docs/PRODUCTION-OPERATIONAL-RUNBOOK.md](file:///c:/Andre/My%20Code/patemon/docs/PRODUCTION-OPERATIONAL-RUNBOOK.md)
- **Pusat Bantuan & FAQ Layanan Pelanggan:** [docs/SUPPORT-FAQ-AND-HELP-CENTER.md](file:///c:/Andre/My%20Code/patemon/docs/SUPPORT-FAQ-AND-HELP-CENTER.md)
- **Laporan Audit Keamanan & Aksesibilitas:** [docs/SECURITY-ACCESSIBILITY-AND-PERFORMANCE-AUDIT.md](file:///c:/Andre/My%20Code/patemon/docs/SECURITY-ACCESSIBILITY-AND-PERFORMANCE-AUDIT.md)
- **Laporan UAT & Evaluasi Pakar Adat:** [docs/UAT-AND-RITUAL-REVIEW-REPORT.md](file:///c:/Andre/My%20Code/patemon/docs/UAT-AND-RITUAL-REVIEW-REPORT.md)
- **Laporan Pengujian Otomatis & QA:** [docs/TESTING-AND-QA-REPORT.md](file:///c:/Andre/My%20Code/patemon/docs/TESTING-AND-QA-REPORT.md)
