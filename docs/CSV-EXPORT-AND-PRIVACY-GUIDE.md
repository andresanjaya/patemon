# Panduan Teknis: Ekspor CSV Kontingensi & Pelindungan Privasi Akun (UU PDP)

Dokumen ini menjelaskan implementasi fitur **Ekspor CSV Kontingensi Lapangan** dan **Kontrol Privasi Akun (UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi)** pada Patemon Bali Hindu Wedding Planner MVP v1 (Issue #34).

---

## 1. Arsitektur Kontingensi Lapangan (Offline Field Contingency)

### 1.1 Urgensi Budaya & Operasional di Bali
Pada hari pelaksanaan upacara pernikahan adat Hindu Bali (*pawiwahan*), aktivitas terkonsentrasi di area *natah umah*, *bale banjar*, *puri*, atau *pura pedalaman*. Di lokasi-lokasi tersebut, sinyal telekomunikasi seluler seringkali mengalami interferensi atau terputus sama sekali.

Keluarga besar, panitia krama banjar, dan *serati banten* membutuhkan lembar pegangan fisik (*print-out*) atau dokumen *spreadsheet* (Excel) yang dapat diakses secara *offline* tanpa bergantung pada koneksi internet aktif.

### 1.2 Format Ekspor Modular
Setiap modul perencanaan menyediakan tombol **Ekspor CSV** langsung di header dasbor dan terintegrasi di **Pusat Ekspor & Kontingensi Offline** pada menu Pengaturan Workspace (`/workspace/[weddingId]/settings`):

1. **Banten & Sarana Upakara (`banten-[slug].csv`)**:
   - Kolom: Nama Sarana Banten, Upacara/Rangkaian, Kategori, Jumlah, Satuan, Metode Pengadaan (*Ngayah Keluarga*, *Beli Paket Serati*, *Ditugaskan ke Kerabat*), Status Pengadaan (*Siap di Lokasi*, *Sedang Dibuat*, *Dipesan Serati*, *Dibutuhkan*), Penanggung Jawab (PIC), Estimasi Biaya (IDR), Biaya Riil (IDR), Catatan Khusus.
2. **Jadwal Rundown Hari-H Panitia (`rundown-hari-h-[slug].csv`)**:
   - Kolom: Urutan, Rangkaian Upacara, Waktu Mulai (WITA), Waktu Selesai (WITA), Durasi (Menit), Nama Kegiatan/Segmen, Lokasi Acara, Koordinator/PIC, Deskripsi Acara, Catatan Khusus.
3. **Checklist Tugas & PIC Keluarga (`tugas-[slug].csv`)**:
   - Kolom: Nama Tugas, Upacara Terkait, Kategori, Prioritas (*Mendesak P0*, *Tinggi P1*, *Sedang P2*, *Rendah P3*), Status Pengerjaan (*Belum Dimulai*, *Dalam Pengerjaan*, *Selesai*, *Dibatalkan*), Penanggung Jawab (PIC), Tenggat Waktu, Deskripsi & Instruksi.
4. **Buku Pos Anggaran (`anggaran-[slug].csv`)**:
   - Kolom: Kategori Anggaran, Nama Pos Pengeluaran, Anggaran Rencana (IDR), Biaya Aktual (IDR), Sudah Dibayar (IDR), Sisa Pembayaran (IDR), Status Pos, Tanggung Jawab Pembayaran (*Purusa/Pradana/Bersama*), Catatan.
5. **Riwayat Transaksi Pembayaran (`transaksi-pembayaran-[slug].csv`)**:
   - Kolom: Tanggal Pembayaran, Pos Pengeluaran, Kategori, Jumlah Pembayaran (IDR), Metode Pembayaran, Pihak Pembayar, Penerima Pembayaran, Catatan & Bukti.
6. **Daftar Vendor & Kontak Kontrak (`vendor-[slug].csv`)**:
   - Kolom: Nama Vendor, Kategori Layanan, Nama Kontak (PIC), Nomor Telepon, Tautan/Media Sosial, Status Pemesanan, Nilai Kesepakatan (IDR), Uang Muka/Terbayar (IDR), Sisa Pembayaran (IDR), Catatan & Kesepakatan.
7. **Daftar Tamu Undangan (`daftar-tamu-[slug].csv`)**:
   - Kolom: Nama Undangan, Pihak (*Purusa/Pradana/Bersama*), Kelompok/Dadia/Banjar, Jumlah Pax (*Headcount*), Status Undangan (*Hadir/Belum Menjawab/Tidak Bisa Hadir*), Nomor Telepon, Catatan Khusus.
8. **Cadangan Lengkap Workspace (`patemon-arsip-lengkap-[slug].json`)**:
   - Berkas JSON master berisi struktur seluruh entitas pawiwahan (upacara, banten, tugas, anggaran, vendor, rundown, dan tamu) dengan stempel waktu dan tanda versi sistem.

---

## 2. Keamanan & Sanitasi CSV (RFC-4180 & Formula Injection Prevention)

Modul `src/lib/csv-export.ts` mengimplementasikan standar keamanan spreadsheet:
- **Excel-Compatible UTF-8 BOM (`\uFEFF`)**: Ditambahkan di awal berkas teks agar aksara lokal dan nama khas Bali dengan tanda khusus tidak mengalami *character distortion* (mojibake) saat dibuka langsung di Microsoft Excel Windows/Mac.
- **RFC-4180 Compliant Escaping**: Setiap sel dibungkus dengan tanda kutip ganda `"` dan karakter kutip internal di-*escape* menjadi `""`. Karakter baris baru (`\n`, `\r`) dan koma ditangani dengan aman.
- **Formula Injection / CSV Injection Mitigation**: Sesuai rekomendasi OWASP, karakter pembuka potensial eksekusi formula spreadsheet (`=`, `+`, `-`, `@`, `\t`, `\r`) diproteksi dengan awalan kutip tunggal (`'`) agar dievaluasi sebagai teks literal biasa oleh aplikasi spreadsheet (angka minus biasa tetap diperbolehkan).

---

## 3. Pelindungan Data Pribadi & Privasi Akun (UU PDP No. 27/2022)

Patemon dirancang selaras dengan Undang-Undang Republik Indonesia No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP). Kontrol privasi tersedia pada halaman Profil Pengguna (`/profile`):

### 3.1 Hak Akses & Portabilitas Data Pribadi (Pasal 25 & 26 UU PDP)
- Pengguna berhak mengakses dan memperoleh salinan data pribadi yang terekam di sistem Patemon.
- Tombol **"Unduh Salinan Data Pribadi (Takeout - JSON)"** memicu Server Action `getUserDataTakeoutAction()`.
- Berkas JSON terstruktur mencakup:
  - Data profil pengguna (nama lengkap, alamat email terverifikasi, nomor kontak WhatsApp).
  - Riwayat seluruh keanggotaan workspace pawiwahan (peran: *owner*, *editor*, *viewer*, dan status).
  - Undangan masuk aktif.
  - Stempel waktu ekspor dan pernyataan kepatuhan UU PDP.

### 3.2 Hak Penghapusan Akun & Data Pribadi / Right to Erasure (Pasal 28 UU PDP)
- Pengguna berhak menghapus akun dan menghentikan pemrosesan data pribadi mereka.
- Ditempatkan di **"Zona Bahaya: Hapus Akun & Data"** pada `/profile`.

#### Guardrail Proteksi Kepemilikan Workspace (Sole-Owner Protection):
- Sebelum penghapusan diizinkan, Server Action `checkAccountDeletionEligibilityAction()` memindai seluruh workspace di mana pengguna berstatus sebagai `owner` aktif.
- **Jika pengguna adalah satu-satunya Pemilik aktif:** Penghapusan akun **DIBLOKIR**. Modal menampilkan peringatan:
  > *"Pendelegasian Pemilik (Owner) Diperlukan: Anda merupakan satu-satunya Pemilik aktif pada workspace [Daftar Workspace]. Untuk melindungi koordinasi keluarga, Anda wajib mengalihkan peran Pemilik ke anggota lain atau menghapus workspace terlebih dahulu."*
  - Tautan langsung ke `/workspace/[weddingId]/settings` disediakan untuk memfasilitasi delegasi peran.
- **Jika pengguna memenuhi syarat (eligible):**
  - Pengguna diwajibkan mengetikkan frasa konfirmasi huruf kapital `"HAPUS AKUN"` secara eksplisit.
  - `deleteUserAccountAction("HAPUS AKUN")` memverifikasi sesi, memeriksa ulang guardrail kepemilikan di sisi server, menghapus profil pengguna (dan auth user melalui Supabase Admin Client jika tersedia), mencabut sesi aktif via `signOut()`, dan mengarahkan kembali ke beranda dengan notifikasi konfirmasi.

---

## 4. Pengujian Otomatis

Seluruh logika sanitasi CSV, pemformat domain, aksi ekspor workspace, hak takeout, guardrail kepemilikan tunggal, dan alur konfirmasi penghapusan diuji pada berkas:
- `tests/csv-export-privacy.test.ts` (13 pengujian unit & integrasi).
- Total pengujian proyek: **174 pengujian di 16 berkas lulus 100%**.
