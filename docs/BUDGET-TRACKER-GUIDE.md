# Panduan Modul Perencana Anggaran & Catatan Transaksi (Issue #28)

Modul **Budget Tracker and Transaction Records** di Patemon dirancang khusus untuk memfasilitasi pasangan dan keluarga besar dalam menyusun estimasi alokasi, mengikat komitmen kontrak vendor/serati, dan mencatat riwayat transaksi pembayaran/termin (DP) secara transparan tanpa pembulatan desimal.

---

## 1. Prinsip Keuangan & Integritas Data

1. **Aritmatika Integer IDR Mutlak (*No Floating-Point Math*):**
   - Seluruh nominal uang disimpan dan dihitung dalam integer Rupiah murni (`BIGINT` pada Postgres, `number` bulat pada TypeScript).
   - Menghindari sepenuhnya pembulatan desimal mengambang (*floating point rounding errors*) khas mata uang fiat.

2. **Rekonsiliasi Tanpa Penghitungan Ganda (*No Double Counting*):**
   - Item banten paket dan bahan olahan mebat dipisahkan secara tegas agar tidak terjadi perhitungan ganda (*double-counting*).
   - Pos pengeluaran yang berstatus `canceled` (dibatalkan) secara otomatis dikecualikan dari penjumlahan total rencana (*planned*), komitmen realisasi (*actual*), dan sisa tagihan (*outstanding*).

3. **Multi-Tahap Termin Pembayaran (*Multi-Stage Deposits*):**
   - Mendukung pencatatan pembayaran bertahap (misal: Uang Muka / DP 30%, Termin 2, dan Pelunasan Akhir).
   - Status kesepakatan pos pengeluaran secara otomatis bertransisi:
     - `booked` (Dipesan / Deal) ──► `paid_partial` (DP / Cicilan) ──► `paid_full` (Lunas).

---

## 2. Kategori Anggaran (*Budget Categories*)

| Kategori | Label UI | Ruang Lingkup Alokasi |
| :--- | :--- | :--- |
| `upakara` | **Upakara & Banten** | Paket banten pokok pawiwahan, sesari & punia sulinggih/pemangku, tirta pakuluh. |
| `tempat_dekorasi` | **Tempat, Tratag & Dekorasi** | Pemasangan tetaring anyaman kelapa banjar, sewa tratag/kursi, penjor janur, pelaminan. |
| `busana_rias` | **Busana Adat & Tata Rias** | Sewa busana Payas Agung/Madya, tata rias sanggar adat (MUA), seragam keluarga inti. |
| `konsumsi` | **Konsumsi & Mebat Adat** | Bahan mentah babi guling, daging mebat lawar sekaa banjar, jamuan prasmanan undangan. |
| `dokumentasi` | **Foto, Video & Drone** | Jasa foto liputan prosesi adat, video sinematik mesakapan, album cetak. |
| `musik_hiburan` | **Gamelan & Gong Adat** | Dana punia sekaa gong banjar, penabuh gender wayang, kidung pesantian. |
| `administrasi` | **Administrasi & Legalitas** | Surat pengantar perkawinan banjar adat, pendaftaran Dinas Dukcapil & akta nikah. |
| `lainnya` | **Operasional & Tak Terduga** | Dana cadangan darurat, logistik transportasi keluarga, konsumsi harian persiapan. |

---

## 3. Rumus Rekonsiliasi Keuangan

| Metrik | Formula Perhitungan | Keterangan |
| :--- | :--- | :--- |
| **Target Anggaran** | `workspace.target_budget` | Batas plafon maksimal alokasi pawiwahan. |
| **Total Rencana (*Planned*)** | `∑ (quantity × unit_price)` | Estimasi awal sebelum kontrak vendor difinalisasi. |
| **Realisasi (*Actual*)** | `∑ (actual_amount > 0 ? actual_amount : planned_amount)` | Komitmen kontrak riil yang telah disepakati. |
| **Total Terbayar (*Paid*)** | `∑ (budget_payments.amount)` | Akumulasi seluruh bukti pembayaran yang telah dicatat. |
| **Sisa Tagihan (*Outstanding*)** | `max(0, Total Realisasi - Total Terbayar)` | Kewajiban yang belum diselesaikan kepada vendor/serati. |
| **Sisa Saldo Anggaran** | `Target Anggaran - Total Realisasi` | Surplus anggaran aman (hijau) atau defisit melebihi target (merah). |

---

## 4. Fitur Antarmuka Pengguna (*UI Dashboard*)

- **Kartu Ringkasan Finansial 5-Metrik:** Menampilkan target, rencana, realisasi, total terbayar, sisa tagihan, dan sisa saldo anggaran.
- **Filter & Pencarian Lintas Pos:** Pencarian teks instan (nama pengeluaran, vendor, catatan), filter kategori, filter status pembayaran, dan filter penanggung jawab alokasi (*Keluarga Purusa*, *Keluarga Pradana*, *Bersama*).
- **Pengelompokan Fleksibel:** Pengelompokan tampilan berdasarkan Kategori, Status Pembayaran, Penanggung Jawab, atau Daftar Lurus.
- **Pencatatan Transaksi Cepat (+ Bayar):** Modal pencatatan pembayaran instan dengan opsi prefill pelunasan sisa tagihan, pilihan metode pembayaran (*Transfer*, *Tunai*, *QRIS*, *Kartu*), dan nama penerima.
- **Riwayat Transaksi Interaktif:** Accordion per pos pengeluaran yang dapat dibuka-tutup untuk memeriksa setiap pembayaran dan menghapusnya jika terjadi kesalahan input.
- **Rekomendasi Anggaran Adat Bali:** Memuat 12 template pengeluaran kanonik pawiwahan Bali dengan satu klik.

---

## 5. Keamanan & Kebijakan Hak Akses (*Row-Level Security*)

- **Isolasi Antar-Wedding:** Seluruh data `public.budget_items` dan `public.budget_payments` terikat pada kolom `wedding_id`.
- **Peran Pengguna (*Role Permissions*):**
  - `owner` & `editor`: Berhak membuat pos anggaran, menyunting nilai, mencatat transaksi pembayaran, dan menghapus data.
  - `viewer`: Mode pratinjau hanya-baca (*read-only*), kontrol input dinonaktifkan.

