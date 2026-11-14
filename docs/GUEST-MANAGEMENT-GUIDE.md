# Panduan Manajemen Daftar Tamu & Undangan Pawiwahan (Issue #30)

Dokumen ini mendokumentasikan arsitektur, pembagian pihak keluarga adat Bali, struktur kelompok rumah tangga (household/dadia/banjar), estimasi porsi kehadiran (*headcount*), format pengiriman undangan WhatsApp, serta ekspor CSV untuk **Patemon MVP v1**.

---

## 1. Latar Belakang & Tujuan

Dalam pernikahan adat Hindu Bali (*Pawiwahan*), pengelolaan daftar undangan memiliki karakteristik khas:
1. **Klasifikasi Pihak Keluarga:** Membedakan undangan pihak **Purusa** (keluarga/kerabat mempelai pria), pihak **Pradana** (mempelai wanita), serta undangan **Bersama** (sahabat, rekan kerja, organisasi).
2. **Pengelompokan Adat & Komunitas (*Household / Group*):** Tamu seringkali diundang per kepala keluarga (KK) atau per kelompok banjar/tempekan/dadia dengan estimasi rombongan (*headcount*), bukan hanya per individu.
3. **Porsi Katering & Konsumsi Mebat:** Perhitungan porsi makanan (*pax*) harus otomatis mengakumulasi jumlah rombongan dan mengecualikan undangan yang telah mengonfirmasi berhalangan hadir (*declined*).
4. **Undangan Cepat WhatsApp:** Kemudahan mengirim pesan undangan personal dengan salam pembuka adat Bali (*Om Swastyastu*) langsung ke aplikasi WhatsApp tamu.
5. **Portabilitas Data (Ekspor CSV):** Kemampuan mengunduh seluruh daftar tamu ke dalam format file CSV dengan dukungan UTF-8 BOM agar rapi saat dibuka di Microsoft Excel atau Google Sheets.

---

## 2. Pihak Keluarga Adat Bali (*Sides*)

| ID Pihak | Nama Tampilan | Deskripsi Adat & Relevansi |
|---|---|---|
| `groom` | **Purusa (Pria)** | Keluarga besar, kerabat dadia, dan krama banjar pihak mempelai pria |
| `bride` | **Pradana (Wanita)** | Keluarga besar, kerabat, dan undangan pihak mempelai wanita |
| `both` / `mutual` | **Kedua Pihak / Bersama** | Sahabat bersama kedua mempelai, rekan kerja, dan tamu kehormatan |

---

## 3. Kelompok Rumah Tangga & Komunitas Adat (*Household Groups*)

1. **Keluarga Besar Dadia / Paibon:** Kerabat garis keturunan pura kawitan/dadia.
2. **Krama Banjar Adat & Tempekan:** Krama banjar suka-duka setempat.
3. **Prajuru Adat & Tokoh Masyarakat:** Kelian banjar, bendesa adat, mangku, dan tokoh desa.
4. **Rekan Kerja & Instansi:** Kolega kantor dan relasi profesi kedua mempelai.
5. **Sahabat / Teman Kuliah & Sekolah:** Lingkaran pertemanan mempelai.
6. **Kerabat Luar Daerah / Merantau:** Keluarga yang berdomisili di luar Bali/kota.
7. **Lainnya / Umum:** Tamu umum dan relasi tambahan.

---

## 4. Siklus Status Undangan (*Invitation Status*)

| Status | Label | Arti Operasional |
|---|---|---|
| `draft` | **Konsep / Rencana** | Nama sudah dicatat oleh keluarga namun undangan fisik/digital belum dikirim |
| `sent` | **Terkirim** | Undangan fisik telah diantar atau pesan undangan digital telah terkirim via WA |
| `confirmed` | **Hadir (Konfirmasi)** | Tamu telah mengonfirmasi kesediaan hadir beserta jumlah rombongan keluarga |
| `declined` | **Berhalangan Hadir** | Tamu mengabarkan berhalangan hadir (otomatis dieksklusi dari total porsi konsumsi) |

---

## 5. Formula Kalkulasi Estimasi Porsi (*Headcount*)

$$\text{Total Headcount (Pax Aktif)} = \sum_{g \in \text{Tamu Aktif},\ g.\text{status} \neq \text{'declined'}} g.\text{headcount}$$

$$\text{Headcount Konfirmasi Hadir} = \sum_{g \in \text{Tamu Aktif},\ g.\text{status} = \text{'confirmed'}} g.\text{headcount}$$

$$\text{Headcount Berhalangan} = \sum_{g \in \text{Tamu Aktif},\ g.\text{status} = \text{'declined'}} g.\text{headcount}$$

- Perhitungan porsi per pihak:
  - $\text{Porsi Purusa} = \sum g.\text{headcount}\ (g.\text{side} = \text{'groom'})$
  - $\text{Porsi Pradana} = \sum g.\text{headcount}\ (g.\text{side} = \text{'bride'})$
  - $\text{Porsi Bersama} = \sum g.\text{headcount}\ (g.\text{side} \in \{\text{'both'}, \text{'mutual'}\})$

---

## 6. Integrasi WhatsApp & Ekspor CSV

### Pengiriman Pesan WhatsApp Otomatis (`formatWhatsAppInviteLink`)
Mengonversi nomor telepon lokal (`0812...`) ke format internasional (`62812...`) dengan pesan undangan adat personal:
```
Om Swastyastu [Nama Tamu], dengan penuh rasa syukur dan sukacita kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada upacara Pawiwahan kami ([Nama Pasangan]) pada hari [Tanggal Acara]. Matur suksma.
```

### Format File Ekspor CSV (`exportGuestsToCSV`)
- Menggunakan header UTF-8 BOM (`\uFEFF`) agar karakter aksen dan spasi terbaca otomatis tanpa error encoding di Microsoft Excel versi Windows/Mac.
- Kolom yang diekspor:
  1. `Nama Undangan`
  2. `Pihak`
  3. `Kelompok / Dadia / Banjar`
  4. `Jumlah Pax (Headcount)`
  5. `Status Undangan`
  6. `Nomor Telepon`
  7. `Catatan Khusus`

---

## 7. Keamanan & Row Level Security (RLS)

Tabel `public.guests` dilindungi kebijakan isolasi per-workspace pada Supabase:
- `guests_select`: Anggota workspace dengan peran minimal `viewer`.
- `guests_insert`, `guests_update`, `guests_delete`: Anggota workspace dengan peran `editor` atau `owner`.
- Penghapusan dilakukan secara *soft delete* (`deleted_at IS NULL`).

---

## 8. Verifikasi Pengujian

Modul ini diuji secara komprehensif melalui [`tests/guest-management.test.ts`](file:///c:/Andre/My%20Code/patemon/tests/guest-management.test.ts):
- 16 pengujian unit otomatis mencakup verifikasi pihak keluarga, siklus status, kalkulasi headcount dan pengabaian status *declined*, sanitasi URL WhatsApp, serta integritas format ekspor CSV.
- Seluruh rangkaian test suite aplikasi mencapai **132 tests lulus (100%)** di 12 file.
