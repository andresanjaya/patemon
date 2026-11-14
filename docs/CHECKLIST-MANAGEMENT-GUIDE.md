# Panduan Modul Checklist & Task Management (Issue #27)

Modul **Checklist & Task Management** di Patemon dirancang khusus untuk memfasilitasi pasangan dan keluarga besar dalam mengkoordinasikan tugas persiapan pernikahan Hindu Bali (*Pawiwahan*), administrasi legalitas pencatatan sipil, logistik tratag/tetaring, banten, konsumsi mebat, hingga busana adat secara terstruktur dan transparan.

---

## 1. Prinsip & Batasan Budaya (*Cultural Guardrails*)

1. **Non-Dogmatis & Menghormati Desa Kala Patra:**
   - Template tugas rekomendasi adat bersifat opsional dan fleksibel. Tidak ada tugas yang dipaksakan sebagai kewajiban mutlak universal tanpa persetujuan keluarga atau pemangku.
   - Pembedaan tugas adat didasarkan pada bentuk perkawinan (*Memadik*, *Ngerorod*, *Nyentana*) dan kesepakatan dua keluarga (*rembug keluarga*).

2. **Pengakuan Gotong Royong Adat (*Ngayah & Sekaa*):**
   - Mendukung penugasan tugas adat kepada krama banjar (*sekaa mebat*, *sekaa suka-duka*), serati banten, pemangku merajan, maupun keluarga inti tanpa mengharuskan pihak tersebut memiliki akun login sistem (*Assignee Free-text / PIC*).

3. **Keterpaduan dengan Prosesi & Banten:**
   - Tugas dapat dikaitkan langsung (*optional foreign key*) ke prosesi upacara tertentu (misal: *Memadik*, *Mebyakala*, *Madengen-dengen*, *Mesakapan*) untuk memastikan kesiapan hari-H.

---

## 2. Kategori Tugas (*Task Categories*)

| Kategori | Label UI | Ruang Lingkup Persiapan |
| :--- | :--- | :--- |
| `adat` | **Adat & Upakara** | Konsultasi *Dewasa Ayu*, muput Sulinggih/Pemangku, koordinasi Serati, nunas tirta pakuluh, tegen-tegenan. |
| `administrasi` | **Administrasi & Hukum** | Surat pengantar Banjar Adat & Desa, pendaftaran Dinas Dukcapil, penandatanganan akta nikah resmi. |
| `logistik` | **Logistik & Tratag** | Pemasangan tetaring anyaman kelapa bersama banjar, tata suara (*sound system*), penataan area merajan. |
| `busana` | **Busana & Tata Rias** | Fitting busana pengantin (*Payas Agung / Payas Madya*), busana seragam keluarga, rias MUA hari-H. |
| `konsumsi` | **Konsumsi & Mebat** | Pengolahan hidangan tradisional (*mebat*, babi guling, lawar), konsumsi ngayah, jamuan prasmanan. |
| `dokumentasi` | **Dokumentasi & Media** | Fotografer adat, videografer momen mesakapan & sungkeman, peliputan drone. |
| `keuangan` | **Keuangan & DP** | Uang muka (*down payment*) vendor, sesari pemangku, dana punia pura. |
| `umum` | **Persiapan Umum** | Rapat keluarga, akomodasi tamu luar daerah, koordinasi panitia keluarga. |

---

## 3. Prioritas & Siklus Status Tugas

### Tingkat Prioritas
- **Mendesak (`urgent`)**: Tugas krusial penentu tanggal atau legalitas (misal: penentuan *Dewasa Ayu*, pendaftaran berkas Dukcapil, konfirmasi Sulinggih).
- **Tinggi (`high`)**: Koordinasi serati banten, sekaa tratag banjar, booking busana utama.
- **Sedang (`medium`)**: Dokumentasi, fitting busana keluarga pendamping, kelengkapan suun-suunan.
- **Rendah (`low`)**: Detail dekorasi tambahan, suvenir, daftar putar musik latar.

### Status Pengerjaan & Lifecycle
```
[ todo ] (Belum Mulai) ──► [ in_progress ] (Dalam Proses) ──► [ done ] (Selesai, completed_at set)
   │                                                              ▲
   └──────────────────────────[ canceled ] (Dibatalkan)───────────┘
```
- Menandai checkbox secara instan mengalihkan tugas antara `todo` / `in_progress` ke `done` (dengan pengisian otomatis cap waktu `completed_at` ke waktu server UTC).
- Membatalkan status selesai mengembalikan status ke `todo` dan mengosongkan `completed_at`.

---

## 4. Fitur Antarmuka Pengguna (*UI Dashboard*)

- **Ringkasan KPI Real-Time:**
  - Persentase penyelesaian tugas keseluruhan (*completion rate progress bar*).
  - Jumlah tugas dalam proses dan belum mulai.
  - Jumlah tugas yang telah **Lewat Tenggat** (*overdue*) dihitung otomatis terhadap tanggal acuan zona waktu WITA.
  - Jumlah tugas prioritas mendesak aktif.
- **Penyaringan & Pencarian:**
  - Pencarian teks instan mencakup judul, deskripsi, nama PIC, dan kategori.
  - Filter dropdown berdasarkan kategori, prioritas, status, PIC, dan prosesi adat terkait.
- **Mode Pengelompokan Fleksibel:**
  - **Kategori**: Mengelompokkan tugas berdasarkan bidang persiapan.
  - **Tenggat Waktu**: Mengelompokkan tugas menjadi *Lewat Tenggat*, *Mendatang Pekan Ini*, *Jadwal Mendatang*, dan *Belum Ada Tanggal*.
  - **Status**: Mengelompokkan berdasarkan fase pengerjaan.
  - **Semua**: Daftar datar urut prioritas dan tenggat waktu.
- **Impor Rekomendasi Tugas Adat Bali (*Template Picker Modal*):**
  - Pasangan dapat memuat 14 template tugas kanonik pawiwahan Bali dengan satu klik.

---

## 5. Keamanan & Kebijakan Hak Akses (*Row-Level Security*)

- **Pemisahan Antar-Wedding (*Workspace Isolation*):**
  - Seluruh data tabel `public.wedding_tasks` terikat langsung pada kolom `wedding_id`.
- **Aturan Peran (*Role-based Permissions*):**
  - `owner` & `editor`: Berhak membuat, mengubah status, menyunting detail, mengimpor template, dan menghapus tugas.
  - `viewer`: Mode pratinjau hanya-baca (*read-only*), kontrol input dinonaktifkan.

