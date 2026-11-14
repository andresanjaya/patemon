# Panduan Manajemen Rekanan & Vendor Pernikahan Adat Bali (Issue #29)

Dokumen ini mendokumentasikan arsitektur, integrasi keuangan, kategori adat, dan alur operasional modul **Vendor Management** untuk **Patemon MVP v1**.

---

## 1. Latar Belakang & Tujuan

Pernikahan adat Hindu Bali (*Pawiwahan*) melibatkan koordinasi intensif dengan berbagai penyedia jasa (*vendor*) dan kelompok krama adat, mulai dari Serati Banten, Sanggar Busana Payas Agung/Modifikasi, kelompok mebat/katering prasmanan, sekaa gong/gambelan, hingga dekorasi angkul-angkul dan penjor.

Sebelumnya, penawaran harga, kontak, status pemesanan (booking), dan termin pembayaran seringkali tercecer di catatan pesan singkat atau chat WhatsApp keluarga tanpa rekapitulasi terpusat. Modul ini menghadirkan:

1. **Direktori Rekanan Terpusat:** Menyimpan data penyedia jasa, PIC keluarga penanggung jawab, kontak telepon/WhatsApp, dan portofolio.
2. **Kategori Adat Bali Spesifik:** 9 kategori yang merefleksikan kebutuhan riil pawiwahan Bali.
3. **Siklus Status Kerjasama (Pipeline):** Tracking bertahap mulai dari Prospek, Dihubungi, Penawaran Diterima, Dipesan (*Booked*), Selesai/Lunas, hingga Batal.
4. **Sinkronisasi Otomatis ke Anggaran (*Budget*):** Penawaran atau kontrak vendor dapat langsung ditautkan ke tabel `budget_items` untuk memonitor riwayat uang muka (DP) dan sisa tagihan jatuh tempo (*due payments*).
5. **Komunikasi Cepat WhatsApp:** Tombol click-to-chat dengan format salam adat Bali otomatis (`Om Swastyastu...`).

---

## 2. Kategori Vendor Adat Bali

| ID Kategori | Nama Tampilan | Deskripsi Adat & Lingkup Kerja |
|---|---|---|
| `banten_serati` | **Serati Banten & Tukang Banten** | Pengadaan sarana upakara, banten pawiwahan, suci, caru ayam brumbun, dan pabyakala |
| `busana_rias` | **Tata Rias & Busana Adat (MUA)** | Payas Agung, Payas Modifikasi, busana keluarga & pengiring adat |
| `fotografi_videografi` | **Fotografi & Videografi** | Dokumentasi prosesi sakral, cinematic video teaser & album kenangan |
| `dekorasi_tenda` | **Dekorasi, Tenda & Penjor** | Angkul-angkul janur, pelaminan adat, tenda terob tamu, & sepasang penjor |
| `katering_mebat` | **Katering, Mebat & Prasmanan** | Olahan mebat tradisional (lawar, sate lilit, juk ares) dan prasmanan tamu |
| `musik_sound_gong` | **Gong, Gambelan & Sound System** | Sekaa Gong Baleganjur, Gambelan Semar Pegulingan & sound system sulinggih |
| `venue_bale` | **Venue & Bale Pawiwahan** | Sewa wantilan banjar, gedung resepsi, atau penataan pekarangan bale dangin |
| `undangan_souvenir` | **Undangan & Cendera Mata** | Undangan cetak fisik motif Bali / aksara Bali, undangan digital & souvenir |
| `lainnya` | **Lainnya / Umum** | Pecalang pengatur lalu lintas, transportasi keluarga & kebutuhan tak terduga |

---

## 3. Siklus Status Kerjasama (Lifecycle Pipeline)

```
[prospect] (Rencana / Prospek)
    │
    ▼
[contacted] (Sudah Dihubungi untuk Cek Slot Tanggal)
    │
    ▼
[quoted] (Proposal & Penawaran Biaya Diterima)
    │
    ▼
[booked] (Telah Dipesan / DP Terkunci) ──► Terhubung ke Budget & Termin Pembayaran
    │
    ▼
[completed] (Layanan Selesai & Lunas)
    │
    └──► [canceled] (Dibatalkan - otomatis dieksklusi dari perhitungan finansial aktif)
```

---

## 4. Formula Perhitungan Finansial & Tagihan Jatuh Tempo

Semua nilai uang dihitung dalam **integer Rupiah murni** (`BIGINT` di database, `Math.round()` di TypeScript) untuk mencegah kesalahan pembulatan desimal.

```
Nilai Penawaran (quoteAmount)   = Biaya penawaran awal dari vendor
Biaya Disepakati (agreedAmount) = Jika terhubung ke item anggaran: actualAmount || plannedAmount
                                  Jika tidak terhubung: quoteAmount (jika berstatus booked/completed)
Terbayar (paidAmount)           = Total riwayat transaksi DP & pelunasan pada item anggaran terkait
Sisa Tagihan (dueAmount)        = Math.max(0, agreedAmount - paidAmount)
```

- **Vendor yang dibatalkan (`status === 'canceled'`)** otomatis diabaikan dari penjumlahan total penawaran, total biaya disepakati, dan sisa tagihan workspace.

---

## 5. Keamanan & Row Level Security (RLS)

Tabel `public.vendors` dilindungi oleh RLS Supabase:
- **`vendors_select`**: Hanya pengguna terautentikasi dengan keanggotaan minimal `viewer` pada `wedding_id` terkait yang dapat melihat vendor.
- **`vendors_insert` / `vendors_update` / `vendors_delete`**: Hanya anggota dengan peran `editor` atau `owner` yang berhak mengubah atau menghapus vendor.
- Penghapusan dilakukan secara *soft delete* (`deleted_at IS NULL`) sehingga riwayat audit tetap terjaga.

---

## 6. Verifikasi & Pengujian Otomatis

Modul ini diverifikasi melalui rangkaian unit test di [`tests/vendor-management.test.ts`](file:///c:/Andre/My%20Code/patemon/tests/vendor-management.test.ts):
- Verifikasi kelengkapan 9 kategori vendor adat Bali dan fallback `lainnya`.
- Verifikasi 6 konfigurasi status lifecycle dan badge UI.
- Validasi sanitasi nomor telepon dan URL WhatsApp click-to-chat.
- Validasi formula kalkulasi agregasi statistik vendor dan pengecualian status batal.
- Validasi integritas data numerik bulat (integer IDR) pada seluruh template dan demo baseline.
